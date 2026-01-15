import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import XIcon from '../assets/icons/x.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adSelectorPosition: 'top' | 'bottom';
  onAdSelectorPositionChange: (position: 'top' | 'bottom') => void;
  animationMode: 'basic' | 'advanced' | 'both';
  onAnimationModeChange: (mode: 'basic' | 'advanced' | 'both') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  adSelectorPosition,
  onAdSelectorPositionChange,
  animationMode,
  onAnimationModeChange,
}) => {
  const [isAdSelectorDropdownOpen, setIsAdSelectorDropdownOpen] = useState(false);
  const [isAnimationModeDropdownOpen, setIsAnimationModeDropdownOpen] = useState(false);
  const adSelectorDropdownRef = useRef<HTMLDivElement>(null);
  const animationModeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adSelectorDropdownRef.current && !adSelectorDropdownRef.current.contains(event.target as Node)) {
        setIsAdSelectorDropdownOpen(false);
      }
      if (animationModeDropdownRef.current && !animationModeDropdownRef.current.contains(event.target as Node)) {
        setIsAnimationModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Semi-transparent black backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.66)' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="w-6" /> {/* Spacer for centering */}
          <h2 className="text-xl font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            App Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Ad Selector Setting */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Ad Selector</span>
            
            {/* Dropdown */}
            <div className="relative" ref={adSelectorDropdownRef}>
              <button
                onClick={() => setIsAdSelectorDropdownOpen(!isAdSelectorDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer min-w-[120px] justify-between"
              >
                <span className="text-sm font-medium text-gray-900 capitalize">{adSelectorPosition}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-500 transition-transform ${isAdSelectorDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isAdSelectorDropdownOpen ? (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[200] min-w-[120px]">
                  <button
                    onClick={() => {
                      onAdSelectorPositionChange('top');
                      setIsAdSelectorDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                      adSelectorPosition === 'top' ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => {
                      onAdSelectorPositionChange('bottom');
                      setIsAdSelectorDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                      adSelectorPosition === 'bottom' ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    Bottom
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Animation Mode Setting */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Animation Mode</span>
            
            {/* Dropdown */}
            <div className="relative" ref={animationModeDropdownRef}>
              <button
                onClick={() => setIsAnimationModeDropdownOpen(!isAnimationModeDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer min-w-[120px] justify-between"
              >
                <span className="text-sm font-medium text-gray-900 capitalize">{animationMode}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-500 transition-transform ${isAnimationModeDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isAnimationModeDropdownOpen ? (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[200] min-w-[120px]">
                  <button
                    onClick={() => {
                      onAnimationModeChange('basic');
                      setIsAnimationModeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                      animationMode === 'basic' ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    Basic
                  </button>
                  <button
                    onClick={() => {
                      onAnimationModeChange('advanced');
                      setIsAnimationModeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                      animationMode === 'advanced' ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    Advanced
                  </button>
                  <button
                    onClick={() => {
                      onAnimationModeChange('both');
                      setIsAnimationModeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                      animationMode === 'both' ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    Both
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
