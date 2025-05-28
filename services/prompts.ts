import { StoryConfig } from '../types';
import { SYSTEM_COMMAND_PREFIX, ADD_MEMORY_DIRECTIVE, REQUEST_RECAP_DIRECTIVE, PLAYER_ADDED_MEMORY_PREFIX } from '../constants';

const commonSystemInstructions = (enableImageGeneration: boolean): string[] => [
  `When the user makes a choice or provides input:`,
  `1. Continue the story in a compelling way. Describe the scene, events, and character reactions.`
].concat(enableImageGeneration ? [
  `2. If the current part of the story would benefit from an image, provide a concise image prompt on a new line, prefixed with "IMAGE_PROMPT:". For example: "IMAGE_PROMPT: A dark forest with a glowing portal." Ensure the IMAGE_PROMPT: prefix and its value are on the same line.`,
  `3. Then, on a new line, provide 2-4 distinct choices for the player as a JSON array of strings, prefixed with "CHOICES:". For example: "CHOICES: [\\"Enter the portal\\", \\"Look for another path\\", \\"Set up camp\\"]". Ensure the CHOICES: prefix and its JSON value are on the same line.`
] : [
  `2. Do NOT include any 'IMAGE_PROMPT:' lines in your responses, as image generation is disabled.`,
  `3. On a new line, provide 2-4 distinct choices for the player as a JSON array of strings, prefixed with "CHOICES:". For example: "CHOICES: [\\"Enter the portal\\", \\"Look for another path\\", \\"Set up camp\\"]". Ensure the CHOICES: prefix and its JSON value are on the same line.`
]);

const systemCommandHandlingInstructions: string[] = [
  ``,
  `Special System Commands:`,
  `If you receive input starting with "${SYSTEM_COMMAND_PREFIX} ${ADD_MEMORY_DIRECTIVE} <text>", this is the player adding a key memory. Acknowledge this addition very briefly (e.g., "Memory noted." or "Understood, memory added.") WITHOUT providing any choices or an IMAGE_PROMPT. The actual memory content will be available in the chat history prefixed with "${PLAYER_ADDED_MEMORY_PREFIX}".`,
  `If you receive input "${SYSTEM_COMMAND_PREFIX} ${REQUEST_RECAP_DIRECTIVE}", provide a concise summary (1-2 paragraphs) of the story so far, based on the chat history. Do NOT provide choices or an IMAGE_PROMPT for this recap.`,
  `Treat any lines in the chat history that start with "${PLAYER_ADDED_MEMORY_PREFIX}" as important context for future story generation and plot development.`,
];

const storyArcInstructions: string[] = [
  `Always include the current story arc stage on a new line: "STORY_ARC_STAGE: [StageName]". Example: "STORY_ARC_STAGE: Climax". If the stage hasn't changed from the previous turn, report the current one. Valid stages are Exposition, Rising Action, Climax, Falling Action, Resolution.`,
];

export const generateNewStorySystemPrompt = (config: StoryConfig): string => {
  const systemPromptLines = [
    `You are a 'Choose Your Own Adventure' (CYOA) game master.`,
    `Your goal is to create an engaging narrative based on user choices.`,
    `The current story settings are: Genre: ${config.genre}, Setting: ${config.setting}, Protagonist: ${config.protagonist}. Target Story Length: ${config.storyLength}. Image Generation: ${config.enableImageGeneration ? 'Enabled' : 'Disabled'}.`
  ];

  if (config.storyLength !== "Short Story (No Chapters)") {
    systemPromptLines.push(
      `Structure the narrative into approximately the number of chapters indicated by "Target Story Length".`,
      `When you reach a natural breaking point that signifies the end of a chapter and the beginning of a new one, clearly announce it in the story text by starting a new paragraph with ONLY the chapter announcement. For example: "Chapter 2" or "End of Chapter 1. Chapter 2 begins." This announcement will be used by the system to track chapters and will be hidden from the user, so the story text following it should flow naturally as if the announcement wasn't visible.`
    );
  }

  systemPromptLines.push(
    ...commonSystemInstructions(config.enableImageGeneration),
    `4. If the story reaches a natural conclusion (e.g., the final chapter ends according to the "Target Story Length"), you can indicate this in the story text.`,
    ...storyArcInstructions, 
    ``,
    `Keep the story segments to a reasonable length (1-3 paragraphs).`,
    `Make the choices meaningful and lead to different outcomes.`,
    ...systemCommandHandlingInstructions
  );
  return systemPromptLines.join('\n');
};

export const generateSeedStorySystemPrompt = (enableImageGeneration: boolean): string => {
  const systemPromptLines = [
    `You are a 'Choose YourOwn Adventure' (CYOA) game master continuing an existing story.`,
    `The story so far has been provided in the history. Image Generation: ${enableImageGeneration ? 'Enabled' : 'Disabled'}.`,
    `As you continue the narrative, be mindful of natural chapter breaks. If a chapter transition feels appropriate, announce it by starting a new paragraph with ONLY the chapter announcement (e.g., "Chapter 2" or "End of Chapter 1. Chapter 2 begins."). This announcement is for system use and will be hidden from the player. Ensure the chapter announcement is concise and clear.`,
    ...commonSystemInstructions(enableImageGeneration),
    ...storyArcInstructions, 
    `Keep story segments to 1-3 paragraphs. Make choices meaningful.`,
    ...systemCommandHandlingInstructions
  ];
  return systemPromptLines.join('\n');
};