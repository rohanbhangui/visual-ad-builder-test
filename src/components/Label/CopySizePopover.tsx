import { useState, useRef, useEffect } from 'react';
import type { AdSize } from '../../data';
import CopyIcon from '../../assets/icons/copy.svg?react';

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

interface CopySizePopoverProps {
  allowedSizes: AdSize[];
  currentSize: AdSize;
  onCopy: (targetSizes: AdSize[]) => void;
  buttonClassName?: string;
  iconClassName?: string;
}

export const CopySizePopover = ({
  allowedSizes,
  currentSize,
  onCopy,
  buttonClassName,
  iconClassName = 'w-3.5 h-3.5',
}: CopySizePopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<AdSize[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allCheckboxRef = useRef<HTMLInputElement>(null);

  // Filter out current size from available targets
  const availableTargets = allowedSizes.filter((s) => s !== currentSize);

  // Set indeterminate state on "All sizes" checkbox
  useEffect(() => {
    if (allCheckboxRef.current) {
      const someSelected =
        selectedTargets.length > 0 && selectedTargets.length < availableTargets.length;
      allCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedTargets, availableTargets.length]);

  // Update popover position when it's shown
  useEffect(() => {
    if (isOpen && popoverRef.current && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = popoverRef.current.offsetHeight || 400; // Estimate if not rendered yet
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // Open upward if not enough space below but enough space above
      const openUpward = spaceBelow < popoverHeight + 8 && spaceAbove > popoverHeight + 8;

      if (openUpward) {
        // Position above the button
        popoverRef.current.style.setProperty(
          '--popover-top',
          `${buttonRect.top - popoverHeight - 4}px`
        );
      } else {
        // Position below the button (default)
        popoverRef.current.style.setProperty('--popover-top', `${buttonRect.bottom + 4}px`);
      }

      // Horizontal positioning (align to right of button)
      const popoverWidth = 224; // w-56 = 14rem = 224px
      let leftPos = buttonRect.right - popoverWidth;

      // Ensure popover doesn't go off left edge
      if (leftPos < 8) {
        leftPos = 8;
      }

      // Ensure popover doesn't go off right edge
      if (leftPos + popoverWidth > window.innerWidth - 8) {
        leftPos = window.innerWidth - popoverWidth - 8;
      }

      popoverRef.current.style.setProperty('--popover-left', `${leftPos}px`);
    }
  }, [isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedTargets([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (selectedTargets.length > 0) {
      onCopy(selectedTargets);
      setIsOpen(false);
      setSelectedTargets([]);
    }
  };

  const handleToggleAll = () => {
    if (selectedTargets.length === availableTargets.length) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets([...availableTargets]);
    }
  };

  // Don't render if no available targets
  if (availableTargets.length === 0) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          `cursor-pointer p-0.5 rounded transition-colors ${
            isOpen
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`
        }
        title="Copy to other sizes"
      >
        <CopyIcon className={iconClassName} />
      </button>

      {isOpen ? (
        <div
          ref={popoverRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-lg p-3 w-56"
          style={{
            top: 'var(--popover-top)',
            left: 'var(--popover-left)',
          }}
        >
          <div className="text-xs font-medium text-gray-700 mb-2">Copy to:</div>

          {/* All checkbox */}
          <label className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-1">
            <input
              ref={allCheckboxRef}
              type="checkbox"
              checked={selectedTargets.length === availableTargets.length}
              onChange={handleToggleAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-700">All sizes</span>
          </label>

          <div className="my-2 border-t border-gray-200"></div>

          {/* Individual size checkboxes */}
          {availableTargets.map((size) => (
            <label
              key={size}
              className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-1"
            >
              <input
                type="checkbox"
                checked={selectedTargets.includes(size)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTargets([...selectedTargets, size]);
                  } else {
                    setSelectedTargets(selectedTargets.filter((s) => s !== size));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">
                {size} - {AD_SIZE_NAMES[size]}
              </span>
            </label>
          ))}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedTargets([]);
              }}
              className="cursor-pointer flex-1 text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedTargets.length === 0}
              className="cursor-pointer flex-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};
