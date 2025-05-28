import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AppTheme, STORY_ARC_STAGES, StoryArcStage } from '../types'; // Assuming STORY_ARC_STAGES is needed

interface LearnMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

const ModalOverlay = styled.div<{ isOpen: boolean; theme: AppTheme }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${(props) => props.theme.colors.modalOverlay};
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1050; // Higher than other modals if they can overlap
  font-family: ${(props) => props.theme.fonts.body};
  transition: opacity 0.3s ease-in-out;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
`;

const ModalContent = styled.div<{ theme: AppTheme }>`
  background: ${(props) => props.theme.colors.cardBg};
  color: ${(props) => props.theme.colors.text};
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 700px; // Wider for more content
  height: 80vh; // Max height
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  transform: ${(props) => (props.theme.name === 'fadeIn' ? 'scale(0.95)' : 'none')}; // Example conditional transform
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  opacity: 1; // Assuming ModalOverlay handles entry opacity

  h2 {
    color: ${(props) => props.theme.colors.primary};
    margin-top: 0;
    margin-bottom: 15px;
    text-align: center;
  }

  h3 {
    color: ${(props) => props.theme.colors.accent};
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    padding-bottom: 5px;
  }

  p, li {
    margin-bottom: 10px;
    line-height: 1.6;
    font-size: 0.95em;
  }

  ul {
    list-style: disc;
    padding-left: 20px;
  }

  strong {
    font-weight: 600;
  }
`;

const ScrollableArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px; // For scrollbar spacing
  margin-bottom: 15px;
  
  /* Custom scrollbar (optional, for consistent styling) */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background}; // Or a lighter version of cardBg
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbarThumb};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button<{ theme: AppTheme }>`
  background: ${(props) => props.theme.colors.buttonPrimary};
  color: ${(props) => props.theme.colors.primaryText};
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  align-self: flex-end; // Pushes to the right if ModalContent is flex
  margin-top: 10px;

  &:hover {
    background: ${(props) => props.theme.colors.primaryHover};
  }
`;

const StoryArcStageDefinitions: Record<StoryArcStage | "Story Arc", string> = {
  "Story Arc": "A story arc is the overall path a story follows, providing structure to the narrative. It typically involves character development, rising stakes, a climax, and resolution.",
  "Exposition": "The beginning of the story where characters, setting, and the basic conflict are introduced. It sets the stage for the events to come.",
  "Rising Action": "A series of events that build suspense and lead to the climax. Conflicts develop, stakes get higher, and characters face increasing challenges.",
  "Climax": "The turning point of the story, often the most intense moment. The main conflict comes to a head, and the outcome of the story is often decided here.",
  "Falling Action": "Events that occur after the climax, leading towards the resolution. Tension decreases, and the immediate consequences of the climax unfold.",
  "Resolution": "The end of the story where conflicts are resolved, and loose ends are tied up. We see the aftermath of the climax and the new state of the characters or world.",
};


const LearnMoreModal: React.FC<LearnMoreModalProps> = ({ isOpen, onClose, theme }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Focus the modal itself or the close button after a short delay for transition
      setTimeout(() => closeButtonRef.current?.focus(), 100); 

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        } else if (event.key === 'Tab' && modalContentRef.current) {
           // Basic focus trapping
          const focusableElements = Array.from(
            modalContentRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => el.offsetParent !== null);
          
          if (focusableElements.length === 0) return;
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else { // Tab
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
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay isOpen={isOpen} theme={theme} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="learnMoreModalTitle">
      <ModalContent ref={modalContentRef} theme={theme} onClick={(e) => e.stopPropagation()}>
        <h2 id="learnMoreModalTitle">Learn More: Story Craft & AI</h2>
        <ScrollableArea theme={theme}>
          {/* Creative Writing Concepts */}
          <h3>Creative Writing Concepts</h3>
          <strong>Story Arc:</strong>
          <p>{StoryArcStageDefinitions["Story Arc"]}</p>
          <ul>
            {STORY_ARC_STAGES.map((stage: StoryArcStage) => (
              <li key={stage}>
                <strong>{stage}:</strong> {StoryArcStageDefinitions[stage]}
              </li>
            ))}
          </ul>

          <strong>Genre:</strong>
          <p>Genre defines the category of your story (e.g., Sci-Fi, Fantasy, Horror). It sets expectations for tone, themes, and typical story elements. Choosing a genre helps the AI understand the desired style and conventions for its responses.</p>
          
          <strong>Setting:</strong>
          <p>The setting is the time and place where your story occurs. A well-described setting immerses the reader (and the AI!) and can influence the plot, character behavior, and overall mood. Specific details help the AI generate more relevant descriptions and events.</p>

          <strong>Protagonist:</strong>
          <p>The protagonist is the main character of your story. Defining their archetype (e.g., Brave Knight, Cunning Detective) helps the AI understand their typical motivations, strengths, and potential conflicts, shaping how they interact with the story world.</p>

          <strong>Choices & Branching Narratives:</strong>
          <p>In interactive stories, the choices you make directly influence the plot. Each decision can lead down a different path, creating a unique story experience. The AI provides these choices to give you agency and explore various outcomes.</p>

          {/* AI Workflow Integration */}
          <h3>AI Workflow Integration</h3>
          <strong>AI-Assisted Brainstorming:</strong>
          <p>The AI can be a powerful brainstorming partner. Use its suggestions for story segments, characters, plot twists, and image prompts as inspiration. Even if you decide to take the story in a different direction, the AI's ideas can spark your own creativity.</p>
          
          <strong>Prompt Refinement (for Text & Images):</strong>
          <p>The AI generates content based on prompts – instructions you provide. For images, this is the "image prompt." For story continuation, your choices or custom text act as prompts. You can refine these prompts to guide the AI. Clear, detailed prompts generally lead to more specific and desired outcomes. Don't hesitate to edit AI-suggested image prompts or be very specific in your text responses to steer the narrative.</p>
          
          <strong>Regeneration:</strong>
          <p>Not happy with the AI's last response or image? Use the "Regen" feature. This asks the AI to try generating a different continuation, set of choices, or image based on the same preceding context. It's a way to guide the story or visuals if you don't like the current path, without having to undo your last choice.</p>
          
          <strong>Using "Memory":</strong>
          <p>Help the AI build a richer, more consistent story! Add key details, character notes, or past events using the "Add Memory" feature. Providing specific memories helps the AI maintain coherence over longer narratives – a useful technique when working with AI, as it effectively adds to the AI's context for future turns.</p>
          
          <strong>Using "Recap":</strong>
          <p>Lost track of the plot or want to see what the AI remembers? Use the "Recap" button to request a summary of the story so far. This can help you (and the AI!) stay aligned on key events and ensure the narrative is progressing coherently.</p>

        </ScrollableArea>
        <CloseButton ref={closeButtonRef} theme={theme} onClick={onClose} aria-label="Close learn more modal">
          Close
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LearnMoreModal;
