import { useState } from 'react';
import { Label } from './Label/Label';
import { type AdSize } from '../data';
import cornersIcon from '../assets/icons/corners.svg';

interface CornersInputProps {
  label?: string;
  value: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  onChange: (
    value: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }
  ) => void;
  disabled?: boolean;
  isSizeSpecific?: boolean;
  selectedSize?: AdSize;
  onCopyToSize?: (targetSizes: AdSize[]) => void;
  allowedSizes?: AdSize[];
  currentSize?: AdSize;
}

export const CornersInput = ({
  label = 'Corners',
  value,
  onChange,
  disabled = false,
  isSizeSpecific = true,
  selectedSize,
  onCopyToSize,
  allowedSizes,
  currentSize,
}: CornersInputProps) => {
  const isUniform = typeof value === 'number';
  const [isExpanded, setIsExpanded] = useState(!isUniform);

  const individualValues = !isUniform
    ? value
    : { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value };

  // Check if all corners have the same value
  const allCornersSame =
    individualValues.topLeft === individualValues.topRight &&
    individualValues.topLeft === individualValues.bottomRight &&
    individualValues.topLeft === individualValues.bottomLeft;

  const mainInputValue =
    allCornersSame && individualValues.topLeft !== 0
      ? individualValues.topLeft.toString()
      : allCornersSame && individualValues.topLeft === 0
        ? ''
        : '';
  const mainInputPlaceholder = allCornersSame ? '' : 'Mixed';

  const handleMainInputChange = (value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    onChange(numValue);
  };

  const handleIndividualChange = (
    corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft',
    inputValue: string
  ) => {
    const numValue = inputValue === '' ? 0 : Math.max(0, parseInt(inputValue) || 0);

    // Get current values
    const currentValues =
      typeof value === 'number'
        ? { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value }
        : value;

    // Update the specific corner
    onChange({
      ...currentValues,
      [corner]: numValue,
    });
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <Label
        isSizeSpecific={isSizeSpecific}
        selectedSize={selectedSize}
        onCopyToSize={onCopyToSize}
        allowedSizes={allowedSizes}
        currentSize={currentSize}
        className="w-[250px]"
      >
        {label}
      </Label>
      {/* Main input - always visible */}
      <div className="flex gap-1 mb-1">
        <div className="relative flex-1">
          <img
            src={cornersIcon}
            alt="Corners"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={mainInputValue}
            placeholder={mainInputPlaceholder}
            onChange={(e) => handleMainInputChange(e.target.value)}
            disabled={disabled}
            className={`w-full h-8 pl-7 pr-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        </div>
        <button
          type="button"
          onClick={handleToggleExpanded}
          disabled={disabled}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            isExpanded ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isExpanded ? 'Hide individual corners' : 'Set individual corners'}
        >
          <img src={cornersIcon} alt="Corners" className="w-4 h-4" />
        </button>
      </div>

      {/* Individual corners - shown when expanded */}
      {isExpanded ? (
        <div className="space-y-1">
          {/* Top row */}
          <div className="flex gap-1">
            {/* Top-left */}
            <div className="flex-1 relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-t-2 border-gray-400 rounded-tl-sm pointer-events-none" />
              <input
                type="number"
                min="0"
                step="1"
                value={individualValues.topLeft}
                onChange={(e) => handleIndividualChange('topLeft', e.target.value)}
                disabled={disabled}
                className={`w-full h-8 pl-7 pr-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                title="Top-left"
              />
            </div>
            {/* Top-right */}
            <div className="flex-1 relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 border-r-2 border-t-2 border-gray-400 rounded-tr-sm pointer-events-none" />
              <input
                type="number"
                min="0"
                step="1"
                value={individualValues.topRight}
                onChange={(e) => handleIndividualChange('topRight', e.target.value)}
                disabled={disabled}
                className={`w-full h-8 pl-7 pr-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                title="Top-right"
              />
            </div>
          </div>
          {/* Bottom row */}
          <div className="flex gap-1">
            {/* Bottom-left */}
            <div className="flex-1 relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-b-2 border-gray-400 rounded-bl-sm pointer-events-none" />
              <input
                type="number"
                min="0"
                step="1"
                value={individualValues.bottomLeft}
                onChange={(e) => handleIndividualChange('bottomLeft', e.target.value)}
                disabled={disabled}
                className={`w-full h-8 pl-7 pr-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                title="Bottom-left"
              />
            </div>
            {/* Bottom-right */}
            <div className="flex-1 relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 border-r-2 border-b-2 border-gray-400 rounded-br-sm pointer-events-none" />
              <input
                type="number"
                min="0"
                step="1"
                value={individualValues.bottomRight}
                onChange={(e) => handleIndividualChange('bottomRight', e.target.value)}
                disabled={disabled}
                className={`w-full h-8 pl-7 pr-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                title="Bottom-right"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
