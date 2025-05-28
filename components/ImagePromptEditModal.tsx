import React, { useState, useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface ImagePromptEditModalProps {
  initialPrompt: string;
  onConfirm: (newPrompt: string) => void;
  onCancel: () => void;
  theme: AppTheme;
}

const ImagePromptEditModal: React.FC<ImagePromptEditModalProps> = ({ initialPrompt, onConfirm, onCancel, theme }) => {
  const [editedPrompt, setEditedPrompt] = useState(initialPrompt);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    textareaRef.current?.focus();
    textareaRef.current?.select();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      } else if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null); // only visible, focusable elements

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
      previouslyFocusedElement?.focus();
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedPrompt.trim()) {
      onConfirm(editedPrompt.trim());
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.colors.modalOverlay} transition-opacity duration-300 ease-in-out animate-fadeIn`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-prompt-edit-modal-title"
    >
      <div
        ref={modalRef}
        className={`${theme.colors.cardBg} p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 animate-scaleUp`}
      >
        <h3 id="image-prompt-edit-modal-title" className={`text-2xl font-semibold mb-4 ${theme.colors.text}`}>
          Edit Image Prompt
        </h3>
        <p className={`text-sm mb-3 ${theme.colors.secondaryText}`}>
          The AI has suggested an image prompt based on the story. You can edit it below to refine the details, style, or composition of the image you want to generate. Adjusting prompts is a great way to guide the AI and a common part of creative AI workflows!
        </p>
        <p className={`text-xs italic mb-4 ${theme.colors.secondaryText} opacity-80`}>
          Review or modify the AI-suggested prompt before generating the image.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="image-prompt-textarea" className="sr-only">Image Prompt</label>
          <textarea
            id="image-prompt-textarea"
            ref={textareaRef}
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={4}
            className={`w-full p-3 rounded-md resize-y ${theme.colors.inputField} mb-6 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
            placeholder="Enter image prompt..."
            aria-describedby="prompt-helper-text"
          />
          <p id="prompt-helper-text" className={`text-xs ${theme.colors.secondaryText} opacity-75 mb-6 -mt-4`}>
            Describe the scene you want to visualize.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className={`${theme.colors.buttonSecondary} py-2 px-4 focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
              aria-label="Cancel image generation"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="submit"
              disabled={!editedPrompt.trim()}
              className={`${theme.colors.buttonPrimary} py-2 px-4 ${!editedPrompt.trim() ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
            >
              Generate Image
            </button>
          </div>
        </form>
      </div>
      {/* Fix: Replaced Next.js specific <style jsx global> with standard <style> tag.
           Keyframes are renamed to be more specific to this modal to avoid potential global conflicts. */}
      <style>{`
        .animate-fadeIn { animation: ImagePromptEditModal_fadeIn_animation 0.3s ease-out forwards; }
        .animate-scaleUp { animation: ImagePromptEditModal_scaleUp_animation 0.3s ease-out forwards; }
        @keyframes ImagePromptEditModal_fadeIn_animation { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ImagePromptEditModal_scaleUp_animation { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ImagePromptEditModal;