import { useState, useEffect } from 'react';
import { type LayerContent, type AdSize, type Animation } from '../../../data';
import { Label } from '../../Label/Label';
import { CopySizePopover } from '../../Label/CopySizePopover';
import { ColorInput } from '../../ColorInput';
import TrashIcon from '../../../assets/icons/trash.svg?react';
import EditIcon from '../../../assets/icons/edit.svg?react';
import CopyIcon from '../../../assets/icons/copy.svg?react';
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

export const AnimationTab = ({ layer, selectedSize, onAnimationChange }: AnimationTabProps) => {
  const config = layer.sizeConfig[selectedSize];
  const animations = config?.animations || [];

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Local state for numeric inputs to allow typing
  const [durationInputs, setDurationInputs] = useState<Map<string, string>>(new Map());
  const [delayInputs, setDelayInputs] = useState<Map<string, string>>(new Map());
  const [startPointInputs, setStartPointInputs] = useState<Map<string, string>>(new Map());

  // Reset expanded state when layer changes, but only if user hasn't interacted
  useEffect(() => {
    if (!userHasInteracted) {
      setExpandedIds(new Set());
    }
  }, [layer.id, selectedSize, userHasInteracted]);

  if (!config) return null;

  const handleAddAnimation = () => {
    const animationNumber = animations.length + 1;
    const newAnimation: Animation = {
      id: `sa-${crypto.randomUUID()}`,
      name: `Animation ${animationNumber}`,
      type: 'fadeIn',
      from: { value: 0, unit: '' },
      to: { value: 1, unit: '' },
      duration: { value: 0.3, unit: 's' },
      delay: { value: 0, unit: 's' },
      easing: 'linear',
    };
    onAnimationChange(layer.id, selectedSize, [...animations, newAnimation]);
    // Auto-expand the new animation and set it to editing mode
    setExpandedIds((prev) => new Set([...prev, newAnimation.id]));
    setEditingNameId(newAnimation.id);
  };

  const handleDeleteAnimation = (animationId: string) => {
    onAnimationChange(
      layer.id,
      selectedSize,
      animations.filter((a) => a.id !== animationId)
    );
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(animationId);
      return next;
    });
  };

  const handleCopyToSizes = (animationId: string, targetSizes: AdSize[]) => {
    const animationToCopy = animations.find((a) => a.id === animationId);
    if (!animationToCopy) return;

    // Copy to each selected target size
    targetSizes.forEach((targetSize) => {
      const targetConfig = layer.sizeConfig[targetSize];
      if (!targetConfig) return;

      const targetAnimations = targetConfig.animations || [];
      const copiedAnimation: Animation = {
        ...animationToCopy,
        id: `sa-${crypto.randomUUID()}`,
      };

      onAnimationChange(layer.id, targetSize, [...targetAnimations, copiedAnimation]);
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
    setUserHasInteracted(true);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(animationId)) {
        next.delete(animationId);
      } else {
        next.add(animationId);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newAnimations = [...animations];
    const draggedAnimation = newAnimations[draggedIndex];
    newAnimations.splice(draggedIndex, 1);
    newAnimations.splice(dropIndex, 0, draggedAnimation);

    onAnimationChange(layer.id, selectedSize, newAnimations);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTypeChange = (animationId: string, type: Animation['type']) => {
    const animation = animations.find((a) => a.id === animationId);
    if (!animation) return;

    let from: string | { value: number; unit: string } = { value: 0, unit: '' };
    let to: string | { value: number; unit: string } = { value: 1, unit: '' };
    let property: Animation['property'] = undefined;

    // Set default from/to values based on type
    switch (type) {
      case 'fadeIn':
        from = { value: 0, unit: '' };
        to = { value: 1, unit: '' };
        property = 'opacity';
        break;
      case 'slideLeft':
        from = { value: 100, unit: '%' };
        to = { value: 0, unit: '%' };
        property = 'x';
        break;
      case 'slideRight':
        from = { value: -100, unit: '%' };
        to = { value: 0, unit: '%' };
        property = 'x';
        break;
      case 'slideUp':
        from = { value: 100, unit: '%' };
        to = { value: 0, unit: '%' };
        property = 'y';
        break;
      case 'slideDown':
        from = { value: -100, unit: '%' };
        to = { value: 0, unit: '%' };
        property = 'y';
        break;
      case 'scale':
        from = { value: 0, unit: '' };
        to = { value: 1, unit: '' };
        property = 'scale';
        break;
      case 'custom':
        from = animation.from ?? { value: 0, unit: '' };
        to = animation.to ?? { value: 1, unit: '' };
        property = animation.property ?? 'opacity';
        break;
    }

    handleUpdateAnimation(animationId, { type, from, to, property });
  };

  if (animations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-500 text-center py-8">No animations for this size</div>
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
      {animations.map((animation, index) => {
        const isExpanded = expandedIds.has(animation.id);
        const isEditingName = editingNameId === animation.id;
        const isDragging = draggedIndex === index;
        const showDropLineAbove =
          dragOverIndex === index && draggedIndex !== null && draggedIndex > index;
        const showDropLineBelow =
          dragOverIndex === index && draggedIndex !== null && draggedIndex < index;

        return (
          <div key={animation.id} className="relative">
            {/* Drop indicator line above */}
            {showDropLineAbove ? (
              <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-blue-500 z-10" />
            ) : null}

            <div
              className={`border border-gray-300 rounded transition-opacity ${
                isDragging ? 'opacity-50' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Animation Header */}
              <div
                className="flex items-center h-9 px-2 bg-gray-50 border-b border-gray-200 cursor-move"
                draggable={!layer.locked && !isEditingName ? true : false}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
              >
                <button
                  onClick={() => toggleExpanded(animation.id)}
                  className="p-0 mr-1.5 cursor-pointer"
                  disabled={layer.locked}
                >
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
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
                {!layer.locked ? (
                  <CopySizePopover
                    allowedSizes={Object.keys(layer.sizeConfig) as AdSize[]}
                    currentSize={selectedSize}
                    onCopy={(targetSizes) => handleCopyToSizes(animation.id, targetSizes)}
                    buttonClassName="p-1 ml-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  />
                ) : null}
                <button
                  onClick={() => handleDeleteAnimation(animation.id)}
                  disabled={layer.locked}
                  className={`p-1 ml-0.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${
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

            {/* Drop indicator line below */}
            {showDropLineBelow ? (
              <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-blue-500 z-10" />
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
          <Label isSizeSpecific={true} selectedSize={selectedSize}>
            Animation Type
          </Label>
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
          <Label isSizeSpecific={true} selectedSize={selectedSize}>
            Easing
          </Label>
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

        {/* Slide From */}
        {['slideLeft', 'slideRight', 'slideUp', 'slideDown'].includes(animation.type) ? (
          <div>
            <Label isSizeSpecific={true} selectedSize={selectedSize}>
              From
            </Label>
            <div className="flex gap-1">
              <input
                type="text"
                value={
                  startPointInputs.has(animation.id)
                    ? startPointInputs.get(animation.id)
                    : typeof animation.from === 'object' && animation.from !== null
                      ? animation.from.value
                      : typeof animation.from === 'string'
                        ? parseFloat(animation.from) || 100
                        : animation.from || 100
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setStartPointInputs(new Map(startPointInputs.set(animation.id, val)));
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  const numValue = val === '' ? 0 : parseFloat(val) || 0;
                  const currentUnit =
                    typeof animation.from === 'object' && animation.from !== null
                      ? animation.from.unit
                      : typeof animation.from === 'string' && animation.from.includes('%')
                        ? '%'
                        : 'px';
                  handleUpdateAnimation(animation.id, {
                    from: { value: numValue, unit: currentUnit },
                  });
                  startPointInputs.delete(animation.id);
                  setStartPointInputs(new Map(startPointInputs));
                }}
                disabled={layer.locked}
                className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <select
                value={
                  typeof animation.from === 'object' && animation.from !== null
                    ? animation.from.unit
                    : typeof animation.from === 'string' && animation.from.includes('%')
                      ? '%'
                      : 'px'
                }
                onChange={(e) => {
                  const currentValue =
                    typeof animation.from === 'object' && animation.from !== null
                      ? animation.from.value
                      : typeof animation.from === 'string'
                        ? parseFloat(animation.from) || 100
                        : animation.from || 100;
                  handleUpdateAnimation(animation.id, {
                    from: { value: currentValue, unit: e.target.value as 'px' | '%' },
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
        ) : null}

        {/* Scale Start Value */}
        {animation.type === 'scale' ? (
          <div>
            <Label isSizeSpecific={true} selectedSize={selectedSize}>
              Start Scale
            </Label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="10"
                value={
                  typeof animation.from === 'object' && animation.from !== null
                    ? animation.from.value * 100
                    : typeof animation.from === 'number'
                      ? animation.from * 100
                      : 0
                }
                onChange={(e) => {
                  const percentValue = parseFloat(e.target.value) || 0;
                  const scaleValue = percentValue / 100;
                  handleUpdateAnimation(animation.id, { from: { value: scaleValue, unit: '' } });
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
              <Label isSizeSpecific={true} selectedSize={selectedSize}>
                Property
              </Label>
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
                <ColorInput
                  label="From"
                  value={typeof animation.from === 'string' ? animation.from : '#000000'}
                  onChange={(color) => handleUpdateAnimation(animation.id, { from: color })}
                  disabled={layer.locked}
                />
                <ColorInput
                  label="To"
                  value={typeof animation.to === 'string' ? animation.to : '#ffffff'}
                  onChange={(color) => handleUpdateAnimation(animation.id, { to: color })}
                  disabled={layer.locked}
                />
              </div>
            ) : animation.property === 'scale' ? (
              /* Scale inputs (percentage) */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label isSizeSpecific={true} selectedSize={selectedSize}>
                    From Scale
                  </Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={
                        typeof animation.from === 'object' && animation.from !== null
                          ? animation.from.value * 100
                          : typeof animation.from === 'number'
                            ? animation.from * 100
                            : 0
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        handleUpdateAnimation(animation.id, {
                          from: { value: percentValue / 100, unit: '' },
                        });
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
                  <Label isSizeSpecific={true} selectedSize={selectedSize}>
                    To Scale
                  </Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={
                        typeof animation.to === 'object' && animation.to !== null
                          ? animation.to.value * 100
                          : typeof animation.to === 'number'
                            ? animation.to * 100
                            : 100
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        handleUpdateAnimation(animation.id, {
                          to: { value: percentValue / 100, unit: '' },
                        });
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
                  <Label isSizeSpecific={true} selectedSize={selectedSize}>
                    From
                  </Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="1"
                      value={
                        typeof animation.from === 'object' && animation.from !== null
                          ? animation.from.value
                          : typeof animation.from === 'string'
                            ? parseFloat(animation.from) || 0
                            : animation.from || 0
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const currentUnit =
                          typeof animation.from === 'object' && animation.from !== null
                            ? animation.from.unit
                            : typeof animation.from === 'string' && animation.from.includes('%')
                              ? '%'
                              : 'px';
                        handleUpdateAnimation(animation.id, {
                          from: { value, unit: currentUnit },
                        });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <select
                      value={
                        typeof animation.from === 'object' && animation.from !== null
                          ? animation.from.unit
                          : typeof animation.from === 'string' && animation.from.includes('%')
                            ? '%'
                            : 'px'
                      }
                      onChange={(e) => {
                        const currentValue =
                          typeof animation.from === 'object' && animation.from !== null
                            ? animation.from.value
                            : typeof animation.from === 'string'
                              ? parseFloat(animation.from) || 0
                              : animation.from || 0;
                        handleUpdateAnimation(animation.id, {
                          from: { value: currentValue, unit: e.target.value as 'px' | '%' },
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
                  <Label isSizeSpecific={true} selectedSize={selectedSize}>
                    To
                  </Label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="1"
                      value={
                        typeof animation.to === 'object' && animation.to !== null
                          ? animation.to.value
                          : typeof animation.to === 'string'
                            ? parseFloat(animation.to) || 0
                            : animation.to || 0
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const currentUnit =
                          typeof animation.to === 'object' && animation.to !== null
                            ? animation.to.unit
                            : typeof animation.to === 'string' && animation.to.includes('%')
                              ? '%'
                              : 'px';
                        handleUpdateAnimation(animation.id, { to: { value, unit: currentUnit } });
                      }}
                      disabled={layer.locked}
                      className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                    <select
                      value={
                        typeof animation.to === 'object' && animation.to !== null
                          ? animation.to.unit
                          : typeof animation.to === 'string' && animation.to.includes('%')
                            ? '%'
                            : 'px'
                      }
                      onChange={(e) => {
                        const currentValue =
                          typeof animation.to === 'object' && animation.to !== null
                            ? animation.to.value
                            : typeof animation.to === 'string'
                              ? parseFloat(animation.to) || 0
                              : animation.to || 0;
                        handleUpdateAnimation(animation.id, {
                          to: { value: currentValue, unit: e.target.value as 'px' | '%' },
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
                  <Label isSizeSpecific={true} selectedSize={selectedSize}>
                    From
                  </Label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={
                      typeof animation.from === 'object' && animation.from !== null
                        ? animation.from.value
                        : typeof animation.from === 'number'
                          ? animation.from
                          : 0
                    }
                    onChange={(e) =>
                      handleUpdateAnimation(animation.id, {
                        from: { value: parseFloat(e.target.value) || 0, unit: '' },
                      })
                    }
                    disabled={layer.locked}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
                <div>
                  <Label isSizeSpecific={true}>To</Label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={
                      typeof animation.to === 'object' && animation.to !== null
                        ? animation.to.value
                        : typeof animation.to === 'number'
                          ? animation.to
                          : 1
                    }
                    onChange={(e) =>
                      handleUpdateAnimation(animation.id, {
                        to: { value: parseFloat(e.target.value) || 1, unit: '' },
                      })
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
            <Label isSizeSpecific={true} selectedSize={selectedSize}>
              Duration
            </Label>
            <div className="flex gap-1">
              <input
                type="text"
                value={
                  durationInputs.has(animation.id)
                    ? durationInputs.get(animation.id)
                    : animation.duration.value
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setDurationInputs(new Map(durationInputs.set(animation.id, val)));
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  const numValue = val === '' ? 0 : parseFloat(val) || 0;
                  handleUpdateAnimation(animation.id, {
                    duration: {
                      ...animation.duration,
                      value: numValue,
                    },
                  });
                  durationInputs.delete(animation.id);
                  setDurationInputs(new Map(durationInputs));
                }}
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
            <Label isSizeSpecific={true} selectedSize={selectedSize}>
              Delay
            </Label>
            <div className="flex gap-1">
              <input
                type="text"
                value={
                  delayInputs.has(animation.id)
                    ? delayInputs.get(animation.id)
                    : animation.delay.value
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setDelayInputs(new Map(delayInputs.set(animation.id, val)));
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  const numValue = val === '' ? 0 : parseFloat(val) || 0;
                  handleUpdateAnimation(animation.id, {
                    delay: {
                      ...animation.delay,
                      value: numValue,
                    },
                  });
                  delayInputs.delete(animation.id);
                  setDelayInputs(new Map(delayInputs));
                }}
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
