# Interactive Story Weaver - Improvement Plan

This document outlines potential improvements and new features for the Interactive Story Weaver application, reflecting ongoing design and development goals.

## I. High-Impact UX & Immersion Enhancements

### 1. Streaming AI Responses
*   **Goal:** Implement streaming for AI text responses (`chat.sendMessageStream()`).
*   **Benefit:** Story appears word-by-word or sentence-by-sentence, significantly improving perceived responsiveness and making the interaction feel more dynamic, reducing wait times.

### 2. Advanced Image Interaction & Control
*   **Refine Image Prompt:** Allow users to view and *edit* AI-suggested `IMAGE_PROMPT`s before committing to image generation.
*   **Full-Screen Image View:** Add an option to view generated images in a larger, full-screen modal.
*   **Image Panel Context:** (Existing) Allow clicking on past story segments with images to update the "Visual Context" panel to show that specific image.
*   **Benefit:** Deeper engagement with visuals and more user agency.

## II. Further UI/UX Polish & Accessibility

### 1. Visual Polish & Theming
*   **Genre-Specific Themes:** (Existing) Dynamically adjust color palettes or subtle background patterns based on the selected story genre.
*   **UI Animations:** Introduce subtle animations for new story bubbles (fade-in/slide-up) and smooth transitions between screens.
*   **Benefit:** A more polished and premium feel.

### 2. Loading States & Feedback
*   **Finer-Grained Loading:**
    *   (Existing) Show "skeleton" placeholders for upcoming assistant story bubbles.
    *   (Existing) Display a small spinner/placeholder *within the specific segment's bubble* for image generation.
    *   Ensure loading indicators are specific (e.g., only image area when regenerating an image, text remains visible).
*   **Chapter Display:** (Existing) Make AI announcements for new chapters visually distinct in the story log.
*   **Benefit:** Clearer feedback to the user.

### 3. Enhanced Accessibility (A11y)
*   **Continuous Audit:** (Existing) Review and enhance ARIA attributes, especially for dynamic content like choices and new story segments (use `aria-live` regions effectively).
*   **Focus Management:** (Existing) Ensure robust keyboard navigation and clear, visible focus states, especially for modals and dynamic elements.
*   **Benefit:** Makes the app usable and enjoyable for a wider audience.

### 4. Error Messaging
*   (Existing) For non-critical errors (e.g., image generation failure but text succeeds), display a non-intrusive message within the GameScreen.

## III. Deepening Gemini API Integration & Story Mechanics

### 1. Robust Error Handling & Retry Logic
*   **Exponential Backoff:** (Existing - expand) Implement exponential backoff and retry mechanisms in `geminiService.ts` for transient network errors or API rate limits (e.g., HTTP 429, 5xx).
*   **Specific Error Codes:** (Existing - expand) Catch specific HTTP error codes (401/403 for API key, 429 for rate limits) for tailored feedback.
*   **Benefit:** Improved reliability and user experience.

### 2. Context Management for Very Long Stories
*   **AI-Powered Summarization:** For extremely long narratives, consider a strategy where the app periodically asks Gemini to summarize the story or extract key plot points/character developments. This summary could be re-injected into the system prompt or a condensed history.
*   **Benefit:** Helps maintain story coherence over extended play. (Related to existing "Memory/Recap" but more advanced)

### 3. Experiment with `thinkingConfig`
*   (Existing) For `gemini-2.5-flash-preview-04-17`, test `config: { thinkingConfig: { thinkingBudget: 0 } }` to potentially speed up responses, evaluating quality trade-offs.

### 4. Resilience in `services/geminiService.ts`
*   (`parseGeminiResponse`): (Existing) Improve robustness in handling minor variations in AI output formatting. Log parsing failures or retry triggers.

## IV. Code Quality & Future-Proofing

### 1. Comprehensive Testing
*   **Unit & Integration Tests:** Introduce unit tests for critical logic (e.g., `geminiService.ts`, prompt generation) and integration tests for user flows (e.g., using Jest, React Testing Library).
*   **Benefit:** Ensures stability during development and refactoring.

### 2. Performance for Long Story Logs
*   **UI Virtualization:** (Existing) If performance issues arise with many story segments, implement libraries like `react-window` or `TanStack Virtual` for the story log.
*   **Benefit:** Maintains a smooth experience.

### 3. Offline Functionality (PWA)
*   **Progressive Web App:** Explore turning the app into a PWA with a service worker and caching strategies. This could allow users to read loaded stories or even start new ones (with limited AI interaction) offline.
*   **Benefit:** Increased accessibility and app-like feel.

### 4. Prompt Management
*   (Existing) Keep system prompts in `services/prompts.ts` for better organization.

## V. Potential New Features (Already Implemented or Still Relevant)

### 1. Story Persistence
*   **Local Storage:** (Implemented) Allows users to save current story progress and load it.
*   **Export Story:** (Implemented) Enable users to export stories as text files.

### 2. Story Control
*   **"Regenerate Last AI Response":** (Implemented) Allows users to request a regeneration of the AI's last story segment.
*   **In-Game "Memory" or "Recap":** (Implemented) Features for users to add "key memories" or ask the AI for a "recap" to maintain context.

### 3. Branching Story Points (Future Consideration)
*   **Bookmark & Explore:** Allow users to "bookmark" a choice point and later return to explore a different path without losing progress on the original.
*   **Benefit:** Greatly increases replayability.

---
This plan serves as a reference for ongoing development and feature ideation for the Interactive Story Weaver.
