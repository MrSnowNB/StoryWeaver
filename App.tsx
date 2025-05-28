

import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, StoryConfig, StorySegment, Choice, ParsedSeedStory, StoryLengthOption, STORY_LENGTH_OPTIONS, STORY_GENRES, STORY_SETTINGS, PROTAGONIST_ARCHETYPES, AppTheme, StoryGenre, StorySaveData, GeminiStreamedServiceResponse, PendingImageAction, StoryArcStage, STORY_ARC_STAGES } from './types';
import MainMenu from './components/MainMenu';
import NewStoryForm from './components/NewStoryForm';
import SeedStoryForm from './components/SeedStoryForm';
import GameScreen from './components/GameScreen';
import { startChatSession, getNextStoryPart, generateImageFromPrompt, parseSeedStory } from './services/geminiService';
import { generateNewStorySystemPrompt, generateSeedStorySystemPrompt } from './services/prompts'; 
import { Chat } from '@google/genai';
import { APP_TITLE, LOCAL_STORAGE_KEY, SYSTEM_COMMAND_PREFIX, ADD_MEMORY_DIRECTIVE, REQUEST_RECAP_DIRECTIVE, PLAYER_ADDED_MEMORY_PREFIX } from './constants';
import { getThemeByGenre, defaultTheme, sciFiTheme, horrorTheme } from './themes'; // Import specific themes for loading by name

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('MainMenu');
  const [storyConfig, setStoryConfig] = useState<StoryConfig | null>(null);
  const [storyHistory, setStoryHistory] = useState<StorySegment[]>([]);
  const [geminiChat, setGeminiChat] = useState<Chat | null>(null);
  const [isGeneratingNextPart, setIsGeneratingNextPart] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(defaultTheme);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [currentStoryArcStage, setCurrentStoryArcStage] = useState<StoryArcStage | null>(null);
  const [hasSavedStory, setHasSavedStory] = useState<boolean>(false);
  const [selectedImageForContextPanel, setSelectedImageForContextPanel] = useState<string | null>(null);
  const [pendingImageAction, setPendingImageAction] = useState<PendingImageAction | null>(null);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);


  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    setHasSavedStory(!!savedData);
  }, []);

  useEffect(() => {
    document.title = error ? `Error - ${APP_TITLE}` : gameMode !== 'MainMenu' ? `Playing - ${APP_TITLE}` : APP_TITLE;
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.className = ''; 
      appContainer.classList.add('min-h-screen', currentTheme.colors.background, currentTheme.colors.text);
    }
  }, [gameMode, error, currentTheme]);
  
  const saveStoryToLocalStorage = useCallback(() => {
    if (gameMode === 'Playing' && storyConfig && storyHistory.length > 0) {
      const dataToSave: StorySaveData = {
        storyHistory,
        storyConfig,
        currentChapter,
        currentStoryArcStage,
        themeName: currentTheme.name,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      setHasSavedStory(true);
    }
  }, [storyHistory, storyConfig, currentChapter, currentStoryArcStage, currentTheme, gameMode]);

  useEffect(() => {
    saveStoryToLocalStorage();
  }, [saveStoryToLocalStorage]);


  const resetGameState = (clearSave: boolean = false) => {
    setStoryConfig(null);
    setStoryHistory([]);
    setGeminiChat(null);
    setIsGeneratingNextPart(false);
    setIsGeneratingImage(false);
    setError(null);
    setCurrentTheme(defaultTheme); 
    setCurrentChapter(null);
    setCurrentStoryArcStage(null);
    setSelectedImageForContextPanel(null); 
    setPendingImageAction(null);
    setFullScreenImageUrl(null);
    if (clearSave) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setHasSavedStory(false);
    }
  };

  const processUserResponse = async (
    responseText: string, 
    currentChat: Chat,
    currentHistoryArg: StorySegment[], 
    currentConfig: StoryConfig | null,
    isInitialCall: boolean = false,
    isSystemDirective: boolean = false 
  ) => {
    setIsGeneratingNextPart(true);
    let newHistoryAfterUser = [...currentHistoryArg]; 
  
    if (!isInitialCall && !isSystemDirective) {
      const userSegment: StorySegment = {
        id: crypto.randomUUID(),
        speaker: 'User',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      newHistoryAfterUser = [...newHistoryAfterUser, userSegment];
      setStoryHistory(newHistoryAfterUser); 
    } else if (isInitialCall && currentHistoryArg.length === 0 && currentConfig?.initialPrompt) {
        const systemInitialPromptSegment: StorySegment = {
            id: crypto.randomUUID(),
            speaker: 'System',
            text: `Starting a new ${currentConfig.genre} story (${currentConfig.storyLength}, Image Generation: ${currentConfig.enableImageGeneration ? 'Enabled' : 'Disabled'}) in ${currentConfig.setting} with a ${currentConfig.protagonist}. Initial prompt: "${responseText}"`,
            timestamp: new Date().toISOString(),
        };
        newHistoryAfterUser = [systemInitialPromptSegment];
        setStoryHistory(newHistoryAfterUser);
    }

    const streamingSegmentId = crypto.randomUUID();
    const aiResponseSegmentStub: StorySegment = {
      id: streamingSegmentId,
      speaker: isSystemDirective ? 'System' : 'Assistant',
      text: '', 
      timestamp: new Date().toISOString(),
      isStreaming: true,
      choices: [],
    };
    
    setStoryHistory(prev => [...prev, aiResponseSegmentStub]);
  
    const handleChunk = (chunkText: string) => {
      setStoryHistory(prev => prev.map(seg =>
        seg.id === streamingSegmentId ? { ...seg, text: seg.text + chunkText } : seg
      ));
    };
    
    const streamResult: GeminiStreamedServiceResponse = await getNextStoryPart(currentChat, responseText, handleChunk);
  
    if (streamResult.error) {
      setError(streamResult.error);
      setStoryHistory(prev => prev.map(seg => 
        seg.id === streamingSegmentId ? { ...seg, isStreaming: false, text: seg.text + `\n\n[Error: ${streamResult.error}]` } : seg
      ));
      if (streamResult.error.toLowerCase().includes("api key") || streamResult.error.toLowerCase().includes("rate limit") || streamResult.error.toLowerCase().includes("quota")) {
        setGameMode('Error');
      }
    } else {
      if (!isSystemDirective && streamResult.newChapterAnnouncement) {
        setCurrentChapter(streamResult.newChapterAnnouncement);
      }
      if (streamResult.storyArcStage) {
        setCurrentStoryArcStage(streamResult.storyArcStage);
      }
  
      setStoryHistory(prev => prev.map(seg =>
        seg.id === streamingSegmentId ? {
          ...seg,
          isStreaming: false,
          imagePrompt: (currentConfig?.enableImageGeneration && !isSystemDirective) ? streamResult.imageGenPrompt : undefined, // Store prompt, don't generate yet
          choices: isSystemDirective ? [] : streamResult.choices?.map(c => ({ id: crypto.randomUUID(), text: c })) || [],
        } : seg
      ));
      // Image generation is now user-initiated via "Visualize Scene" button and modal
    }
    setIsGeneratingNextPart(false);
  };

  const handleStartNewStory = async (config: StoryConfig) => { 
    resetGameState(); 
    setCurrentTheme(getThemeByGenre(config.genre));
    setStoryConfig(config);
    setGameMode('Playing');
    setCurrentStoryArcStage(STORY_ARC_STAGES[0]); // Start with Exposition
    
    if (config.storyLength !== "Short Story (No Chapters)") {
      setCurrentChapter("Chapter 1"); 
    } else {
      setCurrentChapter(null);
    }

    const systemPrompt = generateNewStorySystemPrompt(config); 
    const chat = await startChatSession(systemPrompt);

    if (chat) {
      setGeminiChat(chat);
      const initialUserPrompt = config.initialPrompt || `Let's begin the story.`;
      await processUserResponse(initialUserPrompt, chat, [], config, true, false); 
    } else {
      setError("Failed to initialize chat with Gemini. Check API Key and network.");
      setGameMode('Error');
      setIsGeneratingNextPart(false);
    }
  };

  const handleSeedStory = async (seedText: string, seedImage?: string, enableImageGenerationForSeed?: boolean) => {
    resetGameState();
    
    const parsedSegments = parseSeedStory(seedText);
    if (parsedSegments.length === 0) {
      setError("Could not parse the seed story. Please ensure it has some content.");
      setGameMode('Error');
      return;
    }
    
    const inferredGenre = STORY_GENRES.find(g => seedText.toLowerCase().includes(g.toLowerCase())) || STORY_GENRES[1];
    setCurrentTheme(getThemeByGenre(inferredGenre)); 
    setCurrentChapter(null); 
    setCurrentStoryArcStage(STORY_ARC_STAGES[0]); // Default for seeded, AI can update
    
    const currentStoryConfig: StoryConfig = {
        genre: inferredGenre, 
        setting: "Unknown (from seed)", 
        protagonist: "Unknown (from seed)", 
        storyLength: STORY_LENGTH_OPTIONS[0], 
        enableImageGeneration: enableImageGenerationForSeed !== undefined ? enableImageGenerationForSeed : true,
    };
    setStoryConfig(currentStoryConfig);

    let initialHistoryForChat = parsedSegments;
    if (seedImage) {
      const imageSegment: StorySegment = {
        id: crypto.randomUUID(),
        speaker: 'System',
        text: 'Initial image provided for the story.',
        imageUrl: seedImage,
        timestamp: new Date(new Date(parsedSegments[0]?.timestamp || Date.now()).getTime() - 1).toISOString(), 
      };
      initialHistoryForChat = [imageSegment, ...parsedSegments];
    } 
    setStoryHistory(initialHistoryForChat); 
    
    setGameMode('Playing');
    
    const systemPrompt = generateSeedStorySystemPrompt(currentStoryConfig.enableImageGeneration); 
    const chat = await startChatSession(systemPrompt, initialHistoryForChat); 
    if (chat) {
      setGeminiChat(chat);
      await processUserResponse("What happens next based on the story so far?", chat, initialHistoryForChat, currentStoryConfig, false, false);
    } else {
      setError("Failed to initialize chat with Gemini for seeded story. Check API Key and network.");
      setGameMode('Error');
      setIsGeneratingNextPart(false); 
    }
  };
  
  const loadStoryFromLocalStorage = async () => {
    const savedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedDataString) {
      setError("No saved game found.");
      setGameMode('MainMenu'); 
      return;
    }
    try {
      const savedData: StorySaveData = JSON.parse(savedDataString);
      resetGameState(); 

      if (savedData.themeName === sciFiTheme.name) setCurrentTheme(sciFiTheme);
      else if (savedData.themeName === horrorTheme.name) setCurrentTheme(horrorTheme);
      else setCurrentTheme(getThemeByGenre(savedData.storyConfig.genre) || defaultTheme);

      setStoryConfig(savedData.storyConfig);
      setStoryHistory(savedData.storyHistory); 
      setCurrentChapter(savedData.currentChapter);
      setCurrentStoryArcStage(savedData.currentStoryArcStage || STORY_ARC_STAGES[0]);
      setSelectedImageForContextPanel(null); 
      
      const systemPrompt = savedData.storyConfig.initialPrompt 
        ? generateNewStorySystemPrompt(savedData.storyConfig) 
        : generateSeedStorySystemPrompt(savedData.storyConfig.enableImageGeneration);

      const chat = await startChatSession(systemPrompt, savedData.storyHistory);
      if (chat) {
        setGeminiChat(chat);
        setGameMode('Playing');
      } else {
        setError("Failed to re-initialize chat session. API key might be an issue or network problems.");
        setGameMode('Error'); 
      }
    } catch (e) {
      console.error("Failed to load saved game:", e);
      setError("Failed to load saved game. Data might be corrupted.");
      localStorage.removeItem(LOCAL_STORAGE_KEY); 
      setHasSavedStory(false);
      setGameMode('Error');
    }
  };

  const handleContinueStory = () => {
    loadStoryFromLocalStorage();
  };
  
  const handleUserResponse = async (responseText: string) => {
    if (!geminiChat) {
      setError("Chat session is not active.");
      setGameMode('Error');
      return;
    }
    if (!storyConfig) { 
        setError("Story configuration is missing.");
        setGameMode('Error');
        return;
    }
    setSelectedImageForContextPanel(null); 
    await processUserResponse(responseText, geminiChat, storyHistory, storyConfig, false, false);
  };
  
  const handleInitiateImagePromptEdit = (segmentId: string, prompt: string) => {
    if (!storyConfig?.enableImageGeneration) return;
    setPendingImageAction({ segmentId, prompt });
  };

  const handleCancelImagePromptEdit = () => {
    setPendingImageAction(null);
  };

  const handleConfirmImageGeneration = (segmentId: string, finalPrompt: string) => {
    setPendingImageAction(null);
    // Update the stored prompt for the segment before calling generation
    setStoryHistory(prev => prev.map(seg => 
      seg.id === segmentId ? { ...seg, imagePrompt: finalPrompt } : seg
    ));
    handleImageGeneration(segmentId, finalPrompt);
  };
  
  // This function is now called after user confirms/edits prompt
  const handleImageGeneration = async (segmentId: string, promptToUse: string) => {
    if (!storyConfig?.enableImageGeneration) {
        setStoryHistory(prevHistory => 
            prevHistory.map(segment => 
              segment.id === segmentId ? { ...segment, imagePrompt: promptToUse, text: (segment.text || "") + "\n(Image generation is disabled for this story.)" } : segment
            )
        );
        return;
    }
    if (!promptToUse || promptToUse.trim() === "") {
      setStoryHistory(prevHistory => 
        prevHistory.map(segment => 
          segment.id === segmentId ? { ...segment, text: (segment.text || "") + "\n(Image generation skipped: No prompt provided.)" } : segment
        )
      );
      return;
    }

    setIsGeneratingImage(true); 
    setStoryHistory(prevHistory => 
        prevHistory.map(segment => 
          segment.id === segmentId ? { ...segment, isGeneratingThisImage: true, imagePrompt: promptToUse } : segment
        )
    );

    const imageUrl = await generateImageFromPrompt(promptToUse);
    
    let updatedTextSuffix = "";
    if (imageUrl === "ERROR_QUOTA_EXCEEDED") {
        updatedTextSuffix = "\n(Image generation failed: Quota exceeded.)";
    } else if (imageUrl === "ERROR_API_KEY_INVALID") {
        updatedTextSuffix = "\n(Image generation failed: API key issue.)";
    } else if (!imageUrl) { 
       updatedTextSuffix = `\n(Image generation failed for prompt: "${promptToUse}")`;
    }

    setStoryHistory(prevHistory => 
      prevHistory.map(segment => 
        segment.id === segmentId ? { 
          ...segment, 
          imageUrl: (imageUrl && imageUrl !== "ERROR_QUOTA_EXCEEDED" && imageUrl !== "ERROR_API_KEY_INVALID") ? imageUrl : segment.imageUrl, 
          text: (segment.text || "") + updatedTextSuffix, 
          isGeneratingThisImage: false 
        } : segment
      )
    );
    setIsGeneratingImage(false);
  };
  
  const handleBackToMenu = () => {
    resetGameState(); 
    setGameMode('MainMenu');
  };
  
  const handleExportStory = () => {
    if (!storyConfig || storyHistory.length === 0) {
      alert("No story to export.");
      return;
    }

    let content = `Interactive Story Weaver Export\n`;
    content += `-----------------------------------\n`;
    content += `Genre: ${storyConfig.genre}\n`;
    content += `Setting: ${storyConfig.setting}\n`;
    content += `Protagonist: ${storyConfig.protagonist}\n`;
    content += `Story Length: ${storyConfig.storyLength}\n`;
    content += `Image Generation Enabled: ${storyConfig.enableImageGeneration}\n`;
    if (currentChapter) {
      content += `Current Chapter: ${currentChapter}\n`;
    }
    if (currentStoryArcStage) {
      content += `Current Story Arc Stage: ${currentStoryArcStage}\n`;
    }
    content += `-----------------------------------\n\n`;

    storyHistory.forEach(segment => {
      const speakerPrefix = segment.speaker === 'System' && segment.text.startsWith(PLAYER_ADDED_MEMORY_PREFIX) 
        ? 'Memory' 
        : segment.speaker;
      content += `[${new Date(segment.timestamp).toLocaleString()}] ${speakerPrefix}:\n`;
      content += `${segment.text}\n`;
      if (segment.imageUrl) {
        content += `(Image was present for this segment - not included in text export)\n`;
      }
      if (segment.imagePrompt) { // This will now be the AI-suggested or user-edited prompt
        content += `(Image prompt used: ${segment.imagePrompt})\n`;
      }
      if (segment.choices && segment.choices.length > 0) {
        content += `Choices offered: ${segment.choices.map(c => `"${c.text}"`).join(', ')}\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `StoryWeaver-${storyConfig.genre}-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

 const handleRegenerateLastResponse = async () => {
    if (isGeneratingNextPart || !storyConfig || !geminiChat) {
      console.warn("Regeneration skipped: already generating, no story config, or no chat.");
      return;
    }
  
    let lastAiSegmentIndex = -1;
    let historyBeforeLastAi = [...storyHistory];

    for (let i = storyHistory.length - 1; i >= 0; i--) {
      const currentSegment = storyHistory[i];
      if (currentSegment.speaker === 'Assistant' || 
         (currentSegment.speaker === 'System' && 
          !currentSegment.text.startsWith(PLAYER_ADDED_MEMORY_PREFIX) && 
          !currentSegment.text.includes("Memory noted") &&
          !currentSegment.text.includes("Recap of the story so far:"))) {
        lastAiSegmentIndex = i;
        historyBeforeLastAi = storyHistory.slice(0, i); 
        break;
      }
    }
    
    if (lastAiSegmentIndex === -1) {
      console.warn("Regenerate: No suitable AI response found to regenerate.");
      return;
    }
  
    setSelectedImageForContextPanel(null); 
    setPendingImageAction(null); // Ensure no pending image edits interfere
  
    let textToResend: string;
    let historyForChatInitialization: StorySegment[];
    let historyForProcessUserResponse: StorySegment[];
    let isEffectivelyInitialCallForPcdUR: boolean;
    let isSystemDirectiveForPcdUR = false;

    const promptingSegmentIndex = lastAiSegmentIndex - 1;
    const segmentThatPromptedAi = promptingSegmentIndex >=0 ? storyHistory[promptingSegmentIndex] : null;

    if (segmentThatPromptedAi && segmentThatPromptedAi.speaker === 'User') {
        textToResend = segmentThatPromptedAi.text;
        historyForChatInitialization = storyHistory.slice(0, promptingSegmentIndex); 
        historyForProcessUserResponse = historyForChatInitialization; 
        isEffectivelyInitialCallForPcdUR = false;
    } else if (segmentThatPromptedAi && segmentThatPromptedAi.speaker === 'System' && segmentThatPromptedAi.text.startsWith(SYSTEM_COMMAND_PREFIX)) {
        textToResend = segmentThatPromptedAi.text;
        historyForChatInitialization = storyHistory.slice(0, promptingSegmentIndex);
        historyForProcessUserResponse = [...historyForChatInitialization, segmentThatPromptedAi]; 
        isEffectivelyInitialCallForPcdUR = false;
        isSystemDirectiveForPcdUR = true;
    } else if (storyConfig.initialPrompt && storyHistory.filter(s => s.speaker === 'User').length === 0) {
        textToResend = storyConfig.initialPrompt;
        const systemSetupSegment = storyHistory.find(s => s.speaker === 'System' && s.text.startsWith("Starting a new"));
        historyForChatInitialization = systemSetupSegment ? [systemSetupSegment] : [];
        historyForProcessUserResponse = systemSetupSegment ? [systemSetupSegment] : [];
        isEffectivelyInitialCallForPcdUR = true; 
    } else {
        console.warn("Regenerate: Could not determine the prompting action for the last AI response.");
        const lastUserSegment = [...historyBeforeLastAi].reverse().find(s => s.speaker === 'User');
        if (lastUserSegment) {
            textToResend = lastUserSegment.text;
            const lastUserIndex = historyBeforeLastAi.lastIndexOf(lastUserSegment);
            historyForChatInitialization = historyBeforeLastAi.slice(0, lastUserIndex);
            historyForProcessUserResponse = historyForChatInitialization;
            isEffectivelyInitialCallForPcdUR = false;
        } else {
            console.error("Regenerate: Critical error, cannot find a prompt to resend.");
            return; 
        }
    }
  
    setStoryHistory(historyBeforeLastAi); 
  
    const systemPromptForChat = storyConfig.initialPrompt || storyHistory.some(s => s.speaker === 'System' && s.text.startsWith("Starting a new"))
      ? generateNewStorySystemPrompt(storyConfig)
      : generateSeedStorySystemPrompt(storyConfig.enableImageGeneration);
    
    const newChat = await startChatSession(systemPromptForChat, historyForChatInitialization); 
  
    if (newChat) {
      setGeminiChat(newChat);
      await processUserResponse(textToResend, newChat, historyForProcessUserResponse, storyConfig, isEffectivelyInitialCallForPcdUR, isSystemDirectiveForPcdUR);
    } else {
      setError("Failed to re-initialize chat for regeneration.");
      setStoryHistory(storyHistory); 
      setGameMode('Error');
    }
  };

  const handleAddMemory = async (memoryText: string) => {
    if (!geminiChat || !storyConfig || isGeneratingNextPart) return;
    setSelectedImageForContextPanel(null); 
    setPendingImageAction(null);

    const memorySegment: StorySegment = {
      id: crypto.randomUUID(),
      speaker: 'System', 
      text: `${PLAYER_ADDED_MEMORY_PREFIX} ${memoryText}`,
      timestamp: new Date().toISOString(),
    };
    const newHistoryWithMemoryDirective = [...storyHistory, memorySegment];
    
    const command = `${SYSTEM_COMMAND_PREFIX} ${ADD_MEMORY_DIRECTIVE} ${memoryText}`;
    await processUserResponse(command, geminiChat, newHistoryWithMemoryDirective, storyConfig, false, true);
  };

  const handleRequestRecap = async () => {
    if (!geminiChat || !storyConfig || isGeneratingNextPart) return;
    setSelectedImageForContextPanel(null); 
    setPendingImageAction(null);
    const command = `${SYSTEM_COMMAND_PREFIX} ${REQUEST_RECAP_DIRECTIVE}`;
    await processUserResponse(command, geminiChat, storyHistory, storyConfig, false, true);
  };

  const handleSelectImageForContext = useCallback((imageUrl: string | undefined) => {
    setSelectedImageForContextPanel(imageUrl || null);
  }, []);

  const handleShowFullScreenImage = (imageUrl: string) => {
    setFullScreenImageUrl(imageUrl);
  };

  const handleCloseFullScreenImage = () => {
    setFullScreenImageUrl(null);
  };


  if (error && gameMode !== 'Error') {
    console.error("Global error state caught in App.tsx:", error);
  }

  if (gameMode === 'Error') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${currentTheme.colors.errorBg} ${currentTheme.colors.errorText} animate-fadeInScreen`}>
        <h2 className="text-4xl font-bold mb-4">An Error Occurred</h2>
        <p className="text-xl mb-6 max-w-md text-center">{error || "An unknown error occurred."}</p>
        <button
          onClick={handleBackToMenu}
          className={`font-semibold py-3 px-6 rounded-lg shadow-md ${currentTheme.colors.buttonSecondary} ${currentTheme.colors.text === 'text-white' || currentTheme.colors.text === 'text-gray-100' ? 'text-gray-900' : currentTheme.colors.primaryText }`}
        >
          Return to Main Menu
        </button>
      </div>
    );
  }
  
  switch (gameMode) {
    case 'MainMenu':
      return <MainMenu 
                key="mainmenu"
                theme={currentTheme} 
                onStartNewStory={() => setGameMode('NewStorySetup')} 
                onSeedStory={() => setGameMode('SeedStorySetup')}
                onContinueStory={handleContinueStory}
                hasSavedStory={hasSavedStory} 
              />;
    case 'NewStorySetup':
      return <NewStoryForm key="newstorysetup" theme={currentTheme} onSubmit={handleStartNewStory} onBack={handleBackToMenu} />;
    case 'SeedStorySetup':
      return <SeedStoryForm key="seedstorysetup" theme={currentTheme} onSubmit={(seedText, seedImage, enableImgGen) => handleSeedStory(seedText, seedImage, enableImgGen)} onBack={handleBackToMenu} />;
    case 'Playing':
      return (
        <GameScreen
          key="gamescreen"
          theme={currentTheme}
          storyHistory={storyHistory}
          currentChapter={currentChapter}
          currentStoryArcStage={currentStoryArcStage}
          isGeneratingNextPart={isGeneratingNextPart}
          isGeneratingImage={isGeneratingImage} 
          onUserResponse={handleUserResponse}
          onBackToMenu={handleBackToMenu}
          onInitiateImagePromptEdit={handleInitiateImagePromptEdit} 
          onExportStory={handleExportStory} 
          onRegenerateLastResponse={handleRegenerateLastResponse}
          onAddMemory={handleAddMemory}
          onRequestRecap={handleRequestRecap}
          selectedImageForContextPanel={selectedImageForContextPanel}
          onSelectImageForContext={handleSelectImageForContext}
          pendingImageAction={pendingImageAction} 
          onConfirmImageGeneration={handleConfirmImageGeneration} 
          onCancelImagePromptEdit={handleCancelImagePromptEdit} 
          fullScreenImageUrl={fullScreenImageUrl} 
          onShowFullScreenImage={handleShowFullScreenImage} 
          onCloseFullScreenImage={handleCloseFullScreenImage} 
        />
      );
    default: 
      return <MainMenu 
                key="defaultmenu"
                theme={currentTheme} 
                onStartNewStory={() => setGameMode('NewStorySetup')} 
                onSeedStory={() => setGameMode('SeedStorySetup')}
                onContinueStory={handleContinueStory}
                hasSavedStory={hasSavedStory}
             />;
  }
};

export default App;