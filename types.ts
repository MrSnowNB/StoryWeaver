// Removed incorrect import of AppTheme. AppTheme is defined in this file.
// import { AppTheme } from "./themes"; // Ensure AppTheme is imported if used here, or defined
import { Chat } from "@google/genai";

export interface Choice {
  id: string;
  text: string;
}

export interface StorySegment {
  id: string;
  speaker: 'User' | 'Assistant' | 'System';
  text: string;
  imageUrl?: string; // base64 string or URL
  imagePrompt?: string; // The prompt suggested by AI or edited by user
  timestamp: string;
  choices?: Choice[];
  isGeneratingThisImage?: boolean; // True when image generation is actively in progress for this segment
  isStreaming?: boolean; // To indicate text is currently streaming into this segment
}

export const STORY_LENGTH_OPTIONS = ["Short Story (No Chapters)", "2 Chapters", "3 Chapters", "4 Chapters", "5 Chapters", "6 Chapters", "7 Chapters", "10 Chapters", "Epic (10+ Chapters)"] as const;
export type StoryLengthOption = typeof STORY_LENGTH_OPTIONS[number];

export interface StoryConfig {
  genre: StoryGenre; 
  setting: string;
  protagonist: string;
  storyLength: StoryLengthOption;
  enableImageGeneration: boolean;
  initialPrompt?: string; // Made optional as it won't exist for seeded/loaded stories
}

export type GameMode = 'MainMenu' | 'NewStorySetup' | 'SeedStorySetup' | 'Playing' | 'Error';

export const STORY_ARC_STAGES = ["Exposition", "Rising Action", "Climax", "Falling Action", "Resolution"] as const;
export type StoryArcStage = typeof STORY_ARC_STAGES[number];

export interface GeminiServiceResponse {
  text: string; // Full text, will be assembled from chunks if streaming
  imageGenPrompt?: string;
  choices?: string[];
  newChapterAnnouncement?: string; 
  storyArcStage?: StoryArcStage; // Added for story arc progress
  error?: string;
}

// Used by App.tsx when calling the streaming version of getNextStoryPart
export type GeminiStreamedServiceResponse = Omit<GeminiServiceResponse, 'text'>;


export interface GeminiService {
  startChatSession: (systemPrompt: string, initialHistory?: StorySegment[]) => Promise<Chat | null>;
  getNextStoryPart: (
    chat: Chat, 
    userInput: string, 
    onChunk: (chunkText: string) => void
  ) => Promise<GeminiStreamedServiceResponse>; // Text is handled by onChunk
  generateImageFromPrompt: (prompt: string) => Promise<string | null>;
}

export const STORY_GENRES = ["Sci-Fi", "Fantasy", "Mystery", "Horror", "Adventure", "Cyberpunk", "Romance", "Thriller", "Historical Fiction", "Slice of Life", "Dystopian", "Post-Apocalyptic", "Mythological"] as const;
export type StoryGenre = typeof STORY_GENRES[number];

export const STORY_SETTINGS = ["Futuristic Megacity", "Enchanted Forest", "Victorian London", "Haunted Mansion", "Lost Temple", "Space Station", "Ancient Ruins", "Desert Oasis", "Volcanic Lair", "Floating Sky Islands", "Underground City", "Steampunk Metropolis", "Digital Realm", "Rural Village"] as const;
export type StorySetting = typeof STORY_SETTINGS[number];

export const PROTAGONIST_ARCHETYPES = ["Brave Knight", "Cunning Detective", "Lone Explorer", "Rogue AI", "Young Mage", "Street Samurai", "Seasoned Spy", "Reluctant Hero", "Mad Scientist", "Ambitious Politician", "Wise Mentor", "Charming Rogue", "Rebel with a Cause", "Alien Ambassador"] as const;
export type ProtagonistArchetype = typeof PROTAGONIST_ARCHETYPES[number];

export interface ParsedSeedStory {
  initialHistory: StorySegment[];
  initialImage?: string; // base64
}

// Theming related types
export interface ThemeColors {
  background: string; 
  text: string; 
  primary: string; 
  primaryHover: string; 
  primaryText: string; 
  secondary: string; 
  secondaryHover?: string; 
  secondaryText: string; 
  accent: string; 
  accentBg?: string; 
  border: string; 
  errorBg: string; 
  errorText: string; 
  
  buttonPrimary: string;
  buttonSecondary: string;
  inputField: string;
  selectField: string;
  checkboxTrack: string;
  checkboxCheckedTrack: string;
  checkboxDot: string;
  cardBg: string;
  
  storyBubbleUserBg: string;
  storyBubbleUserText: string;
  storyBubbleAssistantBg: string;
  storyBubbleAssistantText: string;
  storyBubbleSystemBg: string;
  storyBubbleSystemText: string;
  
  scrollbarThumb: string;
  scrollbarTrack: string; 

  skeletonBg: string;

  chapterDisplayBg: string;
  chapterDisplayText: string;

  modalOverlay: string;
}

export interface AppTheme {
  name: string;
  colors: ThemeColors;
}

// For Local Storage
export interface StorySaveData {
  storyHistory: StorySegment[];
  storyConfig: StoryConfig;
  currentChapter: string | null;
  currentStoryArcStage: StoryArcStage | null; // Added for story arc progress
  themeName: string; // To restore theme
}

// For App.tsx state
export interface PendingImageAction {
  segmentId: string;
  prompt: string;
}