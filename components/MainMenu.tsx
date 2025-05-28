import React from 'react';
import { APP_TITLE } from '../constants';
import { AppTheme } from '../types';

interface MainMenuProps {
  onStartNewStory: () => void;
  onSeedStory: () => void;
  onContinueStory: () => void;
  hasSavedStory: boolean;
  theme: AppTheme;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartNewStory, onSeedStory, onContinueStory, hasSavedStory, theme }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme.colors.background} transition-colors duration-500 ease-in-out animate-fadeInScreen`}>
      <header className="mb-12 text-center">
        <h1 className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4 ${theme.name === 'Horror' ? 'from-red-500 via-orange-600 to-yellow-600' : theme.name === 'Sci-Fi' ? 'from-sky-400 via-cyan-500 to-teal-500' : 'from-purple-400 via-pink-500 to-red-500'}`}>
          {APP_TITLE}
        </h1>
        <p className={`text-xl max-w-2xl ${theme.name === 'Horror' ? 'text-red-200' : theme.name === 'Sci-Fi' ? 'text-sky-300' : 'text-indigo-200'}`}>
          Craft epic tales with AI, or bring your own stories to life. Your adventure awaits!
        </p>
      </header>
      
      <div className="space-y-6 md:space-y-0 md:space-x-8 md:flex md:flex-wrap md:justify-center">
        {hasSavedStory && (
            <button
                onClick={onContinueStory}
                className={`${theme.colors.buttonPrimary} ${theme.name === 'Sci-Fi' ? 'bg-green-500 hover:bg-green-600' : theme.name === 'Horror' ? 'bg-yellow-600 hover:bg-yellow-700 text-black' : 'bg-green-500 hover:bg-green-600'} w-full md:w-64 text-lg flex items-center justify-center space-x-2 mb-6 md:mb-0`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
                <span>Continue Last Story</span>
            </button>
        )}
        <button
          onClick={onStartNewStory}
          className={`${theme.colors.buttonPrimary} w-full md:w-64 text-lg flex items-center justify-center space-x-2`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.648L16.5 21.75l-.398-1.102a3.375 3.375 0 00-2.455-2.456L12.75 18l1.102-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.102a3.375 3.375 0 002.456 2.456L20.25 18l-1.102.398a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          <span>Create New Story</span>
        </button>
        <button
          onClick={onSeedStory}
          className={`${theme.colors.buttonPrimary} ${theme.name === 'Sci-Fi' ? 'bg-teal-500 hover:bg-teal-600' : theme.name === 'Horror' ? 'bg-orange-700 hover:bg-orange-800' : 'bg-teal-500 hover:bg-teal-600'} w-full md:w-64 text-lg flex items-center justify-center space-x-2`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span>Seed Existing Story</span>
        </button>
      </div>
       <footer className={`mt-16 text-center text-sm ${theme.name === 'Horror' ? 'text-red-300' : theme.name === 'Sci-Fi' ? 'text-sky-400' : 'text-indigo-300'}`}>
        <p>Powered by Gemini API</p>
        <p>&copy; ${new Date().getFullYear()} Interactive Story Weaver. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainMenu;