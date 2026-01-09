import { type RichtextLayer, type AdSize } from '../../../data';
import { ColorInput } from '../../ColorInput';
import { Label } from '../../Label/Label';
import { FONT_SIZE_OPTIONS, GOOGLE_FONTS, UI_COLORS } from '../../../consts';
import TextAlignLeftIcon from '../../../assets/icons/text-align-left.svg?react';
import TextAlignCenterIcon from '../../../assets/icons/text-align-center.svg?react';
import TextAlignRightIcon from '../../../assets/icons/text-align-right.svg?react';

interface RichtextLayerFieldsProps {
  layer: RichtextLayer;
  selectedSize: AdSize;
  onContentChange: (layerId: string, content: string) => void;
  onColorChange: (layerId: string, color: string) => void;
  onFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onFontSizeChange: (layerId: string, fontSize: string) => void;
  onTextAlignChange: (layerId: string, textAlign: 'left' | 'center' | 'right') => void;
  contentEditableRef?: React.RefObject<HTMLDivElement | null>;
  onCopyFontSize?: (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => void;
  allowedSizes?: AdSize[];
}

export const RichtextLayerFields = ({
  layer,
  selectedSize,
  onContentChange,
  onColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onTextAlignChange,
  contentEditableRef,
  onCopyFontSize,
  allowedSizes,
}: RichtextLayerFieldsProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  return (
    <>
      <div>
        {/* Font Family and Font Size */}
        <div className="flex gap-1 mb-2">
          <div>
            <Label>Font Family</Label>
            <select
              value={layer.styles?.fontFamily || 'Arial'}
              onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
              disabled={layer.locked}
              className={`h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <Label
              isSizeSpecific={true}
              selectedSize={selectedSize}
              onCopyToSize={
                onCopyFontSize && config.fontSize
                  ? (targetSizes) => onCopyFontSize(layer.id, selectedSize, targetSizes)
                  : undefined
              }
              allowedSizes={allowedSizes}
              currentSize={selectedSize}
            >
              Font Size
            </Label>
            <select
              value={config.fontSize || '14px'}
              onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
              disabled={layer.locked}
              className={`h-8 w-20 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

        {/* Rich Text Formatting and Alignment Buttons */}
        <div className="flex gap-1 mb-1">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand('bold', false);
            }}
            disabled={layer.locked}
            className={`px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-50 ${
              layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand('italic', false);
            }}
            disabled={layer.locked}
            className={`px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-50 ${
              layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Italic"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            I
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand('underline', false);
            }}
            disabled={layer.locked}
            className={`px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-50 ${
              layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Underline"
          >
            U
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <div className="inline-flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => onTextAlignChange(layer.id, 'left')}
              disabled={layer.locked}
              className={`px-3 py-1 text-sm border-r border-gray-300 last:border-r-0 ${
                (config.textAlign || 'left') === 'left'
                  ? `${UI_COLORS.SIZE_SPECIFIC_ACTIVE} ${UI_COLORS.SIZE_SPECIFIC_ACTIVE_HOVER} ${UI_COLORS.SIZE_SPECIFIC_TEXT}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Left"
            >
              <TextAlignLeftIcon />
            </button>
            <button
              onClick={() => onTextAlignChange(layer.id, 'center')}
              disabled={layer.locked}
              className={`px-3 py-1 text-sm border-r border-gray-300 last:border-r-0 ${
                config.textAlign === 'center'
                  ? `${UI_COLORS.SIZE_SPECIFIC_ACTIVE} ${UI_COLORS.SIZE_SPECIFIC_ACTIVE_HOVER} ${UI_COLORS.SIZE_SPECIFIC_TEXT}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Center"
            >
              <TextAlignCenterIcon />
            </button>
            <button
              onClick={() => onTextAlignChange(layer.id, 'right')}
              disabled={layer.locked}
              className={`px-3 py-1 text-sm ${
                config.textAlign === 'right'
                  ? `${UI_COLORS.SIZE_SPECIFIC_ACTIVE} ${UI_COLORS.SIZE_SPECIFIC_ACTIVE_HOVER} ${UI_COLORS.SIZE_SPECIFIC_TEXT}`
                  : 'hover:bg-gray-50'
              } ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Align Right"
            >
              <TextAlignRightIcon />
            </button>
          </div>
        </div>
        <div
          ref={contentEditableRef}
          contentEditable={!layer.locked}
          onInput={(e) => onContentChange(layer.id, e.currentTarget.innerHTML)}
          suppressContentEditableWarning
          className={`w-full px-2 py-2 text-sm border border-gray-300 rounded min-h-[80px] max-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          style={{
            color: layer.styles?.color || '#000000',
            fontSize: config.fontSize || '14px',
            fontFamily: layer.styles?.fontFamily || 'Arial',
          }}
        />
      </div>

      <ColorInput
        label="Text Color"
        value={layer.styles?.color || '#000000'}
        onChange={(color) => onColorChange(layer.id, color)}
        disabled={layer.locked}
      />
    </>
  );
};
