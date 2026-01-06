import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import XIcon from '../assets/icons/x.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adSelectorPosition: 'top' | 'bottom';
  onAdSelectorPositionChange: (position: 'top' | 'bottom') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  adSelectorPosition,
  onAdSelectorPositionChange,
}) => {
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
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Ad Selector</span>
            
            {/* Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer min-w-[120px] justify-between"
              >
                <span className="text-sm font-medium text-gray-900 capitalize">{adSelectorPosition}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen ? (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[200] min-w-[120px]">
                  <button
                    onClick={() => {
                      onAdSelectorPositionChange('top');
                      setIsDropdownOpen(false);
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
                      setIsDropdownOpen(false);
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
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
