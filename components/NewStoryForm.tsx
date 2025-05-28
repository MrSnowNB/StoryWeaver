import React, { useState } from 'react';
import { StoryConfig, STORY_GENRES, STORY_SETTINGS, PROTAGONIST_ARCHETYPES, StoryGenre, StorySetting, ProtagonistArchetype, STORY_LENGTH_OPTIONS, StoryLengthOption, AppTheme } from '../types';

interface NewStoryFormProps {
  onSubmit: (config: StoryConfig) => void;
  onBack: () => void;
  theme: AppTheme;
}

const NewStoryForm: React.FC<NewStoryFormProps> = ({ onSubmit, onBack, theme }) => {
  const [genre, setGenre] = useState<StoryGenre>(STORY_GENRES[0]);
  const [setting, setSetting] = useState<StorySetting>(STORY_SETTINGS[0]);
  const [protagonist, setProtagonist] = useState<ProtagonistArchetype>(PROTAGONIST_ARCHETYPES[0]);
  const [storyLength, setStoryLength] = useState<StoryLengthOption>(STORY_LENGTH_OPTIONS[0]);
  const [enableImageGeneration, setEnableImageGeneration] = useState<boolean>(true);
  const [customInitialPrompt, setCustomInitialPrompt] = useState<string>('');

  const learningTips = {
    genre: {
      "Sci-Fi": "Tip: Sci-Fi stories often explore future technologies, space travel, and societal changes. They can be optimistic or cautionary, focusing on 'what if?' scenarios.",
      "Fantasy": "Tip: Fantasy stories usually involve magical elements, mythical creatures, and epic quests in imaginary worlds. They often explore themes of good vs. evil.",
      "Horror": "Tip: Horror aims to evoke fear or dread. Common elements include supernatural beings, psychological thrills, and suspenseful situations where characters are in danger.",
    },
    setting: {
      "Futuristic Megacity": "Tip: A megacity setting suggests advanced technology, dense populations, and often themes of social stratification or rebellion.",
      "Enchanted Forest": "Tip: Enchanted forests are common in fantasy, filled with magic, hidden dangers, and mysterious creatures. They can symbolize the unknown or a journey into the subconscious.",
    },
    protagonist: {
      "Brave Knight": "Tip: Knights often embody honor, courage, and duty. Their stories might involve quests, protecting the innocent, or facing moral dilemmas.",
      "Cunning Detective": "Tip: Detectives are known for their intellect, observation skills, and pursuit of truth. Their stories usually revolve around solving mysteries and uncovering secrets.",
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initialPrompt = customInitialPrompt.trim() || `Begin a ${storyLength === "Short Story (No Chapters)" ? "short " : ""}${genre} story set in a ${setting}, featuring a ${protagonist}. Describe the opening scene.`;
    onSubmit({ genre, setting, protagonist, storyLength, initialPrompt, enableImageGeneration });
  };

  const handleRandomizeSelections = () => {
    const randomGenre = STORY_GENRES[Math.floor(Math.random() * STORY_GENRES.length)];
    const randomSetting = STORY_SETTINGS[Math.floor(Math.random() * STORY_SETTINGS.length)];
    const randomProtagonist = PROTAGONIST_ARCHETYPES[Math.floor(Math.random() * PROTAGONIST_ARCHETYPES.length)];
    // Optional: Randomize story length and image generation too, if desired in the future.
    // const randomStoryLength = STORY_LENGTH_OPTIONS[Math.floor(Math.random() * STORY_LENGTH_OPTIONS.length)];
    // const randomEnableImageGeneration = Math.random() < 0.5;

    setGenre(randomGenre);
    setSetting(randomSetting);
    setProtagonist(randomProtagonist);
    // setStoryLength(randomStoryLength);
    // setEnableImageGeneration(randomEnableImageGeneration);
  };

  const SelectField = <T extends string,>({ label, value, onChange, options }: { label:string, value: T, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: readonly T[]}) => (
    <div className="mb-6">
      <label className={`block text-sm font-bold mb-2 ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-300' : theme.colors.text}`} htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label}
      </label>
      <select
        id={label.toLowerCase().replace(/\s+/g, '-')}
        value={value}
        onChange={onChange}
        className={`shadow appearance-none rounded w-full py-3 px-4 leading-tight focus:outline-none ${theme.colors.selectField}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className={`${theme.colors.secondary} ${theme.colors.secondaryText}`}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; id: string }> = ({ label, checked, onChange, id }) => (
    <div className="mb-6">
      <label htmlFor={id} className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="sr-only"
            checked={checked}
            onChange={onChange}
          />
          <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? theme.colors.checkboxCheckedTrack : theme.colors.checkboxTrack}`}></div>
          <div className={`dot absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${theme.colors.checkboxDot} ${checked ? 'translate-x-full' : ''}`}></div>
        </div>
        <div className={`ml-3 font-medium ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-300' : theme.colors.text}`}>
          {label}
        </div>
      </label>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme.colors.background} transition-colors duration-500 ease-in-out animate-fadeInScreen`}>
      <div className={`w-full max-w-2xl p-8 md:p-12 ${theme.colors.cardBg}`}>
        <h2 className={`text-4xl font-bold text-center mb-10 ${theme.name === 'Horror' ? 'text-red-500' : theme.name === 'Sci-Fi' ? 'text-cyan-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500'}`}>
          Craft Your Adventure
        </h2>
        <form onSubmit={handleSubmit}>
          <SelectField label="Genre" value={genre} onChange={(e) => setGenre(e.target.value as StoryGenre)} options={STORY_GENRES} />
          {learningTips.genre[genre as keyof typeof learningTips.genre] && (
            <div className={`mt-1 p-2 rounded-md ${theme.colors.secondary} ${theme.colors.secondaryText} text-xs animate-fadeInUp`}>
              {learningTips.genre[genre as keyof typeof learningTips.genre]}
            </div>
          )}
          <SelectField label="Setting" value={setting} onChange={(e) => setSetting(e.target.value as StorySetting)} options={STORY_SETTINGS} />
          {learningTips.setting[setting as keyof typeof learningTips.setting] && (
            <div className={`mt-1 p-2 rounded-md ${theme.colors.secondary} ${theme.colors.secondaryText} text-xs animate-fadeInUp`}>
              {learningTips.setting[setting as keyof typeof learningTips.setting]}
            </div>
          )}
          <SelectField label="Protagonist Archetype" value={protagonist} onChange={(e) => setProtagonist(e.target.value as ProtagonistArchetype)} options={PROTAGONIST_ARCHETYPES} />
          {learningTips.protagonist[protagonist as keyof typeof learningTips.protagonist] && (
            <div className={`mt-1 p-2 rounded-md ${theme.colors.secondary} ${theme.colors.secondaryText} text-xs animate-fadeInUp`}>
              {learningTips.protagonist[protagonist as keyof typeof learningTips.protagonist]}
            </div>
          )}
          <SelectField label="Story Length" value={storyLength} onChange={(e) => setStoryLength(e.target.value as StoryLengthOption)} options={STORY_LENGTH_OPTIONS} />
          
          <div className="my-6 flex justify-center">
            <button
              type="button"
              onClick={handleRandomizeSelections}
              className={`${theme.colors.buttonSecondary} flex items-center space-x-2 py-2 px-4 text-sm`}
              aria-label="Shuffle story ideas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.648L16.5 21.75l-.398-1.102a3.375 3.375 0 00-2.455-2.456L12.75 18l1.102-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.102a3.375 3.375 0 002.456 2.456L20.25 18l-1.102.398a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              <span>Shuffle Ideas</span>
            </button>
          </div>

          <CheckboxField
            label="Enable Image Generation"
            id="enable-image-generation"
            checked={enableImageGeneration}
            onChange={(e) => setEnableImageGeneration(e.target.checked)}
          />

          <div className="mb-8">
            <label className={`block text-sm font-bold mb-2 ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-300' : theme.colors.text}`} htmlFor="initial-prompt">
              Optional: Custom Opening Prompt
            </label>
            <textarea
              id="initial-prompt"
              value={customInitialPrompt}
              onChange={(e) => setCustomInitialPrompt(e.target.value)}
              placeholder={`e.g., Our ${protagonist} awakens in a strange ${setting} with no memory...`}
              rows={3}
              className={`shadow appearance-none rounded w-full py-3 px-4 leading-tight focus:outline-none resize-none ${theme.colors.inputField}`}
            />
            <p className={`text-xs mt-1 ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-400' : theme.colors.accent}`}>If empty, a default prompt based on your selections will be used.</p>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <button
              type="button"
              onClick={onBack}
              className={`${theme.colors.buttonSecondary}`}
            >
              Back to Menu
            </button>
            <button
              type="submit"
              className={`${theme.colors.buttonPrimary} flex items-center space-x-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>Start Weaving!</span>
            </button>
          </div>
        </form>
      </div>
      {/* Minimal fade-in animation for tips */}
      <style>{`
        .animate-fadeInUp { 
          animation: NewStoryForm_fadeInUp_animation 0.3s ease-out forwards; 
          opacity: 0;
        }
        @keyframes NewStoryForm_fadeInUp_animation { 
          from { opacity: 0; transform: translateY(5px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
};

export default NewStoryForm;