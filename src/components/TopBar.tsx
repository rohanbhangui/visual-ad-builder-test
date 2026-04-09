import { useState, useRef, useEffect } from 'react';
import { HTML5_AD_SIZES, UI_LAYOUT } from '../consts';
import { type AdSize } from '../data';
import CheckIcon from '../assets/icons/check.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import UndoIcon from '../assets/icons/undo.svg?react';
import RedoIcon from '../assets/icons/redo.svg?react';
import SettingsIcon from '../assets/icons/settings.svg?react';
import PlusIcon from '../assets/icons/plus.svg?react';
import XIcon from '../assets/icons/x.svg?react';
import { AD_SIZE_NAMES } from '../utils/adSizes';

interface TopBarProps {
  mode: 'edit' | 'preview';
  selectedSize: AdSize;
  allowedSizes: AdSize[];
  canManageSizes?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showAdSelector?: boolean;
  onModeChange: (mode: 'edit' | 'preview') => void;
  onSizeChange: (size: AdSize) => void;
  onAddSize?: () => void;
  onDeleteSize?: (size: AdSize) => void;
  onExportHTML: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSettingsClick: () => void;
}

export const TopBar = ({
  mode,
  selectedSize,
  allowedSizes,
  canManageSizes = false,
  canUndo,
  canRedo,
  showAdSelector = true,
  onModeChange,
  onSizeChange,
  onAddSize,
  onDeleteSize,
  onExportHTML,
  onUndo,
  onRedo,
  onSettingsClick,
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

        {/* Size Selector Dropdown - Conditionally rendered */}
        {showAdSelector && (
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
                <div
                  key={size}
                  className={`group w-full flex items-center gap-2 px-4 py-2 transition-colors cursor-pointer text-left relative ${
                    size === selectedSize ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSizeChange(size);
                      setIsDropdownOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                  >
                    <div className="w-6 flex justify-center flex-shrink-0">
                      {size === selectedSize
                        ? <CheckIcon className="w-4 h-4 text-blue-600" />
                        : getAspectRatioBox(size)}
                    </div>
                    <div className="flex flex-col flex-1 leading-tight">
                      <span className="text-sm font-medium text-gray-900">{AD_SIZE_NAMES[size]}</span>
                      <span className="font-mono text-[11px] text-gray-600">{size}</span>
                    </div>
                  </button>
                  {allowedSizes.length > 1 && canManageSizes && onDeleteSize ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSize(size);
                        setIsDropdownOpen(false);
                      }}
                      className="cursor-pointer rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title={`Delete ${size}`}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
              {canManageSizes && onAddSize ? (
                <>
                  <div className="mx-3 border-t border-gray-200" />
                  <button
                    type="button"
                    onClick={() => {
                      onAddSize();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Size
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          </div>
        )}

        {/* Undo/Redo Buttons */}
        <div className="flex gap-1 border-l border-gray-300 pl-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="cursor-pointer p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (⌥Z)"
          >
            <UndoIcon className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="cursor-pointer p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (⌥⇧Z)"
          >
            <RedoIcon className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5 text-gray-700" />
        </button>

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
