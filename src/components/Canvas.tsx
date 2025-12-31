import React from 'react';
import { type LayerContent, type AdSize } from '../data';
import { COLORS } from '../consts';
import { getGoogleFontsLink } from '../utils/googleFonts';
import SettingsIcon from '../assets/icons/settings.svg?react';

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
  zoom?: number;
  pan?: { x: number; y: number };
  onCanvasSettingsClick?: () => void;
  isSpacePressed?: boolean;
  isPanning?: boolean;
  animationKey?: number; // Key to force iframe reload for replay
  animationLoop?: number; // 0 = no loop, -1 = infinite, >0 = loop X times
  animationLoopDelay?: { value: number; unit: 'ms' | 's' }; // Delay between loop iterations
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
  zoom = 1,
  pan = { x: 0, y: 0 },
  onCanvasSettingsClick,
  isSpacePressed = false,
  isPanning = false,
  animationKey = 0,
  animationLoop = 0,
  animationLoopDelay = { value: 0, unit: 's' as const },
}) => {
  const generatePreviewHTML = (): string => {
    // Calculate loop time in milliseconds for the script
    const loopTimeMs = animationLoopDelay.unit === 's' ? animationLoopDelay.value * 1000 : animationLoopDelay.value;
    
    const layerElements = layers
      .filter((layer) => {
        // Only render layers that have data for the selected size
        const config = layer.sizeConfig[selectedSize];
        return !!config;
      })
      .map((layer, index) => {
        const config = layer.sizeConfig[selectedSize]!;
        const posX = config.positionX;
        const posY = config.positionY;
        const width = config.width;
        const height = config.height;
        const zIndex = layers.length - index;
        const opacity = layer.styles.opacity;
        
        // Get animations for this size
        const animations = config.animations || [];
        // Always set iteration count to 1, JS will handle looping
        const animationStyle = animations.length > 0
          ? `animation: ${animations.map(anim => 
              `anim-${layer.id}-${anim.id} ${anim.duration.value}${anim.duration.unit} ${anim.easing} ${anim.delay.value}${anim.delay.unit} 1 forwards`
            ).join(', ')};`
          : '';

        const style = `position: absolute; left: ${posX.value}${posX.unit || 'px'}; top: ${posY.value}${posY.unit || 'px'}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit}; z-index: ${zIndex}; opacity: ${opacity}; ${animationStyle}`;

        let content = '';

        switch (layer.type) {
          case 'image':
            content = `<img ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} src="${layer.url}" style="${style} object-fit: ${layer.styles.objectFit || 'cover'};" alt="${layer.label}">`;
            break;
          case 'text':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'richtext':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'video':
            if (width.value > 0 && height.value > 0) {
              const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
              const controls = layer.properties?.controls !== false ? ' controls' : '';
              content = `<video ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} src="${layer.url}" preload="metadata" style="${style}"${autoplay}${controls}></video>`;
            }
            break;
          case 'button':
            content = `<a ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} href="${layer.url}" target="_blank" style="${style} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;">${layer.text}</a>`;
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

    // Generate CSS keyframes for animations
    const animationKeyframes: string[] = [];
    
    layers.forEach((layer) => {
      const config = layer.sizeConfig[selectedSize];
      const animations = config?.animations;
      
      if (!animations || animations.length === 0) return;
      
      animations.forEach((animation) => {
        let keyframes = '';
        
        switch (animation.type) {
          case 'fadeIn':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { opacity: ${animation.from ?? 0}; }
              to { opacity: ${animation.to ?? 1}; }
            }`;
            break;
          case 'slideLeft':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { transform: translateX(${animation.from ?? '100%'}); }
              to { transform: translateX(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideRight':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { transform: translateX(${animation.from ?? '-100%'}); }
              to { transform: translateX(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideUp':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { transform: translateY(${animation.from ?? '100%'}); }
              to { transform: translateY(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideDown':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { transform: translateY(${animation.from ?? '-100%'}); }
              to { transform: translateY(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'scale':
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { transform: scale(${animation.from ?? 0}); }
              to { transform: scale(${animation.to ?? 1}); }
            }`;
            break;
          case 'custom': {
            // For custom animations, use the property specified
            const prop = animation.property || 'opacity';
            keyframes = `@keyframes anim-${layer.id}-${animation.id} {
              from { ${prop}: ${animation.from ?? 0}; }
              to { ${prop}: ${animation.to ?? 1}; }
            }`;
            break;
          }
        }
        
        if (keyframes) {
          animationKeyframes.push(keyframes);
        }
      });
    });

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
            ${animationKeyframes.join('\n')}
          </style>
        </head>
        <body>
          ${layerElements}
          <script>
            (function() {
              const loopCount = ${animationLoop};
              const totalLoopTime = ${loopTimeMs};
              
              if (loopCount === 0) return; // No looping
              
              let currentLoop = 0;
              
              // Find all elements with animations
              const animatedElements = Array.from(document.querySelectorAll('[style*="animation"]'));
              if (animatedElements.length === 0) return;
              
              // Track which elements have completed all their animations in this cycle
              const completedElements = new Set();
              const elementAnimCounts = new Map();
              const elementAnimEndCounts = new Map();
              const maxAnimationDuration = new Map();
              
              // Setup: count animations per element and calculate max duration
              animatedElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const animationNames = style.animationName.split(',').filter(n => n.trim() !== 'none');
                const durations = style.animationDuration.split(',').map(d => parseFloat(d) * 1000);
                const delays = style.animationDelay.split(',').map(d => parseFloat(d) * 1000);
                
                elementAnimCounts.set(el, animationNames.length);
                elementAnimEndCounts.set(el, 0);
                
                // Calculate max (duration + delay) for this element
                let maxDuration = 0;
                for (let i = 0; i < animationNames.length; i++) {
                  const totalDuration = (durations[i] || 0) + (delays[i] || 0);
                  maxDuration = Math.max(maxDuration, totalDuration);
                }
                maxAnimationDuration.set(el, maxDuration);
              });
              
              // Calculate the longest animation across all elements
              let globalMaxDuration = 0;
              maxAnimationDuration.forEach(duration => {
                globalMaxDuration = Math.max(globalMaxDuration, duration);
              });
              
              function restartAllAnimations() {
                animatedElements.forEach(el => {
                  const currentStyle = el.style.animation;
                  el.style.animation = 'none';
                  void el.offsetHeight; // Force reflow
                  el.style.animation = currentStyle;
                });
                
                // Reset tracking
                completedElements.clear();
                elementAnimEndCounts.forEach((_, key) => {
                  elementAnimEndCounts.set(key, 0);
                });
              }
              
              function checkAllComplete() {
                // Check if all elements have completed all their animations
                if (completedElements.size === animatedElements.length) {
                  currentLoop++;
                  
                  // Check if we should continue looping
                  const shouldContinue = loopCount === -1 || currentLoop < loopCount;
                  
                  if (shouldContinue) {
                    // Wait for the remaining time in the loop cycle
                    // If animations took longer than totalLoopTime, wait at least 100ms
                    const pauseDuration = Math.max(100, totalLoopTime - globalMaxDuration);
                    setTimeout(restartAllAnimations, pauseDuration);
                  }
                }
              }
              
              // Listen to animationend on all animated elements
              animatedElements.forEach(el => {
                el.addEventListener('animationend', function(e) {
                  const totalAnims = elementAnimCounts.get(el);
                  const currentEndCount = elementAnimEndCounts.get(el) + 1;
                  elementAnimEndCounts.set(el, currentEndCount);
                  
                  // Only mark as complete when ALL animations on this element have ended
                  if (currentEndCount >= totalAnims) {
                    completedElements.add(el);
                    checkAllComplete();
                  }
                });
              });
            })();
          </script>
        </body>
      </html>
    `;
  };

  const renderLayer = (layer: LayerContent, index: number) => {
    const config = layer.sizeConfig[selectedSize];

    // Skip rendering if layer doesn't have data for selected size
    if (!config) {
      return null;
    }

    const posX = config.positionX;
    const posY = config.positionY;
    const width = config.width;
    const height = config.height;

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
              objectFit: (layer.styles?.objectFit || 'cover') as React.CSSProperties['objectFit'],
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
              fontSize: config.fontSize || '14px',
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
              fontSize: config.fontSize || '14px',
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
          if (!layer.locked && !isSpacePressed && !isPanning) {
            // Clear any hover states from all elements before handling click
            document.querySelectorAll('[data-layer-hover]').forEach((el) => {
              (el as HTMLElement).style.outline = '';
              (el as HTMLElement).style.outlineOffset = '';
            });
            onLayerMouseDown(e, layer.id);
          }
        }}
        className={
          !layer.locked && !isSelected && !isSpacePressed && !isPanning
            ? 'group hover:outline hover:outline-2 hover:outline-blue-400'
            : ''
        }
        data-layer-hover={!layer.locked && !isSelected && !isSpacePressed && !isPanning ? 'true' : undefined}
        onMouseEnter={(e) => {
          if (!layer.locked && !isSelected && !isSpacePressed && !isPanning) {
            (e.currentTarget as HTMLElement).style.outline = '2px solid rgba(59, 130, 246, 0.5)';
            (e.currentTarget as HTMLElement).style.outlineOffset = '-2px';
          }
        }}
        onMouseLeave={(e) => {
          if (!layer.locked && !isSelected && !isSpacePressed && !isPanning) {
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
    <div 
      className="flex-1 flex items-center justify-center w-full" 
      data-canvas-container
      style={{ 
        cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
      }}
    >
      {mode === 'edit' ? (
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'none',
          }}
        >
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
          {mode === 'edit' && onCanvasSettingsClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCanvasSettingsClick();
              }}
              className="absolute flex items-center gap-1 text-gray-400 hover:text-gray-900 hover:underline cursor-pointer bg-transparent"
              style={{
                top: `${-23/zoom}px`,
                right: `${-5/zoom}px`,
                padding: '2px 4px',
                fontSize: '12px',
                transform: `scale(${1/zoom})`,
                transformOrigin: 'top right',
                border: 'none'
              }}
              title="Canvas Settings"
            >
              <SettingsIcon style={{ width: '14px', height: '14px' }} />
              <span>Canvas</span>
            </button>
          ) : null}
          {snapLines.map((line, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none z-[9999]"
              style={{
                backgroundColor: COLORS.RED_GUIDELINE,
                ...(line.type === 'vertical'
                  ? { left: `${line.position}px`, top: 0, width: `${1/zoom}px`, height: '100%' }
                  : { top: `${line.position}px`, left: 0, height: `${1/zoom}px`, width: '100%' }),
              }}
            />
          ))}
          {layers.map((layer, index) => renderLayer(layer, index))}
          {/* Selection outline overlay - rendered on top of all layers */}
          {selectedLayerIds.length > 0 ?
            (() => {
              // Calculate unified bounding box for all selected layers
              const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id) && !l.locked);
              if (selectedLayers.length === 0) return null;

              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

              selectedLayers.forEach(layer => {
                const config = layer.sizeConfig[selectedSize];
                if (!config) return;

                const posX = config.positionX;
                const posY = config.positionY;
                const width = config.width;
                const height = config.height;

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
                      outline: `${2/zoom}px solid ${COLORS.BLUE_SELECTED}`,
                      outlineOffset: `${-2/zoom}px`,
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
                        className="absolute bg-white rounded-full cursor-nw-resize"
                        style={{
                          top: `${-6/zoom}px`,
                          left: `${-6/zoom}px`,
                          width: `${12/zoom}px`,
                          height: `${12/zoom}px`,
                          border: `${2/zoom}px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'nw')}
                      />
                      <div
                        className="absolute bg-white rounded-full cursor-ne-resize"
                        style={{
                          top: `${-6/zoom}px`,
                          right: `${-6/zoom}px`,
                          width: `${12/zoom}px`,
                          height: `${12/zoom}px`,
                          border: `${2/zoom}px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'ne')}
                      />
                      <div
                        className="absolute bg-white rounded-full cursor-sw-resize"
                        style={{
                          bottom: `${-6/zoom}px`,
                          left: `${-6/zoom}px`,
                          width: `${12/zoom}px`,
                          height: `${12/zoom}px`,
                          border: `${2/zoom}px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'sw')}
                      />
                      <div
                        className="absolute bg-white rounded-full cursor-se-resize"
                        style={{
                          bottom: `${-6/zoom}px`,
                          right: `${-6/zoom}px`,
                          width: `${12/zoom}px`,
                          height: `${12/zoom}px`,
                          border: `${2/zoom}px solid ${COLORS.BLUE_SELECTED}`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'se')}
                      />
                      {/* Edge resize areas (invisible) */}
                      <div
                        className="absolute cursor-n-resize"
                        style={{
                          top: `${-4/zoom}px`,
                          left: `${12/zoom}px`,
                          right: `${12/zoom}px`,
                          height: `${8/zoom}px`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'n')}
                      />
                      <div
                        className="absolute cursor-e-resize"
                        style={{
                          right: `${-4/zoom}px`,
                          top: `${12/zoom}px`,
                          bottom: `${12/zoom}px`,
                          width: `${8/zoom}px`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'e')}
                      />
                      <div
                        className="absolute cursor-s-resize"
                        style={{
                          bottom: `${-4/zoom}px`,
                          left: `${12/zoom}px`,
                          right: `${12/zoom}px`,
                          height: `${8/zoom}px`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 's')}
                      />
                      <div
                        className="absolute cursor-w-resize"
                        style={{
                          left: `${-4/zoom}px`,
                          top: `${12/zoom}px`,
                          bottom: `${12/zoom}px`,
                          width: `${8/zoom}px`,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => onResizeMouseDown(e, selectedLayerIds[0], 'w')}
                      />
                    </div>
                  ): null}
                </>
              );
            })() : null}
        </div>
        </div>
      ) : (
        <iframe
          key={animationKey}
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
