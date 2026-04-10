import { useState } from 'react';
import { type VideoLayer } from '../../../data';
import { UrlInput } from '../../inputs/UrlInput';
import { Label } from '../../Label/Label';

interface VideoLayerFieldsProps {
  layer: VideoLayer;
  onVideoUrlChange: (layerId: string, url: string) => void;
  onVideoPropertyChange: (
    layerId: string,
    property: 'autoplay' | 'controls',
    value: boolean
  ) => void;
  onObjectFitChange: (layerId: string, objectFit: string) => void;
}

export const VideoLayerFields = ({
  layer,
  onVideoUrlChange,
  onVideoPropertyChange,
  onObjectFitChange,
}: VideoLayerFieldsProps) => {
  const [videoLoadError, setVideoLoadError] = useState(false);

  return (
    <>
      <div>
        <Label>Video URL</Label>
        <div>
          {layer.url && !videoLoadError ? (
            <video
              key={layer.url}
              src={layer.url}
              preload="metadata"
              className="w-[100px] h-[56px] object-cover border border-gray-300 rounded"
              onLoadedMetadata={() => setVideoLoadError(false)}
              onError={() => setVideoLoadError(true)}
            />
          ) : (
            <div className="w-[100px] h-[56px] bg-gray-400 border border-gray-300 rounded flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" fill="none" />
                <polygon points="10,8 16,12 10,16" />
              </svg>
            </div>
          )}
        </div>
        <UrlInput
          label=""
          value={layer.url}
          onChange={(url) => onVideoUrlChange(layer.id, url)}
          placeholder="https://example.com/video.mp4"
          disabled={layer.locked}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={layer.properties?.autoplay ?? false}
            onChange={(e) => onVideoPropertyChange(layer.id, 'autoplay', e.target.checked)}
            disabled={layer.locked}
            className={`w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <span className="text-gray-700">Autoplay</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={layer.properties?.controls ?? true}
            onChange={(e) => onVideoPropertyChange(layer.id, 'controls', e.target.checked)}
            disabled={layer.locked}
            className={`w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
              layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <span className="text-gray-700">Show Controls</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Video Fit</label>
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
