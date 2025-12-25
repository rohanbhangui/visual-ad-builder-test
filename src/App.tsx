import { useState, useRef, useEffect } from 'react';
import { sampleCanvas, HTML5_AD_SIZES, type LayerContent } from './data';

function App() {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [layers, setLayers] = useState<LayerContent[]>(sampleCanvas.layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<keyof typeof HTML5_AD_SIZES>('336x280');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapLines, setSnapLines] = useState<Array<{ type: 'vertical' | 'horizontal', position: number }>>([]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, layerX: 0, layerY: 0, direction: '' });

  const dimensions = HTML5_AD_SIZES[selectedSize];
  const SNAP_THRESHOLD = 8;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleLayerMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (mode !== 'edit') return;
    
    // Don't start dragging if clicking on a resize handle
    const target = e.target as HTMLElement;
    if (target.style.cursor && target.style.cursor.includes('resize')) {
      return;
    }
    
    e.stopPropagation();
    
    setSelectedLayerId(layerId);
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const pos = layer.position[selectedSize];
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: pos.x as number,
      layerY: pos.y as number
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, layerId: string, direction: string) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedLayerId(layerId);
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const pos = layer.position[selectedSize];
    const width = layer.width[selectedSize];
    const height = layer.height[selectedSize];
    
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: width.value,
      height: height.value,
      layerX: pos.x as number,
      layerY: pos.y as number,
      direction
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedLayerId) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      const currentLayer = layers.find(l => l.id === selectedLayerId);
      if (!currentLayer) return;
      
      const currentWidth = currentLayer.width[selectedSize].value;
      const currentHeight = currentLayer.height[selectedSize].value;
      
      let newX = dragStartRef.current.layerX + dx;
      let newY = dragStartRef.current.layerY + dy;
      
      // Calculate snap points
      const guides: Array<{ type: 'vertical' | 'horizontal', position: number }> = [];
      
      // Canvas edges
      const canvasEdges = {
        left: 0,
        right: dimensions.width,
        top: 0,
        bottom: dimensions.height,
        centerX: dimensions.width / 2,
        centerY: dimensions.height / 2
      };
      
      // Current element edges
      const currentRight = newX + currentWidth;
      const currentBottom = newY + currentHeight;
      const currentCenterX = newX + currentWidth / 2;
      const currentCenterY = newY + currentHeight / 2;
      
      // Snap to canvas edges (only if Shift is not pressed)
      if (!isShiftPressed) {
        if (Math.abs(newX - canvasEdges.left) < SNAP_THRESHOLD) {
          newX = canvasEdges.left;
          guides.push({ type: 'vertical', position: canvasEdges.left });
        }
        if (Math.abs(currentRight - canvasEdges.right) < SNAP_THRESHOLD) {
          newX = canvasEdges.right - currentWidth;
          guides.push({ type: 'vertical', position: canvasEdges.right });
        }
        if (Math.abs(currentCenterX - canvasEdges.centerX) < SNAP_THRESHOLD) {
          newX = canvasEdges.centerX - currentWidth / 2;
          guides.push({ type: 'vertical', position: canvasEdges.centerX });
        }
        
        if (Math.abs(newY - canvasEdges.top) < SNAP_THRESHOLD) {
          newY = canvasEdges.top;
          guides.push({ type: 'horizontal', position: canvasEdges.top });
        }
        if (Math.abs(currentBottom - canvasEdges.bottom) < SNAP_THRESHOLD) {
          newY = canvasEdges.bottom - currentHeight;
          guides.push({ type: 'horizontal', position: canvasEdges.bottom });
        }
        if (Math.abs(currentCenterY - canvasEdges.centerY) < SNAP_THRESHOLD) {
          newY = canvasEdges.centerY - currentHeight / 2;
          guides.push({ type: 'horizontal', position: canvasEdges.centerY });
        }
        
        // Snap to other elements
        layers.forEach(layer => {
          if (layer.id === selectedLayerId) return;
          
          const otherPos = layer.position[selectedSize];
          const otherWidth = layer.width[selectedSize].value;
          const otherHeight = layer.height[selectedSize].value;
          const otherX = otherPos.x as number;
          const otherY = otherPos.y as number;
          const otherRight = otherX + otherWidth;
          const otherBottom = otherY + otherHeight;
          const otherCenterX = otherX + otherWidth / 2;
          const otherCenterY = otherY + otherHeight / 2;
          
          // Snap left to left
          if (Math.abs(newX - otherX) < SNAP_THRESHOLD) {
            newX = otherX;
            guides.push({ type: 'vertical', position: otherX });
          }
          // Snap right to right
          if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
            newX = otherRight - currentWidth;
            guides.push({ type: 'vertical', position: otherRight });
          }
          // Snap left to right
          if (Math.abs(newX - otherRight) < SNAP_THRESHOLD) {
            newX = otherRight;
            guides.push({ type: 'vertical', position: otherRight });
          }
          // Snap right to left
          if (Math.abs(currentRight - otherX) < SNAP_THRESHOLD) {
            newX = otherX - currentWidth;
            guides.push({ type: 'vertical', position: otherX });
          }
          // Snap center to center X
          if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
            newX = otherCenterX - currentWidth / 2;
            guides.push({ type: 'vertical', position: otherCenterX });
          }
          
          // Snap top to top
          if (Math.abs(newY - otherY) < SNAP_THRESHOLD) {
            newY = otherY;
            guides.push({ type: 'horizontal', position: otherY });
          }
          // Snap bottom to bottom
          if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
            newY = otherBottom - currentHeight;
            guides.push({ type: 'horizontal', position: otherBottom });
          }
          // Snap top to bottom
          if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD) {
            newY = otherBottom;
            guides.push({ type: 'horizontal', position: otherBottom });
          }
          // Snap bottom to top
          if (Math.abs(currentBottom - otherY) < SNAP_THRESHOLD) {
            newY = otherY - currentHeight;
            guides.push({ type: 'horizontal', position: otherY });
          }
          // Snap center to center Y
          if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
            newY = otherCenterY - currentHeight / 2;
            guides.push({ type: 'horizontal', position: otherCenterY });
          }
        });
      }
      
      setSnapLines(guides);
      
      setLayers(prev => prev.map(layer => {
        if (layer.id === selectedLayerId) {
          return {
            ...layer,
            position: {
              ...layer.position,
              [selectedSize]: {
                ...layer.position[selectedSize],
                x: newX,
                y: newY
              }
            }
          };
        }
        return layer;
      }));
    } else if (isResizing && selectedLayerId) {
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      const { direction, width, height, layerX, layerY } = resizeStartRef.current;
      
      const currentLayer = layers.find(l => l.id === selectedLayerId);
      if (!currentLayer) return;
      
      let newWidth = width;
      let newHeight = height;
      let newX = layerX;
      let newY = layerY;
      
      if (direction.includes('e')) newWidth = Math.max(10, width + dx);
      if (direction.includes('w')) {
        newWidth = Math.max(10, width - dx);
        newX = layerX + dx;
      }
      if (direction.includes('s')) newHeight = Math.max(10, height + dy);
      if (direction.includes('n')) {
        newHeight = Math.max(10, height - dy);
        newY = layerY + dy;
      }
      
      // Apply snapping during resize if Shift is not pressed
      const guides: Array<{ type: 'vertical' | 'horizontal', position: number }> = [];
      
      if (!isShiftPressed) {
        const canvasEdges = {
          left: 0,
          right: dimensions.width,
          top: 0,
          bottom: dimensions.height,
          centerX: dimensions.width / 2,
          centerY: dimensions.height / 2
        };
        
        const currentRight = newX + newWidth;
        const currentBottom = newY + newHeight;
        const currentCenterX = newX + newWidth / 2;
        const currentCenterY = newY + newHeight / 2;
        
        // Snap to canvas edges
        if (Math.abs(newX - canvasEdges.left) < SNAP_THRESHOLD) {
          if (direction.includes('w')) {
            newWidth = width + (layerX - canvasEdges.left);
            newX = canvasEdges.left;
          }
          guides.push({ type: 'vertical', position: canvasEdges.left });
        }
        if (Math.abs(currentRight - canvasEdges.right) < SNAP_THRESHOLD) {
          if (direction.includes('e')) {
            newWidth = canvasEdges.right - newX;
          }
          guides.push({ type: 'vertical', position: canvasEdges.right });
        }
        if (Math.abs(currentCenterX - canvasEdges.centerX) < SNAP_THRESHOLD) {
          guides.push({ type: 'vertical', position: canvasEdges.centerX });
        }
        
        if (Math.abs(newY - canvasEdges.top) < SNAP_THRESHOLD) {
          if (direction.includes('n')) {
            newHeight = height + (layerY - canvasEdges.top);
            newY = canvasEdges.top;
          }
          guides.push({ type: 'horizontal', position: canvasEdges.top });
        }
        if (Math.abs(currentBottom - canvasEdges.bottom) < SNAP_THRESHOLD) {
          if (direction.includes('s')) {
            newHeight = canvasEdges.bottom - newY;
          }
          guides.push({ type: 'horizontal', position: canvasEdges.bottom });
        }
        if (Math.abs(currentCenterY - canvasEdges.centerY) < SNAP_THRESHOLD) {
          guides.push({ type: 'horizontal', position: canvasEdges.centerY });
        }
        
        // Snap to other elements
        layers.forEach(layer => {
          if (layer.id === selectedLayerId) return;
          
          const otherPos = layer.position[selectedSize];
          const otherWidth = layer.width[selectedSize].value;
          const otherHeight = layer.height[selectedSize].value;
          const otherX = otherPos.x as number;
          const otherY = otherPos.y as number;
          const otherRight = otherX + otherWidth;
          const otherBottom = otherY + otherHeight;
          const otherCenterX = otherX + otherWidth / 2;
          const otherCenterY = otherY + otherHeight / 2;
          
          // Vertical snapping
          if (Math.abs(newX - otherX) < SNAP_THRESHOLD) {
            if (direction.includes('w')) {
              newWidth = width + (layerX - otherX);
              newX = otherX;
            }
            guides.push({ type: 'vertical', position: otherX });
          }
          if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
            if (direction.includes('e')) {
              newWidth = otherRight - newX;
            }
            guides.push({ type: 'vertical', position: otherRight });
          }
          if (Math.abs(newX - otherRight) < SNAP_THRESHOLD) {
            if (direction.includes('w')) {
              newWidth = width + (layerX - otherRight);
              newX = otherRight;
            }
            guides.push({ type: 'vertical', position: otherRight });
          }
          if (Math.abs(currentRight - otherX) < SNAP_THRESHOLD) {
            if (direction.includes('e')) {
              newWidth = otherX - newX;
            }
            guides.push({ type: 'vertical', position: otherX });
          }
          if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
            guides.push({ type: 'vertical', position: otherCenterX });
          }
          
          // Horizontal snapping
          if (Math.abs(newY - otherY) < SNAP_THRESHOLD) {
            if (direction.includes('n')) {
              newHeight = height + (layerY - otherY);
              newY = otherY;
            }
            guides.push({ type: 'horizontal', position: otherY });
          }
          if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
            if (direction.includes('s')) {
              newHeight = otherBottom - newY;
            }
            guides.push({ type: 'horizontal', position: otherBottom });
          }
          if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD) {
            if (direction.includes('n')) {
              newHeight = height + (layerY - otherBottom);
              newY = otherBottom;
            }
            guides.push({ type: 'horizontal', position: otherBottom });
          }
          if (Math.abs(currentBottom - otherY) < SNAP_THRESHOLD) {
            if (direction.includes('s')) {
              newHeight = otherY - newY;
            }
            guides.push({ type: 'horizontal', position: otherY });
          }
          if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
            guides.push({ type: 'horizontal', position: otherCenterY });
          }
        });
      }
      
      setSnapLines(guides);
      
      setLayers(prev => prev.map(layer => {
        if (layer.id === selectedLayerId) {
          return {
            ...layer,
            position: {
              ...layer.position,
              [selectedSize]: { ...layer.position[selectedSize], x: newX, y: newY }
            },
            width: {
              ...layer.width,
              [selectedSize]: { value: newWidth, unit: 'px' }
            },
            height: {
              ...layer.height,
              [selectedSize]: { value: newHeight, unit: 'px' }
            }
          };
        }
        return layer;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setSnapLines([]);
  };

  const generatePreviewHTML = () => {
    const layerElements = layers
      .map((layer) => {
        const pos = layer.position[selectedSize];
        const width = layer.width[selectedSize];
        const height = layer.height[selectedSize];
        const style = `position: absolute; left: ${pos.x}${pos.unit}; top: ${pos.y}${pos.unit}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit};`;

        let content = '';
        switch (layer.type) {
          case 'image':
            content = `<img src="${layer.url}" style="${style} object-fit: cover;" alt="${layer.label}" />`;
            break;
          case 'text':
            content = `<div style="${style}">${layer.content}</div>`;
            break;
          case 'richtext':
            content = `<div style="${style}">${layer.content}</div>`;
            break;
          case 'video':
            if (width.value > 0 && height.value > 0) {
              content = `<video src="${layer.url}" style="${style}" controls></video>`;
            }
            break;
          case 'button':
            content = `<a href="${layer.url}" target="_blank" style="${style} display: flex; align-items: center; justify-content: center; background-color: #333; color: white; text-decoration: none; font-size: 14px; cursor: pointer;">${layer.text}</a>`;
            break;
        }

        return content;
      })
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body, div, span, h1, h2, h3, h4, h5, h6, p, img, video, button {
      margin: 0;
      padding: 0;
      border: 0;
      font-size: 100%;
      font-weight: normal;
      vertical-align: baseline;
    }
    body {
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      position: relative;
      overflow: hidden;
      -webkit-text-size-adjust: 100%;
      background: white;
      margin: 0;
      padding: 0;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${layerElements}
</body>
</html>`;
  };

  const renderLayer = (layer: LayerContent) => {
    const pos = layer.position[selectedSize];
    const width = layer.width[selectedSize];
    const height = layer.height[selectedSize];
    const isSelected = selectedLayerId === layer.id;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${pos.x}${pos.unit}`,
      top: `${pos.y}${pos.unit}`,
      width: `${width.value}${width.unit}`,
      height: `${height.value}${height.unit}`,
      cursor: mode === 'edit' ? 'move' : 'default',
      outline: isSelected ? '2px solid #2563eb' : undefined,
      outlineOffset: '-2px'
    };

    const contentWrapperStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      overflow: (layer.type === 'text' || layer.type === 'richtext') ? 'hidden' : undefined,
      position: 'relative'
    };

    let content = null;
    
    switch (layer.type) {
      case 'image':
        content = <img src={layer.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt={layer.label} />;
        break;
      case 'text':
      case 'richtext':
        content = <div style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: layer.content }} />;
        break;
      case 'video':
        if (width.value > 0 && height.value > 0) {
          content = <video src={layer.url} controls style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />;
        }
        break;
      case 'button':
        content = (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '14px',
            pointerEvents: 'none'
          }}>
            {layer.text}
          </div>
        );
        break;
    }

    return (
      <div
        key={layer.id}
        style={style}
        onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
        className="group hover:outline hover:outline-2 hover:outline-blue-400"
      >
        <div style={contentWrapperStyle}>
          {content}
        </div>
        {mode === 'edit' && isSelected && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #2563eb',
                borderRadius: '50%',
                cursor: 'nw-resize',
                zIndex: 10
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, layer.id, 'nw')}
            />
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #2563eb',
                borderRadius: '50%',
                cursor: 'ne-resize',
                zIndex: 10
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, layer.id, 'ne')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #2563eb',
                borderRadius: '50%',
                cursor: 'sw-resize',
                zIndex: 10
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, layer.id, 'sw')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #2563eb',
                borderRadius: '50%',
                cursor: 'se-resize',
                zIndex: 10
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, layer.id, 'se')}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Visual Builder</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Edit</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mode === 'preview'}
              onChange={(e) => setMode(e.target.checked ? 'preview' : 'edit')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm text-gray-700">Preview</span>
        </div>
      </div>

      <div className="flex-1 bg-[#d4d4d4] overflow-hidden flex flex-col items-center justify-center" onClick={() => setSelectedLayerId(null)}>
        <div className="flex-1 flex items-center justify-center w-full">
          {mode === 'edit' ? (
            <div
              className="canvas-reset"
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                position: 'relative',
                background: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => {
                e.stopPropagation();
                if (e.target === e.currentTarget) {
                  setSelectedLayerId(null);
                }
              }}
            >
              {snapLines.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    backgroundColor: '#ef4444',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    ...(line.type === 'vertical' 
                      ? { left: `${line.position}px`, top: 0, width: '1px', height: '100%' }
                      : { top: `${line.position}px`, left: 0, height: '1px', width: '100%' }
                    )
                  }}
                />
              ))}
              {layers.map(renderLayer)}
            </div>
          ) : (
            <iframe
              srcDoc={generatePreviewHTML()}
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                border: 0,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              title="Preview"
            />
          )}
        </div>

        <div className="h-24 flex items-center justify-center gap-6 px-4">
          {sampleCanvas.allowedSizes.map(size => {
            const { width, height } = HTML5_AD_SIZES[size];
            const isSelected = selectedSize === size;
            const scale = 0.12;
            
            return (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
                style={{ padding: '8px' }}
              >
                <div
                  style={{
                    width: `${width * scale}px`,
                    height: `${height * scale}px`,
                    border: isSelected ? '2px solid #2563eb' : '2px solid transparent',
                    background: 'white',
                    transition: 'border-color 0.2s',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                />
                <span className="text-xs font-medium text-gray-700">{size}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;