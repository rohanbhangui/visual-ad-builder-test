import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import XIcon from '../assets/icons/x.svg?react';

interface ExportHTMLModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export const ExportHTMLModal: React.FC<ExportHTMLModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Semi-transparent black backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.66)' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="w-6" /> {/* Spacer for centering */}
          <h2 className="text-xl font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            Export Template (All Sizes)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Textarea */}
        <div className="flex-1 p-6 overflow-hidden">
          <textarea
            readOnly
            value={htmlContent}
            className="w-full h-full font-mono text-sm border border-gray-300 rounded-md p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleCopy}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
