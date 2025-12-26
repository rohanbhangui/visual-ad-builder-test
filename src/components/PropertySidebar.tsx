import { useState, useRef, useEffect } from 'react';
import { type LayerContent, type AdSize } from '../data';
import { ColorInput } from './ColorInput';
import { PositionSizeInput } from './PositionSizeInput';
import { UrlInput } from './UrlInput';
import {
  FONT_SIZE_OPTIONS,
  MAX_TEXT_CONTENT_LENGTH,
  MAX_BUTTON_TEXT_LENGTH,
  GOOGLE_FONTS,
} from '../consts';

interface PropertySidebarProps {
  selectedLayerId: string | null;
  layers: LayerContent[];
  selectedSize: AdSize;
  onPropertyChange: (
    layerId: string,
    property: 'positionX' | 'positionY' | 'width' | 'height',
    value: number,
    unit?: 'px' | '%'
  ) => void;
  onDelete: (layerId: string) => void;
  onLabelChange: (layerId: string, newLabel: string) => void;
  onContentChange: (layerId: string, content: string) => void;
  onColorChange: (layerId: string, color: string) => void;
  onFontSizeChange: (layerId: string, fontSize: string) => void;
  onFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onTextChange: (layerId: string, text: string) => void;
  onBackgroundColorChange: (layerId: string, color: string) => void;
  onImageUrlChange: (layerId: string, url: string) => void;
  onObjectFitChange: (layerId: string, objectFit: string) => void;
  onVideoUrlChange: (layerId: string, url: string) => void;
  onAlignLayer: (
    layerId: string,
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => void;
}

export const PropertySidebar = ({
  selectedLayerId,
  layers,
  selectedSize,
  onPropertyChange,
  onDelete,
  onLabelChange,
  onContentChange,
  onColorChange,
  onFontSizeChange,
  onFontFamilyChange,
  onTextChange,
  onBackgroundColorChange,
  onImageUrlChange,
  onObjectFitChange,
  onVideoUrlChange,
  onAlignLayer,
}: PropertySidebarProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Update contentEditable when layer selection changes
  useEffect(() => {
    const el = contentEditableRef.current;
    if (!el || !selectedLayerId) return;

    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer && layer.type === 'richtext') {
      el.innerHTML = layer.content;
    }
  }, [selectedLayerId]);
  if (!selectedLayerId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
          <p className="text-sm text-gray-500">Select a layer to edit its properties</p>
        </div>
      </div>
    );
  }

  const layer = layers.find((l) => l.id === selectedLayerId);
  if (!layer) return null;

  const posX = layer.positionX[selectedSize]!;
  const posY = layer.positionY[selectedSize]!;
  const width = layer.width[selectedSize]!;
  const height = layer.height[selectedSize]!;

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Options</h2>

        {/* Editable Label */}
        <div className="mb-4 group/label">
          {isEditingLabel ? (
            <input
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={() => {
                if (editedLabel.trim()) {
                  onLabelChange(layer.id, editedLabel.trim());
                }
                setIsEditingLabel(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editedLabel.trim()) {
                    onLabelChange(layer.id, editedLabel.trim());
                  }
                  setIsEditingLabel(false);
                } else if (e.key === 'Escape') {
                  setIsEditingLabel(false);
                  setEditedLabel(layer.label);
                }
              }}
              autoFocus
              className="w-full px-2 py-1 text-sm font-medium text-gray-700 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700 flex-1">{layer.label}</h3>
              <button
                onClick={() => {
                  setEditedLabel(layer.label);
                  setIsEditingLabel(true);
                }}
                className="opacity-0 group-hover/label:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Alignment Buttons */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
            <div className="flex gap-1">
              <button
                onClick={() => onAlignLayer(layer.id, 'left')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Align Left"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="3" y1="6" x2="3" y2="18"></line>
                  <rect x="7" y="8" width="10" height="8" rx="1"></rect>
                </svg>
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'center-h')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Center Horizontally"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <rect x="7" y="8" width="10" height="8" rx="1"></rect>
                </svg>
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'right')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Align Right"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="21" y1="6" x2="21" y2="18"></line>
                  <rect x="7" y="8" width="10" height="8" rx="1"></rect>
                </svg>
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'top')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Align Top"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="6" y1="3" x2="18" y2="3"></line>
                  <rect x="8" y="7" width="8" height="10" rx="1"></rect>
                </svg>
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'center-v')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Center Vertically"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <rect x="8" y="7" width="8" height="10" rx="1"></rect>
                </svg>
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'bottom')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Align Bottom"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="6" y1="21" x2="18" y2="21"></line>
                  <rect x="8" y="7" width="8" height="10" rx="1"></rect>
                </svg>
              </button>
            </div>
          </div>

          {/* Position X and Y */}
          <div className="grid grid-cols-2 gap-2">
            <PositionSizeInput
              label="X"
              value={posX.value}
              unit={posX.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'positionX', value, unit)}
            />
            <PositionSizeInput
              label="Y"
              value={posY.value}
              unit={posY.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'positionY', value, unit)}
            />
          </div>

          {/* Width and Height */}
          <div className="grid grid-cols-2 gap-2">
            <PositionSizeInput
              label="Width"
              value={width.value}
              unit={width.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'width', value, unit)}
            />
            <PositionSizeInput
              label="Height"
              value={height.value}
              unit={height.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'height', value, unit)}
            />
          </div>

          {/* Image Controls */}
          {layer.type === 'image' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                {layer.url && (
                  <div className="mb-2">
                    <img
                      src={layer.url}
                      alt="Preview"
                      className="w-[100px] h-[66px] object-cover border border-gray-300 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <UrlInput
                  label=""
                  value={layer.url}
                  onChange={(url) => onImageUrlChange(layer.id, url)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image Fit</label>
                <select
                  value={layer.styles?.objectFit || 'cover'}
                  onChange={(e) => onObjectFitChange(layer.id, e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </div>
            </>
          )}

          {/* Video Controls */}
          {layer.type === 'video' && (
            <UrlInput
              label="Video URL"
              value={layer.url}
              onChange={(url) => onVideoUrlChange(layer.id, url)}
              placeholder="https://example.com/video.mp4"
            />
          )}

          {/* Button Controls */}
          {layer.type === 'button' && (
            <>
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
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <ColorInput
                label="Text Color"
                value={layer.styles?.color || '#ffffff'}
                onChange={(color) => onColorChange(layer.id, color)}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Font Family
                  </label>
                  <select
                    value={layer.styles?.fontFamily || 'Arial'}
                    onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GOOGLE_FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <select
                    value={layer.styles?.fontSize || '14px'}
                    onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              />
            </>
          )}

          {/* Text Content Editor */}
          {(layer.type === 'text' || layer.type === 'richtext') && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">Content</label>
                  {layer.type === 'text' && (
                    <span
                      className={`text-xs ${
                        layer.content.length > MAX_TEXT_CONTENT_LENGTH
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {layer.content.length}/{MAX_TEXT_CONTENT_LENGTH}
                    </span>
                  )}
                </div>
                {layer.type === 'text' ? (
                  <textarea
                    value={layer.content}
                    onChange={(e) => onContentChange(layer.id, e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                ) : (
                  <>
                    {/* Rich Text Formatting Buttons with Font Size and Font Family */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand('bold', false);
                        }}
                        className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-50"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand('italic', false);
                        }}
                        className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-50"
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
                        className="px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-50"
                        title="Underline"
                      >
                        U
                      </button>
                      <select
                        value={layer.styles?.fontFamily || 'Arial'}
                        onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                      <select
                        value={layer.styles?.fontSize || '14px'}
                        onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {FONT_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      ref={contentEditableRef}
                      contentEditable
                      onInput={(e) => onContentChange(layer.id, e.currentTarget.innerHTML)}
                      suppressContentEditableWarning
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded min-h-[80px] max-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
                      style={{
                        color: layer.styles?.color || '#000000',
                        fontSize: layer.styles?.fontSize || '14px',
                        fontFamily: layer.styles?.fontFamily || 'Arial',
                      }}
                    />
                  </>
                )}
              </div>

              {/* Color Picker */}
              <ColorInput
                label="Text Color"
                value={layer.styles?.color || '#000000'}
                onChange={(color) => onColorChange(layer.id, color)}
              />

              {/* Font Size for Text (non-richtext) */}
              {layer.type === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <select
                    value={layer.styles?.fontSize || '14px'}
                    onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Button */}
        <div className="mt-6">
          <button
            onClick={() => onDelete(layer.id)}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
          >
            Delete Layer
          </button>
        </div>
      </div>
    </div>
  );
};
