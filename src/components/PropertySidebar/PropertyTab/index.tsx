import { type RefObject } from 'react';
import {
  type LayerContent,
  type AdSize,
  type ImageLayer,
  type VideoLayer,
  type ButtonLayer,
  type TextLayer,
  type RichtextLayer,
} from '../../../data';
import { PositionSizeInput } from '../../PositionSizeInput';
import { Label } from '../../Label';
import LockIcon from '../../../assets/icons/lock.svg?react';
import UnlockIcon from '../../../assets/icons/unlock.svg?react';
import AlignLeftIcon from '../../../assets/icons/align-left.svg?react';
import AlignCenterHIcon from '../../../assets/icons/align-center-h.svg?react';
import AlignRightIcon from '../../../assets/icons/align-right.svg?react';
import AlignTopIcon from '../../../assets/icons/align-top.svg?react';
import AlignCenterVIcon from '../../../assets/icons/align-center-v.svg?react';
import AlignBottomIcon from '../../../assets/icons/align-bottom.svg?react';
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

interface PropertyTabProps {
  layer: LayerContent;
  selectedSize: AdSize;
  contentEditableRef?: RefObject<HTMLDivElement | null>;
  onPropertyChange: (
    layerId: string,
    property: 'positionX' | 'positionY' | 'width' | 'height',
    value: number,
    unit?: 'px' | '%'
  ) => void;
  onHtmlIdChange: (layerId: string, htmlId: string) => void;
  onAlignLayer: (
    layerId: string,
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => void;
  onAspectRatioLockToggle: (layerId: string) => void;
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
  onOpacityChange: (layerId: string, opacity: number) => void;
}

export const PropertyTab = ({
  layer,
  selectedSize,
  contentEditableRef,
  onPropertyChange,
  onHtmlIdChange,
  onAlignLayer,
  onAspectRatioLockToggle,
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
  onOpacityChange,
}: PropertyTabProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  const posX = config.positionX;
  const posY = config.positionY;
  const width = config.width;
  const height = config.height;

  return (
    <div className="space-y-3">
      {/* HTML ID */}
      <div>
        <Label isGlobal={true} htmlFor="element-id">
          Element ID
        </Label>
        <input
          id="element-id"
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
        <Label>Alignment</Label>
        <div className="flex gap-1">
          {ALIGNMENT_BUTTONS.map(({ alignment, icon: Icon, title }) => (
            <button
              key={alignment}
              onClick={() => onAlignLayer(layer.id, alignment)}
              disabled={layer.locked}
              className={`p-2 border border-gray-300 rounded hover:bg-gray-50 ${
                layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
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
      <div className="relative">
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
          layer={layer satisfies ImageLayer}
          onImageUrlChange={onImageUrlChange}
          onObjectFitChange={onObjectFitChange}
        />
      ) : null}

      {/* Video Controls */}
      {layer.type === 'video' ? (
        <VideoLayerFields
          layer={layer satisfies VideoLayer}
          onVideoUrlChange={onVideoUrlChange}
          onVideoPropertyChange={onVideoPropertyChange}
        />
      ) : null}

      {/* Button Controls */}
      {layer.type === 'button' ? (
        <ButtonLayerFields
          layer={layer satisfies ButtonLayer}
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
          layer={layer satisfies TextLayer}
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
          layer={layer satisfies RichtextLayer}
          selectedSize={selectedSize}
          onContentChange={onContentChange}
          onColorChange={onColorChange}
          onFontFamilyChange={onFontFamilyChange}
          onFontSizeChange={onFontSizeChange}
          onTextAlignChange={onTextAlignChange}
          contentEditableRef={contentEditableRef}
        />
      ) : null}

      {/* Layer Opacity */}
      <div className="mt-4">
        <Label isGlobal={true}>Layer Opacity</Label>
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
    </div>
  );
};
