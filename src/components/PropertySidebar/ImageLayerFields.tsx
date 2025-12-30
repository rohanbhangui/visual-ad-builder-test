import { useState } from 'react';
import { type ImageLayer } from '../../data';
import { UrlInput } from '../UrlInput';

interface ImageLayerFieldsProps {
  layer: ImageLayer;
  onImageUrlChange: (layerId: string, url: string) => void;
  onObjectFitChange: (layerId: string, objectFit: string) => void;
}

export const ImageLayerFields = ({
  layer,
  onImageUrlChange,
  onObjectFitChange,
}: ImageLayerFieldsProps) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
        <div className="mb-2">
          {layer.url && !imageLoadError ? (
            <img
              key={layer.url}
              src={layer.url}
              alt="Preview"
              className="w-[100px] h-[56px] object-cover border border-gray-300 rounded"
              onLoad={() => setImageLoadError(false)}
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <div className="w-[100px] h-[56px] bg-gray-400 border border-gray-300 rounded flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
        <UrlInput
          label=""
          value={layer.url}
          onChange={(url) => onImageUrlChange(layer.id, url)}
          placeholder="https://example.com/image.jpg"
          disabled={layer.locked}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Image Fit</label>
        <select
          value={layer.styles?.objectFit || 'cover'}
          onChange={(e) => onObjectFitChange(layer.id, e.target.value)}
          disabled={layer.locked}
          className={`w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </div>
    </>
  );
};
