import { useState, useRef, useEffect } from 'react';
import { HTML5_AD_SIZES, UI_LAYOUT } from '../consts';
import { type AdSize } from '../data';
import CheckIcon from '../assets/icons/check.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import UndoIcon from '../assets/icons/undo.svg?react';
import RedoIcon from '../assets/icons/redo.svg?react';

interface TopBarProps {
  mode: 'edit' | 'preview';
  selectedSize: AdSize;
  allowedSizes: AdSize[];
  canUndo: boolean;
  canRedo: boolean;
  onModeChange: (mode: 'edit' | 'preview') => void;
  onSizeChange: (size: AdSize) => void;
  onExportHTML: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

// Ad size common names
const AD_SIZE_NAMES: Record<AdSize, string> = {
  '728x90': 'Leaderboard',
  '336x280': 'Large Rectangle',
  '300x250': 'Medium Rectangle',
  '970x90': 'Large Leaderboard',
  '120x600': 'Skyscraper',
  '160x600': 'Wide Skyscraper',
  '300x600': 'Half Page',
  '320x50': 'Mobile Banner',
  '250x250': 'Square',
};

export const TopBar = ({
  mode,
  selectedSize,
  allowedSizes,
  canUndo,
  canRedo,
  onModeChange,
  onSizeChange,
  onExportHTML,
  onUndo,
  onRedo,
}: TopBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAspectRatioBox = (size: AdSize) => {
    const dimensions = HTML5_AD_SIZES[size];
    if (!dimensions) return null;
    
    const maxWidth = 24;
    const maxHeight = 16;

    let width = dimensions.width;
    let height = dimensions.height;

    // Scale to fit within max dimensions while maintaining aspect ratio
    const scale = Math.min(maxWidth / width, maxHeight / height);
    width = width * scale;
    height = height * scale;

    return (
      <div
        className="border border-gray-400 bg-gray-100"
        style={{ width: `${width}px`, height: `${height}px`, borderRadius: '2px' }}
      />
    );
  };

  return (
    <div
      className="border-b border-gray-200 flex items-center justify-between px-4 bg-white relative z-50"
      style={{ height: `${UI_LAYOUT.TOP_BAR_HEIGHT}px` }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Visual Builder</h1>

        {/* Size Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {getAspectRatioBox(selectedSize)}
            <span className="text-sm font-medium text-gray-900">{AD_SIZE_NAMES[selectedSize]}</span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-500 transition-transform ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen ? (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[200] min-w-[240px]">
              {allowedSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onSizeChange(size);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 transition-colors cursor-pointer text-left relative ${
                    size === selectedSize ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-6 flex justify-center flex-shrink-0">
                    {getAspectRatioBox(size)}
                  </div>
                  <div className="flex flex-col flex-1 leading-tight">
                    <span className="text-sm font-medium text-gray-900">{AD_SIZE_NAMES[size]}</span>
                    <span className="font-mono text-[11px] text-gray-600">{size}</span>
                  </div>
                  {size === selectedSize ? (
                    <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Undo/Redo Buttons */}
        <div className="flex gap-1 border-l border-gray-300 pl-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (⌥Z)"
          >
            <UndoIcon className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (⌥⇧Z)"
          >
            <RedoIcon className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Edit</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mode === 'preview'}
              onChange={(e) => onModeChange(e.target.checked ? 'preview' : 'edit')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm text-gray-700">Preview</span>
        </div>
        <button
          onClick={onExportHTML}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors text-sm cursor-pointer"
        >
          Export Template
        </button>
      </div>
    </div>
  );
};
