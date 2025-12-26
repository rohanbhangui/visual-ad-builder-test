import { HTML5_AD_SIZES } from '../consts';

interface SizeSelectorProps {
  allowedSizes: Array<keyof typeof HTML5_AD_SIZES>;
  selectedSize: keyof typeof HTML5_AD_SIZES;
  onSizeChange: (size: keyof typeof HTML5_AD_SIZES) => void;
}

export const SizeSelector = ({ allowedSizes, selectedSize, onSizeChange }: SizeSelectorProps) => {
  return (
    <div className="h-24 flex items-center justify-center gap-6 px-4">
      {allowedSizes.map((size) => {
        const { width, height } = HTML5_AD_SIZES[size];
        const isSelected = selectedSize === size;
        const scale = 0.12;

        return (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className="flex flex-col items-center gap-2 p-2 transition-opacity hover:opacity-80"
          >
            <div
              className={`bg-white shadow transition-colors duration-200 border-2 ${
                isSelected ? 'border-blue-600' : 'border-transparent'
              }`}
              style={{
                width: `${width * scale}px`,
                height: `${height * scale}px`,
              }}
            />
            <span className="text-xs font-medium text-gray-700">{size}</span>
          </button>
        );
      })}
    </div>
  );
};
