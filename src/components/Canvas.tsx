import React from 'react';
import { type LayerContent, type AdSize } from '../data';
import { COLORS } from '../consts';
import { getGoogleFontsLink } from '../utils/googleFonts';

interface CanvasProps {
  mode: 'edit' | 'preview';
  layers: LayerContent[];
  selectedLayerId: string | null;
  selectedSize: AdSize;
  dimensions: { width: number; height: number };
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
  selectedLayerId,
  selectedSize,
  dimensions,
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

        const style = `position: absolute; left: ${posX.value}${posX.unit || 'px'}; top: ${posY.value}${posY.unit || 'px'}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit}; z-index: ${zIndex};`;

        let content = '';

        switch (layer.type) {
          case 'image':
            content = `<img src="${layer.url}" style="${style} object-fit: cover;" alt="${layer.label}">`;
            break;
          case 'text':
            content = `<div style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'richtext':
            content = `<div style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'video':
            if (width.value > 0 && height.value > 0) {
              const autoplay = layer.properties?.autoplay ? ' autoplay muted' : '';
              const controls = layer.properties?.controls !== false ? ' controls' : '';
              content = `<video src="${layer.url}" style="${style}"${autoplay}${controls}></video>`;
            }
            break;
          case 'button':
            content = `<a href="${layer.url}" target="_blank" style="${style} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;">${layer.text}</a>`;
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
      background: white;
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
</html>`;
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

    const isSelected = selectedLayerId === layer.id;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${posX.value}${posX.unit || 'px'}`,
      top: `${posY.value}${posY.unit || 'px'}`,
      width: `${width.value}${width.unit}`,
      height: `${height.value}${height.unit}`,
      cursor: mode === 'edit' && !layer.locked ? 'move' : 'default',
      outline: isSelected ? `2px solid ${COLORS.BLUE_SELECTED}` : undefined,
      outlineOffset: '-2px',
      zIndex: layers.length - index,
      pointerEvents: layer.locked ? 'none' : 'auto',
    };

    const contentWrapperStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      overflow: layer.type === 'text' || layer.type === 'richtext' ? 'hidden' : undefined,
      position: 'relative',
    };

    let content = null;

    switch (layer.type) {
      case 'image':
        content = (
          <img
            src={layer.url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: (layer.styles?.objectFit as any) || 'cover',
              pointerEvents: 'none',
            }}
            alt={layer.label}
          />
        );
        break;
      case 'text':
      case 'richtext':
        content = (
          <div
            style={{
              pointerEvents: 'none',
              color: layer.styles?.color || '#000000',
              fontSize: layer.styles?.fontSize || '14px',
              fontFamily: layer.styles?.fontFamily || 'Arial',
              textAlign: layer.styles?.textAlign || 'left',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: layer.content }}
          />
        );
        break;
      case 'video':
        if (width.value > 0 && height.value > 0) {
          content = (
            <video
              src={layer.url}
              preload="metadata"
              controls={layer.properties?.controls ?? true}
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          );
        }
        break;
      case 'button':
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: layer.styles?.backgroundColor || '#333333',
              color: layer.styles?.color || '#ffffff',
              fontSize: layer.styles?.fontSize || '14px',
              fontFamily: layer.styles?.fontFamily || 'Arial',
              pointerEvents: 'none',
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
            onLayerMouseDown(e, layer.id);
          }
        }}
        className={layer.locked ? '' : 'group hover:outline hover:outline-2 hover:outline-blue-400'}
      >
        <div style={contentWrapperStyle}>{content}</div>
        {mode === 'edit' && isSelected && !layer.locked ? (
          <>
            {/* Corner handles */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: `2px solid ${COLORS.BLUE_SELECTED}`,
                borderRadius: '50%',
                cursor: 'nw-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'nw')}
            />
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: `2px solid ${COLORS.BLUE_SELECTED}`,
                borderRadius: '50%',
                cursor: 'ne-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'ne')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: `2px solid ${COLORS.BLUE_SELECTED}`,
                borderRadius: '50%',
                cursor: 'sw-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'sw')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: `2px solid ${COLORS.BLUE_SELECTED}`,
                borderRadius: '50%',
                cursor: 'se-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'se')}
            />
            {/* Edge resize areas (invisible) */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: '12px',
                right: '12px',
                height: '8px',
                cursor: 'n-resize',
                zIndex: 9,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'n')}
            />
            <div
              style={{
                position: 'absolute',
                right: '-4px',
                top: '12px',
                bottom: '12px',
                width: '8px',
                cursor: 'e-resize',
                zIndex: 9,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'e')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '12px',
                right: '12px',
                height: '8px',
                cursor: 's-resize',
                zIndex: 9,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 's')}
            />
            <div
              style={{
                position: 'absolute',
                left: '-4px',
                top: '12px',
                bottom: '12px',
                width: '8px',
                cursor: 'w-resize',
                zIndex: 9,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, layer.id, 'w')}
            />
          </>
        ) : null}
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
            background: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onClick={onCanvasClick}
        >
          {snapLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                backgroundColor: COLORS.RED_GUIDELINE,
                pointerEvents: 'none',
                zIndex: 9999,
                ...(line.type === 'vertical'
                  ? { left: `${line.position}px`, top: 0, width: '1px', height: '100%' }
                  : { top: `${line.position}px`, left: 0, height: '1px', width: '100%' }),
              }}
            />
          ))}
          {layers.map((layer, index) => renderLayer(layer, index))}
        </div>
      ) : (
        <iframe
          srcDoc={generatePreviewHTML()}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            border: 0,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
          title="Preview"
        />
      )}
    </div>
  );
};
