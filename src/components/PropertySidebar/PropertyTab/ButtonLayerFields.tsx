import { type ButtonLayer, type AdSize, type LayerContent } from '../../../data';
import { ColorInput } from '../../ColorInput';
import { UrlInput } from '../../UrlInput';
import { Label } from '../../Label';
import { FONT_SIZE_OPTIONS, MAX_BUTTON_TEXT_LENGTH, GOOGLE_FONTS } from '../../../consts';

interface ButtonLayerFieldsProps {
  layer: ButtonLayer;
  selectedSize: AdSize;
  layers: LayerContent[]; // All layers to build dropdown
  onImageUrlChange: (layerId: string, url: string) => void;
  onTextChange: (layerId: string, text: string) => void;
  onColorChange: (layerId: string, color: string) => void;
  onFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onFontSizeChange: (layerId: string, fontSize: string) => void;
  onBackgroundColorChange: (layerId: string, color: string) => void;
  onButtonActionTypeChange: (layerId: string, actionType: 'link' | 'videoControl') => void;
  onButtonIconChange: (layerId: string, icon: { type: 'none' | 'play' | 'pause' | 'replay' | 'play-fill' | 'pause-fill' | 'custom' | 'toggle-filled' | 'toggle-outline' | 'toggle-custom'; customImage?: string; customPlayImage?: string; customPauseImage?: string; color?: string; size?: number; position?: 'before' | 'after' }) => void;
  onVideoControlChange: (layerId: string, videoControl: { targetElementId: string; action: 'play' | 'pause' | 'restart' | 'togglePlayPause' }) => void;
}

export const ButtonLayerFields = ({
  layer,
  selectedSize,
  layers,
  onImageUrlChange,
  onTextChange,
  onColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onBackgroundColorChange,
  onButtonActionTypeChange,
  onButtonIconChange,
  onVideoControlChange,
}: ButtonLayerFieldsProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  const icon = layer.icon || { type: 'none', size: 24, position: 'before' };

  // Get video layers with IDs for video control dropdown
  const videoLayers = layers.filter(l => l.type === 'video');
  const videoLayersWithIds = videoLayers.filter(l => l.attributes?.id && l.attributes.id.trim() !== '');
  const videoLayersWithoutIds = videoLayers.filter(l => !l.attributes?.id || l.attributes.id.trim() === '');

  return (
    <>
      {/* Action Type Selector */}
      <div>
        <Label isGlobal={true}>Button Action</Label>
        <select
          value={layer.actionType || 'link'}
          onChange={(e) => onButtonActionTypeChange(layer.id, e.target.value as 'link' | 'videoControl')}
          disabled={layer.locked}
          className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <option value="link">Link (URL)</option>
          <option value="videoControl">Video Control</option>
        </select>
      </div>

      {/* Link URL (shown when actionType is 'link') */}
      {layer.actionType === 'link' && (
        <UrlInput
          label="URL"
          value={layer.url}
          onChange={(url) => onImageUrlChange(layer.id, url)}
          placeholder="e.g. example.com"
          disabled={layer.locked}
          isGlobal={true}
        />
      )}

      {/* Video Control Settings (shown when actionType is 'videoControl') */}
      {layer.actionType === 'videoControl' && (
        <>
          <div>
            <Label isGlobal={true}>Target Video Element</Label>
            <select
              value={layer.videoControl?.targetElementId || ''}
              onChange={(e) => onVideoControlChange(layer.id, {
                ...layer.videoControl,
                targetElementId: e.target.value,
                action: layer.videoControl?.action || 'play'
              } as any)}
              disabled={layer.locked}
              className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value=""></option>
              {videoLayersWithIds.map(l => (
                <option key={l.id} value={l.attributes?.id}>
                  {l.label} (#{l.attributes?.id})
                </option>
              ))}
              {videoLayersWithoutIds.length > 0 && (
                <option disabled className="text-gray-400">
                  ⚠️ {videoLayersWithoutIds.length} video layer(s) without IDs
                </option>
              )}
            </select>
          </div>

          <div>
            <Label isGlobal={true}>Video Action</Label>
            <select
              value={layer.videoControl?.action || 'play'}
              onChange={(e) => onVideoControlChange(layer.id, {
                ...layer.videoControl,
                targetElementId: layer.videoControl?.targetElementId || '',
                action: e.target.value as 'play' | 'pause' | 'restart' | 'togglePlayPause'
              } as any)}
              disabled={layer.locked}
              className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value="play">Play</option>
              <option value="pause">Pause</option>
              <option value="restart">Restart</option>
              <option value="togglePlayPause">Toggle Play/Pause</option>
            </select>
          </div>
        </>
      )}

      {/* Icon Configuration */}
      <div>
        <Label isGlobal={true}>Icon</Label>
        <select
          value={icon.type}
          onChange={(e) => onButtonIconChange(layer.id, { ...icon, type: e.target.value as any })}
          disabled={layer.locked}
          className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {layer.actionType === 'videoControl' && layer.videoControl?.action === 'togglePlayPause' ? (
            <>
              <option value="none">No Icon</option>
              <option value="toggle-filled">Filled</option>
              <option value="toggle-outline">Not Filled</option>
              <option value="toggle-custom">Custom</option>
            </>
          ) : (
            <>
              <option value="none">No Icon</option>
              <option value="play">Play</option>
              <option value="pause">Pause</option>
              <option value="play-fill">Play (Filled)</option>
              <option value="pause-fill">Pause (Filled)</option>
              <option value="replay">Replay</option>
              <option value="custom">Custom Image</option>
            </>
          )}
        </select>
      </div>

      {/* Icon-specific settings */}
      {icon.type !== 'none' && (
        <>
          {/* Icon Size, Position & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label isGlobal={true}>Size</Label>
              <select
                value={icon.size || 24}
                onChange={(e) => onButtonIconChange(layer.id, { ...icon, size: parseInt(e.target.value) })}
                disabled={layer.locked}
                className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="16">16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
                <option value="40">40px</option>
                <option value="48">48px</option>
              </select>
            </div>
            <div>
              <Label isGlobal={true}>Position</Label>
              <select
                value={icon.position || 'before'}
                onChange={(e) => onButtonIconChange(layer.id, { ...icon, position: e.target.value as 'before' | 'after' })}
                disabled={layer.locked}
                className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
            </div>
          </div>

          {/* Icon Color (for SVG icons only) */}
          {icon.type !== 'none' && icon.type !== 'custom' && icon.type !== 'toggle-custom' && (
            <ColorInput
              label="Color"
              value={icon.color || layer.styles?.color || '#ffffff'}
              onChange={(color) => onButtonIconChange(layer.id, { ...icon, color })}
              disabled={layer.locked}
              isGlobal={true}
            />
          )}

          {/* Custom Image URL (single icon) */}
          {icon.type === 'custom' && (
            <UrlInput
              label="Icon Image URL"
              value={icon.customImage || ''}
              onChange={(url) => onButtonIconChange(layer.id, { ...icon, customImage: url })}
              placeholder="https://example.com/icon.png"
              disabled={layer.locked}
              isGlobal={true}
            />
          )}

          {/* Custom Toggle Icons (two URLs) */}
          {icon.type === 'toggle-custom' && (
            <>
              <UrlInput
                label="Play Icon URL"
                value={icon.customPlayImage || ''}
                onChange={(url) => onButtonIconChange(layer.id, { ...icon, customPlayImage: url })}
                placeholder="https://example.com/play.png"
                disabled={layer.locked}
                isGlobal={true}
              />
              <UrlInput
                label="Pause Icon URL"
                value={icon.customPauseImage || ''}
                onChange={(url) => onButtonIconChange(layer.id, { ...icon, customPauseImage: url })}
                placeholder="https://example.com/pause.png"
                disabled={layer.locked}
                isGlobal={true}
              />
            </>
          )}
        </>
      )}

      {/* Button Text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label isGlobal={true}>Text</Label>
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

      {/* Text Styling (always show if text exists) */}
      {layer.text && (
        <>
          <ColorInput
            label="Text Color"
            value={layer.styles?.color || '#ffffff'}
            onChange={(color) => onColorChange(layer.id, color)}
            disabled={layer.locked}
            isGlobal={true}
          />

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
              <Label>Font Size</Label>
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
      )}
    </>
  );
};
