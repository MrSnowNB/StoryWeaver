import React, { useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface FullScreenImageModalProps {
  imageUrl: string;
  onClose: () => void;
  theme: AppTheme;
}

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({ imageUrl, onClose, theme }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      // Basic tab trapping (can be made more robust if many focusable elements are added)
      if (event.key === 'Tab' && modalRef.current) {
         if (document.activeElement === closeButtonRef.current && !event.shiftKey) {
            // Potentially loop focus back or to another element if more exist
            // For now, just prevent tabbing out if it's the only one
            // closeButtonRef.current?.focus(); 
            // event.preventDefault();
         }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${theme.colors.modalOverlay} transition-opacity duration-300 ease-in-out animate-fadeIn`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-image-modal-title"
    >
      <div
        ref={modalRef}
        className={`${theme.colors.cardBg} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] p-4 relative flex flex-col items-center justify-center transform transition-all duration-300 ease-in-out animate-scaleUp`}
      >
        <h2 id="fullscreen-image-modal-title" className="sr-only">Full Screen Image View</h2>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className={`absolute top-3 right-3 p-2 rounded-full ${theme.colors.secondary} ${theme.colors.secondaryText} hover:${theme.colors.secondaryHover} focus:outline-none focus:ring-2 ${theme.colors.accent.replace('text-','focus:ring-')}`}
          aria-label="Close full screen image view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Full screen story scene"
          className="max-w-full max-h-[calc(90vh-80px)] object-contain rounded"
        />
      </div>
       {/* Fix: Replaced Next.js specific <style jsx global> with standard <style> tag.
           Keyframes are renamed to be more specific to this modal to avoid potential global conflicts. */}
       <style>{`
        .animate-fadeIn { animation: FullScreenImageModal_fadeIn_animation 0.2s ease-out forwards; }
        .animate-scaleUp { animation: FullScreenImageModal_scaleUp_animation 0.2s ease-out forwards; }
        @keyframes FullScreenImageModal_fadeIn_animation { from { opacity: 0; } to { opacity: 1; } }
        @keyframes FullScreenImageModal_scaleUp_animation { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default FullScreenImageModal;