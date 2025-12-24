import { useState } from 'react';
import { sampleCanvas, HTML5_AD_SIZES } from './data';
import { CanvasPreview } from './components/CanvasPreview';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import './App.css';

const toggleStyles = `
  .toggle-group {
    display: inline-flex;
    background: #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.25rem;
    position: relative;
  }
  .toggle-btn {
    flex: 1;
    padding: 0.5rem 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: 600;
    color: #374151;
    transition: color 0.3s ease;
    position: relative;
    z-index: 2;
  }
  .toggle-btn.active {
    color: white;
  }
  .toggle-slider {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    height: calc(100% - 0.5rem);
    background: #22c55e;
    border-radius: 0.375rem;
    transition: left 0.3s ease;
    z-index: 1;
  }
  .toggle-btn:first-child ~ .toggle-slider {
    width: calc(50% - 0.25rem);
  }
  .toggle-btn:nth-child(2).active ~ .toggle-slider {
    left: calc(50% + 0.125rem);
  }
`;

const App = () => {
  const [selectedSize, setSelectedSize] = useState<keyof typeof HTML5_AD_SIZES>(sampleCanvas.allowedSizes[0]);
  const [canvas, setCanvas] = useState(sampleCanvas);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const handleLayerUpdate = (layerId: string, updates: any) => {
    setCanvas((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }));
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <style>{toggleStyles}</style>
      <div className="text-center py-8 border-b border-gray-700">
        <h1 className="text-4xl font-bold">Visual HTML5 Ad Builder</h1>
      </div>

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 overflow-auto border-2 border-green-500 bg-gray-300 flex flex-col">
          <div className="flex justify-center p-8 pb-4">
            <div className="flex items-center gap-4">
              <label htmlFor="size-select" className="text-lg font-semibold text-gray-900">
                Ad Size:
              </label>
              <select
                id="size-select"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as keyof typeof HTML5_AD_SIZES)}
                className="px-4 py-2 rounded bg-gray-200 border border-gray-400 text-gray-900 cursor-pointer hover:border-gray-500 focus:outline-none focus:border-blue-500"
              >
                {sampleCanvas.allowedSizes.map((size) => (
                  <option key={size} value={size}>
                    {size} ({HTML5_AD_SIZES[size].width}x{HTML5_AD_SIZES[size].height})
                  </option>
                ))}
              </select>

              <div className="toggle-group ml-8">
                <button
                  onClick={() => setMode('edit')}
                  className={`toggle-btn ${mode === 'edit' ? 'active' : ''}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className={`toggle-btn ${mode === 'preview' ? 'active' : ''}`}
                >
                  Preview
                </button>
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-start p-8 bg-gray-200">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">{selectedSize}</h2>
              {mode === 'edit' ? (
                <InteractiveCanvas canvas={canvas} size={selectedSize} onLayerUpdate={handleLayerUpdate} />
              ) : (
                <CanvasPreview canvas={canvas} size={selectedSize} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 border-2 border-red-500 p-4 bg-gray-800">
          <p className="text-center font-semibold">Sidebar</p>
        </div>
      </div>
    </div>
  );
};

export default App;
