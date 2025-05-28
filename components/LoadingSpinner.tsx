import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** If true, the spinner is purely decorative and will be hidden from screen readers.
   *  Set this if surrounding text already describes the loading state.
   *  Defaults to false, meaning it will have role="status" and a "Loading..." label.
   */
  isPurelyDecorative?: boolean; 
  label?: string; // Custom label for screen readers, defaults to "Loading..."
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', isPurelyDecorative = false, label = "Loading..." }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-20 h-20 border-8',
  };
  const colorClass = 'border-current';

  return (
    <div className="flex justify-center items-center my-1">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClass} border-t-transparent`}
        aria-hidden={isPurelyDecorative ? "true" : undefined}
        role={!isPurelyDecorative ? "status" : undefined}
      >
        {!isPurelyDecorative && <span className="visually-hidden">{label}</span>}
      </div>
    </div>
  );
};

export default LoadingSpinner;