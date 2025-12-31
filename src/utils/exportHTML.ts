import { type LayerContent, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';
import { getGoogleFontsLink } from './googleFonts';

export const generateResponsiveHTML = (
  layers: LayerContent[],
  allowedSizes: AdSize[],
  backgroundColor: string = '#ffffff',
  animationLoop: number = 0
): string => {
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

  // Get loop timing from first layer's config for the first size
  const firstSize = allowedSizes[0];
  const firstLayerConfigForTiming = layers[0]?.sizeConfig[firstSize];
  const loopDelayForScript = firstLayerConfigForTiming?.animationLoopDelay || { value: 5, unit: 's' as const };
  const resetDurationForScript = firstLayerConfigForTiming?.animationResetDuration || { value: 1, unit: 's' as const };
  const loopTimeMs = loopDelayForScript.unit === 's' ? loopDelayForScript.value * 1000 : loopDelayForScript.value;
  const resetDelayMs = resetDurationForScript.unit === 's' ? resetDurationForScript.value * 1000 : resetDurationForScript.value;

  // Generate single set of layer elements
  const generateLayerElements = (): string => {
    return layers
      .map((layer, index) => {
        const zIndex = layers.length - index;
        const opacity = layer.styles.opacity;
        
        // Use attributes.id if set, otherwise fall back to UUID
        const layerId = layer.attributes.id || layer.id;
        
        // Check if opacity is animated in any size config
        const hasOpacityAnimation = Object.values(layer.sizeConfig).some(config => 
          config?.animations?.some(a => a.type === 'fadeIn')
        );

        // Base styles that don't change - exclude opacity if it's animated
        const opacityStyle = !hasOpacityAnimation ? ` opacity: ${opacity};` : '';
        const baseStyle = `position: absolute; z-index: ${zIndex};${opacityStyle}`;

        let content = '';
        let additionalStyles = '';

        switch (layer.type) {
          case 'image': {
            // Width/height will be set via CSS for each size
            additionalStyles = `object-fit: ${layer.styles.objectFit || 'cover'};`;
            content = `<img id="${layerId}" src="${layer.url}" style="${baseStyle} ${additionalStyles}" alt="${layer.label}">`;
            break;
          }
          case 'text':
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'}; white-space: pre-wrap;`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'richtext':
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'video': {
            const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
            const controls = layer.properties?.controls !== false ? ' controls' : '';
            content = `<video id="${layerId}" src="${layer.url}" style="${baseStyle}"${autoplay}${controls}></video>`;
            break;
          }
          case 'button': {
            const icon = layer.icon || { type: 'none', position: 'before' };
            // Use a default icon size since export HTML doesn't have specific config access here
            // Actual size will be set per ad size in CSS
            const iconSize = 24;
            const iconColor = icon.color || layer.styles?.color || '#ffffff';
            
            // For toggle icons, generate both play and pause SVGs
            const playIconFilled = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            const pauseIconFilled = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
            const playIconOutline = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            const pauseIconOutline = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
            
            let iconHtml = '';
            let isToggleIcon = false;
            let toggleIconData = '';
            
            if (icon.type === 'play') {
              iconHtml = playIconOutline;
            } else if (icon.type === 'pause') {
              iconHtml = pauseIconOutline;
            } else if (icon.type === 'replay') {
              iconHtml = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;
            } else if (icon.type === 'play-fill') {
              iconHtml = playIconFilled;
            } else if (icon.type === 'pause-fill') {
              iconHtml = pauseIconFilled;
            } else if (icon.type === 'toggle-filled' || icon.type === 'toggle-outline') {
              // Find target video to check autoplay status
              const targetVideo = layer.actionType === 'videoControl' && layer.videoControl?.targetElementId
                ? layers.find(l => l.type === 'video' && l.attributes?.id === layer.videoControl?.targetElementId)
                : null;
              const hasAutoplay = targetVideo && targetVideo.type === 'video' && targetVideo.properties?.autoplay;
              
              // Set initial icon based on autoplay (pause if autoplay, play if not)
              const isFilled = icon.type === 'toggle-filled';
              const playIcon = isFilled ? playIconFilled : playIconOutline;
              const pauseIcon = isFilled ? pauseIconFilled : pauseIconOutline;
              
              iconHtml = hasAutoplay ? pauseIcon : playIcon;
              isToggleIcon = true;
              toggleIconData = ` data-play-icon="${playIcon.replace(/"/g, '&quot;')}" data-pause-icon="${pauseIcon.replace(/"/g, '&quot;')}"`;
            } else if (icon.type === 'toggle-custom' && icon.customPlayImage && icon.customPauseImage) {
              // Find target video to check autoplay status
              const targetVideo = layer.actionType === 'videoControl' && layer.videoControl?.targetElementId
                ? layers.find(l => l.type === 'video' && l.attributes?.id === layer.videoControl?.targetElementId)
                : null;
              const hasAutoplay = targetVideo && targetVideo.type === 'video' && targetVideo.properties?.autoplay;
              
              // Set initial icon based on autoplay (pause if autoplay, play if not)
              iconHtml = hasAutoplay 
                ? `<img src="${icon.customPauseImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />`
                : `<img src="${icon.customPlayImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />`;
              isToggleIcon = true;
              toggleIconData = ` data-play-icon="<img src='${icon.customPlayImage}' width='${iconSize}' height='${iconSize}' style='object-fit: contain;' />" data-pause-icon="<img src='${icon.customPauseImage}' width='${iconSize}' height='${iconSize}' style='object-fit: contain;' />"`;
            } else if (icon.type === 'custom' && icon.customImage) {
              iconHtml = `<img src="${icon.customImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />`;
            }
            
            const hasText = layer.text && layer.text.trim().length > 0;
            const hasIcon = icon.type !== 'none' && iconHtml;
            const gap = hasText && hasIcon ? '6px' : '0';
            
            let contentHtml = '';
            if (hasIcon && hasText) {
              if (isToggleIcon) {
                contentHtml = icon.position === 'before' 
                  ? `<span class="btn-icon"${toggleIconData}>${iconHtml}</span><span style="margin-left: ${gap};">${layer.text}</span>`
                  : `<span style="margin-right: ${gap};">${layer.text}</span><span class="btn-icon"${toggleIconData}>${iconHtml}</span>`;
              } else {
                contentHtml = icon.position === 'before' 
                  ? `${iconHtml}<span style="margin-left: ${gap};">${layer.text}</span>`
                  : `<span style="margin-right: ${gap};">${layer.text}</span>${iconHtml}`;
              }
            } else if (hasIcon) {
              contentHtml = isToggleIcon ? `<span class="btn-icon"${toggleIconData}>${iconHtml}</span>` : iconHtml;
            } else {
              contentHtml = layer.text;
            }
            
            const baseButtonStyle = `${baseStyle} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer; border: none;`;
            
            // Use button for video controls, anchor for links
            if (layer.actionType === 'videoControl' && layer.videoControl) {
              const iconToggleLogic = isToggleIcon 
                ? `const iconEl = this.querySelector('.btn-icon'); if (iconEl && v) { setTimeout(() => { iconEl.innerHTML = v.paused ? iconEl.dataset.playIcon : iconEl.dataset.pauseIcon; }, 0); }`
                : '';
              
              const videoAction = layer.videoControl.action === 'play' ? 'v.play();' :
                layer.videoControl.action === 'pause' ? 'v.pause();' :
                layer.videoControl.action === 'restart' ? 'v.currentTime = 0; v.play();' :
                'v.paused ? v.play() : v.pause();';
              
              const onclickHandler = `const v = document.getElementById('${layer.videoControl.targetElementId}'); if (v) { ${videoAction} ${iconToggleLogic} }`;
              
              content = `<button id="${layerId}" onclick="${onclickHandler}" style="${baseButtonStyle}">${contentHtml}</button>`;
            } else {
              const href = layer.actionType === 'link' ? layer.url : '#';
              const target = layer.actionType === 'link' ? ' target="_blank"' : '';
              content = `<a id="${layerId}" href="${href}"${target} style="${baseButtonStyle} text-decoration: none;">${contentHtml}</a>`;
            }
            break;
          }
        }

        return `    ${content}`;
      })
      .filter(Boolean)
      .join('\n');
  };

  // Generate CSS keyframes for animations per size
  const generateAnimationKeyframes = (size: AdSize): string => {
    const allKeyframes: string[] = [];
    
    // Get loop delay and reset duration from first layer's size config (or defaults)
    const firstLayerConfig = layers[0]?.sizeConfig[size];
    const loopDelay = firstLayerConfig?.animationLoopDelay || { value: 5, unit: 's' as const };
    const resetDuration = firstLayerConfig?.animationResetDuration || { value: 1, unit: 's' as const };
    
    const loopTimeMs = loopDelay.unit === 's' ? loopDelay.value * 1000 : loopDelay.value;
    const resetDelayMs = resetDuration.unit === 's' ? resetDuration.value * 1000 : resetDuration.value;
    const totalCycleTime = loopTimeMs + resetDelayMs;
    
    layers.forEach((layer) => {
      const layerId = layer.attributes.id || layer.id;
      const config = layer.sizeConfig[size];
      const animations = config?.animations;
      
      if (!animations || animations.length === 0 || animationLoop === 0) return;
      
      const resetStartPercent = (loopTimeMs / totalCycleTime) * 100;
      
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
          keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
            0% { ${fromValue}; }
            ${animStartPercent.toFixed(4)}% { ${fromValue}; }
            ${animEndPercent.toFixed(4)}% { ${toValue}; }
            ${resetStartPercent.toFixed(4)}% { ${toValue}; }
            ${(resetStartPercent + 0.01).toFixed(4)}% { ${fromValue}; }
            100% { ${fromValue}; }
          }`;
          allKeyframes.push(keyframes);
        }
      });
    });
    
    return allKeyframes.join('\n        ');
  };

  // Generate CSS with media queries for each size
  const generateResponsiveCSS = (): string => {
    const firstSize = allowedSizes[0];
    const firstDimensions = HTML5_AD_SIZES[firstSize];

    // Generate base styles for first size
    const baseStyles = layers
      .map((layer) => {
        // Use attributes.id if set, otherwise fall back to UUID
        const layerId = layer.attributes.id || layer.id;
        const config = layer.sizeConfig[firstSize];

        if (!config) {
          return `      #${layerId} { display: none; }`;
        }

        // Get loop timing from first layer's config for this size
        const firstLayerConfig = layers[0]?.sizeConfig[firstSize];
        const loopDelay = firstLayerConfig?.animationLoopDelay || { value: 5, unit: 's' as const };
        const resetDuration = firstLayerConfig?.animationResetDuration || { value: 1, unit: 's' as const };
        const loopTimeMs = loopDelay.unit === 's' ? loopDelay.value * 1000 : loopDelay.value;
        const resetDelayMs = resetDuration.unit === 's' ? resetDuration.value * 1000 : resetDuration.value;

        const posX = config.positionX;
        const posY = config.positionY;
        const width = config.width;
        const height = config.height;
        
        // Add fontSize for text, richtext, and button layers
        let fontSizeRule = '';
        if ((layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') && config.fontSize) {
          fontSizeRule = `\n        font-size: ${config.fontSize};`;
        }
        
        // Add icon size for button layers (applied to SVG children)
        let iconSizeRule = '';
        if (layer.type === 'button' && config.iconSize) {
          iconSizeRule = `\n      #${layerId} svg { width: ${config.iconSize}px; height: ${config.iconSize}px; }`;
        }

        // Add initial state CSS based on animation "from" values
        let initialStateRules = '';
        const animations = config.animations;
        if (animations && animations.length > 0) {
          const initialStates: string[] = [];
          animations.forEach(animation => {
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
            initialStateRules = `\n        ${initialStates.join(';\n        ')};`;
          }
        }

        // Add animation styles
        let animationRule = '';
        if (animations && animations.length > 0 && animationLoop !== 0) {
          const totalCycleTime = loopTimeMs + resetDelayMs;
          const iterationCount = animationLoop === -1 ? 'infinite' : animationLoop.toString();
          const animationStrings = animations.map(animation => 
            `anim-${layerId}-${animation.id}-${firstSize} ${totalCycleTime}ms linear 0s ${iterationCount} normal both`
          );
          animationRule = `\n        animation: ${animationStrings.join(', ')};`;
        }

        return `      #${layerId} {
        display: block;
        left: ${posX.value}${posX.unit || 'px'};
        top: ${posY.value}${posY.unit || 'px'};
        width: ${width.value}${width.unit};
        height: ${height.value}${height.unit};${fontSizeRule}${initialStateRules}${animationRule}
      }${iconSizeRule}`;
      })
      .join('\n');

    // Generate media queries for other sizes
    const mediaQueries = allowedSizes
      .slice(1)
      .map((size) => {
        const dimensions = HTML5_AD_SIZES[size];

        const layerStyles = layers
          .map((layer) => {
            // Use attributes.id if set, otherwise fall back to UUID
            const layerId = layer.attributes.id || layer.id;
            const config = layer.sizeConfig[size];

            if (!config) {
              return `        #${layerId} { display: none; }`;
            }

            // Get loop timing from first layer's config for this size
            const firstLayerConfig = layers[0]?.sizeConfig[size];
            const loopDelay = firstLayerConfig?.animationLoopDelay || { value: 5, unit: 's' as const };
            const resetDuration = firstLayerConfig?.animationResetDuration || { value: 1, unit: 's' as const };
            const loopTimeMs = loopDelay.unit === 's' ? loopDelay.value * 1000 : loopDelay.value;
            const resetDelayMs = resetDuration.unit === 's' ? resetDuration.value * 1000 : resetDuration.value;

            const posX = config.positionX;
            const posY = config.positionY;
            const width = config.width;
            const height = config.height;
            
            // Add fontSize for text, richtext, and button layers
            let fontSizeRule = '';
            if ((layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') && config.fontSize) {
              fontSizeRule = `\n          font-size: ${config.fontSize};`;
            }
            
            // Add icon size for button layers (applied to SVG children)
            let iconSizeRule = '';
            if (layer.type === 'button' && config.iconSize) {
              iconSizeRule = `\n        #${layerId} svg { width: ${config.iconSize}px; height: ${config.iconSize}px; }`;
            }

            // Add initial state CSS based on animation "from" values
            let initialStateRules = '';
            const animations = config.animations;
            if (animations && animations.length > 0) {
              const initialStates: string[] = [];
              animations.forEach(animation => {
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
                initialStateRules = `\n          ${initialStates.join(';\n          ')};`;
              }
            }

            // Add animation styles
            let animationRule = '';
            if (animations && animations.length > 0 && animationLoop !== 0) {
              const totalCycleTime = loopTimeMs + resetDelayMs;
              const iterationCount = animationLoop === -1 ? 'infinite' : animationLoop.toString();
              const animationStrings = animations.map(animation => 
                `anim-${layerId}-${animation.id}-${size} ${totalCycleTime}ms linear 0s ${iterationCount} normal both`
              );
              animationRule = `\n          animation: ${animationStrings.join(', ')};`;
            }

            return `        #${layerId} {
          display: block;
          left: ${posX.value}${posX.unit || 'px'};
          top: ${posY.value}${posY.unit || 'px'};
          width: ${width.value}${width.unit};
          height: ${height.value}${height.unit};${fontSizeRule}${initialStateRules}${animationRule}
        }${iconSizeRule}`;
          })
          .join('\n');

        const animationKeyframes = generateAnimationKeyframes(size);

        return `
      /* ${size} */
      @media (min-width: ${dimensions.width}px) and (min-height: ${dimensions.height}px) {
        ${animationKeyframes ? `/* Animation keyframes for ${size} */\n        ${animationKeyframes}\n\n        ` : ''}
.ad-container {
          width: ${dimensions.width}px;
          height: ${dimensions.height}px;
        }
${layerStyles}
      }`;
      })
      .join('\n');

    const baseAnimationKeyframes = generateAnimationKeyframes(firstSize);

    return `
      html, body {
        width: 100%;
        height: 100%;
        min-width: ${firstDimensions.width}px;
        min-height: ${firstDimensions.height}px;
      }

      .ad-container {
        width: ${firstDimensions.width}px;
        height: ${firstDimensions.height}px;
        position: relative;
        overflow: hidden;
        margin: 0 auto;
      }

      /* Animation keyframes for ${firstSize} */
      ${baseAnimationKeyframes}

      /* Base styles for ${firstSize} */
${baseStyles}
${mediaQueries}`;
  };

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${googleFontsLink ? `<link href="${googleFontsLink}" rel="stylesheet">` : ''}
    <style>
      /* Reset styles */
      html, body, div, span, h1, h2, h3, h4, h5, h6, p, img, video, button, a {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font-weight: normal;
        vertical-align: baseline;
      }
      
      * {
        box-sizing: border-box;
      }

      body {
        position: relative;
        overflow: hidden;
        -webkit-text-size-adjust: 100%;
        background: ${backgroundColor};
        user-select: none;
        -webkit-user-select: none;
      }
      ${generateResponsiveCSS()}
    </style>
  </head>
  <body>
    <div class="ad-container">
${generateLayerElements()}
    </div>
    <script>
      // Animation loop controller
      (function() {
        const loopCount = ${animationLoop};
        const totalLoopTime = ${loopTimeMs};
        const resetDelayMs = ${resetDelayMs};
        
        let currentLoop = 0;
        
        // Find all elements with animations
        const animatedElements = Array.from(document.querySelectorAll('[style*="animation"]'));
        if (animatedElements.length === 0) return; // No elements with animations
        
        // If no looping (loopCount === 0), animations still run once via CSS, so we're done
        if (loopCount === 0) return;
        
        // Calculate animation durations for timing
        const maxAnimationDuration = new Map();
        
        // Setup: calculate max duration for each element
        animatedElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const animationNames = style.animationName.split(',').filter(n => n.trim() !== 'none');
          const durations = style.animationDuration.split(',').map(d => parseFloat(d) * 1000);
          const delays = style.animationDelay.split(',').map(d => parseFloat(d) * 1000);
          
          // Calculate max (duration + delay) for this element
          let maxDuration = 0;
          for (let i = 0; i < animationNames.length; i++) {
            const totalDuration = (durations[i] || 0) + (delays[i] || 0);
            maxDuration = Math.max(maxDuration, totalDuration);
          }
          maxAnimationDuration.set(element, maxDuration);
        });
        
        // Calculate the longest animation across all elements
        let globalMaxDuration = 0;
        maxAnimationDuration.forEach(duration => {
          globalMaxDuration = Math.max(globalMaxDuration, duration);
        });
        
        function resetToInitialState() {
          console.log('🔄 Resetting to initial state...');
          // Reset all videos to the beginning (paused at start)
          document.querySelectorAll('video').forEach(function(video) {
            video.currentTime = 0;
            video.pause();
          });
          
          // Clear inline styles to let CSS rules take over
          animatedElements.forEach(element => {
            // Remove inline animation style
            element.style.removeProperty('animation');
            // Clear animated properties so CSS initial state takes over
            element.style.removeProperty('opacity');
            element.style.removeProperty('transform');
          });
          
          // Force reflow
          void document.body.offsetHeight;
          
          console.log('✅ Reset complete, elements at initial state');
        }
        
        function startAnimations() {
          console.log('🚀 Starting animations...');
          
          // Start videos that have autoplay
          document.querySelectorAll('video').forEach(function(video) {
            if (video.autoplay) {
              video.play();
            }
          });
          
          // Force reflow to restart animations
          void document.body.offsetHeight;
          
          console.log('✅ Animations started!');
          
          // Schedule the next loop based on animation duration (but not on first run)
          if (currentLoop > 0 && (loopCount === -1 || currentLoop < loopCount - 1)) {
            console.log('⏰ Scheduling next loop after', globalMaxDuration + 'ms (animation duration)');
            setTimeout(function() {
              currentLoop++;
              console.log('✨ Animation cycle completed! Loop', currentLoop, '/', loopCount === -1 ? 'infinite' : loopCount);
              
              const shouldContinue = loopCount === -1 || currentLoop < loopCount;
              console.log('   Should continue?', shouldContinue);
              
              if (shouldContinue) {
                const remainingLoopTime = Math.max(0, totalLoopTime - globalMaxDuration);
                console.log('⏱️  Waiting', remainingLoopTime + 'ms (remaining loop time)...');
                
                setTimeout(function() {
                  resetToInitialState();
                  console.log('⏱️  Waiting', resetDelayMs + 'ms (reset duration) before restarting...');
                  setTimeout(function() {
                    startAnimations();
                  }, resetDelayMs);
                }, remainingLoopTime);
              } else {
                console.log('🏁 Animation loop complete. No more loops.');
              }
            }, globalMaxDuration);
          }
        }
        
        // Start the first animation cycle
        console.log('🎭 Animation loop initialized:', {
          loopCount: loopCount === -1 ? 'infinite' : loopCount,
          totalLoopTime: totalLoopTime + 'ms',
          resetDelayMs: resetDelayMs + 'ms',
          globalMaxDuration: globalMaxDuration + 'ms',
          animatedElements: animatedElements.length
        });
        
        // Schedule first loop completion (let CSS animations run naturally on first load)
        console.log('⏰ Scheduling first loop completion after', globalMaxDuration + 'ms');
        setTimeout(function() {
          currentLoop++;
          console.log('✨ First animation cycle completed! Loop', currentLoop, '/', loopCount === -1 ? 'infinite' : loopCount);
          
          const shouldContinue = loopCount === -1 || currentLoop < loopCount;
          console.log('   Should continue?', shouldContinue);
          
          if (shouldContinue) {
            const remainingLoopTime = Math.max(0, totalLoopTime - globalMaxDuration);
            console.log('⏱️  Waiting', remainingLoopTime + 'ms (remaining loop time)...');
            
            setTimeout(function() {
              resetToInitialState();
              console.log('⏱️  Waiting', resetDelayMs + 'ms (reset duration) before restarting...');
              setTimeout(function() {
                startAnimations();
              }, resetDelayMs);
            }, remainingLoopTime);
          } else {
            console.log('🏁 Animation loop complete. No more loops.');
          }
        }, globalMaxDuration);
      })();
    </script>
  </body>
</html>`;
};
