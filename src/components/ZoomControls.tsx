import { useState, useRef, useEffect } from 'react';
import ResetViewIcon from '../assets/icons/reset-view-ccw.svg?react';

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetPan: () => void;
}

export const ZoomControls = ({ zoom, onZoomChange, onResetPan }: ZoomControlsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleZoomIn = () => {
    const nextLevel = ZOOM_LEVELS.find((level) => level > zoom);
    if (nextLevel) {
      onZoomChange(nextLevel);
    }
  };

  const handleZoomOut = () => {
    const prevLevel = [...ZOOM_LEVELS].reverse().find((level) => level < zoom);
    if (prevLevel) {
      onZoomChange(prevLevel);
    }
  };

  const handleZoomLevelClick = (level: number) => {
    onZoomChange(level);
    setIsDropdownOpen(false);
  };

  const minZoom = ZOOM_LEVELS[0];
  const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2">
      {/* Reset Pan Button */}
      <button
        onClick={onResetPan}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200/80 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        title="Reset View"
      >
        <ResetViewIcon className="w-3.5 h-3.5" />
      </button>

      {/* Zoom Controls Group */}
      <div className="flex items-center">
        {/* Zoom Out Button */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          className="w-6 h-6 flex items-center justify-center rounded-l hover:bg-gray-200/80 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 font-medium text-base transition-colors cursor-pointer"
          title="Zoom Out"
        >
          −
        </button>

        {/* Zoom Percentage Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="min-w-[50px] px-1.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/80 transition-colors cursor-pointer border-l border-r border-gray-300"
            title="Select Zoom Level"
          >
            {Math.round(zoom * 100)}%
          </button>

          {isDropdownOpen ? (
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[70px]">
              {ZOOM_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleZoomLevelClick(level)}
                  className={`w-full px-2.5 py-1 text-xs text-left hover:bg-gray-100 ${
                    Math.abs(zoom - level) < 0.01
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {Math.round(level * 100)}%
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Zoom In Button */}
        <button
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          className="w-6 h-6 flex items-center justify-center rounded-r hover:bg-gray-200/80 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 font-medium text-base transition-colors cursor-pointer"
          title="Zoom In"
        >
          +
        </button>
      </div>
    </div>
  );
};
