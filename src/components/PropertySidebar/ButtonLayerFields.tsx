import { type ButtonLayer, type AdSize } from '../../data';
import { ColorInput } from '../ColorInput';
import { UrlInput } from '../UrlInput';
import { Label } from '../Label';
import { FONT_SIZE_OPTIONS, MAX_BUTTON_TEXT_LENGTH, GOOGLE_FONTS } from '../../consts';

interface ButtonLayerFieldsProps {
  layer: ButtonLayer;
  selectedSize: AdSize;
  onImageUrlChange: (layerId: string, url: string) => void;
  onTextChange: (layerId: string, text: string) => void;
  onColorChange: (layerId: string, color: string) => void;
  onFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onFontSizeChange: (layerId: string, fontSize: string) => void;
  onBackgroundColorChange: (layerId: string, color: string) => void;
}

export const ButtonLayerFields = ({
  layer,
  selectedSize,
  onImageUrlChange,
  onTextChange,
  onColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onBackgroundColorChange,
}: ButtonLayerFieldsProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  return (
    <>
      <UrlInput
        label="Button URL"
        value={layer.url}
        onChange={(url) => onImageUrlChange(layer.id, url)}
        placeholder="https://example.com"
        disabled={layer.locked}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-600">Button Text</label>
          <span
            className={`text-xs ${
              layer.text.length > MAX_BUTTON_TEXT_LENGTH ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {layer.text.length}/{MAX_BUTTON_TEXT_LENGTH}
          </span>
        </div>
        <input
          type="text"
          value={layer.text}
          onChange={(e) => onTextChange(layer.id, e.target.value)}
          disabled={layer.locked}
          className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <ColorInput
        label="Text Color"
        value={layer.styles?.color || '#ffffff'}
        onChange={(color) => onColorChange(layer.id, color)}
        disabled={layer.locked}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
          <select
            value={layer.styles?.fontFamily || 'Arial'}
            onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
            disabled={layer.locked}
            className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {GOOGLE_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label isPerSize={true} selectedSize={selectedSize}>
            Font Size
          </Label>
          <select
            value={config.fontSize || '14px'}
            onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
            disabled={layer.locked}
            className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ColorInput
        label="Background Color"
        value={layer.styles?.backgroundColor || '#333333'}
        onChange={(color) => onBackgroundColorChange(layer.id, color)}
        disabled={layer.locked}
      />
    </>
  );
};
