import { useState } from 'react';
import type { AdSize } from '../../data';
import { CopySizePopover } from './CopySizePopover';

interface LabelProps {
  children: React.ReactNode;
  isSizeSpecific?: boolean;
  selectedSize?: AdSize;
  isSecondary?: boolean;
  htmlFor?: string;
  onCopyToSize?: (targetSizes: AdSize[]) => void;
  allowedSizes?: AdSize[];
  currentSize?: AdSize;
  className?: string;
}

export const Label = ({
  children,
  isSizeSpecific = false,
  selectedSize,
  isSecondary = false,
  htmlFor,
  onCopyToSize,
  allowedSizes,
  currentSize,
  className = '',
}: LabelProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipText = isSizeSpecific && selectedSize
    ? `${selectedSize} only`
    : undefined;

  return (
    <div className={`relative flex items-center justify-between mb-1 ${className}`}>
      <label
        htmlFor={htmlFor}
        className={`block text-xs font-medium pt-0.5 ${
          isSecondary ? 'text-gray-500' : 'text-gray-600'
        }`}
      >
        <span
          className={`relative inline-block ${
            isSizeSpecific
              ? 'px-0.5 bg-amber-100 text-amber-900 cursor-help'
              : ''
          }`}
          onMouseEnter={() => isSizeSpecific && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
        </span>
      </label>

      {onCopyToSize && allowedSizes && currentSize ? (
        <CopySizePopover
          allowedSizes={allowedSizes}
          currentSize={currentSize}
          onCopy={onCopyToSize}
        />
      ) : null}

      {showTooltip && tooltipText ? (
        <div
          className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap pointer-events-none"
          style={{
            transform: 'translateY(-100%)',
            marginTop: '-8px',
            left: 'var(--tooltip-x)',
            top: 'var(--tooltip-y)',
          }}
          ref={(el) => {
            if (el) {
              const span = el.parentElement?.querySelector('span');
              if (span) {
                const rect = span.getBoundingClientRect();
                el.style.setProperty('--tooltip-x', `${rect.left}px`);
                el.style.setProperty('--tooltip-y', `${rect.top}px`);
              }
            }
          }}
        >
          {tooltipText}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 bottom-0 left-2 translate-y-1"></div>
        </div>
      ) : null}
    </div>
  );
};
