import { useState } from 'react';
import { Label } from './Label';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  isGlobal?: boolean;
}

export const ColorInput = ({
  label,
  value,
  onChange,
  disabled,
  isGlobal = false,
}: ColorInputProps) => {
  const [error, setError] = useState<string>('');
  const [inputValue, setInputValue] = useState(value || '');

  // Derive dropdown value from current value prop
  const dropdownValue: 'transparent' | 'custom' =
    value === 'transparent' || value === 'rgba(0,0,0,0)' ? 'transparent' : 'custom';

  // Sync input value when prop value changes from outside
  if (inputValue !== value && value !== undefined) {
    setInputValue(value || '');
  }

  const validateColor = (color: string): boolean => {
    // Allow transparent values
    if (color.toLowerCase() === 'transparent' || color === 'rgba(0,0,0,0)') {
      return true;
    }
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
        } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      >
        <input
          type="color"
          value={
            value === 'transparent' || value === 'rgba(0,0,0,0)' ? '#000000' : value || '#000000'
          }
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
          className={`flex-1 h-8 px-2 py-1 text-sm border-none border-l border-gray-300 focus:outline-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          placeholder="rgba(0,0,0,0) or #000000"
        />
        <div className="border-l border-gray-300 self-stretch my-1.5" />
        <div className="relative flex items-center">
          <select
            value={dropdownValue}
            onChange={(e) => {
              const newValue = e.target.value as 'transparent' | 'custom';
              if (newValue === 'transparent') {
                setInputValue('rgba(0,0,0,0)');
                onChange('rgba(0,0,0,0)');
                setError('');
              } else {
                // Switching to custom - use black as default
                setInputValue('#000000');
                onChange('#000000');
                setError('');
              }
            }}
            disabled={disabled}
            className={`appearance-none h-8 px-2 pr-7 text-sm border-none focus:outline-none focus:ring-0 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'
            }`}
          >
            <option value="custom">Custom</option>
            <option value="transparent">None</option>
          </select>
          <svg
            className="absolute right-[9px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
