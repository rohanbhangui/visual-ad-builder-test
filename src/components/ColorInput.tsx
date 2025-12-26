import { useState, useEffect } from 'react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
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
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
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
          className="w-8 h-8 border-none cursor-pointer flex-shrink-0 ml-0.5"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleTextChange}
          className="flex-1 h-8 px-2 text-sm border-none border-l border-gray-300 focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
