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
  UI_COLORS,
} from '../consts';
import EditIcon from '../assets/icons/edit.svg?react';
import AlignLeftIcon from '../assets/icons/align-left.svg?react';
import AlignCenterHIcon from '../assets/icons/align-center-h.svg?react';
import AlignRightIcon from '../assets/icons/align-right.svg?react';
import AlignTopIcon from '../assets/icons/align-top.svg?react';
import AlignCenterVIcon from '../assets/icons/align-center-v.svg?react';
import AlignBottomIcon from '../assets/icons/align-bottom.svg?react';
import TextAlignLeftIcon from '../assets/icons/text-align-left.svg?react';
import TextAlignCenterIcon from '../assets/icons/text-align-center.svg?react';
import TextAlignRightIcon from '../assets/icons/text-align-right.svg?react';

interface PropertySidebarProps {
  selectedLayerId: string | null;
  layers: LayerContent[];
  selectedSize: AdSize;
  canvasName?: string;
  canvasBackgroundColor?: string;
  isClippingEnabled?: boolean;
  onClippingEnabledChange?: (enabled: boolean) => void;
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
  onTextAlignChange: (layerId: string, textAlign: 'left' | 'center' | 'right') => void;
  onTextChange: (layerId: string, text: string) => void;
  onBackgroundColorChange: (layerId: string, color: string) => void;
  onImageUrlChange: (layerId: string, url: string) => void;
  onObjectFitChange: (layerId: string, objectFit: string) => void;
  onVideoUrlChange: (layerId: string, url: string) => void;
  onVideoPropertyChange: (
    layerId: string,
    property: 'autoplay' | 'controls',
    value: boolean
  ) => void;
  onAlignLayer: (
    layerId: string,
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onCanvasNameChange: (name: string) => void;
  onCanvasBackgroundColorChange: (color: string) => void;
}

export const PropertySidebar = ({
  selectedLayerId,
  layers,
  selectedSize,
  canvasName,
  canvasBackgroundColor,
  isClippingEnabled = false,
  onClippingEnabledChange,
  onPropertyChange,
  onDelete,
  onLabelChange,
  onContentChange,
  onColorChange,
  onFontSizeChange,
  onFontFamilyChange,
  onTextAlignChange,
  onTextChange,
  onBackgroundColorChange,
  onImageUrlChange,
  onObjectFitChange,
  onVideoUrlChange,
  onVideoPropertyChange,
  onAlignLayer,
  onOpacityChange,
  onCanvasNameChange,
  onCanvasBackgroundColorChange,
}: PropertySidebarProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
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

  // Reset media load errors when layer changes or URL changes
  useEffect(() => {
    setImageLoadError(false);
    setVideoLoadError(false);
  }, [selectedLayerId, layers]);

  if (!selectedLayerId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Options</h2>

          {/* Canvas Settings Label */}
          <div className="mb-4 group/label mt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700 flex-1 mt-0.5">Canvas Settings</h3>
            </div>
          </div>

          <div className="space-y-3">
            {/* Canvas Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Ad Name</label>
              <input
                type="text"
                value={canvasName || ''}
                onChange={(e) => onCanvasNameChange(e.target.value)}
                className="w-full h-8 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ad name"
              />
            </div>

            {/* Canvas Background Color */}
            <div>
              <ColorInput
                label="Background Color"
                value={canvasBackgroundColor || '#ffffff'}
                onChange={onCanvasBackgroundColorChange}
              />
            </div>

            {/* Clip Layers to Canvas Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClippingEnabled}
                  onChange={(e) => onClippingEnabledChange?.(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-gray-700">Clip layers to canvas</span>
              </label>
            </div>
          </div>
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
                className={`text-gray-400 hover:text-gray-600 p-1 transition-colors ${
                  layer.locked ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                <EditIcon />
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
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Align Left"
              >
                <AlignLeftIcon />
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'center-h')}
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Center Horizontally"
              >
                <AlignCenterHIcon />
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'right')}
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Align Right"
              >
                <AlignRightIcon />
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'top')}
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Align Top"
              >
                <AlignTopIcon />
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'center-v')}
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Center Vertically"
              >
                <AlignCenterVIcon />
              </button>
              <button
                onClick={() => onAlignLayer(layer.id, 'bottom')}
                disabled={layer.locked}
                className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Align Bottom"
              >
                <AlignBottomIcon />
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
              disabled={layer.locked}
            />
            <PositionSizeInput
              label="Y"
              value={posY.value}
              unit={posY.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'positionY', value, unit)}
              disabled={layer.locked}
            />
          </div>

          {/* Width and Height */}
          <div className="grid grid-cols-2 gap-2">
            <PositionSizeInput
              label="Width"
              value={width.value}
              unit={width.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'width', value, unit)}
              disabled={layer.locked}
            />
            <PositionSizeInput
              label="Height"
              value={height.value}
              unit={height.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'height', value, unit)}
              disabled={layer.locked}
            />
          </div>

          {/* Image Controls */}
          {layer.type === 'image' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <div className="mb-2">
                  {layer.url && !imageLoadError ? (
                    <img
                      key={layer.url}
                      src={layer.url}
                      alt="Preview"
                      className="w-[100px] h-[56px] object-cover border border-gray-300 rounded"
                      onLoad={() => setImageLoadError(false)}
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="w-[100px] h-[56px] bg-gray-400 border border-gray-300 rounded flex items-center justify-center">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <UrlInput
                  label=""
                  value={layer.url}
                  onChange={(url) => onImageUrlChange(layer.id, url)}
                  placeholder="https://example.com/image.jpg"
                  disabled={layer.locked}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image Fit</label>
                <select
                  value={layer.styles?.objectFit || 'cover'}
                  onChange={(e) => onObjectFitChange(layer.id, e.target.value)}
                  disabled={layer.locked}
                  className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </div>
            </>
          ) : null}

          {/* Video Controls */}
          {layer.type === 'video' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
                <div className="mb-2">
                  {layer.url && !videoLoadError ? (
                    <video
                      key={layer.url}
                      src={layer.url}
                      preload="metadata"
                      className="w-[100px] h-[56px] object-cover border border-gray-300 rounded"
                      onLoadedMetadata={() => setVideoLoadError(false)}
                      onError={() => setVideoLoadError(true)}
                    />
                  ) : (
                    <div className="w-[100px] h-[56px] bg-gray-400 border border-gray-300 rounded flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="white"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" fill="none" />
                        <polygon points="10,8 16,12 10,16" />
                      </svg>
                    </div>
                  )}
                </div>
                <UrlInput
                  label=""
                  value={layer.url}
                  onChange={(url) => onVideoUrlChange(layer.id, url)}
                  placeholder="https://example.com/video.mp4"
                  disabled={layer.locked}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={layer.properties?.autoplay ?? false}
                    onChange={(e) => onVideoPropertyChange(layer.id, 'autoplay', e.target.checked)}
                    disabled={layer.locked}
                    className={`w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'cursor-not-allowed' : ''}`}
                  />
                  <span className="text-gray-700">Autoplay</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={layer.properties?.controls ?? true}
                    onChange={(e) => onVideoPropertyChange(layer.id, 'controls', e.target.checked)}
                    disabled={layer.locked}
                    className={`w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'cursor-not-allowed' : ''}`}
                  />
                  <span className="text-gray-700">Show Controls</span>
                </label>
              </div>
            </>
          ) : null}

          {/* Button Controls */}
          {layer.type === 'button' ? (
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
                  className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Font Family
                  </label>
                  <select
                    value={layer.styles?.fontFamily || 'Arial'}
                    onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
                    disabled={layer.locked}
                    className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                    disabled={layer.locked}
                    className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
          ) : null}

          {/* Text Content Editor */}
          {layer.type === 'text' || layer.type === 'richtext' ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">Content</label>
                  {layer.type === 'text' ? (
                    <span
                      className={`text-xs ${
                        layer.content.length > MAX_TEXT_CONTENT_LENGTH
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {layer.content.length}/{MAX_TEXT_CONTENT_LENGTH}
                    </span>
                  ) : null}
                </div>
                {layer.type === 'text' ? (
                  <textarea
                    value={layer.content}
                    onChange={(e) => onContentChange(layer.id, e.target.value)}
                    disabled={layer.locked}
                    className={`w-full px-2 py-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    rows={4}
                  />
                ) : (
                  <>
                    {/* Font Family and Font Size */}
                    <div className="flex gap-2 mb-1">
                      <select
                        value={layer.styles?.fontFamily || 'Arial'}
                        onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
                        disabled={layer.locked}
                        className={`flex-1 h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                        disabled={layer.locked}
                        className={`h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        {FONT_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rich Text Formatting and Alignment Buttons */}
                    <div className="flex gap-1 mb-1">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand('bold', false);
                        }}
                        disabled={layer.locked}
                        className={`px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            (layer.styles?.textAlign || 'left') === 'left'
                              ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                              : 'hover:bg-gray-50'
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Align Left"
                        >
                          <TextAlignLeftIcon />
                        </button>
                        <button
                          onClick={() => onTextAlignChange(layer.id, 'center')}
                          disabled={layer.locked}
                          className={`px-3 py-1 text-sm border-r border-gray-300 last:border-r-0 ${
                            layer.styles?.textAlign === 'center'
                              ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                              : 'hover:bg-gray-50'
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Align Center"
                        >
                          <TextAlignCenterIcon />
                        </button>
                        <button
                          onClick={() => onTextAlignChange(layer.id, 'right')}
                          disabled={layer.locked}
                          className={`px-3 py-1 text-sm ${
                            layer.styles?.textAlign === 'right'
                              ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                              : 'hover:bg-gray-50'
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      className={`w-full px-2 py-2 text-sm border border-gray-300 rounded min-h-[80px] max-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      style={{
                        color: layer.styles?.color || '#000000',
                        fontSize: layer.styles?.fontSize || '14px',
                        fontFamily: layer.styles?.fontFamily || 'Arial',
                      }}
                    />
                  </>
                )}
              </div>

              {/* Font Family and Font Size for Text (non-richtext) */}
              {layer.type === 'text' ? (
                <>
                  {/* Text Color and Text Align side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <ColorInput
                      label="Text Color"
                      value={layer.styles?.color || '#000000'}
                      onChange={(color) => onColorChange(layer.id, color)}
                      disabled={layer.locked}
                    />

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Text Align
                      </label>
                      <div className="inline-flex border border-gray-300 rounded overflow-hidden">
                        <button
                          onClick={() => onTextAlignChange(layer.id, 'left')}
                          disabled={layer.locked}
                          className={`px-3 h-8 flex items-center text-sm border-r border-gray-300 last:border-r-0 ${
                            (layer.styles?.textAlign || 'left') === 'left'
                              ? `${UI_COLORS.ACTIVE_BUTTON} ${UI_COLORS.ACTIVE_BUTTON_HOVER}`
                              : 'hover:bg-gray-50'
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                          } ${layer.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Font Family
                      </label>
                      <select
                        value={layer.styles?.fontFamily || 'Arial'}
                        onChange={(e) => onFontFamilyChange(layer.id, e.target.value)}
                        disabled={layer.locked}
                        className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Font Size
                      </label>
                      <select
                        value={layer.styles?.fontSize || '14px'}
                        onChange={(e) => onFontSizeChange(layer.id, e.target.value)}
                        disabled={layer.locked}
                        className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              ) : null}
            </>
          ) : null}
        </div>

        {/* Text Color for richtext */}
        {layer.type === 'richtext' ? (
          <div className="mt-4">
            <ColorInput
              label="Text Color"
              value={layer.styles?.color || '#000000'}
              onChange={(color) => onColorChange(layer.id, color)}
              disabled={layer.locked}
            />
          </div>
        ) : null}

        {/* Layer Opacity */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Layer Opacity</label>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 relative h-1 bg-gray-200 rounded-full cursor-pointer"
              onMouseDown={(e) => {
                if (layer.locked) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const updateOpacity = (clientX: number) => {
                  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                  const percentage = (x / rect.width) * 100;
                  onOpacityChange(layer.id, percentage / 100);
                };

                updateOpacity(e.clientX);

                const handleMouseMove = (e: MouseEvent) => {
                  updateOpacity(e.clientX);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${
                  layer.locked ? 'bg-gray-400' : 'bg-blue-500'
                }`}
                style={{ width: `${(layer.styles?.opacity || 1) * 100}%` }}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full shadow-sm ${
                  layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                style={{ left: `calc(${(layer.styles?.opacity || 1) * 100}% - 8px)` }}
              />
            </div>
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round((layer.styles?.opacity || 1) * 100)}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  const clamped = Math.max(0, Math.min(100, value));
                  onOpacityChange(layer.id, clamped / 100);
                }
              }}
              disabled={layer.locked}
              className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Delete Button */}
        <div className="mt-6">
          <button
            onClick={() => onDelete(layer.id)}
            disabled={layer.locked}
            className={`w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors ${
              layer.locked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Delete Layer
          </button>
        </div>
      </div>
    </div>
  );
};
