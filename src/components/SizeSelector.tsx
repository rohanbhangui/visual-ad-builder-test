import { HTML5_AD_SIZES } from '../data';

interface SizeSelectorProps {
  allowedSizes: Array<keyof typeof HTML5_AD_SIZES>;
  selectedSize: keyof typeof HTML5_AD_SIZES;
  onSizeChange: (size: keyof typeof HTML5_AD_SIZES) => void;
}

export function SizeSelector({ allowedSizes, selectedSize, onSizeChange }: SizeSelectorProps) {
  return (
    <div className="h-24 flex items-center justify-center gap-6 px-4">
      {allowedSizes.map(size => {
        const { width, height } = HTML5_AD_SIZES[size];
        const isSelected = selectedSize === size;
        const scale = 0.12;
        
        return (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
            style={{ padding: '8px' }}
          >
            <div
              style={{
                width: `${width * scale}px`,
                height: `${height * scale}px`,
                border: isSelected ? '2px solid #2563eb' : '2px solid transparent',
                background: 'white',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            />
            <span className="text-xs font-medium text-gray-700">{size}</span>
          </button>
        );
      })}
    </div>
  );
}
