



// FIX: Removed StreamGenerateContentResult as it's not exported by @google/genai.
// The return type of chat.sendMessageStream() is Promise<AsyncIterable<GenerateContentResponse>>.
// The result of awaiting this promise is AsyncIterable<GenerateContentResponse>.
import { GoogleGenAI, Chat, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants';
import { StorySegment, GeminiStreamedServiceResponse, StoryArcStage, STORY_ARC_STAGES } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Utility function for retrying promises with exponential backoff
async function withRetry<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000, // 1 second
  maxDelay: number = 30000 // 30 seconds
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  while (true) {
    try {
      return await action();
    } catch (error: any) {
      retries++;
      // Check if error is retryable (e.g., 429, 5xx)
      // Also check for specific GoogleGenAIError codes if applicable, though status is often sufficient.
      const isRetryableError = (
        error?.status === 429 || // Too Many Requests
        (error?.status >= 500 && error?.status <= 599) // Server-side errors
      );
      
      if (!isRetryableError || retries > maxRetries) {
        // If not retryable or max retries exceeded, throw the original error
        console.error(`Action failed after ${retries-1} retries or error not retryable.`, error);
        throw error;
      }

      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      const currentDelay = Math.min(delay + jitter, maxDelay);
      
      console.warn(`Retryable error encountered (status: ${error?.status}, message: ${error?.message}). Retrying attempt ${retries}/${maxRetries} in ${currentDelay.toFixed(0)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      delay = Math.min(delay * 2, maxDelay); 
    }
  }
}


export const startChatSession = async (systemPrompt: string, initialHistory?: StorySegment[]): Promise<Chat | null> => {
  try {
    const generativeAI = getAI();
    const formattedHistory = initialHistory?.map(segment => {
        const role = segment.speaker === 'User' ? 'user' : 'model';
        const parts = [{ text: segment.text || "" }]; 
        return { role, parts };
    }) || [];
    
    // startChatSession itself is less prone to transient errors like 429, but wrapping for consistency if needed.
    // However, API key issues (401/403) should fail fast.
    const chat = generativeAI.chats.create({
      model: GEMINI_TEXT_MODEL,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 } 
      },
      history: formattedHistory,
    });
    return chat;
  } catch (error: any) {
    let logMessage = "Error starting chat session.";
    if (error && typeof error === 'object') {
        const errObj = error as { status?: number; code?: string; message?: string };
        if (errObj.status === 401 || errObj.status === 403 || errObj.code === 'PERMISSION_DENIED' || (errObj.message && (errObj.message.toLowerCase().includes("api key not valid") || errObj.message.toLowerCase().includes("authentication failed")))) {
            logMessage = "Error starting chat: API key is invalid or lacks permissions.";
        } else if (errObj.status === 429 || errObj.code === 'RESOURCE_EXHAUSTED' || (errObj.message && (errObj.message.toLowerCase().includes("quota") || errObj.message.toLowerCase().includes("rate limit")))) {
            logMessage = "Error starting chat: Rate limit or quota exceeded.";
        } else if (errObj.message) {
            logMessage = `Error starting chat: ${errObj.message}`;
        }
    } else if (typeof error === 'string') {
        logMessage = `Error starting chat: ${error}`;
    }
    console.error(logMessage, error); 
    return null;
  }
};

const extractChapterAnnouncement = (text: string): { cleanedText: string; chapter?: string } => {
  const chapterPatterns = [
    /(?:(?:end\s+of\s+chapter\s+\d+|chapter\s+\d+\s+ends)\s*\.\s*)?(chapter\s+\d+\s*(?::|\s+begins|\s+starts)?)/i,
    /^\s*(chapter\s+\d+\s*(?::|\s+begins|\s+starts)?)/i 
  ];

  let cleanedText = text;
  let chapter: string | undefined;

  for (const pattern of chapterPatterns) {
    const match = cleanedText.match(pattern);
    if (match && match[1]) {
      chapter = match[1].trim().replace(/\s+/g, ' ').replace(/:$/, '').replace(/\s+(begins|starts)$/i, '').trim();
      cleanedText = cleanedText.replace(match[0], '').trim();
      break; 
    }
  }
  return { cleanedText, chapter };
};


const parseGeminiResponse = (responseText: string): { 
    storyText: string; 
    imageGenPrompt?: string; 
    choices: string[]; 
    foundChoicesDirective: boolean; 
    newChapterAnnouncement?: string;
    storyArcStage?: StoryArcStage; 
} => {
  let storyTextAccumulator = "";
  let imageGenPrompt: string | undefined;
  let parsedChoices: string[] = [];
  let foundChoicesDirective = false;
  let newChapterAnnouncement: string | undefined;
  let storyArcStage: StoryArcStage | undefined;

  const lines = responseText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  for (const line of lines) {
    if (line.toUpperCase().startsWith("IMAGE_PROMPT:")) {
      imageGenPrompt = line.substring(line.toUpperCase().indexOf("IMAGE_PROMPT:") + "IMAGE_PROMPT:".length).trim();
    } else if (line.toUpperCase().startsWith("CHOICES:")) {
      foundChoicesDirective = true;
      const choicesJsonString = line.substring(line.toUpperCase().indexOf("CHOICES:") + "CHOICES:".length).trim();
      if (choicesJsonString) {
        try {
          let potentialJson = choicesJsonString;
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
          const match = potentialJson.match(fenceRegex);
          if (match && match[2]) {
            potentialJson = match[2].trim();
          }

          const rawChoices = JSON.parse(potentialJson);
          if (Array.isArray(rawChoices) && rawChoices.every(c => typeof c === 'string')) {
            parsedChoices = rawChoices.map(c => c.trim()).filter(c => c.length > 0);
          } else {
            console.error("Parsed choices are not an array of strings or are empty after trim:", rawChoices, "Original JSON string:", `"${choicesJsonString}"`);
          }
        } catch (e: any) {
          console.error("Failed to parse choices JSON:", e.message, `Input was: "${choicesJsonString}"`, e);
        }
      } else {
        console.warn("CHOICES: prefix found but no JSON content followed.");
      }
    } else if (line.toUpperCase().startsWith("STORY_ARC_STAGE:")) {
        const stageValue = line.substring("STORY_ARC_STAGE:".length).trim();
        if (STORY_ARC_STAGES.includes(stageValue as StoryArcStage)) {
            storyArcStage = stageValue as StoryArcStage;
        } else {
            console.warn("Received unknown STORY_ARC_STAGE:", stageValue);
        }
    } else {
      storyTextAccumulator += line + "\n";
    }
  }
  
  if (storyTextAccumulator.trim() !== "") {
    const chapterParseResult = extractChapterAnnouncement(storyTextAccumulator.trim());
    storyTextAccumulator = chapterParseResult.cleanedText;
    if (chapterParseResult.chapter) {
      newChapterAnnouncement = chapterParseResult.chapter;
    }
  }
  
  return { storyText: storyTextAccumulator.trim(), imageGenPrompt, choices: parsedChoices, foundChoicesDirective, newChapterAnnouncement, storyArcStage };
};


export const getNextStoryPart = async (
  chat: Chat, 
  userInput: string,
  onChunk: (chunkText: string) => void
): Promise<GeminiStreamedServiceResponse> => {
  try {
    // FIX: Explicitly type the action for withRetry
    // FIX: chat.sendMessageStream returns Promise<AsyncIterable<GenerateContentResponse>>
    const initialStreamAction = (): Promise<AsyncIterable<GenerateContentResponse>> => chat.sendMessageStream({ message: userInput });
    // FIX: Explicitly type the result from withRetry
    // FIX: The awaited result of chat.sendMessageStream is AsyncIterable<GenerateContentResponse>
    const initialApiResponseStream: AsyncIterable<GenerateContentResponse> = await withRetry<AsyncIterable<GenerateContentResponse>>(initialStreamAction);
    
    let fullResponseText = "";

    for await (const chunk of initialApiResponseStream) {
      const textChunk = chunk.text || "";
      if (textChunk) {
        onChunk(textChunk); 
        fullResponseText += textChunk;
      }
    }
    if (fullResponseText === "") {
        onChunk(""); 
    }

    let { 
      storyText, 
      imageGenPrompt, 
      choices, 
      foundChoicesDirective,
      newChapterAnnouncement,
      storyArcStage 
    } = parseGeminiResponse(fullResponseText);

    if (choices.length === 0 && storyText.trim() !== "" && !foundChoicesDirective) {
      console.log("Original response lacked choices and CHOICES: directive. Attempting a retry to get choices.");
      const retryPromptForChoices = "You previously provided the story content. Based on that, please now provide 2-4 choices for the player in the format: CHOICES: [\"Choice 1\", \"Choice 2\"]. Only provide the choices part.";
      
      // FIX: Explicitly type the action for withRetry
      // FIX: chat.sendMessageStream returns Promise<AsyncIterable<GenerateContentResponse>>
      const retryStreamAction = (): Promise<AsyncIterable<GenerateContentResponse>> => chat.sendMessageStream({ message: retryPromptForChoices });
      // FIX: Explicitly type the result from withRetry
      // FIX: The awaited result of chat.sendMessageStream is AsyncIterable<GenerateContentResponse>
      const retryApiResponseStream: AsyncIterable<GenerateContentResponse> = await withRetry<AsyncIterable<GenerateContentResponse>>(retryStreamAction);
      let retryFullResponseText = "";
      for await (const chunk of retryApiResponseStream) {
        const retryTextChunk = chunk.text || "";
        if (retryTextChunk) {
            retryFullResponseText += retryTextChunk;
        }
      }
      
      const parsedRetry = parseGeminiResponse(retryFullResponseText); 
      
      if (parsedRetry.choices.length > 0) {
        console.log("Choices obtained from retry.");
        choices = parsedRetry.choices;
        foundChoicesDirective = parsedRetry.foundChoicesDirective || choices.length > 0; 
      } else {
        console.log("Retry did not yield choices. Text from retry (if any):", parsedRetry.storyText);
      }
    }

    if (choices.length === 0) {
      if (storyText.trim() !== "" || (imageGenPrompt && imageGenPrompt.trim() !== "")) {
        choices = ["Continue the story."];
      } else if (fullResponseText.trim() === "") {
        const defaultStuckMessage = "The story seems to pause, waiting for your input, or perhaps contemplating its next move.";
        onChunk(defaultStuckMessage); 
        choices = ["See what happens next."];
      } else if (fullResponseText.trim() !== "" && !foundChoicesDirective) {
        choices = ["See what happens next."];
      } else {
        const defaultEmptyMessage = "An unexpected silence hangs in the air. What will you do?";
        if (storyText.trim() === "") onChunk(defaultEmptyMessage);
        choices = ["Investigate the silence."];
      }
    }
    return { imageGenPrompt, choices, newChapterAnnouncement, storyArcStage };

  } catch (error: any) {
    let errorMessage = "Failed to get story response from AI.";
    if (error && typeof error === 'object') {
        const errObj = error as { status?: number; code?: string; message?: string };
         if (errObj.status === 401 || errObj.status === 403 || errObj.code === 'PERMISSION_DENIED' || (errObj.message && (errObj.message.toLowerCase().includes("api key not valid") || errObj.message.toLowerCase().includes("authentication failed")))) {
            errorMessage = "Failed to get story response: API key is invalid or lacks permissions.";
        } else if (errObj.status === 429 || errObj.code === 'RESOURCE_EXHAUSTED' || (errObj.message && (errObj.message.toLowerCase().includes("quota") || errObj.message.toLowerCase().includes("rate limit")))) {
            errorMessage = "Failed to get story response: Rate limit or quota exceeded. Please try again later.";
        } else if (errObj.status && errObj.status >= 500 && errObj.status <= 599) {
            errorMessage = `Failed to get story response: Server error (status ${errObj.status}). Please try again later.`;
        } else if (errObj.message) {
            errorMessage = `Failed to get story response: ${errObj.message}`;
        }
    } else if (typeof error === 'string') {
        errorMessage = `Failed to get story response: ${error}`;
    }
    console.error("Final error in getNextStoryPart after retries (if any):", errorMessage, error); 
    return { imageGenPrompt: undefined, choices: undefined, newChapterAnnouncement: undefined, storyArcStage: undefined, error: errorMessage };
  }
};


export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  if (!prompt || prompt.trim() === "") {
    console.warn("Image generation skipped: Empty prompt provided.");
    return null;
  }
  try {
    const generativeAI = getAI();
    // FIX: Explicitly type the action for withRetry
    const imageGenerationAction = (): Promise<GenerateImagesResponse> => generativeAI.models.generateImages({
      model: GEMINI_IMAGE_MODEL,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    // FIX: Explicitly type the result from withRetry
    const response: GenerateImagesResponse = await withRetry<GenerateImagesResponse>(imageGenerationAction);

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    console.warn("Image generation successful but no image bytes received in response.");
    return null;
  } catch (error: any) { 
    let detailedErrorMessage = "Unknown image generation error";
    let errorTypeToReturn = null; 

    if (error && typeof error === 'object') {
        const errObj = error as { status?: number; code?: string; message?: string };
        if (errObj.status === 401 || errObj.status === 403 || errObj.code === 'PERMISSION_DENIED' || (errObj.message && (errObj.message.toLowerCase().includes("api key not valid") || errObj.message.toLowerCase().includes("authentication failed")))) {
            detailedErrorMessage = "Image generation failed: API key is invalid or lacks permissions.";
            errorTypeToReturn = "ERROR_API_KEY_INVALID";
        } else if (errObj.status === 429 || errObj.code === 'RESOURCE_EXHAUSTED' || (errObj.message && (errObj.message.toLowerCase().includes("quota") || errObj.message.toLowerCase().includes("rate limit")))) {
            detailedErrorMessage = "Image generation failed: Rate limit or quota exceeded. Please try again later.";
            errorTypeToReturn = "ERROR_QUOTA_EXCEEDED";
        } else if (errObj.status && errObj.status >= 500 && errObj.status <= 599) {
            detailedErrorMessage = `Image generation failed: Server error (status ${errObj.status}). Please try again later.`;
            // Potentially a generic error type or null to let App.tsx handle it
        } else if (errObj.message) {
            detailedErrorMessage = `Image generation failed: ${errObj.message}`;
        }
    } else if (typeof error === 'string') {
        detailedErrorMessage = `Image generation failed: ${error}`;
    }
    
    console.error("Final error in generateImageFromPrompt after retries (if any):", detailedErrorMessage, error); 
    // Return specific error types or null to indicate failure; App.tsx handles these.
    return errorTypeToReturn; 
  }
};

export const parseSeedStory = (seedText: string): StorySegment[] => {
  const segments: StorySegment[] = [];
  const lines = seedText.split(/\r?\n+/).map(l => l.trim()).filter(l => l.length > 0);
  
  let buffer = "";
  let lastSpeaker: 'User' | 'Assistant' | null = null;
  let lastTimestamp: string = new Date().toISOString();

  const userSpeakerRegex = /^User\s*(?:\(([\dTZ:.,\s-]+)\))?\s*:?\s*/i;
  const assistantSpeakerRegex = /^Assistant\s*(?:\(([\dTZ:.,\s-]+)\))?\s*:?\s*/i;


  for (const line of lines) {
    let speaker: 'User' | 'Assistant' | null = null;
    let timestamp: string | undefined;
    let textContent = line;

    const userMatch = line.match(userSpeakerRegex);
    const assistantMatch = line.match(assistantSpeakerRegex);

    if (userMatch) {
      speaker = 'User';
      timestamp = userMatch[1]?.trim();
      textContent = line.substring(userMatch[0].length).trim();
    } else if (assistantMatch) {
      speaker = 'Assistant';
      timestamp = assistantMatch[1]?.trim();
      textContent = line.substring(assistantMatch[0].length).trim();
    }

    if (speaker) {
      if (lastSpeaker && buffer.trim() !== "") {
        segments.push({
          id: crypto.randomUUID(),
          speaker: lastSpeaker,
          text: buffer.trim().replace(/^add_memory:\s*/i, "Memory added: "),
          timestamp: lastTimestamp, 
        });
      }
      buffer = textContent;
      lastSpeaker = speaker;
      lastTimestamp = timestamp ? new Date(timestamp.replace(',', ' ')).toISOString() : new Date().toISOString();
    } else {
      if (line.match(/^[A-Z]\)\s/)) { 
         buffer += (buffer.length > 0 ? "\n" : "") + line;
      } else if (!line.startsWith("[No source_id provided]") && !line.toLowerCase().startsWith("add_memory:")) {
         buffer += (buffer.length > 0 ? "\n" : "") + line;
      } else if (line.toLowerCase().startsWith("add_memory:")) {
        buffer += (buffer.length > 0 ? "\n" : "") + "Memory added: " + line.substring("add_memory:".length).trim();
      }
    }
  }

  if (lastSpeaker && buffer.trim() !== "") {
     segments.push({
        id: crypto.randomUUID(),
        speaker: lastSpeaker,
        text: buffer.trim().replace(/^add_memory:\s*/i, "Memory added: "),
        timestamp: lastTimestamp,
      });
  }
  
  if (segments.length === 0 && seedText.trim().length > 0) {
    segments.push({
      id: crypto.randomUUID(),
      speaker: 'User', 
      text: seedText.trim(),
      timestamp: new Date().toISOString(),
    });
  }

  return segments;
};