import { useState, useEffect } from 'react';
import { Label } from './Label';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  isGlobal?: boolean;
}

export const ColorInput = ({ label, value, onChange, disabled, isGlobal = false }: ColorInputProps) => {
  const [error, setError] = useState<string>('');
  const [inputValue, setInputValue] = useState(value || '');

  // Sync input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const validateColor = (color: string): boolean => {
    // Validate hex color format (#RGB or #RRGGBB)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);

    if (newColor === '') {
      setError('');
      onChange('');
    } else if (validateColor(newColor)) {
      setError('');
      onChange(newColor);
    } else {
      setError('Invalid hex color (e.g., #000000)');
    }
  };

  return (
    <div>
      <Label isGlobal={isGlobal}>{label}</Label>
      <div
        className={`flex items-stretch border rounded overflow-hidden ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => {
            setError('');
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          disabled={disabled}
          className={`w-8 h-8 border-none flex-shrink-0 ml-0.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleTextChange}
          disabled={disabled}
          className={`flex-1 h-8 px-2 text-sm border-none border-l border-gray-300 focus:outline-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
