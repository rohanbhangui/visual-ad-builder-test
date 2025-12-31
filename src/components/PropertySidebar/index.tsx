import { useState, useRef, useEffect } from 'react';
import { type LayerContent, type AdSize, type Animation } from '../../data';
import { ColorInput } from '../ColorInput';
import { PositionSizeInput } from '../PositionSizeInput';
import { Label } from '../Label';
import EditIcon from '../../assets/icons/edit.svg?react';
import XIcon from '../../assets/icons/x.svg?react';
import AlignLeftIcon from '../../assets/icons/align-left.svg?react';
import AlignCenterHIcon from '../../assets/icons/align-center-h.svg?react';
import AlignRightIcon from '../../assets/icons/align-right.svg?react';
import AlignTopIcon from '../../assets/icons/align-top.svg?react';
import AlignCenterVIcon from '../../assets/icons/align-center-v.svg?react';
import AlignBottomIcon from '../../assets/icons/align-bottom.svg?react';
import { PropertyTab } from './PropertyTab/PropertyTab';
import { AnimationTab } from './AnimationTab/AnimationTab';

const ALIGNMENT_BUTTONS = [
  { alignment: 'left' as const, icon: AlignLeftIcon, title: 'Align Left' },
  { alignment: 'center-h' as const, icon: AlignCenterHIcon, title: 'Center Horizontally' },
  { alignment: 'right' as const, icon: AlignRightIcon, title: 'Align Right' },
  { alignment: 'top' as const, icon: AlignTopIcon, title: 'Align Top' },
  { alignment: 'center-v' as const, icon: AlignCenterVIcon, title: 'Center Vertically' },
  { alignment: 'bottom' as const, icon: AlignBottomIcon, title: 'Align Bottom' },
];

type TabType = 'properties' | 'animations';

interface PropertySidebarProps {
  selectedLayerIds: string[];
  layers: LayerContent[];
  selectedSize: AdSize;
  canvasName?: string;
  canvasBackgroundColor?: string;
  animationLoop?: number;
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
  onIconSizeChange: (layerId: string, iconSize: number) => void;
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
  onAnimationLoopChange?: (loop: number) => void;
  onAnimationLoopDelayChange?: (
    layerId: string,
    size: AdSize,
    delay: { value: number; unit: 'ms' | 's' }
  ) => void;
  onAnimationResetDurationChange?: (
    layerId: string,
    size: AdSize,
    duration: { value: number; unit: 'ms' | 's' }
  ) => void;
  onHtmlIdChange: (layerId: string, htmlId: string) => void;
  onAnimationChange: (layerId: string, size: AdSize, animations: Animation[]) => void;
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

export const PropertySidebar = ({
  selectedLayerIds,
  layers,
  selectedSize,
  canvasName,
  canvasBackgroundColor,
  animationLoop = 0,
  isClippingEnabled = false,
  onClippingEnabledChange,
  onPropertyChange,
  onDelete,
  onClearSelection,
  onLabelChange,
  onContentChange,
  onColorChange,
  onFontSizeChange,
  onIconSizeChange,
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
  onAnimationLoopChange,
  onAnimationLoopDelayChange,
  onAnimationResetDurationChange,
  onHtmlIdChange,
  onAnimationChange,
  onButtonActionTypeChange,
  onButtonIconChange,
  onVideoControlChange,
}: PropertySidebarProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [loopDelayInputValue, setLoopDelayInputValue] = useState('');
  const [resetDurationInputValue, setResetDurationInputValue] = useState('');
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Get the first selected layer
  const selectedLayer =
    selectedLayerIds.length === 1 ? layers.find((l) => l.id === selectedLayerIds[0]) : null;

  // Get animation loop delay and reset duration from the selected size config
  const animationLoopDelay = selectedLayer?.sizeConfig[selectedSize]?.animationLoopDelay || {
    value: 5,
    unit: 's' as const,
  };
  const animationResetDuration = selectedLayer?.sizeConfig[selectedSize]
    ?.animationResetDuration || { value: 1, unit: 's' as const };

  // Update local input values when layer or size changes
  useEffect(() => {
    setLoopDelayInputValue(animationLoopDelay.value.toString());
    setResetDurationInputValue(animationResetDuration.value.toString());
  }, [selectedLayer?.id, selectedSize, animationLoopDelay.value, animationResetDuration.value]);

  // Calculate minimum loop duration based on animations for the selected size across all layers
  const calculateMinLoopDuration = (): number => {
    let maxEndTimeMs = 0;

    layers.forEach((layer) => {
      const config = layer.sizeConfig[selectedSize];
      if (config?.animations) {
        config.animations.forEach((anim) => {
          const durationMs =
            anim.duration.unit === 's' ? anim.duration.value * 1000 : anim.duration.value;
          const delayMs = anim.delay.unit === 's' ? anim.delay.value * 1000 : anim.delay.value;
          const endTime = durationMs + delayMs;
          maxEndTimeMs = Math.max(maxEndTimeMs, endTime);
        });
      }
    });

    // Convert to same unit as animationLoopDelay
    return animationLoopDelay.unit === 's' ? maxEndTimeMs / 1000 : maxEndTimeMs;
  };

  const minLoopDuration = calculateMinLoopDuration();

  // Check if current input value is below minimum (validate the input value being typed)
  const currentLoopDelayValue = parseFloat(loopDelayInputValue);
  const isLoopDurationTooShort =
    !isNaN(currentLoopDelayValue) && currentLoopDelayValue < minLoopDuration;

  // Handlers to update animation loop timing for the selected layer's size config
  const handleAnimationLoopDelayChange = (delay: { value: number; unit: 'ms' | 's' }) => {
    if (!selectedLayer) return;
    onAnimationLoopDelayChange?.(selectedLayer.id, selectedSize, delay);
  };

  const handleAnimationResetDurationChange = (duration: { value: number; unit: 'ms' | 's' }) => {
    if (!selectedLayer) return;
    onAnimationResetDurationChange?.(selectedLayer.id, selectedSize, duration);
  };

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
    const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));

    // Helper to get common value or "-" if values differ
    const getCommonValue = (property: 'positionX' | 'positionY' | 'width' | 'height') => {
      const values = selectedLayers.map((l) => l.sizeConfig[selectedSize]?.[property]?.value);
      const allSame = values.every((v) => v === values[0]);
      return allSame ? values[0] : undefined;
    };

    const getCommonUnit = (property: 'positionX' | 'positionY' | 'width' | 'height') => {
      const units = selectedLayers.map((l) => l.sizeConfig[selectedSize]?.[property]?.unit || 'px');
      const allSame = units.every((u) => u === units[0]);
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
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedLayerIds.length} items selected
            </h2>
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
                  selectedLayerIds.forEach((id) => onPropertyChange(id, 'positionX', value, unit));
                }}
                disabled={false}
                placeholder={commonX === undefined ? '-' : undefined}
              />
              <PositionSizeInput
                label="Y"
                value={commonY !== undefined ? commonY : 0}
                unit={commonYUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach((id) => onPropertyChange(id, 'positionY', value, unit));
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
                  selectedLayerIds.forEach((id) => onPropertyChange(id, 'width', value, unit));
                }}
                disabled={false}
                placeholder={commonWidth === undefined ? '-' : undefined}
              />
              <PositionSizeInput
                label="Height"
                value={commonHeight !== undefined ? commonHeight : 0}
                unit={commonHeightUnit}
                onChange={(value, unit) => {
                  selectedLayerIds.forEach((id) => onPropertyChange(id, 'height', value, unit));
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
                showNoneOption={true}
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

            {/* Animation Loop Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Loop Count</label>
                <select
                  value={animationLoop}
                  onChange={(e) => onAnimationLoopChange?.(parseInt(e.target.value))}
                  className="w-full h-8 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="0">No Loop</option>
                  <option value="2">2 times</option>
                  <option value="3">3 times</option>
                  <option value="5">5 times</option>
                  <option value="10">10 times</option>
                  <option value="-1">Infinite</option>
                </select>
              </div>

              <div>
                <Label isSizeSpecific={true} selectedSize={selectedSize}>
                  Loop Duration
                </Label>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={loopDelayInputValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLoopDelayInputValue(val);
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) {
                          handleAnimationLoopDelayChange({ ...animationLoopDelay, value: numVal });
                        } else if (val === '') {
                          handleAnimationLoopDelayChange({ ...animationLoopDelay, value: 0 });
                        }
                      }}
                      placeholder="0"
                      className={`w-16 h-8 px-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        isLoopDurationTooShort ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <select
                      value={animationLoopDelay.unit}
                      onChange={(e) =>
                        handleAnimationLoopDelayChange({
                          ...animationLoopDelay,
                          unit: e.target.value as 'ms' | 's',
                        })
                      }
                      className="w-14 h-8 px-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ms">ms</option>
                      <option value="s">s</option>
                    </select>
                  </div>
                  {minLoopDuration > 0 && (
                    <span
                      className={`text-xs ${isLoopDurationTooShort ? 'text-red-600' : 'text-gray-500'}`}
                    >
                      Min: {minLoopDuration.toFixed(2)} {animationLoopDelay.unit}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label isSizeSpecific={true} selectedSize={selectedSize}>
                  Reset Duration
                </Label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={resetDurationInputValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResetDurationInputValue(val);
                      const numVal = parseFloat(val);
                      if (!isNaN(numVal)) {
                        handleAnimationResetDurationChange({
                          ...animationResetDuration,
                          value: numVal,
                        });
                      } else if (val === '') {
                        handleAnimationResetDurationChange({ ...animationResetDuration, value: 0 });
                      }
                    }}
                    placeholder="1"
                    className="w-16 h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={animationResetDuration.unit}
                    onChange={(e) =>
                      handleAnimationResetDurationChange({
                        ...animationResetDuration,
                        unit: e.target.value as 'ms' | 's',
                      })
                    }
                    className="w-14 h-8 px-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ms">ms</option>
                    <option value="s">s</option>
                  </select>
                </div>
              </div>
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        {/* Editable Label */}
        <div className="h-9 flex items-center">
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
              className="w-full px-2 py-1.5 text-lg font-semibold text-gray-900 border-2 border-blue-500 rounded focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 min-w-0 relative overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                  {layer.label}
                </h2>
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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'properties'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'animations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Animations
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <div className="mt-4">
          {activeTab === 'properties' ? (
            <PropertyTab
              layer={layer}
              layers={layers}
              selectedSize={selectedSize}
              contentEditableRef={contentEditableRef}
              onPropertyChange={onPropertyChange}
              onHtmlIdChange={onHtmlIdChange}
              onAlignLayer={onAlignLayer}
              onAspectRatioLockToggle={onAspectRatioLockToggle}
              onContentChange={onContentChange}
              onColorChange={onColorChange}
              onFontSizeChange={onFontSizeChange}
              onIconSizeChange={onIconSizeChange}
              onFontFamilyChange={onFontFamilyChange}
              onTextAlignChange={onTextAlignChange}
              onTextChange={onTextChange}
              onBackgroundColorChange={onBackgroundColorChange}
              onImageUrlChange={onImageUrlChange}
              onObjectFitChange={onObjectFitChange}
              onVideoUrlChange={onVideoUrlChange}
              onVideoPropertyChange={onVideoPropertyChange}
              onOpacityChange={onOpacityChange}
              onButtonActionTypeChange={onButtonActionTypeChange}
              onButtonIconChange={onButtonIconChange}
              onVideoControlChange={onVideoControlChange}
            />
          ) : (
            <AnimationTab
              layer={layer}
              selectedSize={selectedSize}
              onAnimationChange={onAnimationChange}
            />
          )}
        </div>
      </div>

      {/* Delete Button - Outside tabs */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
  );
};
