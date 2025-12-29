import React from 'react';
import { type LayerContent, type AdSize } from '../data';
import { COLORS } from '../consts';
import { getGoogleFontsLink } from '../utils/googleFonts';

interface CanvasProps {
  mode: 'edit' | 'preview';
  layers: LayerContent[];
  selectedLayerIds: string[];
  selectedSize: AdSize;
  dimensions: { width: number; height: number };
  canvasBackgroundColor?: string;
  isClippingEnabled?: boolean;
  snapLines: Array<{ type: 'horizontal' | 'vertical'; position: number }>;
  onLayerMouseDown: (e: React.MouseEvent, layerId: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, layerId: string, corner: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onCanvasClick: (e: React.MouseEvent) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  mode,
  layers,
  selectedLayerIds,
  selectedSize,
  dimensions,
  canvasBackgroundColor,
  isClippingEnabled = false,
  snapLines,
  onLayerMouseDown,
  onResizeMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onCanvasClick,
}) => {
  const generatePreviewHTML = (): string => {
    const layerElements = layers
      .filter((layer) => {
        // Only render layers that have data for the selected size
        return (
          layer.positionX[selectedSize] &&
          layer.positionY[selectedSize] &&
          layer.width[selectedSize] &&
          layer.height[selectedSize]
        );
      })
      .map((layer, index) => {
        const posX = layer.positionX[selectedSize]!;
        const posY = layer.positionY[selectedSize]!;
        const width = layer.width[selectedSize]!;
        const height = layer.height[selectedSize]!;
        const zIndex = layers.length - index;
        const opacity = layer.styles.opacity;

        const style = `position: absolute; left: ${posX.value}${posX.unit || 'px'}; top: ${posY.value}${posY.unit || 'px'}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit}; z-index: ${zIndex}; opacity: ${opacity};`;

        let content = '';

        switch (layer.type) {
          case 'image':
            content = `<img ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} src="${layer.url}" style="${style} object-fit: ${layer.styles.objectFit || 'cover'};" alt="${layer.label}">`;
            break;
          case 'text':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'richtext':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'video':
            if (width.value > 0 && height.value > 0) {
              const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
              const controls = layer.properties?.controls !== false ? ' controls' : '';
              content = `<video ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} src="${layer.url}" preload="metadata" style="${style}"${autoplay}${controls}></video>`;
            }
            break;
          case 'button':
            content = `<a ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} href="${layer.url}" target="_blank" style="${style} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;">${layer.text}</a>`;
            break;
        }

        return content;
      })
      .join('\n');

    // Collect all font families used in layers
    const fontFamilies = layers.flatMap((layer) => {
      if (
        (layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') &&
        layer.styles?.fontFamily
      ) {
        return [layer.styles.fontFamily];
      }
      return [];
    });
    const googleFontsLink = fontFamilies.length > 0 ? getGoogleFontsLink(fontFamilies) : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${googleFontsLink ? `<link href="${googleFontsLink}" rel="stylesheet">` : ''}
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
              background: ${canvasBackgroundColor || 'white'};
              margin: 0;
              padding: 0;
              user-select: none;
              -webkit-user-select: none;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${layerElements}
        </body>
      </html>
    `;
  };

  const renderLayer = (layer: LayerContent, index: number) => {
    const posX = layer.positionX[selectedSize];
    const posY = layer.positionY[selectedSize];
    const width = layer.width[selectedSize];
    const height = layer.height[selectedSize];

    // Skip rendering if layer doesn't have data for selected size
    if (!posX || !posY || !width || !height) {
      return null;
    }

    const isSelected = selectedLayerIds.includes(layer.id);

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${posX.value}${posX.unit || 'px'}`,
      top: `${posY.value}${posY.unit || 'px'}`,
      width: `${width.value}${width.unit}`,
      height: `${height.value}${height.unit}`,
      cursor: mode === 'edit' && !layer.locked ? 'move' : 'default',
      zIndex: layers.length - index,
      pointerEvents: layer.locked ? 'none' : 'auto',
      opacity: layer.styles?.opacity || 1,
    };

    const contentWrapperClassName = `w-full h-full relative ${
      layer.type === 'text' || layer.type === 'richtext' ? 'overflow-hidden' : ''
    }`.trim();

    let content = null;

    switch (layer.type) {
      case 'image':
        content = (
          <img
            {...(layer.attributes.id && { id: layer.attributes.id })}
            src={layer.url}
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: (layer.styles?.objectFit as any) || 'cover',
            }}
            alt={layer.label}
          />
        );
        break;
      case 'text':
      case 'richtext':
        content = (
          <div
            {...(layer.attributes.id && { id: layer.attributes.id })}
            className="pointer-events-none whitespace-pre-wrap"
            style={{
              color: layer.styles?.color || '#000000',
              fontSize: layer.styles?.fontSize || '14px',
              fontFamily: layer.styles?.fontFamily || 'Arial',
              textAlign: layer.styles?.textAlign || 'left',
            }}
            dangerouslySetInnerHTML={{ __html: layer.content }}
          />
        );
        break;
      case 'video':
        if (width.value > 0 && height.value > 0) {
          content = (
            <video
              {...(layer.attributes.id && { id: layer.attributes.id })}
              src={layer.url}
              muted={true}
              playsInline={true}
              preload="auto"
              className="w-full h-full pointer-events-none"
              onLoadedMetadata={(e) => {
                // Show first frame by loading video then immediately pausing
                const video = e.currentTarget;
                video.currentTime = 0.1;
                video.pause();
              }}
              onError={(e) => {
                console.error('Video load error:', e);
              }}
            />
          );
        }
        break;
      case 'button':
        content = (
          <div
            {...(layer.attributes.id && { id: layer.attributes.id })}
            className="w-full h-full flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: layer.styles?.backgroundColor || '#333333',
              color: layer.styles?.color || '#ffffff',
              fontSize: layer.styles?.fontSize || '14px',
              fontFamily: layer.styles?.fontFamily || 'Arial',
            }}
          >
            {layer.text}
          </div>
        );
        break;
    }

    return (
      <div
        key={layer.id}
        style={style}
        onMouseDown={(e) => {
          if (!layer.locked) {
            // Clear any hover states from all elements before handling click
            document.querySelectorAll('[data-layer-hover]').forEach((el) => {
              (el as HTMLElement).style.outline = '';
              (el as HTMLElement).style.outlineOffset = '';
            });
            onLayerMouseDown(e, layer.id);
          }
        }}
        className={
          !layer.locked && !isSelected
            ? 'group hover:outline hover:outline-2 hover:outline-blue-400'
            : ''
        }
        data-layer-hover={!layer.locked && !isSelected ? 'true' : undefined}
        onMouseEnter={(e) => {
          if (!layer.locked && !isSelected) {
            (e.currentTarget as HTMLElement).style.outline = '2px solid rgba(59, 130, 246, 0.5)';
            (e.currentTarget as HTMLElement).style.outlineOffset = '-2px';
          }
        }}
        onMouseLeave={(e) => {
          if (!layer.locked && !isSelected) {
            (e.currentTarget as HTMLElement).style.outline = '';
            (e.currentTarget as HTMLElement).style.outlineOffset = '';
          }
        }}
      >
        <div className={contentWrapperClassName}>{content}</div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full">
      {mode === 'edit' ? (
        <div
          className="canvas-reset"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            position: 'relative',
            background: canvasBackgroundColor || 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            overflow: isClippingEnabled ? 'hidden' : 'visible',
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onClick={onCanvasClick}
        >
          {snapLines.map((line, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none z-[9999]"
              style={{
                backgroundColor: COLORS.RED_GUIDELINE,
                ...(line.type === 'vertical'
                  ? { left: `${line.position}px`, top: 0, width: '1px', height: '100%' }
                  : { top: `${line.position}px`, left: 0, height: '1px', width: '100%' }),
              }}
            />
          ))}
          {layers.map((layer, index) => renderLayer(layer, index))}
          {/* Selection outline overlay - rendered on top of all layers */}
          {selectedLayerIds.length > 0 &&
            (() => {
              // Calculate unified bounding box for all selected layers
              const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id) && !l.locked);
              if (selectedLayers.length === 0) return null;

              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

              selectedLayers.forEach(layer => {
                const posX = layer.positionX[selectedSize];
                const posY = layer.positionY[selectedSize];
                const width = layer.width[selectedSize];
                const height = layer.height[selectedSize];

                if (!posX || !posY || !width || !height) return;

                // Convert to pixels if using percentage
                const x = posX.unit === '%' ? (posX.value / 100) * dimensions.width : posX.value;
                const y = posY.unit === '%' ? (posY.value / 100) * dimensions.height : posY.value;
                const w = width.unit === '%' ? (width.value / 100) * dimensions.width : width.value;
                const h = height.unit === '%' ? (height.value / 100) * dimensions.height : height.value;

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + w);
                maxY = Math.max(maxY, y + h);
              });

              if (minX === Infinity) return null;

              const boundingWidth = maxX - minX;
              const boundingHeight = maxY - minY;

              // For single selection, show resize handles. For multi-select, just the bounding box
              const showResizeHandles = selectedLayerIds.length === 1;

              return (
                <>
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${minX}px`,
                      top: `${minY}px`,
                      width: `${boundingWidth}px`,
                      height: `${boundingHeight}px`,
                      outline: `2px solid ${COLORS.BLUE_SELECTED}`,
                      outlineOffset: '-2px',
                      zIndex: 999,
                    }}
                  />
                  {/* Resize handles - only for single selection */}
                  {showResizeHandles ? (
                    <div
                      className="absolute"
                      style={{
                        left: `${minX}px`,
                        top: `${minY}px`,
                        width: `${boundingWidth}px`,
                        height: `${boundingHeight}px`,
                        zIndex: 999,
                        pointerEvents: 'none',
                      }}
                    >
                      {/* Corner handles */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nw-resize"
                        style={{
                          border: `2px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'nw')}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-ne-resize"
                        style={{
                          border: `2px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'ne')}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-sw-resize"
                        style={{
                          border: `2px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'sw')}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-se-resize"
                        style={{
                          border: `2px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'se')}
                      />
                      {/* Edge resize areas (invisible) */}
                      <div
                        className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'n')}
                      />
                      <div
                        className="absolute -right-1 top-3 bottom-3 w-2 cursor-e-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'e')}
                      />
                      <div
                        className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 's')}
                      />
                      <div
                        className="absolute -left-1 top-3 bottom-3 w-2 cursor-w-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'w')}
                      />
                    </div>
                  ): null}
                </>
              );
            })()}
        </div>
      ) : (
        <iframe
          srcDoc={generatePreviewHTML()}
          className="border-0 shadow-md"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
          title="Preview"
        />
      )}
    </div>
  );
};
