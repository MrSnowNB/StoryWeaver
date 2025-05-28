

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StorySegment, Choice, AppTheme, PendingImageAction, StoryArcStage } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ImagePromptEditModal from './ImagePromptEditModal'; // New import
import FullScreenImageModal from './FullScreenImageModal'; // New import
import StoryArcDisplay from './StoryArcDisplay'; // New import
import StoryArcInfoModal from './StoryArcInfoModal'; // Import the new modal
import LearnMoreModal from './LearnMoreModal'; // Import the new centralized modal
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Import an icon
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For Learn More button
import { useVirtualizer } from '@tanstack/react-virtual';

interface GameScreenProps {
  storyHistory: StorySegment[];
  currentChapter: string | null; 
  currentStoryArcStage: StoryArcStage | null; // New prop
  isGeneratingNextPart: boolean;
  isGeneratingImage: boolean; 
  onUserResponse: (response: string) => void;
  onBackToMenu: () => void;
  onInitiateImagePromptEdit: (segmentId: string, prompt: string) => void; // Changed from onRegenerateImage
  onExportStory: () => void; 
  onRegenerateLastResponse: () => void;
  onAddMemory: (memoryText: string) => void;
  onRequestRecap: () => void;
  theme: AppTheme;
  selectedImageForContextPanel: string | null;
  onSelectImageForContext: (imageUrl: string | undefined) => void;
  pendingImageAction: PendingImageAction | null;
  onConfirmImageGeneration: (segmentId: string, newPrompt: string) => void;
  onCancelImagePromptEdit: () => void;
  fullScreenImageUrl: string | null;
  onShowFullScreenImage: (imageUrl: string) => void;
  onCloseFullScreenImage: () => void;
}

interface StoryBubbleProps { 
  segment: StorySegment; 
  onInitiateImagePromptEdit: (segmentId: string, prompt: string) => void; 
  theme: AppTheme;
  onSelectImageForContext: (imageUrl: string | undefined) => void;
  onShowFullScreenImage: (imageUrl: string) => void;
  // No specific style prop needed from virtualizer if bubble handles its own margins
}

const StoryBubble: React.FC<StoryBubbleProps> = ({ segment, onInitiateImagePromptEdit, theme, onSelectImageForContext, onShowFullScreenImage }) => {
  const baseBubbleClasses = "p-3 md:p-4 rounded-xl mb-3 max-w-xl shadow-md relative animate-fadeInUp"; 
  
  let bubbleStyle = "";
  let textStyle = "";
  let textAlign = ""; 

  switch(segment.speaker) {
    case 'User':
      bubbleStyle = `${theme.colors.storyBubbleUserBg}`;
      textStyle = `${theme.colors.storyBubbleUserText}`;
      textAlign = "ml-auto"; 
      break;
    case 'Assistant':
      bubbleStyle = `${theme.colors.storyBubbleAssistantBg}`;
      textStyle = `${theme.colors.storyBubbleAssistantText}`;
      textAlign = "mr-auto"; 
      break;
    case 'System':
      bubbleStyle = `${theme.colors.storyBubbleSystemBg} w-full max-w-full text-center italic py-2`;
      textStyle = `${theme.colors.storyBubbleSystemText}`;
      textAlign = "mx-auto"; 
      if (segment.text.startsWith("Memory added by player:") || segment.text.includes("Recap of the story so far:") || segment.text.includes("Memory noted")) {
        bubbleStyle = `${theme.colors.secondary} opacity-90 border ${theme.colors.border}`;
        textStyle = `${theme.colors.secondaryText}`;
      }
      break;
  }

  const combinedBubbleClasses = `${baseBubbleClasses} ${bubbleStyle} ${textStyle} ${textAlign} break-words`;
  
  if (!segment.text && !segment.imageUrl && !segment.isGeneratingThisImage && !segment.isStreaming && !segment.imagePrompt) {
    if (segment.speaker === 'Assistant' && segment.choices && segment.choices.length > 0) {
      // This case seems complex, if an assistant bubble has only choices and no text/image/prompt, it's unusual.
      // Let's assume for now such segments are filtered out before reaching here or handled by other logic.
      // If it has choices it usually has text.
      return null; 
    }
     if (!segment.isGeneratingThisImage && segment.speaker !== 'System' && !segment.isStreaming && !segment.imagePrompt) return null;
  }

  const handleImageClick = () => {
    if (segment.imageUrl) {
      onSelectImageForContext(segment.imageUrl);
      onShowFullScreenImage(segment.imageUrl);
    }
  };

  return (
    <div className={combinedBubbleClasses}>
      {segment.isStreaming && segment.text.length === 0 && !segment.imageUrl && (
        <span className={`italic ${theme.colors.secondaryText} opacity-75 text-sm`}>AI is typing...</span>
      )}
      {segment.text && segment.text.trim() !== "" && (
        <p className="whitespace-pre-wrap text-sm md:text-base">
          {segment.text}
          {segment.isStreaming && <span className="inline-block animate-pulse">...</span>}
        </p>
      )}
      
      {segment.imageUrl && (
        <img 
          src={segment.imageUrl} 
          alt={segment.imagePrompt || "Story scene"}
          className={`mt-3 rounded-lg max-h-60 w-auto mx-auto shadow cursor-pointer transition-all duration-200 hover:ring-4 ${theme.colors.accent.replace('text-', 'ring-')} hover:ring-opacity-75 focus:outline-none focus:ring-4 ${theme.colors.accent.replace('text-', 'ring-')} focus:ring-opacity-75`}
          onClick={handleImageClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleImageClick(); }}
          tabIndex={0}
          aria-label="View image full screen and select for context panel"
        />
      )}
      {segment.speaker === 'Assistant' && segment.imagePrompt && !segment.imageUrl && !segment.isGeneratingThisImage && (
        <button 
          onClick={() => onInitiateImagePromptEdit(segment.id, segment.imagePrompt || '')} 
          className={`mt-2 text-xs ${theme.colors.accent} hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-1 ${theme.colors.accent.replace('text-','focus:ring-')}`}
          aria-label="Visualize this scene"
        >
          Visualize Scene
        </button>
      )}
      {segment.isGeneratingThisImage && (
        <div className={`mt-2 flex items-center space-x-2 text-xs ${segment.text && segment.text.trim() !== "" ? '' : 'justify-center w-full'}`}>
          <LoadingSpinner size="sm" isPurelyDecorative={true} /> 
          <span className={`${theme.colors.accent}`}>Visualizing: "{segment.imagePrompt || 'scene'}"...</span>
        </div>
      )}
      {(segment.text?.trim() || segment.imageUrl || segment.isGeneratingThisImage || (segment.isStreaming && segment.text.length > 0) ) && (
         <p className={`text-xs opacity-70 mt-2 ${segment.speaker === 'User' ? 'text-right' : segment.speaker === 'Assistant' ? 'text-right' : 'text-center'} ${segment.speaker === 'User' ? theme.colors.storyBubbleUserText : segment.speaker === 'Assistant' ? theme.colors.storyBubbleAssistantText : theme.colors.storyBubbleSystemText} opacity-60`}>
            {new Date(segment.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

const GameScreen: React.FC<GameScreenProps> = ({
  storyHistory,
  currentChapter, 
  currentStoryArcStage,
  isGeneratingNextPart,
  isGeneratingImage, 
  onUserResponse,
  onBackToMenu,
  onInitiateImagePromptEdit,
  onExportStory,
  onRegenerateLastResponse,
  onAddMemory,
  onRequestRecap,
  theme,
  selectedImageForContextPanel,
  onSelectImageForContext,
  pendingImageAction,
  onConfirmImageGeneration,
  onCancelImagePromptEdit,
  fullScreenImageUrl,
  onShowFullScreenImage,
  onCloseFullScreenImage,
}) => {
  const storyLogRef = useRef<HTMLDivElement>(null);
  const latestAssistantSegment = [...storyHistory].reverse().find(s => s.speaker === 'Assistant' && !s.isStreaming);
  const currentChoices = latestAssistantSegment?.choices || [];
  const canRegenerate = !isGeneratingNextPart && storyHistory.some(s => s.speaker === 'Assistant');

  const [userInput, setUserInput] = useState('');
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryInputValue, setMemoryInputValue] = useState('');
  const [isStoryArcInfoModalOpen, setIsStoryArcInfoModalOpen] = useState(false); 
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false); // State for LearnMoreModal

  const memoryModalRef = useRef<HTMLDivElement>(null);
  const memoryInputRef = useRef<HTMLTextAreaElement>(null);
  const addMemoryButtonRef = useRef<HTMLButtonElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: storyHistory.length,
    getScrollElement: () => storyLogRef.current,
    estimateSize: useCallback((index: number) => {
      const segment = storyHistory[index];
      if (!segment) return 100; // Fallback
      let estimatedHeight = 80; // Base for user/system simple messages
      if (segment.speaker === 'Assistant') estimatedHeight = 120;

      if (segment.imageUrl || segment.isGeneratingThisImage) estimatedHeight += 220; // Image + margin
      else if (segment.imagePrompt && !segment.imageUrl) estimatedHeight += 30; // Visualize button

      if (segment.text) {
        const lines = segment.text.split('\n').length;
        estimatedHeight += lines * 20; // Approximate line height
        if (segment.text.length > 150) estimatedHeight += 40; // Longer text
      }
      if (segment.choices && segment.choices.length > 0) {
         estimatedHeight += Math.ceil(segment.choices.length / 2) * 45 + 20; // Choices buttons + margin
      }
      estimatedHeight += 20; // Timestamp
      return Math.max(50, estimatedHeight);
    }, [storyHistory]),
    overscan: 5,
  });

  useEffect(() => {
    if (storyHistory.length > 0) {
      // Wait for DOM updates and measurements
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(storyHistory.length - 1, { align: 'end', behavior: 'auto' });
      });
    }
  }, [storyHistory.length]); // Only on new message addition

  useEffect(() => {
    const lastSegment = storyHistory[storyHistory.length - 1];
    if (lastSegment?.isStreaming && storyLogRef.current) {
        requestAnimationFrame(() => {
             if (storyLogRef.current) storyLogRef.current.scrollTop = storyLogRef.current.scrollHeight;
        });
    }
  // Only trigger on text change of the last segment if it's streaming
  }, [storyHistory[storyHistory.length -1]?.text, storyHistory[storyHistory.length -1]?.isStreaming]);


  useEffect(() => {
    if (showMemoryModal) {
      const previouslyFocusedElement = document.activeElement as HTMLElement;
      memoryInputRef.current?.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowMemoryModal(false);
          setMemoryInputValue('');
        } else if (event.key === 'Tab' && memoryModalRef.current) {
          const focusableElements = Array.from(
            memoryModalRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => el.offsetParent !== null); 
          
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) { 
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else { 
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement?.focus(); 
      };
    }
  }, [showMemoryModal]);


  const handleFreeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      onUserResponse(userInput.trim());
      setUserInput('');
    }
  };

  const handleSaveMemory = () => {
    if (memoryInputValue.trim()) {
      onAddMemory(memoryInputValue.trim());
      setMemoryInputValue('');
      setShowMemoryModal(false);
    }
  };
  
  const imageToShowInContext = selectedImageForContextPanel || [...storyHistory].reverse().find(s => s.imageUrl)?.imageUrl;
  const latestAssistantSegmentGeneratingImage = !imageToShowInContext && [...storyHistory].reverse().find(s => s.isGeneratingThisImage);

  const handleVisualContextImageClick = () => {
    if (imageToShowInContext) {
        onShowFullScreenImage(imageToShowInContext);
    }
  };
  
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className={`h-screen flex flex-col ${theme.colors.background} ${theme.colors.text} transition-colors duration-500 ease-in-out animate-fadeInScreen`}>
      <header className={`p-3 shadow-lg ${theme.colors.secondary} border-b ${theme.colors.border}`}>
        <div className="flex justify-between items-center mb-2">
            <h1 className={`text-xl sm:text-2xl font-bold ${theme.name === 'Horror' ? 'text-red-500' : theme.name === 'Sci-Fi' ? 'text-cyan-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500'}`}>
            Your Story Unfolds...
            </h1>
            <div className="flex items-center space-x-2">
                 <button
                  onClick={() => setIsLearnMoreModalOpen(true)}
                  className={`${theme.colors.buttonSecondary} text-xs sm:text-sm py-2 px-3 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')} flex items-center space-x-1`} 
                  aria-label="Help and Learn More"
                  disabled={isGeneratingNextPart}
                  title="Learn more about creative writing with AI"
                >
                  <HelpOutlineIcon style={{ fontSize: '1.1rem' }} />
                  <span>Learn</span>
                </button>
                <button
                  onClick={onExportStory}
                  className={`${theme.colors.buttonSecondary} text-xs sm:text-sm py-2 px-3 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`} 
                  aria-label="Export story"
                  disabled={isGeneratingNextPart}
                >
                  Export Story
                </button>
                <button
                  onClick={onBackToMenu}
                  className={`${theme.colors.buttonSecondary} text-xs sm:text-sm py-2 px-3 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`} 
                  aria-label="Back to main menu"
                  disabled={isGeneratingNextPart}
                >
                  Back to Menu
                </button>
            </div>
        </div>
         <div className="flex items-center justify-end w-full space-x-2 mt-1">
            {/* StoryArcDisplay removed from here, will be in right panel */}
            {currentChapter && (
            <span 
                className={`text-xs sm:text-sm font-medium px-3 py-1 rounded-full ${theme.colors.chapterDisplayBg} ${theme.colors.chapterDisplayText} whitespace-nowrap flex-shrink-0`}
                aria-label={`Current chapter: ${currentChapter}`}
            >
                {currentChapter}
            </span>
            )}
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Story Log and Input */}
        <div className="w-full md:w-2/3 flex flex-col p-4 overflow-hidden">
          <div 
            ref={storyLogRef} 
            className={`flex-grow overflow-y-auto pr-2 scrollbar-thin ${theme.colors.scrollbarThumb} ${theme.colors.scrollbarTrack}`} 
            aria-live="polite" 
            id="story-log-container"
            role="log"
          >
            {storyHistory.length > 0 ? (
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {virtualItems.map((virtualItem) => {
                  const segment = storyHistory[virtualItem.index];
                  if (!segment) return null; // Should not happen if count is correct
                  return (
                    <div
                      key={segment.id} // Use segment.id for stable key if virtualItem.key is just index
                      ref={virtualItem.measureRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <StoryBubble
                        segment={segment}
                        onInitiateImagePromptEdit={onInitiateImagePromptEdit}
                        theme={theme}
                        onSelectImageForContext={onSelectImageForContext}
                        onShowFullScreenImage={onShowFullScreenImage}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className={`${theme.colors.secondaryText} opacity-75`}>Your story will appear here...</p>
              </div>
            )}
          </div>
          
          {!isGeneratingNextPart && currentChoices.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${theme.colors.border} space-y-3`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Story choices">
                {currentChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => onUserResponse(choice.text)}
                    className={`w-full font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-300 text-sm md:text-base ${theme.colors.buttonPrimary.replace('transform hover:scale-105','')} focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`} 
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          { !isGeneratingNextPart && (
             <div className={`mt-auto pt-4 border-t ${theme.colors.border} ${currentChoices.length > 0 ? 'space-y-3' : ''}`}>
              {currentChoices.length > 0 && (
                <p className={`text-sm text-center ${theme.colors.secondaryText} opacity-75`}>Or type your own action:</p>
              )}

              <form onSubmit={handleFreeFormSubmit} className="flex gap-2">
                <label htmlFor="user-input-field" className="sr-only">
                  {currentChoices.length > 0 ? "Custom action..." : "What do you do next?"}
                </label>
                <input 
                  id="user-input-field"
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={currentChoices.length > 0 ? "Custom action..." : "What do you do next?"}
                  className={`flex-grow p-3 rounded-lg focus:outline-none text-sm md:text-base ${theme.colors.inputField}`}
                  disabled={isGeneratingNextPart} 
                />
                <button 
                  type="submit" 
                  className={`font-semibold py-3 px-5 rounded-lg shadow-md transition-colors duration-300 ${theme.colors.buttonPrimary.replace('bg-purple-600','bg-green-600').replace('hover:bg-purple-700','hover:bg-green-700').replace('bg-sky-600','bg-emerald-600').replace('hover:bg-sky-700','hover:bg-emerald-700').replace('bg-red-700','bg-lime-700').replace('hover:bg-red-800','hover:bg-lime-800')} focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                  aria-label="Send custom response"
                  disabled={isGeneratingNextPart} 
                >
                  Send
                </button>
              </form>
              
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                 {canRegenerate && (
                    <button
                        onClick={onRegenerateLastResponse}
                        disabled={!canRegenerate || isGeneratingNextPart}
                        className={`${theme.colors.buttonSecondary} ${(!canRegenerate || isGeneratingNextPart) ? 'opacity-50 cursor-not-allowed' : ''} text-xs sm:text-sm py-2 px-3 flex items-center space-x-2 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                        aria-label="Regenerate last AI response"
                        title="Not happy with the AI's last response? Click to ask the AI to try generating a different continuation or set of choices. This is a way to guide the story if you don't like the current path."
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span>Regen</span>
                    </button>
                )}
                <button
                    ref={addMemoryButtonRef}
                    onClick={() => setShowMemoryModal(true)}
                    disabled={isGeneratingNextPart}
                    className={`${theme.colors.buttonSecondary} ${isGeneratingNextPart ? 'opacity-50 cursor-not-allowed' : ''} text-xs sm:text-sm py-2 px-3 flex items-center space-x-2 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                    aria-label="Add a key memory"
                    title="Help the AI remember key details for a more consistent story. Useful for character notes, past events, or specific facts."
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5h0a6 6 0 01-6-6v-1.5m6 7.5v-1.5m-6-6A6 6 0 0112 3v1.5m0 0V3m0 1.5a6 6 0 00-6 6v1.5m6-7.5V3m0 1.5A6 6 0 0118 9v1.5m-6-7.5h0a6 6 0 00-6 6v1.5m6-7.5V9" />
                    </svg>
                    <span>Add Memory</span>
                </button>
                 <button
                    onClick={onRequestRecap}
                    disabled={isGeneratingNextPart}
                    className={`${theme.colors.buttonSecondary} ${isGeneratingNextPart ? 'opacity-50 cursor-not-allowed' : ''} text-xs sm:text-sm py-2 px-3 flex items-center space-x-2 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                    aria-label="Request story recap"
                    title="Lost track of the plot or want to see what the AI remembers? Click to request a summary of the story so far. This can help you (and the AI!) stay aligned on key events."
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <span>Recap</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel: Story Arc and Visual Context */}
        <div className={`w-full md:w-1/3 border-t md:border-t-0 md:border-l ${theme.colors.border} ${theme.colors.secondary} flex flex-col`}>
            {/* Top Half: Story Arc Display */}
            <div className="flex-1 p-4 flex flex-col items-center justify-center border-b ${theme.colors.border} overflow-hidden">
                 <div className="flex items-center justify-center mb-1">
                    <h2 id="story-arc-heading" className={`${theme.colors.secondaryText} text-lg font-semibold`}>Story Arc</h2>
                    <button
                        onClick={() => setIsStoryArcInfoModalOpen(true)}
                        className={`ml-2 ${theme.colors.secondaryText} hover:opacity-75 focus:outline-none focus:ring-1 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                        aria-label="Learn more about Story Arcs"
                    >
                        <InfoOutlinedIcon style={{ fontSize: '1.25rem' }} />
                    </button>
                 </div>
                 <div className="w-full">
                    <StoryArcDisplay currentStage={currentStoryArcStage} theme={theme} />
                 </div>
            </div>

            {/* Bottom Half: Visual Context */}
            <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden" aria-labelledby="visual-context-heading">
                <h2 id="visual-context-heading" className={`${theme.colors.secondaryText} text-lg mb-2 font-semibold`}>Visual Context</h2>
                
                {selectedImageForContextPanel && (
                    <button 
                    onClick={() => onSelectImageForContext(undefined)} 
                    className={`mb-3 text-xs ${theme.colors.accent} hover:opacity-80 focus:outline-none focus:ring-1 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                    aria-label="Show latest image in context panel"
                    >
                    Show Latest Image
                    </button>
                )}

                <div className="w-full flex-grow flex flex-col items-center justify-center">
                    {imageToShowInContext && (
                        <img 
                            src={imageToShowInContext} 
                            alt="Context scene" 
                            className="rounded-lg max-h-[calc(50vh-100px)] md:max-h-[calc(50vh-120px)] w-auto mx-auto shadow-xl object-contain cursor-pointer transition-transform hover:scale-105"
                            onClick={handleVisualContextImageClick}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleVisualContextImageClick(); }}
                            tabIndex={0}
                            aria-label="View image full screen"
                        />
                    )}
                    {latestAssistantSegmentGeneratingImage && !imageToShowInContext && <LoadingSpinner label="Loading image..." />} 
                    {!imageToShowInContext && !latestAssistantSegmentGeneratingImage && (
                    <div className={`text-center ${theme.colors.secondaryText} opacity-60 p-2`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-1 ${theme.colors.accent}`} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p className="text-sm">Images appear in the story.</p>
                        <p className="text-xs">Click an image in the log to view it here.</p>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </main>

      {showMemoryModal && (
        <div
          ref={memoryModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-modal-title"
        >
          <div className={`${theme.colors.cardBg} p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100`}>
            <h3 id="memory-modal-title" className={`text-2xl font-semibold mb-4 ${theme.colors.text}`}>Add a Key Memory</h3>
            <p className={`text-sm mb-4 ${theme.colors.secondaryText}`}>
              Help the AI build a richer, more consistent story! Add key details, character notes, or past events here. Providing specific memories helps the AI maintain coherence over longer narratives – a useful technique when working with AI.
            </p>
            <label htmlFor="memory-input" className="sr-only">Memory text input</label>
            <textarea
              id="memory-input"
              ref={memoryInputRef}
              value={memoryInputValue}
              onChange={(e) => setMemoryInputValue(e.target.value)}
              placeholder="E.g., The protagonist secretly carries a locket from their lost sibling."
              rows={4}
              className={`w-full p-3 rounded-md resize-y ${theme.colors.inputField} mb-4 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMemoryModal(false);
                  setMemoryInputValue('');
                }}
                className={`${theme.colors.buttonSecondary} py-2 px-4 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
                aria-label="Cancel adding memory"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemory}
                disabled={!memoryInputValue.trim() || isGeneratingNextPart}
                className={`${theme.colors.buttonPrimary} py-2 px-4 ${(!memoryInputValue.trim() || isGeneratingNextPart) ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingImageAction && (
        <ImagePromptEditModal
          theme={theme}
          initialPrompt={pendingImageAction.prompt}
          onConfirm={(newPrompt) => onConfirmImageGeneration(pendingImageAction.segmentId, newPrompt)}
          onCancel={onCancelImagePromptEdit}
        />
      )}

      {fullScreenImageUrl && (
        <FullScreenImageModal
          theme={theme}
          imageUrl={fullScreenImageUrl}
          onClose={onCloseFullScreenImage}
        />
      )}

      <StoryArcInfoModal
        isOpen={isStoryArcInfoModalOpen}
        onClose={() => setIsStoryArcInfoModalOpen(false)}
        theme={theme}
      />

      <LearnMoreModal
        isOpen={isLearnMoreModalOpen}
        onClose={() => setIsLearnMoreModalOpen(false)}
        theme={theme}
      />
    </div>
  );
};

export default GameScreen;
