import { useState, useEffect } from 'react';

interface UrlInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const UrlInput = ({ label, value, onChange, placeholder, disabled }: UrlInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState(false);

  // Sync input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Validate and debounce URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue === '') {
        setError(false);
        onChange('');
        return;
      }

      // Basic URL validation
      try {
        new URL(inputValue);
        setError(false);
        onChange(inputValue);
      } catch {
        setError(true);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [inputValue, onChange]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        className={`w-full h-8 px-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
      />
    </div>
  );
};
