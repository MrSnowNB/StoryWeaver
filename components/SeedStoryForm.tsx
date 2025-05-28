import React, { useState, useCallback } from 'react';
import { AppTheme } from '../types';

interface SeedStoryFormProps {
  onSubmit: (seedText: string, seedImage: string | undefined, enableImageGeneration: boolean) => void;
  onBack: () => void;
  theme: AppTheme;
}

const SeedStoryForm: React.FC<SeedStoryFormProps> = ({ onSubmit, onBack, theme }) => {
  const [seedText, setSeedText] = useState<string>('');
  const [seedImage, setSeedImage] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [textFileName, setTextFileName] = useState<string>('');
  const [enableImageGeneration, setEnableImageGeneration] = useState<boolean>(true);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSeedImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      setSeedImage(undefined);
      setImagePreview(undefined);
      setImageFileName('');
    }
  }, []);
  
  const handleFileImportChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTextFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSeedText(reader.result as string);
      };
      reader.readAsText(file);
    } else {
        setTextFileName('');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seedText.trim()) {
      onSubmit(seedText, seedImage, enableImageGeneration);
    } else {
      alert("Please provide some story text to seed, either by pasting or uploading a file.");
    }
  };

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
      <div className={`w-full max-w-3xl p-8 md:p-12 ${theme.colors.cardBg}`}>
        <h2 className={`text-4xl font-bold text-center mb-10 ${theme.name === 'Horror' ? 'text-orange-500' : theme.name === 'Sci-Fi' ? 'text-teal-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500'}`}>
          Continue Your Saga
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className={`block text-sm font-bold mb-2 ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-300' : theme.colors.text}`} htmlFor="seed-text">
              Paste Story Text or Upload File
            </label>
            <textarea
              id="seed-text"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              placeholder="Paste your existing story here, or upload a .txt file below."
              rows={8}
              className={`shadow appearance-none rounded w-full py-3 px-4 leading-tight focus:outline-none resize-y ${theme.colors.inputField}`}
            />
             <div className="mt-2">
                <label
                    htmlFor="text-file-upload"
                    className={`cursor-pointer rounded-md font-medium px-3 py-2 text-sm ${theme.colors.buttonSecondary} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${theme.colors.inputField.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:ring-','focus-within:ring-offset-')} ${theme.colors.inputField.split(' ').find(c => c.startsWith('focus:ring-'))}`}
                  >
                    <span>Upload Story File (.txt)</span>
                    <input id="text-file-upload" name="text-file-upload" type="file" className="sr-only" accept=".txt,text/plain" onChange={handleFileImportChange} />
                </label>
                {textFileName && <p className={`text-xs mt-1 ${theme.colors.accent}`}>{textFileName} selected.</p>}
            </div>
          </div>

          <div className="mb-8">
            <label className={`block text-sm font-bold mb-2 ${theme.colors.text === 'text-gray-100' || theme.colors.text === 'text-sky-100' ? 'text-indigo-300' : theme.colors.text}`}>
              Upload Initial Image (Optional)
            </label>
            <div className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${theme.colors.inputField} ${theme.colors.border} hover:${theme.colors.border.replace('border-', 'border-accent-')}`}>
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto rounded object-contain mb-2"/>
                ) : (
                  <svg className={`mx-auto h-12 w-12 ${theme.colors.accent}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <div className={`flex text-sm ${theme.colors.secondaryText}`}>
                  <label
                    htmlFor="image-file-upload"
                    className={`relative cursor-pointer rounded-md font-medium px-2 py-1 ${theme.colors.secondary} ${theme.colors.accent} hover:${theme.colors.accent.replace('text-', 'text-opacity-80-')} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${theme.colors.inputField.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:ring-','focus-within:ring-offset-')} ${theme.colors.inputField.split(' ').find(c => c.startsWith('focus:ring-'))}`}
                  >
                    <span>Upload image file</span>
                    <input id="image-file-upload" name="image-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                {imageFileName && <p className={`text-xs ${theme.colors.accent}`}>{imageFileName}</p>}
                {!imageFileName && <p className={`text-xs ${theme.colors.secondaryText} opacity-75`}>PNG, JPG, GIF up to 10MB</p>}
              </div>
            </div>
          </div>
          
          <CheckboxField
            label="Enable Image Generation for this story"
            id="enable-image-generation-seed"
            checked={enableImageGeneration}
            onChange={(e) => setEnableImageGeneration(e.target.checked)}
          />

          <div className="flex items-center justify-between space-x-4 mt-8">
            <button
              type="button"
              onClick={onBack}
              className={`${theme.colors.buttonSecondary}`}
            >
              Back to Menu
            </button>
            <button
              type="submit"
              className={`${theme.colors.buttonPrimary} ${theme.name === 'Sci-Fi' ? 'bg-teal-500 hover:bg-teal-600' : theme.name === 'Horror' ? 'bg-orange-700 hover:bg-orange-800' : ''} flex items-center space-x-2`}
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
              </svg>
              <span>Continue Story</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeedStoryForm;