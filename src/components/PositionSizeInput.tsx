import { useState } from 'react';

interface PositionSizeInputProps {
  label: string;
  value: number;
  unit: 'px' | '%';
  onChange: (value: number, unit?: 'px' | '%') => void;
}

export function PositionSizeInput({ label, value, unit, onChange }: PositionSizeInputProps) {
  const [error, setError] = useState<string>('');

  const validateValue = (val: number, currentUnit: 'px' | '%'): boolean => {
    if (isNaN(val)) {
      return false;
    }
    if (currentUnit === '%' && (val < 0 || val > 100)) {
      return false;
    }
    return true;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    
    if (e.target.value === '' || e.target.value === '-') {
      setError('');
      onChange(0);
      return;
    }

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
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type="number"
          value={value}
          onChange={handleValueChange}
          className={`w-16 px-2 py-1 text-sm border rounded ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <select
          value={unit}
          onChange={handleUnitChange}
          className="px-1 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="px">px</option>
          <option value="%">%</option>
        </select>
      </div>
      <div className="h-4 mt-1">
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
