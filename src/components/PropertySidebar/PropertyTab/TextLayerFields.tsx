import { type TextLayer, type AdSize } from '../../../data';
import { ColorInput } from '../../ColorInput';
import { Label } from '../../Label';
import {
  FONT_SIZE_OPTIONS,
  MAX_TEXT_CONTENT_LENGTH,
  GOOGLE_FONTS,
  UI_COLORS,
} from '../../../consts';
import TextAlignLeftIcon from '../../../assets/icons/text-align-left.svg?react';
import TextAlignCenterIcon from '../../../assets/icons/text-align-center.svg?react';
import TextAlignRightIcon from '../../../assets/icons/text-align-right.svg?react';

interface TextLayerFieldsProps {
  layer: TextLayer;
  selectedSize: AdSize;
  onContentChange: (layerId: string, content: string) => void;
  onColorChange: (layerId: string, color: string) => void;
  onFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onFontSizeChange: (layerId: string, fontSize: string) => void;
  onTextAlignChange: (layerId: string, textAlign: 'left' | 'center' | 'right') => void;
}

export const TextLayerFields = ({
  layer,
  selectedSize,
  onContentChange,
  onColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onTextAlignChange,
}: TextLayerFieldsProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <Label isGlobal={true}>Content</Label>
        <span
          className={`text-xs ${
            layer.content.length > MAX_TEXT_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {layer.content.length}/{MAX_TEXT_CONTENT_LENGTH}
        </span>
      </div>
      <div>
        <textarea
          value={layer.content}
          onChange={(e) => onContentChange(layer.id, e.target.value)}
          disabled={layer.locked}
          className={`w-full px-2 py-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          rows={4}
        />
      </div>

      {/* Text Color and Text Align side by side */}
      <div className="grid grid-cols-2 gap-2">
        <ColorInput
          label="Text Color"
          value={layer.styles?.color || '#000000'}
          onChange={(color) => onColorChange(layer.id, color)}
          disabled={layer.locked}
          isGlobal={true}
        />

        <div>
          <Label isGlobal={true}>Text Align</Label>
          <div className="inline-flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => onTextAlignChange(layer.id, 'left')}
              disabled={layer.locked}
              className={`px-3 h-8 flex items-center text-sm border-r border-gray-300 last:border-r-0 ${
                (layer.styles?.textAlign || 'left') === 'left'
                  ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Left"
            >
              <TextAlignLeftIcon />
            </button>
            <button
              onClick={() => onTextAlignChange(layer.id, 'center')}
              disabled={layer.locked}
              className={`px-3 h-8 flex items-center text-sm border-r border-gray-300 last:border-r-0 ${
                layer.styles?.textAlign === 'center'
                  ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Center"
            >
              <TextAlignCenterIcon />
            </button>
            <button
              onClick={() => onTextAlignChange(layer.id, 'right')}
              disabled={layer.locked}
              className={`px-3 h-8 flex items-center text-sm ${
                layer.styles?.textAlign === 'right'
                  ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Right"
            >
              <TextAlignRightIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Font Family and Font Size side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label isGlobal={true}>Font Family</Label>
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
          <Label>
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
    </>
  );
};
