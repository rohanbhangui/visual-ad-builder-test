import { useState, useRef, useEffect } from 'react';
import { 
  type LayerContent, 
  type AdSize,
  type ImageLayer,
  type VideoLayer,
  type ButtonLayer,
  type TextLayer,
  type RichtextLayer
} from '../../data';
import { ColorInput } from '../ColorInput';
import { PositionSizeInput } from '../PositionSizeInput';
import EditIcon from '../../assets/icons/edit.svg?react';
import LockIcon from '../../assets/icons/lock.svg?react';
import UnlockIcon from '../../assets/icons/unlock.svg?react';
import AlignLeftIcon from '../../assets/icons/align-left.svg?react';
import AlignCenterHIcon from '../../assets/icons/align-center-h.svg?react';
import AlignRightIcon from '../../assets/icons/align-right.svg?react';
import AlignTopIcon from '../../assets/icons/align-top.svg?react';
import AlignCenterVIcon from '../../assets/icons/align-center-v.svg?react';
import AlignBottomIcon from '../../assets/icons/align-bottom.svg?react';
import XIcon from '../../assets/icons/x.svg?react';
import { ImageLayerFields } from './ImageLayerFields';
import { VideoLayerFields } from './VideoLayerFields';
import { ButtonLayerFields } from './ButtonLayerFields';
import { TextLayerFields } from './TextLayerFields';
import { RichtextLayerFields } from './RichtextLayerFields';

const ALIGNMENT_BUTTONS = [
  { alignment: 'left' as const, icon: AlignLeftIcon, title: 'Align Left' },
  { alignment: 'center-h' as const, icon: AlignCenterHIcon, title: 'Center Horizontally' },
  { alignment: 'right' as const, icon: AlignRightIcon, title: 'Align Right' },
  { alignment: 'top' as const, icon: AlignTopIcon, title: 'Align Top' },
  { alignment: 'center-v' as const, icon: AlignCenterVIcon, title: 'Center Vertically' },
  { alignment: 'bottom' as const, icon: AlignBottomIcon, title: 'Align Bottom' },
];

interface PropertySidebarProps {
  selectedLayerIds: string[];
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
  onClearSelection: () => void;
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
  onAspectRatioLockToggle: (layerId: string) => void;
  onCanvasNameChange: (name: string) => void;
  onCanvasBackgroundColorChange: (color: string) => void;
  onHtmlIdChange: (layerId: string, htmlId: string) => void;
}

export const PropertySidebar = ({
  selectedLayerIds,
  layers,
  selectedSize,
  canvasName,
  canvasBackgroundColor,
  isClippingEnabled = false,
  onClippingEnabledChange,
  onPropertyChange,
  onDelete,
  onClearSelection,
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
  onAspectRatioLockToggle,
  onCanvasNameChange,
  onCanvasBackgroundColorChange,
  onHtmlIdChange,
}: PropertySidebarProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Update contentEditable when layer selection changes (not when content changes)
  useEffect(() => {
    const el = contentEditableRef.current;
    if (!el || selectedLayerIds.length !== 1) return;

    const layer = layers.find((l) => l.id === selectedLayerIds[0]);
    if (layer && layer.type === 'richtext') {
      // Only update if the element is not focused (user is not typing)
      if (document.activeElement !== el) {
        el.innerHTML = layer.content;
      }
    }
  }, [selectedLayerIds, layers]);

  // Multi-select mode
  if (selectedLayerIds.length > 1) {
    const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
    
    // Helper to get common value or "-" if values differ
    const getCommonValue = (property: 'positionX' | 'positionY' | 'width' | 'height') => {
      const values = selectedLayers.map(l => l.sizeConfig[selectedSize]?.[property]?.value);
      const allSame = values.every(v => v === values[0]);
      return allSame ? values[0] : undefined;
    };

    const getCommonUnit = (property: 'positionX' | 'positionY' | 'width' | 'height') => {
      const units = selectedLayers.map(l => l.sizeConfig[selectedSize]?.[property]?.unit || 'px');
      const allSame = units.every(u => u === units[0]);
      return allSame ? units[0] : undefined;
    };

    const commonX = getCommonValue('positionX');
    const commonY = getCommonValue('positionY');
    const commonWidth = getCommonValue('width');
    const commonHeight = getCommonValue('height');
    const commonXUnit = getCommonUnit('positionX');
    const commonYUnit = getCommonUnit('positionY');
    const commonWidthUnit = getCommonUnit('width');
    const commonHeightUnit = getCommonUnit('height');

    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          {/* Multi-select header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{selectedLayerIds.length} items selected</h2>
            <button
              onClick={onClearSelection}
              className="text-gray-900 hover:text-gray-700 p-1 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Alignment Buttons */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
              <div className="flex gap-1">
                {ALIGNMENT_BUTTONS.map(({ alignment, icon: Icon, title }) => (
                  <button
                    key={alignment}
                    onClick={() => onAlignLayer(selectedLayerIds[0], alignment)}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                    title={title}
                  >
                    <Icon />
                  </button>
                ))}
              </div>
            </div>

            {/* Position X and Y */}
            <div className="grid grid-cols-2 gap-2">
              <PositionSizeInput
                label="X"
                value={commonX !== undefined ? commonX : 0}
                unit={commonXUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach(id => onPropertyChange(id, 'positionX', value, unit));
                }}
                disabled={false}
                placeholder={commonX === undefined ? '-' : undefined}
              />
              <PositionSizeInput
                label="Y"
                value={commonY !== undefined ? commonY : 0}
                unit={commonYUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach(id => onPropertyChange(id, 'positionY', value, unit));
                }}
                disabled={false}
                placeholder={commonY === undefined ? '-' : undefined}
              />
            </div>

            {/* Width and Height */}
            <div className="grid grid-cols-2 gap-2">
              <PositionSizeInput
                label="Width"
                value={commonWidth !== undefined ? commonWidth : 0}
                unit={commonWidthUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach(id => onPropertyChange(id, 'width', value, unit));
                }}
                disabled={false}
                placeholder={commonWidth === undefined ? '-' : undefined}
              />
              <PositionSizeInput
                label="Height"
                value={commonHeight !== undefined ? commonHeight : 0}
                unit={commonHeightUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach(id => onPropertyChange(id, 'height', value, unit));
                }}
                disabled={false}
                placeholder={commonHeight === undefined ? '-' : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedLayerIds.length === 0) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          {/* Canvas Settings Label */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Canvas Settings</h2>
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
                <span className="text-gray-700">Clip Layers to Canvas</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const layer = layers.find((l) => l.id === selectedLayerIds[0]);
  if (!layer) return null;

  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  const posX = config.positionX;
  const posY = config.positionY;
  const width = config.width;
  const height = config.height;

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Editable Label */}
        <div className="mb-6">
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
              className="w-full px-2 py-1 text-lg font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 relative overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">{layer.label}</h2>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
              <button
                onClick={() => {
                  setEditedLabel(layer.label);
                  setIsEditingLabel(true);
                }}
                className={`text-gray-400 hover:text-gray-600 p-1 transition-colors flex-shrink-0 relative z-10 ${
                  layer.locked ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
                }`}
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* HTML ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Element ID</label>
            <input
              type="text"
              value={layer.attributes.id || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow valid HTML ID characters (no spaces)
                if (!/\s/.test(value)) {
                  onHtmlIdChange(layer.id, value);
                }
              }}
              placeholder="e.g., my-element"
              disabled={layer.locked}
              className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Alignment Buttons */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
            <div className="flex gap-1">
              {ALIGNMENT_BUTTONS.map(({ alignment, icon: Icon, title }) => (
                <button
                  key={alignment}
                  onClick={() => onAlignLayer(layer.id, alignment)}
                  disabled={layer.locked}
                  className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={title}
                >
                  <Icon />
                </button>
              ))}
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
              isPerSize={true}
              selectedSize={selectedSize}
            />
            <PositionSizeInput
              label="Y"
              value={posY.value}
              unit={posY.unit || 'px'}
              onChange={(value, unit) => onPropertyChange(layer.id, 'positionY', value, unit)}
              disabled={layer.locked}
              isPerSize={true}
              selectedSize={selectedSize}
            />
          </div>

          {/* Width and Height */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              <PositionSizeInput
                label="Width"
                value={width.value}
                unit={width.unit || 'px'}
                onChange={(value, unit) => onPropertyChange(layer.id, 'width', value, unit)}
                disabled={layer.locked}
                isPerSize={true}
                selectedSize={selectedSize}
              />
              <PositionSizeInput
                label="Height"
                value={height.value}
                unit={height.unit || 'px'}
                onChange={(value, unit) => onPropertyChange(layer.id, 'height', value, unit)}
                disabled={layer.locked}
                isPerSize={true}
                selectedSize={selectedSize}
              />
            </div>
            <button
              onClick={() => onAspectRatioLockToggle(layer.id)}
              disabled={layer.locked}
              className={`absolute left-[calc(50%-12px)] bottom-[5px] -translate-x-1/2 p-0.5 rounded hover:bg-gray-100 transition-colors bg-white ${
                layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title={layer.aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {layer.aspectRatioLocked ? (
                <LockIcon className="w-3.5 h-3.5 text-gray-600" />
              ) : (
                <UnlockIcon className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Image Controls */}
          {layer.type === 'image' ? (
            <ImageLayerFields
              layer={layer as ImageLayer}
              onImageUrlChange={onImageUrlChange}
              onObjectFitChange={onObjectFitChange}
            />
          ) : null}

          {/* Video Controls */}
          {layer.type === 'video' ? (
            <VideoLayerFields
              layer={layer as VideoLayer}
              onVideoUrlChange={onVideoUrlChange}
              onVideoPropertyChange={onVideoPropertyChange}
            />
          ) : null}

          {/* Button Controls */}
          {layer.type === 'button' ? (
            <ButtonLayerFields
              layer={layer as ButtonLayer}
              selectedSize={selectedSize}
              onImageUrlChange={onImageUrlChange}
              onTextChange={onTextChange}
              onColorChange={onColorChange}
              onFontFamilyChange={onFontFamilyChange}
              onFontSizeChange={onFontSizeChange}
              onBackgroundColorChange={onBackgroundColorChange}
            />
          ) : null}

          {/* Text Content Editor */}
          {layer.type === 'text' ? (
            <TextLayerFields
              layer={layer as TextLayer}
              selectedSize={selectedSize}
              onContentChange={onContentChange}
              onColorChange={onColorChange}
              onFontFamilyChange={onFontFamilyChange}
              onFontSizeChange={onFontSizeChange}
              onTextAlignChange={onTextAlignChange}
            />
          ) : null}

          {layer.type === 'richtext' ? (
            <RichtextLayerFields
              layer={layer as RichtextLayer}
              selectedSize={selectedSize}
              onContentChange={onContentChange}
              onColorChange={onColorChange}
              onFontFamilyChange={onFontFamilyChange}
              onFontSizeChange={onFontSizeChange}
              onTextAlignChange={onTextAlignChange}
              contentEditableRef={contentEditableRef}
            />
          ) : null}
        </div>

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
              layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            Delete Layer
          </button>
        </div>
      </div>
    </div>
  );
};
