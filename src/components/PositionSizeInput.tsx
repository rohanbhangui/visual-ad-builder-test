import { useState, useEffect } from 'react';
import { Label } from './Label';
import type { AdSize } from '../data';

interface PositionSizeInputProps {
  label: string;
  value: number;
  unit: 'px' | '%' | undefined;
  onChange: (value: number, unit?: 'px' | '%') => void;
  disabled?: boolean;
  placeholder?: string;
  isSizeSpecific?: boolean;
  selectedSize?: AdSize;
}

export const PositionSizeInput = ({
  label,
  value,
  unit,
  onChange,
  disabled,
  placeholder,
  isSizeSpecific = false,
  selectedSize,
}: PositionSizeInputProps) => {
  const [error, setError] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>(placeholder || value.toString());

  useEffect(() => {
    if (placeholder) {
      setInputValue(placeholder);
    } else {
      setInputValue(value.toString());
    }
  }, [value, placeholder]);

  const validateValue = (val: number, currentUnit: 'px' | '%' | undefined): boolean => {
    if (isNaN(val)) {
      return false;
    }
    if (currentUnit === '%' && (val < 0 || val > 100)) {
      return false;
    }
    return true;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Allow only numbers, minus sign, and decimal point
    if (inputVal !== '' && inputVal !== '-' && !/^-?\d*\.?\d*$/.test(inputVal)) {
      return;
    }
    
    setInputValue(inputVal);

    if (inputVal === '' || inputVal === '-') {
      setError('');
      return;
    }

    const newValue = parseFloat(inputVal);

    if (!validateValue(newValue, unit)) {
      if (unit === '%') {
        setError('Value must be 0-100 for %');
      } else {
        setError('Invalid number');
      }
    } else {
      setError('');
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    if (inputValue === '' || inputValue === '-' || inputValue === placeholder) {
      if (placeholder) {
        setInputValue(placeholder);
      } else {
        setInputValue(value.toString());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const increment = e.key === 'ArrowUp' ? step : -step;
      const newValue = value + increment;
      
      if (validateValue(newValue, unit)) {
        onChange(newValue);
        setInputValue(newValue.toString());
        setError('');
      }
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as 'px' | '%';
    if (!validateValue(value, newUnit)) {
      if (newUnit === '%' && value > 100) {
        onChange(100, newUnit);
      } else {
        onChange(value, newUnit);
      }
    } else {
      onChange(value, newUnit);
    }
    setError('');
  };

  return (
    <div>
      <Label isSizeSpecific={isSizeSpecific} selectedSize={selectedSize}>
        {label}
      </Label>
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={handleValueChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue === placeholder) {
              setInputValue('');
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-16 px-2 py-1 text-sm border rounded ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <select
          value={unit || ''}
          onChange={handleUnitChange}
          disabled={disabled}
          className={`px-1 py-1 text-sm border border-gray-300 rounded ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          {unit === undefined ? <option value="">-</option> : null}
          <option value="px">px</option>
          <option value="%">%</option>
        </select>
      </div>
    </div>
  );
};
