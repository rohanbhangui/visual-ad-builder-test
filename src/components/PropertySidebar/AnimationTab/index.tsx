import { useState } from 'react';
import { type LayerContent, type AdSize, type Animation } from '../../../data';
import { Label } from '../../Label';
import TrashIcon from '../../../assets/icons/trash.svg?react';
import EditIcon from '../../../assets/icons/edit.svg?react';
import ChevronDownIcon from '../../../assets/icons/chevron-down.svg?react';

interface AnimationTabProps {
  layer: LayerContent;
  selectedSize: AdSize;
  onAnimationChange: (layerId: string, size: AdSize, animations: Animation[]) => void;
}

const ANIMATION_TYPES = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'scale', label: 'Scale' },
  { value: 'custom', label: 'Custom' },
] as const;

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
] as const;

export const AnimationTab = ({
  layer,
  selectedSize,
  onAnimationChange,
}: AnimationTabProps) => {
  const config = layer.sizeConfig[selectedSize];
  const animations = config?.animations || [];
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(animations.map(a => a.id)));
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  if (!config) return null;

  const handleAddAnimation = () => {
    const animationNumber = animations.length + 1;
    const newAnimation: Animation = {
      id: crypto.randomUUID(),
      name: `Animation ${animationNumber}`,
      type: 'fadeIn',
      from: 0,
      to: 1,
      duration: { value: 0.3, unit: 's' },
      delay: { value: 0, unit: 's' },
      easing: 'linear',
    };
    onAnimationChange(layer.id, selectedSize, [...animations, newAnimation]);
    // Auto-expand the new animation and set it to editing mode
    setExpandedIds(prev => new Set([...prev, newAnimation.id]));
    setEditingNameId(newAnimation.id);
  };

  const handleDeleteAnimation = (animationId: string) => {
    onAnimationChange(
      layer.id,
      selectedSize,
      animations.filter((a) => a.id !== animationId)
    );
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(animationId);
      return next;
    });
  };

  const handleUpdateAnimation = (animationId: string, updates: Partial<Animation>) => {
    onAnimationChange(
      layer.id,
      selectedSize,
      animations.map((a) => (a.id === animationId ? { ...a, ...updates } : a))
    );
  };

  const toggleExpanded = (animationId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(animationId)) {
        next.delete(animationId);
      } else {
        next.add(animationId);
      }
      return next;
    });
  };

  const handleTypeChange = (animationId: string, type: Animation['type']) => {
    const animation = animations.find(a => a.id === animationId);
    if (!animation) return;
    
    let from: string | number = 0;
    let to: string | number = 1;
    let property: Animation['property'] = undefined;

    // Set default from/to values based on type
    switch (type) {
      case 'fadeIn':
        from = 0;
        to = 1;
        property = 'opacity';
        break;
      case 'slideLeft':
        from = '100%';
        to = '0%';
        property = 'x';
        break;
      case 'slideRight':
        from = '-100%';
        to = '0%';
        property = 'x';
        break;
      case 'slideUp':
        from = '100%';
        to = '0%';
        property = 'y';
        break;
      case 'slideDown':
        from = '-100%';
        to = '0%';
        property = 'y';
        break;
      case 'scale':
        from = 0;
        to = 1;
        property = 'scale';
        break;
      case 'custom':
        from = animation.from ?? 0;
        to = animation.to ?? 1;
        property = animation.property ?? 'opacity';
        break;
    }

    handleUpdateAnimation(animationId, { type, from, to, property });
  };

  if (animations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-500 text-center py-8">
          No animations for this size
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleAddAnimation}
            disabled={layer.locked}
            className={`px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded transition-colors ${
              layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            Add Animation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {animations.map((animation) => {
        const isExpanded = expandedIds.has(animation.id);
        const isEditingName = editingNameId === animation.id;

        return (
          <div key={animation.id} className="border border-gray-300 rounded">
            {/* Animation Header */}
            <div className="flex items-center h-9 px-2 bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => toggleExpanded(animation.id)}
                className="p-0 mr-1.5 cursor-pointer"
                disabled={layer.locked}
              >
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? '' : '-rotate-90'
                  }`}
                />
              </button>
              {isEditingName ? (
                <input
                  type="text"
                  value={animation.name}
                  onChange={(e) => handleUpdateAnimation(animation.id, { name: e.target.value })}
                  onBlur={() => setEditingNameId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingNameId(null);
                    }
                  }}
                  autoFocus
                  className="flex-1 px-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                />
              ) : (
                <span 
                  className="flex-1 text-sm font-medium cursor-pointer block overflow-hidden whitespace-nowrap"
                  onClick={() => toggleExpanded(animation.id)}
                  style={{
                    maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                  }}
                >
                  {animation.name}
                </span>
              )}
              <button
                onClick={() => !layer.locked && setEditingNameId(animation.id)}
                disabled={layer.locked}
                className={`p-1 ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${
                  layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Edit name"
              >
                <EditIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteAnimation(animation.id)}
                disabled={layer.locked}
                className={`p-1 ml-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${
                  layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Delete animation"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Animation Content */}
            {isExpanded ? (
              <div className="p-3 space-y-3">{renderAnimationFields(animation)}</div>
            ) : null}
          </div>
        );
      })}

      {/* Add Animation Button */}
      <button
        onClick={handleAddAnimation}
        disabled={layer.locked}
        className={`px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded transition-colors ${
          layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        Add Animation
      </button>
    </div>
  );

  function renderAnimationFields(animation: Animation) {
    return (
      <>
        {/* Animation Type */}
        <div>
          <Label>Animation Type</Label>
          <select
            value={animation.type}
            onChange={(e) => handleTypeChange(animation.id, e.target.value as Animation['type'])}
            disabled={layer.locked}
            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {ANIMATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Easing */}
        <div>
          <Label>Easing</Label>
          <select
            value={animation.easing}
            onChange={(e) =>
              handleUpdateAnimation(animation.id, {
                easing: e.target.value as Animation['easing'],
              })
            }
            disabled={layer.locked}
            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {EASING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Slide Start Point */}
        {['slideLeft', 'slideRight', 'slideUp', 'slideDown'].includes(animation.type) ? (
          <div>
            <Label>Start Point</Label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="1"
                value={
                  typeof animation.from === 'string'
                    ? parseFloat(animation.from) || 100
                    : animation.from
                }
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const unit =
                    typeof animation.from === 'string' && animation.from.includes('%') ? '%' : 'px';
                  handleUpdateAnimation(animation.id, { from: `${value}${unit}` });
                }}
                disabled={layer.locked}
                className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <select
                value={
                  typeof animation.from === 'string' && animation.from.includes('%') ? '%' : 'px'
                }
                onChange={(e) => {
                  const currentValue =
                    typeof animation.from === 'string' ? parseFloat(animation.from) || 100 : 100;
                  handleUpdateAnimation(animation.id, { from: `${currentValue}${e.target.value}` });
                }}
                disabled={layer.locked}
                className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="px">px</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
        ) : null}

        {/* Scale Start Value */}
        {animation.type === 'scale' ? (
          <div>
            <Label>Start Scale</Label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="10"
                value={typeof animation.from === 'number' ? animation.from * 100 : 0}
                onChange={(e) => {
                  const percentValue = parseFloat(e.target.value) || 0;
                  const scaleValue = percentValue / 100;
                  handleUpdateAnimation(animation.id, { from: scaleValue });
                }}
                disabled={layer.locked}
                className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <div className="flex items-center px-2 py-1.5 text-sm text-gray-600 border border-gray-300 rounded bg-gray-50 w-14">
                %
              </div>
            </div>
          </div>
        ) : null}

        {/* Custom Animation Values */}
        {animation.type === 'custom' ? (
          <>
            <div>
              <Label>Property</Label>
              <select
                value={animation.property || 'opacity'}
                onChange={(e) =>
                  handleUpdateAnimation(animation.id, {
                    property: e.target.value as Animation['property'],
                  })
                }
                disabled={layer.locked}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="backgroundColor">Background Color</option>
                <option value="color">Color</option>
                <option value="height">Height</option>
                <option value="opacity">Opacity</option>
                <option value="scale">Scale</option>
                <option value="width">Width</option>
                <option value="x">X Position</option>
                <option value="y">Y Position</option>
              </select>
            </div>

            {/* Dynamic From/To inputs based on property */}
            {animation.property === 'color' || animation.property === 'backgroundColor' ? (
              /* Color inputs */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From {animation.property === 'backgroundColor' ? 'BG' : 'Color'}</Label>
                  <input
                    type="color"
                    value={typeof animation.from === 'string' ? animation.from : '#000000'}
                    onChange={(e) => handleUpdateAnimation(animation.id, { from: e.target.value })}
                    disabled={layer.locked}
                    className={`w-full h-8 border border-gray-300 rounded ${
                      layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
                <div>
                  <Label>To {animation.property === 'backgroundColor' ? 'BG' : 'Color'}</Label>
                  <input
                    type="color"
                    value={typeof animation.to === 'string' ? animation.to : '#ffffff'}
                    onChange={(e) => handleUpdateAnimation(animation.id, { to: e.target.value })}
                    disabled={layer.locked}
                    className={`w-full h-8 border border-gray-300 rounded ${
                      layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
              </div>
            ) : animation.property === 'scale' ? (
              /* Scale inputs (percentage) */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From Scale</Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={typeof animation.from === 'number' ? animation.from * 100 : 0}
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        handleUpdateAnimation(animation.id, { from: percentValue / 100 });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <div className="flex items-center px-2 py-1.5 text-sm text-gray-600 border border-gray-300 rounded bg-gray-50 w-14">
                      %
                    </div>
                  </div>
                </div>
                <div>
                  <Label>To Scale</Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={typeof animation.to === 'number' ? animation.to * 100 : 100}
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        handleUpdateAnimation(animation.id, { to: percentValue / 100 });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <div className="flex items-center px-2 py-1.5 text-sm text-gray-600 border border-gray-300 rounded bg-gray-50 w-14">
                      %
                    </div>
                  </div>
                </div>
              </div>
            ) : ['x', 'y', 'width', 'height'].includes(animation.property || '') ? (
              /* Position/Size inputs with units */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From</Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="1"
                      value={
                        typeof animation.from === 'string'
                          ? parseFloat(animation.from) || 0
                          : animation.from
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const unit =
                          typeof animation.from === 'string' && animation.from.includes('%')
                            ? '%'
                            : 'px';
                        handleUpdateAnimation(animation.id, { from: `${value}${unit}` });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <select
                      value={
                        typeof animation.from === 'string' && animation.from.includes('%')
                          ? '%'
                          : 'px'
                      }
                      onChange={(e) => {
                        const currentValue =
                          typeof animation.from === 'string'
                            ? parseFloat(animation.from) || 0
                            : animation.from;
                        handleUpdateAnimation(animation.id, {
                          from: `${currentValue}${e.target.value}`,
                        });
                      }}
                      disabled={layer.locked}
                      className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <option value="px">px</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>To</Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="1"
                      value={
                        typeof animation.to === 'string' ? parseFloat(animation.to) || 0 : animation.to
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const unit =
                          typeof animation.to === 'string' && animation.to.includes('%') ? '%' : 'px';
                        handleUpdateAnimation(animation.id, { to: `${value}${unit}` });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <select
                      value={
                        typeof animation.to === 'string' && animation.to.includes('%') ? '%' : 'px'
                      }
                      onChange={(e) => {
                        const currentValue =
                          typeof animation.to === 'string' ? parseFloat(animation.to) || 0 : animation.to;
                        handleUpdateAnimation(animation.id, {
                          to: `${currentValue}${e.target.value}`,
                        });
                      }}
                      disabled={layer.locked}
                      className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <option value="px">px</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* Opacity - simple number input */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From</Label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={typeof animation.from === 'number' ? animation.from : 0}
                    onChange={(e) =>
                      handleUpdateAnimation(animation.id, { from: parseFloat(e.target.value) || 0 })
                    }
                    disabled={layer.locked}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
                <div>
                  <Label>To</Label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={typeof animation.to === 'number' ? animation.to : 1}
                    onChange={(e) =>
                      handleUpdateAnimation(animation.id, { to: parseFloat(e.target.value) || 1 })
                    }
                    disabled={layer.locked}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Duration & Delay */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div>
            <Label>Duration</Label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="0.1"
                value={animation.duration.value}
                onChange={(e) =>
                  handleUpdateAnimation(animation.id, {
                    duration: {
                      ...animation.duration,
                      value: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={layer.locked}
                className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <select
                value={animation.duration.unit}
                onChange={(e) =>
                  handleUpdateAnimation(animation.id, {
                    duration: {
                      ...animation.duration,
                      unit: e.target.value as 'ms' | 's',
                    },
                  })
                }
                disabled={layer.locked}
                className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="ms">ms</option>
                <option value="s">s</option>
              </select>
            </div>
          </div>

          {/* Delay */}
          <div>
            <Label>Delay</Label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="0.1"
                value={animation.delay.value}
                onChange={(e) =>
                  handleUpdateAnimation(animation.id, {
                    delay: {
                      ...animation.delay,
                      value: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={layer.locked}
                className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <select
                value={animation.delay.unit}
                onChange={(e) =>
                  handleUpdateAnimation(animation.id, {
                    delay: {
                      ...animation.delay,
                      unit: e.target.value as 'ms' | 's',
                    },
                  })
                }
                disabled={layer.locked}
                className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="ms">ms</option>
                <option value="s">s</option>
              </select>
            </div>
          </div>
        </div>
      </>
    );
  }
};
