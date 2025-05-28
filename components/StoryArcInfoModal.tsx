import React from 'react';
import styled from 'styled-components';
import { STORY_ARC_STAGES, StoryArcStage } from '../types'; // Updated import

interface StoryArcInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any; // Replace with your actual theme type
}

const ModalOverlay = styled.div<{ isOpen: boolean; theme: any }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: ${(props) => props.theme.fonts.body};
`;

const ModalContent = styled.div<{ theme: any }>`
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  h3 {
    color: ${(props) => props.theme.colors.primary};
    margin-top: 0;
  }
  p {
    margin-bottom: 10px;
    line-height: 1.6;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin-bottom: 15px;
  }
  strong {
    color: ${(props) => props.theme.colors.accent};
  }
`;

const CloseButton = styled.button<{ theme: any }>`
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  float: right;
  margin-top: 10px;

  &:hover {
    background: ${(props) => props.theme.colors.accent};
  }
`;

const StoryArcInfoModal: React.FC<StoryArcInfoModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) {
    return null;
  }

  // Definitions for story arc and its stages
  const definitions: Record<StoryArcStage | "Story Arc", string> = {
    "Story Arc": "A story arc is the path a story follows. It provides a structure for the narrative, typically starting with an introduction of characters and setting, building up conflict, reaching a peak, and then resolving.",
    "Exposition": "The beginning of the story where characters, setting, and the basic conflict are introduced.",
    "Rising Action": "A series of events that build suspense and lead to the climax. Conflicts develop and stakes get higher.",
    "Climax": "The turning point of the story, often the most intense moment. The main conflict comes to a head.",
    "Falling Action": "Events that occur after the climax, leading towards the resolution. Tension decreases.",
    "Resolution": "The end of the story where conflicts are resolved, and loose ends are tied up. We see the aftermath of the climax.",
  };

  return (
    <ModalOverlay isOpen={isOpen} theme={theme} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="storyArcInfoModalTitle">
      <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
        <h3 id="storyArcInfoModalTitle">About Story Arcs</h3>
        <p>{definitions["Story Arc"]}</p>
        <h4>Stages:</h4>
        <ul>
          {STORY_ARC_STAGES.map((stage: StoryArcStage) => (
            <li key={stage}>
              <strong>{stage}:</strong> {definitions[stage]}
            </li>
          ))}
        </ul>
        <CloseButton theme={theme} onClick={onClose} aria-label="Close story arc information modal">
          Close
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default StoryArcInfoModal;
