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
      <div className="flex gap-2 items-start">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => {
            setError('');
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          className="w-12 h-8 border border-gray-300 rounded cursor-pointer flex-shrink-0"
        />
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleTextChange}
            className={`w-full h-8 px-2 text-sm border rounded ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="#000000"
          />
          <div className="h-4 mt-1">{error && <p className="text-xs text-red-500">{error}</p>}</div>
        </div>
      </div>
    </div>
  );
}
