import React from 'react';
import { StoryArcStage, STORY_ARC_STAGES, AppTheme } from '../types';

interface StoryArcDisplayProps {
  currentStage: StoryArcStage | null;
  theme: AppTheme;
}

const StoryArcDisplay: React.FC<StoryArcDisplayProps> = ({ currentStage, theme }) => {
  const activeStageIndex = currentStage ? STORY_ARC_STAGES.indexOf(currentStage) : 0;

  const stageNameOverrides: { [key in StoryArcStage]?: string } = {
    "Rising Action": "Rising",
    "Falling Action": "Falling",
  };

  return (
    <div className="flex items-center justify-between w-full py-2 px-1" aria-label="Story Arc Progress">
      {STORY_ARC_STAGES.map((stage, index) => {
        const isCurrent = index === activeStageIndex;
        const isCompleted = index < activeStageIndex;
        const isPending = index > activeStageIndex;

        let stageClasses = `px-1.5 py-0.5 text-xs rounded-md transition-all duration-300 text-center truncate relative`; // Added relative for z-index
        
        if (isCurrent) {
          stageClasses += ` ${theme.colors.accentBg || 'bg-purple-600'} ${theme.colors.primaryText} font-bold shadow-lg ring-2 ring-opacity-75 ${theme.colors.accent.replace('text-','ring-')} transform scale-105 z-10`;
        } else if (isCompleted) {
          stageClasses += ` ${theme.colors.secondaryHover || 'bg-gray-600'} ${theme.colors.secondaryText} opacity-80`;
        } else { // isPending
          stageClasses += ` ${theme.colors.secondary || 'bg-gray-700'} bg-opacity-40 ${theme.colors.secondaryText} text-opacity-60 border border-dashed ${theme.colors.border}`;
        }
        
        if (stage === "Climax") {
            stageClasses += ` py-1`; // Slightly taller Climax
        }

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center mx-0.5 sm:mx-1 min-w-[50px] sm:min-w-[60px] flex-shrink"> {/* Adjusted margin for scale */}
              <div
                className={stageClasses}
                aria-current={isCurrent ? "step" : undefined}
                title={stage}
              >
                {stageNameOverrides[stage] || stage}
              </div>
              {isCurrent && (
                   <div className={`w-2 h-2 rounded-full mt-1 ${theme.colors.accentBg || 'bg-purple-600'}`}></div>
              )}
            </div>
            {index < STORY_ARC_STAGES.length - 1 && (
              <div
                className={`flex-grow h-1 rounded-sm transition-colors duration-300
                  ${index < activeStageIndex ? (theme.colors.accentBg || 'bg-purple-500') : `${theme.colors.border.replace('border-','bg-')} bg-opacity-30`}
                `}
                style={{minWidth: '8px'}} // Ensure connector line is visible
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StoryArcDisplay;