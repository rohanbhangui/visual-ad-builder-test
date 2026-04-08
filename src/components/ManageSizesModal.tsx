import React from 'react';
import { createPortal } from 'react-dom';
import XIcon from '../assets/icons/x.svg?react';
import PlusIcon from '../assets/icons/plus.svg?react';
import { HTML5_AD_SIZES } from '../consts';
import type { AdSize } from '../data';
import { AD_SIZE_NAMES } from '../utils/adSizes';

interface ManageSizesModalProps {
  isOpen: boolean;
  availableSizes: AdSize[];
  onClose: () => void;
  onAddSize: (size: AdSize) => void;
}

export const ManageSizesModal: React.FC<ManageSizesModalProps> = ({
  isOpen,
  availableSizes,
  onClose,
  onAddSize,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2050] flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.66)' }}
        onClick={onClose}
      />

      <div className="relative w-[560px] max-w-[calc(100vw-32px)] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Size</h2>
            <p className="mt-1 text-sm text-gray-500">
              New sizes inherit layout from the closest existing size.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {availableSizes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              All available ad sizes have already been added.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSizes.map((size) => {
                const dimensions = HTML5_AD_SIZES[size];

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onAddSize(size);
                      onClose();
                    }}
                    className="cursor-pointer rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {AD_SIZE_NAMES[size]}
                        </div>
                        <div className="mt-1 font-mono text-xs text-gray-500">{size}</div>
                        <div className="mt-2 text-xs text-gray-500">
                          {dimensions.width} x {dimensions.height}
                        </div>
                      </div>
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <PlusIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
