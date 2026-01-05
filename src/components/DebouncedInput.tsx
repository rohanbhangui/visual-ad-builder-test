import { useState, useEffect, type InputHTMLAttributes } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/**
 * A text/number input that debounces onChange calls
 * Local state updates immediately for responsive UI, but onChange is debounced
 */
export const DebouncedInput = ({
  value,
  onChange,
  debounceMs = 300,
  ...inputProps
}: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const debouncedValue = useDebouncedValue(localValue, debounceMs);

  // Sync local value when prop value changes from outside
  useEffect(() => {
    setLocalValue(String(value ?? ''));
  }, [value]);

  // Call onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== String(value)) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  // Immediately commit on blur (hybrid approach)
  const handleBlur = () => {
    if (localValue !== String(value)) {
      onChange(localValue);
    }
  };

  return (
    <input
      {...inputProps}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
};
