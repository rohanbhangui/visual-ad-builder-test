import { useState, useEffect, useRef } from 'react';
import { Label } from './Label/Label';
import { DebouncedInput } from './DebouncedInput';

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
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Validate and debounce URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue === '') {
        setError(false);
        onChangeRef.current('');
        return;
      }

      // Basic URL validation
      try {
        new URL(inputValue);
        setError(false);
        onChangeRef.current(inputValue);
      } catch {
        setError(true);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <div>
      {label !== '' ? <Label>{label}</Label> : null}
      <DebouncedInput
        type="text"
        value={inputValue}
        onChange={(val) => setInputValue(val)}
        disabled={disabled}
        debounceMs={500}
        className={`w-full h-8 px-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${label === '' ? 'mt-1' : ''}`}
        placeholder={placeholder}
      />
    </div>
  );
};
