import { useState, useEffect } from 'react';
import { Label } from './Label/Label';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showNoneOption?: boolean;
}

export const ColorInput = ({
  label,
  value,
  onChange,
  disabled,
  showNoneOption = false,
}: ColorInputProps) => {
  const [error, setError] = useState<string>('');
  
  // 1. Zustand value comes in as prop → local state
  const [localValue, setLocalValue] = useState(value);
  
  // 2. Debounce the local value
  const debouncedValue = useDebouncedValue(localValue, 300);

  // 3. Sync local state when Zustand value changes (e.g., undo/redo, external updates)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 4. When debounced value changes, update Zustand store
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, value]);

  // Derive dropdown value from local value
  const dropdownValue: 'transparent' | 'custom' =
    localValue === 'transparent' || localValue === 'rgba(0,0,0,0)' ? 'transparent' : 'custom';

  const validateColor = (color: string): boolean => {
    // Allow transparent values
    if (color.toLowerCase() === 'transparent' || color === 'rgba(0,0,0,0)') {
      return true;
    }
    // Validate hex color format (#RGB or #RRGGBB)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const handleTextChange = (newColor: string) => {
    // All input changes update local state immediately
    if (newColor === '') {
      setError('');
      setLocalValue('');
    } else if (validateColor(newColor)) {
      setError('');
      setLocalValue(newColor);
    } else {
      setError('Invalid hex color (e.g., #000000)');
      setLocalValue(newColor); // Still update local to show what user typed
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div
        className={`flex items-stretch border rounded overflow-hidden ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      >
        <input
          type="color"
          value={
            localValue === 'transparent' || localValue === 'rgba(0,0,0,0)' 
              ? '#000000' 
              : localValue || '#000000'
          }
          onChange={(e) => {
            setError('');
            setLocalValue(e.target.value); // Update local state immediately
          }}
          disabled={disabled}
          className={`w-8 h-8 border-none flex-shrink-0 ml-0.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <input
          type="text"
          value={localValue || ''}
          onChange={(e) => handleTextChange(e.target.value)} // Update local state immediately
          disabled={disabled}
          className={`flex-1 h-8 px-2 py-1 text-sm border-none border-l border-gray-300 focus:outline-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          placeholder="rgba(0,0,0,0) or #000000"
        />
        {showNoneOption ? (
          <>
            <div className="border-l border-gray-300 self-stretch my-1.5" />
            <div className="relative flex items-center">
              <select
                value={dropdownValue}
                onChange={(e) => {
                  const newValue = e.target.value as 'transparent' | 'custom';
                  setError('');
                  // Update local state immediately
                  if (newValue === 'transparent') {
                    setLocalValue('rgba(0,0,0,0)');
                  } else {
                    setLocalValue('#000000');
                  }
                }}
                disabled={disabled}
                className={`appearance-none h-8 px-2 pr-6 text-xs border-none focus:outline-none focus:ring-0 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'
                }`}
              >
                <option value="custom">Color</option>
                <option value="transparent">None</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-700" />
            </div>
          </>
        ) : null}
      </div>
      {error ? <div className="text-red-500 text-xs mt-1">{error}</div> : null}
    </div>
  );
};
