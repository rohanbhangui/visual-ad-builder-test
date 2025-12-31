import React from 'react';
import { type LayerContent, type AdSize } from '../data';
import { COLORS } from '../consts';
import { getGoogleFontsLink } from '../utils/googleFonts';
import SettingsIcon from '../assets/icons/settings.svg?react';
import PlayIcon from '../assets/icons/play.svg?react';
import PauseIcon from '../assets/icons/pause.svg?react';
import ReplayIcon from '../assets/icons/replay.svg?react';
import PlayFilledIcon from '../assets/icons/play-filled.svg?react';
import PauseFilledIcon from '../assets/icons/pause-filled.svg?react';

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
  animationResetDuration?: { value: number; unit: 'ms' | 's' }; // Duration to wait after reset before restarting
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
  animationResetDuration = { value: 1, unit: 's' as const },
}) => {
  const generatePreviewHTML = (): string => {
    // Calculate cycle timing for keyframes (needed for layer mapping)
    const loopTimeMs = animationLoopDelay.unit === 's' ? animationLoopDelay.value * 1000 : animationLoopDelay.value;
    const resetDelayMs = animationResetDuration.unit === 's' ? animationResetDuration.value * 1000 : animationResetDuration.value;
    const totalCycleTime = loopTimeMs + resetDelayMs; // in ms
    
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
        
        // Check if properties are animated
        const hasOpacityAnimation = animations.some(a => a.type === 'fadeIn');
        
        // Calculate iteration count: -1 = infinite, 0 = run once (no loop), >0 = that many times
        const iterationCount = animationLoop === -1 ? 'infinite' : (animationLoop === 0 ? '1' : animationLoop.toString());
        
        // Use totalCycleTime as duration, keyframes handle internal timing including delay
        const animationStyle = animations.length > 0 && animationLoop !== 0
          ? `animation: ${animations.map(anim => 
              `anim-${layer.id}-${anim.id} ${totalCycleTime}ms linear 0s ${iterationCount} normal both`
            ).join(', ')};`
          : '';

        // Build style, excluding animated properties
        const opacityStyle = !hasOpacityAnimation ? `opacity: ${opacity};` : '';
        const style = `position: absolute; left: ${posX.value}${posX.unit || 'px'}; top: ${posY.value}${posY.unit || 'px'}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit}; z-index: ${zIndex}; ${opacityStyle} ${animationStyle}`;

        let content = '';

        switch (layer.type) {
          case 'image':
            content = `<img ${layer.attributes.id ? `id="${layer.attributes.id}"` : `id="a${layer.id}"`} src="${layer.url}" style="${style} object-fit: ${layer.styles.objectFit || 'cover'};" alt="${layer.label}">`;
            break;
          case 'text':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : `id="a${layer.id}"`} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'richtext':
            content = `<div ${layer.attributes.id ? `id="${layer.attributes.id}"` : `id="a${layer.id}"`} style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
            break;
          case 'video':
            if (width.value > 0 && height.value > 0) {
              const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
              const controls = layer.properties?.controls !== false ? ' controls' : '';
              content = `<video ${layer.attributes.id ? `id="${layer.attributes.id}"` : `id="a${layer.id}"`} src="${layer.url}" preload="metadata" style="${style}"${autoplay}${controls}></video>`;
            }
            break;
          case 'button': {
            const icon = layer.icon || { type: 'none', position: 'before' };
            const iconSize = config.iconSize || 24;
            const iconColor = icon.color || layer.styles?.color || '#ffffff';
            
            let iconHtml = '';
            let isToggleIcon = false;
            
            if (icon.type === 'play') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            } else if (icon.type === 'pause') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
            } else if (icon.type === 'replay') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
            } else if (icon.type === 'play-fill') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            } else if (icon.type === 'pause-fill') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`;
            } else if (icon.type === 'toggle-filled' || icon.type === 'toggle-outline') {
              isToggleIcon = true;
              // Find target video to check autoplay status
              const targetVideo = layer.actionType === 'videoControl' && layer.videoControl?.targetElementId
                ? layers.find(l => l.type === 'video' && l.attributes?.id === layer.videoControl?.targetElementId)
                : null;
              const hasAutoplay = targetVideo && targetVideo.type === 'video' && targetVideo.properties?.autoplay;
              
              // Generate both play and pause icons
              const isFilled = icon.type === 'toggle-filled';
              const playIcon = isFilled
                ? `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
                : `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
              const pauseIcon = isFilled
                ? `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
                : `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
              
              // Show pause icon if autoplay is on, play icon if off
              const initialIcon = hasAutoplay ? pauseIcon : playIcon;
              iconHtml = `<span class="btn-icon" data-play-icon="${playIcon.replace(/"/g, '&quot;')}" data-pause-icon="${pauseIcon.replace(/"/g, '&quot;')}">${initialIcon}</span>`;
            } else if (icon.type === 'toggle-custom') {
              isToggleIcon = true;
              // Find target video to check autoplay status
              const targetVideo = layer.actionType === 'videoControl' && layer.videoControl?.targetElementId
                ? layers.find(l => l.type === 'video' && l.attributes?.id === layer.videoControl?.targetElementId)
                : null;
              const hasAutoplay = targetVideo && targetVideo.type === 'video' && targetVideo.properties?.autoplay;
              
              const playImg = icon.customPlayImage ? `<img src="${icon.customPlayImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />` : '';
              const pauseImg = icon.customPauseImage ? `<img src="${icon.customPauseImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />` : '';
              
              // Show pause image if autoplay is on, play image if off
              const initialIcon = (hasAutoplay && pauseImg) ? pauseImg : playImg;
              iconHtml = `<span class="btn-icon" data-play-icon="${playImg.replace(/"/g, '&quot;')}" data-pause-icon="${pauseImg.replace(/"/g, '&quot;')}">${initialIcon}</span>`;
            } else if (icon.type === 'custom' && icon.customImage) {
              iconHtml = `<img src="${icon.customImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />`;
            }
            
            const hasText = layer.text && layer.text.trim().length > 0;
            const hasIcon = icon.type !== 'none' && iconHtml;
            const gap = hasText && hasIcon ? '6px' : '0';
            
            let contentHtml = '';
            if (hasIcon && hasText) {
              contentHtml = icon.position === 'before' 
                ? `${iconHtml}<span style="margin-left: ${gap};">${layer.text}</span>`
                : `<span style="margin-right: ${gap};">${layer.text}</span>${iconHtml}`;
            } else if (hasIcon) {
              contentHtml = iconHtml;
            } else {
              contentHtml = layer.text;
            }
            
            const baseStyle = `${style} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; font-size: ${config.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer; border: none;`;
            
            // Use button for video controls, anchor for links
            if (layer.actionType === 'videoControl' && layer.videoControl) {
              const iconToggleLogic = isToggleIcon ? ` setTimeout(() => { const iconEl = this.querySelector('.btn-icon'); if (iconEl) { iconEl.innerHTML = v.paused ? iconEl.dataset.playIcon : iconEl.dataset.pauseIcon; } }, 0);` : '';
              const onclickHandler = `const v = document.getElementById('${layer.videoControl.targetElementId}'); if (v) { ${
                layer.videoControl.action === 'play' ? `v.play();${iconToggleLogic}` :
                layer.videoControl.action === 'pause' ? `v.pause();${iconToggleLogic}` :
                layer.videoControl.action === 'restart' ? `v.currentTime = 0; v.play();${iconToggleLogic}` :
                `if (v.paused) { v.play(); } else { v.pause(); }${iconToggleLogic}`
              } }`;
              
              content = `<button ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} onclick="${onclickHandler}" style="${baseStyle}">${contentHtml}</button>`;
            } else {
              const href = layer.actionType === 'link' ? layer.url : '#';
              const target = layer.actionType === 'link' ? ' target="_blank"' : '';
              content = `<a ${layer.attributes.id ? `id="${layer.attributes.id}"` : ''} href="${href}"${target} style="${baseStyle} text-decoration: none;">${contentHtml}</a>`;
            }
            break;
          }
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

    // Generate CSS keyframes and initial states for animations
    const animationKeyframes: string[] = [];
    const initialAnimationStates: string[] = [];
    
    layers.forEach((layer) => {
      const config = layer.sizeConfig[selectedSize];
      const animations = config?.animations;
      
      if (!animations || animations.length === 0 || animationLoop === 0) return;
      
      // Calculate keyframe percentages
      const resetStartPercent = (loopTimeMs / totalCycleTime) * 100;
      
      // Generate initial state CSS for elements with animations
      const layerId = layer.attributes.id || layer.id;
      const initialStates: string[] = [];
      animations.forEach((animation) => {
        switch (animation.type) {
          case 'fadeIn':
            initialStates.push(`opacity: ${animation.from ?? 0}`);
            break;
          case 'slideLeft':
            initialStates.push(`transform: translateX(${animation.from ?? '100%'})`);
            break;
          case 'slideRight':
            initialStates.push(`transform: translateX(${animation.from ?? '-100%'})`);
            break;
          case 'slideUp':
            initialStates.push(`transform: translateY(${animation.from ?? '100%'})`);
            break;
          case 'slideDown':
            initialStates.push(`transform: translateY(${animation.from ?? '-100%'})`);
            break;
          case 'scale':
            initialStates.push(`transform: scale(${animation.from ?? 0})`);
            break;
          case 'custom': {
            const prop = animation.property || 'opacity';
            initialStates.push(`${prop}: ${animation.from ?? 0}`);
            break;
          }
        }
      });
      if (initialStates.length > 0) {
        const selector = layerId ? `#${layerId}` : `[data-layer-id="${layer.id}"]`;
        initialAnimationStates.push(`${selector} { ${initialStates.join('; ')}; }`);
      }
      
      animations.forEach((animation) => {
        const duration = animation.duration.unit === 's' ? animation.duration.value * 1000 : animation.duration.value;
        const delay = animation.delay.unit === 's' ? animation.delay.value * 1000 : animation.delay.value;
        const animStartPercent = (delay / totalCycleTime) * 100;
        const animEndPercent = ((delay + duration) / totalCycleTime) * 100;
        
        let keyframes = '';
        let fromValue = '';
        let toValue = '';
        
        switch (animation.type) {
          case 'fadeIn':
            fromValue = `opacity: ${animation.from ?? 0}`;
            toValue = `opacity: ${animation.to ?? layer.styles.opacity ?? 1}`;
            break;
          case 'slideLeft':
            fromValue = `transform: translateX(${animation.from ?? '100%'})`;
            toValue = `transform: translateX(${animation.to ?? '0%'})`;
            break;
          case 'slideRight':
            fromValue = `transform: translateX(${animation.from ?? '-100%'})`;
            toValue = `transform: translateX(${animation.to ?? '0%'})`;
            break;
          case 'slideUp':
            fromValue = `transform: translateY(${animation.from ?? '100%'})`;
            toValue = `transform: translateY(${animation.to ?? '0%'})`;
            break;
          case 'slideDown':
            fromValue = `transform: translateY(${animation.from ?? '-100%'})`;
            toValue = `transform: translateY(${animation.to ?? '0%'})`;
            break;
          case 'scale':
            fromValue = `transform: scale(${animation.from ?? 0})`;
            toValue = `transform: scale(${animation.to ?? 1})`;
            break;
          case 'custom': {
            const prop = animation.property || 'opacity';
            fromValue = `${prop}: ${animation.from ?? 0}`;
            toValue = `${prop}: ${animation.to ?? 1}`;
            break;
          }
        }
        
        if (fromValue && toValue) {
          // Option B: 0% = from, delay% = hold from, delay+duration% = to, loopTime% = hold to, then snap back
          keyframes = `@keyframes anim-${layer.id}-${animation.id} {
            0% { ${fromValue}; }
            ${animStartPercent.toFixed(4)}% { ${fromValue}; }
            ${animEndPercent.toFixed(4)}% { ${toValue}; }
            ${resetStartPercent.toFixed(4)}% { ${toValue}; }
            ${(resetStartPercent + 0.01).toFixed(4)}% { ${fromValue}; }
            100% { ${fromValue}; }
          }`;
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
            ${initialAnimationStates.join('\n            ')}
            ${animationKeyframes.join('\n')}
          </style>
        </head>
        <body>
          ${layerElements}
          <script>
            // No JavaScript timing needed - CSS keyframes handle the full loop cycle!
            console.log('🎬 Animation system initialized with CSS-only looping');
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
      case 'button': {
        const icon = layer.icon || { type: 'none', position: 'before' };
        const iconSize = config.iconSize || 24;
        const iconColor = icon.color || layer.styles?.color || '#ffffff';
        
        let iconElement: React.ReactNode = null;
        if (icon.type === 'play') {
          iconElement = <PlayIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />;
        } else if (icon.type === 'pause') {
          iconElement = <PauseIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />;
        } else if (icon.type === 'replay') {
          iconElement = <ReplayIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />;
        } else if (icon.type === 'play-fill') {
          iconElement = <PlayFilledIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />;
        } else if (icon.type === 'pause-fill') {
          iconElement = <PauseFilledIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />;
        } else if (icon.type === 'toggle-filled') {
          // Show play or pause icon based on toggle state (defaulting to play)
          const isPaused = false;
          iconElement = isPaused ? (
            <PauseFilledIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />
          ) : (
            <PlayFilledIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />
          );
        } else if (icon.type === 'toggle-outline') {
          // Show play or pause icon based on toggle state (defaulting to play)
          const isPaused = false;
          iconElement = isPaused ? (
            <PauseIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />
          ) : (
            <PlayIcon width={iconSize} height={iconSize} style={{ color: iconColor }} />
          );
        } else if (icon.type === 'toggle-custom') {
          // Show play or pause image based on toggle state (defaulting to play)
          const isPaused = false;
          const imageSrc = isPaused ? icon.customPauseImage : icon.customPlayImage;
          if (imageSrc) {
            iconElement = <img src={imageSrc} width={iconSize} height={iconSize} alt="" style={{ objectFit: 'contain' }} />;
          }
        } else if (icon.type === 'custom' && icon.customImage) {
          iconElement = <img src={icon.customImage} width={iconSize} height={iconSize} alt="" style={{ objectFit: 'contain' }} />;
        }
        
        const hasText = layer.text && layer.text.trim().length > 0;
        const hasIcon = icon.type !== 'none' && iconElement;
        
        content = (
          <div
            {...(layer.attributes.id && { id: layer.attributes.id })}
            className="w-full h-full flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: layer.styles?.backgroundColor || '#333333',
              color: layer.styles?.color || '#ffffff',
              fontSize: config.fontSize || '14px',
              fontFamily: layer.styles?.fontFamily || 'Arial',
              gap: hasText && hasIcon ? '6px' : '0',
            }}
          >
            {hasIcon && hasText && icon.position === 'before' ? iconElement : null}
            {hasText ? <span>{layer.text}</span> : null}
            {hasIcon && hasText && icon.position === 'after' ? iconElement : null}
            {hasIcon && !hasText ? iconElement : null}
          </div>
        );
        break;
      }
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
