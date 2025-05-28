import { AppTheme, ThemeColors, StoryGenre } from './types';

const defaultColors: ThemeColors = {
  background: 'bg-gray-900',
  text: 'text-gray-100',
  primary: 'bg-purple-600',
  primaryHover: 'hover:bg-purple-700',
  primaryText: 'text-white',
  secondary: 'bg-gray-700',
  secondaryHover: 'hover:bg-gray-600',
  secondaryText: 'text-gray-200',
  accent: 'text-pink-500',
  accentBg: 'bg-pink-500',
  border: 'border-gray-700',
  errorBg: 'bg-red-800', 
  errorText: 'text-white',

  buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105',
  buttonSecondary: 'bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300',
  inputField: 'bg-gray-700 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent',
  selectField: 'bg-gray-700 border border-indigo-700 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent',
  checkboxTrack: 'bg-gray-600',
  checkboxCheckedTrack: 'bg-purple-600',
  checkboxDot: 'bg-white',
  cardBg: 'bg-gray-900 shadow-2xl rounded-xl',

  storyBubbleUserBg: 'bg-indigo-600',
  storyBubbleUserText: 'text-white',
  storyBubbleAssistantBg: 'bg-gray-700',
  storyBubbleAssistantText: 'text-gray-200',
  storyBubbleSystemBg: 'bg-yellow-600',
  storyBubbleSystemText: 'text-white',
  
  scrollbarThumb: 'scrollbar-thumb-purple-500',
  scrollbarTrack: 'scrollbar-track-gray-800', 

  skeletonBg: 'bg-gray-700 animate-pulse',

  chapterDisplayBg: 'bg-purple-500 bg-opacity-20',
  chapterDisplayText: 'text-purple-300',
  modalOverlay: 'bg-black bg-opacity-75',
};

export const defaultTheme: AppTheme = {
  name: 'Default',
  colors: defaultColors,
};

const sciFiColors: ThemeColors = {
  ...defaultColors, 
  background: 'bg-slate-900', 
  text: 'text-sky-100',
  primary: 'bg-sky-600',
  primaryHover: 'hover:bg-sky-700',
  primaryText: 'text-white',
  secondary: 'bg-slate-700',
  secondaryHover: 'hover:bg-slate-600',
  secondaryText: 'text-sky-100',
  accent: 'text-cyan-400',
  accentBg: 'bg-cyan-500',
  border: 'border-slate-600',

  buttonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105',
  buttonSecondary: 'bg-slate-600 hover:bg-slate-700 text-sky-100 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300',
  inputField: 'bg-slate-700 border border-slate-600 text-sky-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
  selectField: 'bg-slate-700 border border-sky-700 text-sky-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
  checkboxCheckedTrack: 'bg-sky-600',
  cardBg: 'bg-slate-800 shadow-2xl rounded-xl',
  
  storyBubbleUserBg: 'bg-blue-700', 
  storyBubbleUserText: 'text-white',
  storyBubbleAssistantBg: 'bg-slate-700', 
  storyBubbleAssistantText: 'text-sky-100',
  storyBubbleSystemBg: 'bg-teal-600',
  storyBubbleSystemText: 'text-white',

  scrollbarThumb: 'scrollbar-thumb-sky-500',
  scrollbarTrack: 'scrollbar-track-slate-800',

  skeletonBg: 'bg-slate-700 animate-pulse',

  chapterDisplayBg: 'bg-cyan-500 bg-opacity-20',
  chapterDisplayText: 'text-cyan-300',
  modalOverlay: 'bg-slate-900 bg-opacity-75',
};

export const sciFiTheme: AppTheme = {
  name: 'Sci-Fi',
  colors: sciFiColors,
};

const horrorColors: ThemeColors = {
  ...defaultColors,
  background: 'bg-black', 
  text: 'text-red-100', 
  primary: 'bg-red-700',
  primaryHover: 'hover:bg-red-800',
  primaryText: 'text-gray-100',
  secondary: 'bg-neutral-800', 
  secondaryHover: 'hover:bg-neutral-700',
  secondaryText: 'text-red-200',
  accent: 'text-red-500',
  accentBg: 'bg-red-600',
  border: 'border-neutral-700',
  errorBg: 'bg-red-900', 

  buttonPrimary: 'bg-red-700 hover:bg-red-800 text-gray-100 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 border border-red-900',
  buttonSecondary: 'bg-neutral-800 hover:bg-neutral-700 text-red-100 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300 border border-neutral-900',
  inputField: 'bg-neutral-800 border border-neutral-700 text-red-100 focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-red-300',
  selectField: 'bg-neutral-800 border border-red-700 text-red-100 focus:ring-2 focus:ring-red-600 focus:border-transparent',
  checkboxCheckedTrack: 'bg-red-700',
  cardBg: 'bg-neutral-900 shadow-2xl rounded-xl border border-neutral-800',

  storyBubbleUserBg: 'bg-red-900', 
  storyBubbleUserText: 'text-gray-200',
  storyBubbleAssistantBg: 'bg-neutral-800',
  storyBubbleAssistantText: 'text-red-200',
  storyBubbleSystemBg: 'bg-orange-800', 
  storyBubbleSystemText: 'text-white',
  
  scrollbarThumb: 'scrollbar-thumb-red-700',
  scrollbarTrack: 'scrollbar-track-neutral-900',

  skeletonBg: 'bg-neutral-800 animate-pulse',

  chapterDisplayBg: 'bg-red-500 bg-opacity-20',
  chapterDisplayText: 'text-red-300',
  modalOverlay: 'bg-black bg-opacity-85',
};

export const horrorTheme: AppTheme = {
  name: 'Horror',
  colors: horrorColors,
};


export const getThemeByGenre = (genre?: StoryGenre): AppTheme => {
  if (!genre) return defaultTheme;
  switch (genre) {
    case 'Sci-Fi':
    case 'Cyberpunk': 
      return sciFiTheme;
    case 'Horror':
      return horrorTheme;
    case 'Fantasy':
    case 'Mystery':
    case 'Adventure':
    default:
      return defaultTheme;
  }
};