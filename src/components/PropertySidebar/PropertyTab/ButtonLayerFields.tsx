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
  onIconSizeChange: (layerId: string, iconSize: number) => void;
  onButtonActionTypeChange: (layerId: string, actionType: 'link' | 'videoControl') => void;
  onButtonIconChange: (
    layerId: string,
    icon: {
      type:
        | 'none'
        | 'play'
        | 'pause'
        | 'replay'
        | 'play-fill'
        | 'pause-fill'
        | 'custom'
        | 'toggle-filled'
        | 'toggle-outline'
        | 'toggle-custom';
      customImage?: string;
      customPlayImage?: string;
      customPauseImage?: string;
      color?: string;
      position?: 'before' | 'after';
    }
  ) => void;
  onVideoControlChange: (
    layerId: string,
    videoControl: {
      targetElementId: string;
      action: 'play' | 'pause' | 'restart' | 'togglePlayPause';
    }
  ) => void;
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
  onIconSizeChange,
  onButtonActionTypeChange,
  onButtonIconChange,
  onVideoControlChange,
}: ButtonLayerFieldsProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  const icon = layer.icon || { type: 'none', position: 'before' };
  const iconSize = config.iconSize || 24;

  // Get video layers with IDs for video control dropdown
  const videoLayers = layers.filter((l) => l.type === 'video');
  const videoLayersWithIds = videoLayers.filter(
    (l) => l.attributes?.id && l.attributes.id.trim() !== ''
  );
  const videoLayersWithoutIds = videoLayers.filter(
    (l) => !l.attributes?.id || l.attributes.id.trim() === ''
  );

  return (
    <>
      {/* Action Type Selector */}
      <div>
        <Label>Button Action</Label>
        <select
          value={layer.actionType || 'link'}
          onChange={(e) =>
            onButtonActionTypeChange(layer.id, e.target.value as 'link' | 'videoControl')
          }
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
      {layer.actionType === 'link' ? (
        <UrlInput
          label="URL"
          value={layer.url}
          onChange={(url) => onImageUrlChange(layer.id, url)}
          placeholder="e.g. example.com"
          disabled={layer.locked}
        />
      ) : null}

      {/* Video Control Settings (shown when actionType is 'videoControl') */}
      {layer.actionType === 'videoControl' ? (
        <>
          <div>
            <Label>Target Video Element</Label>
            <select
              value={layer.videoControl?.targetElementId || ''}
              onChange={(e) =>
                onVideoControlChange(layer.id, {
                  ...layer.videoControl,
                  targetElementId: e.target.value,
                  action: layer.videoControl?.action || 'play',
                } as any)
              }
              disabled={layer.locked}
              className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value=""></option>
              {videoLayersWithIds.map((l) => (
                <option key={l.id} value={l.attributes?.id}>
                  {l.label} (#{l.attributes?.id})
                </option>
              ))}
              {videoLayersWithoutIds.length > 0 ? (
                <option disabled className="text-gray-400">
                  ⚠️ {videoLayersWithoutIds.length} video layer(s) without IDs
                </option>
              ) : null}
            </select>
          </div>

          <div>
            <Label>Action</Label>
            <select
              value={layer.videoControl?.action || 'play'}
              onChange={(e) =>
                onVideoControlChange(layer.id, {
                  ...layer.videoControl,
                  targetElementId: layer.videoControl?.targetElementId || '',
                  action: e.target.value as 'play' | 'pause' | 'restart' | 'togglePlayPause',
                } as any)
              }
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
      ) : null}

      {/* Button Text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Text</Label>
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

      {/* Color (for both text and icon) */}
      <ColorInput
        label="Color"
        value={layer.styles?.color || '#ffffff'}
        onChange={(color) => onColorChange(layer.id, color)}
        disabled={layer.locked}
      />

      {/* Icon Configuration */}
      <div>
        <Label>Icon</Label>
        <select
          value={icon.type}
          onChange={(e) => onButtonIconChange(layer.id, { ...icon, type: e.target.value as any })}
          disabled={layer.locked}
          className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {layer.actionType === 'videoControl' &&
          layer.videoControl?.action === 'togglePlayPause' ? (
            <>
              <option value="toggle-filled">Filled</option>
              <option value="toggle-outline">Not Filled</option>
              <option value="toggle-custom">Custom</option>
            </>
          ) : layer.actionType === 'videoControl' && layer.videoControl?.action === 'play' ? (
            <>
              <option value="none">No Icon</option>
              <option value="play">Play</option>
              <option value="play-fill">Play (Filled)</option>
              <option value="custom">Custom Image</option>
            </>
          ) : layer.actionType === 'videoControl' && layer.videoControl?.action === 'pause' ? (
            <>
              <option value="none">No Icon</option>
              <option value="pause">Pause</option>
              <option value="pause-fill">Pause (Filled)</option>
              <option value="custom">Custom Image</option>
            </>
          ) : layer.actionType === 'videoControl' && layer.videoControl?.action === 'restart' ? (
            <>
              <option value="none">No Icon</option>
              <option value="replay">Replay</option>
              <option value="custom">Custom Image</option>
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
      {icon.type !== 'none' ? (
        <>
          {/* Icon Size, Position & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label isSizeSpecific={true} selectedSize={selectedSize}>
                Size
              </Label>
              <select
                value={iconSize}
                onChange={(e) => onIconSizeChange(layer.id, parseInt(e.target.value))}
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
              <Label>Position</Label>
              <select
                value={icon.position || 'before'}
                onChange={(e) =>
                  onButtonIconChange(layer.id, {
                    ...icon,
                    position: e.target.value as 'before' | 'after',
                  })
                }
                disabled={layer.locked}
                className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="before">Before Text</option>
                <option value="after">After Text</option>
              </select>
            </div>
          </div>

          {/* Custom Image URL (single icon) */}
          {icon.type === 'custom' ? (
            <UrlInput
              label="Icon Image URL"
              value={icon.customImage || ''}
              onChange={(url) => onButtonIconChange(layer.id, { ...icon, customImage: url })}
              placeholder="https://example.com/icon.png"
              disabled={layer.locked}
            />
          ) : null}

          {/* Custom Toggle Icons (two URLs) */}
          {icon.type === 'toggle-custom' ? (
            <>
              <UrlInput
                label="Play Icon URL"
                value={icon.customPlayImage || ''}
                onChange={(url) => onButtonIconChange(layer.id, { ...icon, customPlayImage: url })}
                placeholder="https://example.com/play.png"
                disabled={layer.locked}
              />
              <UrlInput
                label="Pause Icon URL"
                value={icon.customPauseImage || ''}
                onChange={(url) => onButtonIconChange(layer.id, { ...icon, customPauseImage: url })}
                placeholder="https://example.com/pause.png"
                disabled={layer.locked}
              />
            </>
          ) : null}
        </>
      ) : null}

      {/* Text Styling (always show if text exists) */}
      {layer.text ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Font Family</Label>
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
              <Label isSizeSpecific={true} selectedSize={selectedSize}>
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
      ) : null}
    </>
  );
};
