import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Animation, type LayerContent, type AdSize } from '../data';
import { ColorInput } from './inputs/ColorInput';
import XIcon from '../assets/icons/x.svg?react';

interface AddEditAnimationModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  layer: LayerContent;
  selectedSize: AdSize;
  animation?: Animation;
  onClose: () => void;
  onSave: (layerId: string, size: AdSize, animations: Animation[]) => void;
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

export const AddEditAnimationModal = ({
  isOpen,
  mode,
  layer,
  selectedSize,
  animation,
  onClose,
  onSave,
}: AddEditAnimationModalProps) => {
  const config = layer.sizeConfig[selectedSize];
  const animations = config?.animations || [];

  const [formData, setFormData] = useState<Animation>(() => {
    if (mode === 'edit' && animation) {
      return animation;
    }
    return {
      id: `anim-${Date.now()}`,
      name: `Animation ${animations.length + 1}`,
      type: 'fadeIn',
      from: { value: 0, unit: '' },
      to: { value: 1, unit: '' },
      duration: { value: 1, unit: 's' },
      delay: { value: 0, unit: 's' },
      easing: 'ease',
    };
  });

  const [durationInput, setDurationInput] = useState(formData.duration.value.toString());
  const [delayInput, setDelayInput] = useState(formData.delay.value.toString());

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && animation) {
        setFormData(animation);
        setDurationInput(animation.duration.value.toString());
        setDelayInput(animation.delay.value.toString());
      } else {
        const newAnim = {
          id: `anim-${Date.now()}`,
          name: `Animation ${animations.length + 1}`,
          type: 'fadeIn' as const,
          from: { value: 0, unit: '' },
          to: { value: 1, unit: '' },
          duration: { value: 1, unit: 's' as const },
          delay: { value: 0, unit: 's' as const },
          easing: 'ease' as const,
        };
        setFormData(newAnim);
        setDurationInput('1');
        setDelayInput('0');
      }
    }
  }, [isOpen, mode, animation, animations.length]);

  const handleSave = () => {
    let updatedAnimations: Animation[];
    if (mode === 'add') {
      updatedAnimations = [...animations, formData];
    } else {
      updatedAnimations = animations.map((a) => (a.id === formData.id ? formData : a));
    }
    onSave(layer.id, selectedSize, updatedAnimations);
    onClose();
  };

  if (!isOpen) return null;

  const needsStartPoint = ['slideLeft', 'slideRight', 'slideUp', 'slideDown'].includes(formData.type);
  const needsScaleOptions = formData.type === 'scale';
  const needsCustomFields = formData.type === 'custom';

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Semi-transparent black backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.66)' }} onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-[400px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="w-6" /> {/* Spacer for centering */}
          <h2 className="text-xl font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            {mode === 'add' ? 'Add Animation' : 'Edit Animation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Animation Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as Animation['type'] })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Easing</label>
            <select
              value={formData.easing}
              onChange={(e) => setFormData({ ...formData, easing: e.target.value as Animation['easing'] })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EASING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Point for slide animations */}
          {needsStartPoint ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Point (px)</label>
              <input
                type="number"
                value={typeof formData.from === 'object' && formData.from !== null ? formData.from.value : 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    from: { value: isNaN(val) ? 0 : val, unit: 'px' },
                  });
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : null}

          {/* Scale options */}
          {needsScaleOptions ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="number"
                  step="0.1"
                  value={typeof formData.from === 'object' && formData.from !== null ? formData.from.value : 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      from: { value: isNaN(val) ? 0 : val, unit: '' },
                    });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="number"
                  step="0.1"
                  value={typeof formData.to === 'object' && formData.to !== null ? formData.to.value : 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      to: { value: isNaN(val) ? 1 : val, unit: '' },
                    });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : null}

          {/* Custom Animation Fields */}
          {needsCustomFields ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <select
                  value={formData.property || 'opacity'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      property: e.target.value as Animation['property'],
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {formData.property === 'color' || formData.property === 'backgroundColor' ? (
                <div className="grid grid-cols-2 gap-3">
                  <ColorInput
                    label="From"
                    value={typeof formData.from === 'string' ? formData.from : '#000000'}
                    onChange={(color) => setFormData({ ...formData, from: color })}
                  />
                  <ColorInput
                    label="To"
                    value={typeof formData.to === 'string' ? formData.to : '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, to: color })}
                  />
                </div>
              ) : formData.property === 'scale' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From (%)</label>
                    <input
                      type="number"
                      step="10"
                      value={
                        typeof formData.from === 'object' && formData.from !== null
                          ? formData.from.value * 100
                          : 0
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          from: { value: percentValue / 100, unit: '' },
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To (%)</label>
                    <input
                      type="number"
                      step="10"
                      value={
                        typeof formData.to === 'object' && formData.to !== null
                          ? formData.to.value * 100
                          : 100
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          to: { value: percentValue / 100, unit: '' },
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : formData.property === 'opacity' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="10"
                      value={
                        typeof formData.from === 'object' && formData.from !== null
                          ? formData.from.value * 100
                          : 0
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          from: { value: percentValue / 100, unit: '' },
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="10"
                      value={
                        typeof formData.to === 'object' && formData.to !== null
                          ? formData.to.value * 100
                          : 100
                      }
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          to: { value: percentValue / 100, unit: '' },
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : ['x', 'y', 'width', 'height'].includes(formData.property || '') ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <div className="flex gap-1 w-full">
                      <input
                        type="number"
                        step="1"
                        value={
                          typeof formData.from === 'object' && formData.from !== null
                            ? formData.from.value
                            : 0
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const currentUnit =
                            typeof formData.from === 'object' && formData.from !== null
                              ? formData.from.unit
                              : 'px';
                          setFormData({
                            ...formData,
                            from: { value, unit: currentUnit },
                          });
                        }}
                        className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={
                          typeof formData.from === 'object' && formData.from !== null
                            ? formData.from.unit
                            : 'px'
                        }
                        onChange={(e) => {
                          const currentValue =
                            typeof formData.from === 'object' && formData.from !== null
                              ? formData.from.value
                              : 0;
                          setFormData({
                            ...formData,
                            from: { value: currentValue, unit: e.target.value as 'px' | '%' },
                          });
                        }}
                        className="w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="px">px</option>
                        <option value="%">%</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <div className="flex gap-1 w-full">
                      <input
                        type="number"
                        step="1"
                        value={
                          typeof formData.to === 'object' && formData.to !== null
                            ? formData.to.value
                            : 0
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const currentUnit =
                            typeof formData.to === 'object' && formData.to !== null
                              ? formData.to.unit
                              : 'px';
                          setFormData({
                            ...formData,
                            to: { value, unit: currentUnit },
                          });
                        }}
                        className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={
                          typeof formData.to === 'object' && formData.to !== null
                            ? formData.to.unit
                            : 'px'
                        }
                        onChange={(e) => {
                          const currentValue =
                            typeof formData.to === 'object' && formData.to !== null
                              ? formData.to.value
                              : 0;
                          setFormData({
                            ...formData,
                            to: { value: currentValue, unit: e.target.value as 'px' | '%' },
                          });
                        }}
                        className="w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="px">px</option>
                        <option value="%">%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {/* Duration and Delay side by side */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <div className="flex gap-1 w-full">
                <input
                  type="number"
                  step="0.01"
                  value={durationInput}
                  onChange={(e) => {
                    setDurationInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setFormData({
                        ...formData,
                        duration: { ...formData.duration, value: val },
                      });
                    }
                  }}
                  className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.duration.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, unit: e.target.value as 'ms' | 's' },
                    })
                  }
                  className="w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="s">s</option>
                  <option value="ms">ms</option>
                </select>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay</label>
              <div className="flex gap-1 w-full">
                <input
                  type="number"
                  step="0.01"
                  value={delayInput}
                  onChange={(e) => {
                    setDelayInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setFormData({
                        ...formData,
                        delay: { ...formData.delay, value: val },
                      });
                    }
                  }}
                  className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.delay.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delay: { ...formData.delay, unit: e.target.value as 'ms' | 's' },
                    })
                  }
                  className="w-14 px-1 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="s">s</option>
                  <option value="ms">ms</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {mode === 'add' ? 'Add Animation' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
