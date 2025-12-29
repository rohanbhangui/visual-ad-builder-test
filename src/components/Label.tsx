import { useState } from 'react';

interface LabelProps {
  children: React.ReactNode;
  isPerSize?: boolean;
  selectedSize?: string;
  htmlFor?: string;
}

export const Label = ({ children, isPerSize = false, selectedSize, htmlFor }: LabelProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipText = isPerSize && selectedSize ? `${selectedSize} only` : undefined;

  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-gray-600 mb-1"
      >
        <span
          className={`relative inline-block ${isPerSize ? 'px-0.5 bg-amber-100 text-amber-900 cursor-help' : ''}`}
          onMouseEnter={() => isPerSize && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
          {showTooltip && tooltipText ? (
            <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap -top-7 left-1/2 -translate-x-1/2 pointer-events-none">
              {tooltipText}
              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
            </div>
          ) : null}
        </span>
      </label>
    </div>
  );
};
