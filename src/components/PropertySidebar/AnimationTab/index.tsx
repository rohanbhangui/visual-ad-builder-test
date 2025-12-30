import { type LayerContent, type AdSize, type Animation } from '../../../data';
import { Label } from '../../Label';

interface AnimationTabProps {
  layer: LayerContent;
  selectedSize: AdSize;
  onAnimationChange: (layerId: string, size: AdSize, animation: Animation | null) => void;
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
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'linear', label: 'Linear' },
] as const;

export const AnimationTab = ({
  layer,
  selectedSize,
  onAnimationChange,
}: AnimationTabProps) => {
  const config = layer.sizeConfig[selectedSize];
  if (!config) return null;

  // Get the first animation (we only support 1 per layer per size)
  const animation = config.animations?.[0];

  const handleAddAnimation = () => {
    const newAnimation: Animation = {
      id: crypto.randomUUID(),
      type: 'fadeIn',
      from: 0,
      to: 1,
      duration: { value: 0.3, unit: 's' },
      delay: { value: 0, unit: 's' },
      easing: 'ease-out',
    };
    onAnimationChange(layer.id, selectedSize, newAnimation);
  };

  const handleDeleteAnimation = () => {
    onAnimationChange(layer.id, selectedSize, null);
  };

  const handleTypeChange = (type: Animation['type']) => {
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

    onAnimationChange(layer.id, selectedSize, {
      ...animation,
      type,
      from,
      to,
      property,
    });
  };

  const handlePropertyChange = <K extends keyof Animation>(
    key: K,
    value: Animation[K]
  ) => {
    if (!animation) return;
    onAnimationChange(layer.id, selectedSize, {
      ...animation,
      [key]: value,
    });
  };

  if (!animation) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-500 text-center py-8">
          No animation set for this size
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
      {/* Animation Type */}
      <div>
        <Label>
          Animation Type
        </Label>
        <select
          value={animation.type}
          onChange={(e) => handleTypeChange(e.target.value as Animation['type'])}
          disabled={layer.locked}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
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
        <Label>
          Easing
        </Label>
        <select
          value={animation.easing}
          onChange={(e) => handlePropertyChange('easing', e.target.value as Animation['easing'])}
          disabled={layer.locked}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
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
          <Label>
            Start Point
          </Label>
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              step="1"
              value={typeof animation.from === 'string' ? parseFloat(animation.from) || 100 : animation.from}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                const unit = typeof animation.from === 'string' && animation.from.includes('%') ? '%' : 'px';
                handlePropertyChange('from', `${value}${unit}`);
              }}
              disabled={layer.locked}
              className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <select
              value={typeof animation.from === 'string' && animation.from.includes('%') ? '%' : 'px'}
              onChange={(e) => {
                const currentValue = typeof animation.from === 'string' ? parseFloat(animation.from) || 100 : 100;
                handlePropertyChange('from', `${currentValue}${e.target.value}`);
              }}
              disabled={layer.locked}
              className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
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
          <Label>
            Start Scale
          </Label>
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              step="10"
              value={typeof animation.from === 'number' ? animation.from * 100 : 0}
              onChange={(e) => {
                const percentValue = parseFloat(e.target.value) || 0;
                const scaleValue = percentValue / 100;
                handlePropertyChange('from', scaleValue);
              }}
              disabled={layer.locked}
              className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
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
            <Label>
              Property
            </Label>
            <select
              value={animation.property || 'opacity'}
              onChange={(e) =>
                handlePropertyChange('property', e.target.value as Animation['property'])
              }
              disabled={layer.locked}
              className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="opacity">Opacity</option>
              <option value="x">X Position</option>
              <option value="y">Y Position</option>
              <option value="width">Width</option>
              <option value="height">Height</option>
              <option value="scale">Scale</option>
              <option value="color">Color</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>
                From
              </Label>
              <input
                type="text"
                value={animation.from ?? ''}
                onChange={(e) => handlePropertyChange('from', e.target.value)}
                disabled={layer.locked}
                placeholder="e.g., 0 or 100%"
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <Label>
                To
              </Label>
              <input
                type="text"
                value={animation.to ?? ''}
                onChange={(e) => handlePropertyChange('to', e.target.value)}
                disabled={layer.locked}
                placeholder="e.g., 1 or 0%"
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Duration & Delay */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duration */}
        <div>
          <Label>
            Duration
          </Label>
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              step="0.1"
              value={animation.duration.value}
              onChange={(e) =>
                handlePropertyChange('duration', {
                  ...animation.duration,
                  value: parseFloat(e.target.value) || 0,
                })
              }
              disabled={layer.locked}
              className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <select
              value={animation.duration.unit}
              onChange={(e) =>
                handlePropertyChange('duration', {
                  ...animation.duration,
                  unit: e.target.value as 'ms' | 's',
                })
              }
              disabled={layer.locked}
              className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="ms">ms</option>
              <option value="s">s</option>
            </select>
          </div>
        </div>

        {/* Delay */}
        <div>
          <Label>
            Delay
          </Label>
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              step="0.1"
              value={animation.delay.value}
              onChange={(e) =>
                handlePropertyChange('delay', {
                  ...animation.delay,
                  value: parseFloat(e.target.value) || 0,
                })
              }
              disabled={layer.locked}
              className={`w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <select
              value={animation.delay.unit}
              onChange={(e) =>
                handlePropertyChange('delay', {
                  ...animation.delay,
                  unit: e.target.value as 'ms' | 's',
                })
              }
              disabled={layer.locked}
              className={`w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                layer.locked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="ms">ms</option>
              <option value="s">s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delete Animation Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleDeleteAnimation}
          disabled={layer.locked}
          className={`px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded transition-colors ${
            layer.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          Remove Animation
        </button>
      </div>
    </div>
  );
};
