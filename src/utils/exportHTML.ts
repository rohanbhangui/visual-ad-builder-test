import { type LayerContent, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';
import { getGoogleFontsLink } from './googleFonts';

export const generateResponsiveHTML = (
  layers: LayerContent[],
  allowedSizes: AdSize[],
  backgroundColor: string = '#ffffff',
  animationLoop: number = 0,
  animationLoopDelay: { value: number; unit: 'ms' | 's' } = { value: 0, unit: 's' }
): string => {
  // Calculate loop time in milliseconds for the script
  const loopTimeMs = animationLoopDelay.unit === 's' ? animationLoopDelay.value * 1000 : animationLoopDelay.value;
  
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

  // Generate single set of layer elements
  const generateLayerElements = (): string => {
    return layers
      .map((layer, index) => {
        const zIndex = layers.length - index;
        const opacity = layer.styles.opacity;
        
        // Use attributes.id if set, otherwise fall back to UUID
        const layerId = layer.attributes.id || layer.id;

        // Base styles that don't change
        const baseStyle = `position: absolute; z-index: ${zIndex}; opacity: ${opacity};`;

        let content = '';
        let additionalStyles = '';

        switch (layer.type) {
          case 'image':
            additionalStyles = `object-fit: ${layer.styles.objectFit || 'cover'};`;
            content = `<img id="${layerId}" src="${layer.url}" style="${baseStyle} ${additionalStyles}" alt="${layer.label}">`;
            break;
          case 'text':
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'}; white-space: pre-wrap;`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'richtext':
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'video':
            const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
            const controls = layer.properties?.controls !== false ? ' controls' : '';
            content = `<video id="${layerId}" src="${layer.url}" style="${baseStyle}"${autoplay}${controls}></video>`;
            break;
          case 'button': {
            const icon = layer.icon || { type: 'none', size: 24, position: 'before' };
            const iconSize = icon.size || 24;
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
            } else if (icon.type === 'toggle-filled') {
              iconHtml = playIconFilled;
              isToggleIcon = true;
              toggleIconData = ` data-play-icon="${playIconFilled.replace(/"/g, '&quot;')}" data-pause-icon="${pauseIconFilled.replace(/"/g, '&quot;')}"`;
            } else if (icon.type === 'toggle-outline') {
              iconHtml = playIconOutline;
              isToggleIcon = true;
              toggleIconData = ` data-play-icon="${playIconOutline.replace(/"/g, '&quot;')}" data-pause-icon="${pauseIconOutline.replace(/"/g, '&quot;')}"`;
            } else if (icon.type === 'toggle-custom' && icon.customPlayImage && icon.customPauseImage) {
              iconHtml = `<img src="${icon.customPlayImage}" width="${iconSize}" height="${iconSize}" style="object-fit: contain;" />`;
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
              contentHtml = icon.position === 'before' 
                ? `<span class="btn-icon">${iconHtml}</span><span style="margin-left: ${gap};">${layer.text}</span>`
                : `<span style="margin-right: ${gap};">${layer.text}</span><span class="btn-icon">${iconHtml}</span>`;
            } else if (hasIcon) {
              contentHtml = `<span class="btn-icon">${iconHtml}</span>`;
            } else {
              contentHtml = layer.text;
            }
            
            // Create onclick handler for video controls with icon toggle support
            let onclickHandler = '';
            if (layer.actionType === 'videoControl' && layer.videoControl) {
              const videoAction = layer.videoControl.action === 'play' ? 'v.play();' :
                layer.videoControl.action === 'pause' ? 'v.pause();' :
                layer.videoControl.action === 'restart' ? 'v.currentTime = 0; v.play();' :
                'v.paused ? v.play() : v.pause();';
              
              const iconToggle = isToggleIcon 
                ? `const btn = event.currentTarget; const iconEl = btn.querySelector('.btn-icon'); if (iconEl && v) { iconEl.innerHTML = v.paused ? btn.dataset.playIcon : btn.dataset.pauseIcon; }`
                : '';
              
              onclickHandler = `event.preventDefault(); const v = document.getElementById('${layer.videoControl.targetElementId}'); if (v) { ${videoAction} ${iconToggle} }`;
            }
            
            const href = layer.actionType === 'link' ? layer.url : '#';
            const target = layer.actionType === 'link' ? ' target="_blank"' : '';
            const onclick = onclickHandler ? ` onclick="${onclickHandler}"` : '';
            const dataAttrs = isToggleIcon ? toggleIconData : '';
            
            additionalStyles = `display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;`;
            content = `<a id="${layerId}" href="${href}"${target}${onclick}${dataAttrs} style="${baseStyle} ${additionalStyles}">${contentHtml}</a>`;
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
    
    layers.forEach((layer) => {
      const layerId = layer.attributes.id || layer.id;
      const config = layer.sizeConfig[size];
      const animations = config?.animations;
      
      if (!animations || animations.length === 0) return;
      
      animations.forEach((animation) => {
        let keyframes = '';
        
        switch (animation.type) {
          case 'fadeIn':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { opacity: ${animation.from ?? 0}; }
              to { opacity: ${animation.to ?? 1}; }
            }`;
            break;
          case 'slideLeft':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { transform: translateX(${animation.from ?? '100%'}); }
              to { transform: translateX(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideRight':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { transform: translateX(${animation.from ?? '-100%'}); }
              to { transform: translateX(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideUp':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { transform: translateY(${animation.from ?? '100%'}); }
              to { transform: translateY(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'slideDown':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { transform: translateY(${animation.from ?? '-100%'}); }
              to { transform: translateY(${animation.to ?? '0%'}); }
            }`;
            break;
          case 'scale':
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { transform: scale(${animation.from ?? 0}); }
              to { transform: scale(${animation.to ?? 1}); }
            }`;
            break;
          case 'custom':
            const prop = animation.property || 'opacity';
            keyframes = `@keyframes anim-${layerId}-${animation.id}-${size} {
              from { ${prop}: ${animation.from ?? 0}; }
              to { ${prop}: ${animation.to ?? 1}; }
            }`;
            break;
        }
        
        if (keyframes) {
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

        const posX = config.positionX;
        const posY = config.positionY;
        const width = config.width;
        const height = config.height;
        
        // Add fontSize for text, richtext, and button layers
        let fontSizeRule = '';
        if ((layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') && config.fontSize) {
          fontSizeRule = `\n        font-size: ${config.fontSize};`;
        }

        // Add animation styles
        let animationRule = '';
        const animations = config.animations;
        if (animations && animations.length > 0) {
          // Always set iteration count to 1, JS will handle looping
          const animationStrings = animations.map(animation => 
            `anim-${layerId}-${animation.id}-${firstSize} ${animation.duration.value}${animation.duration.unit} ${animation.easing} ${animation.delay.value}${animation.delay.unit} 1 forwards`
          );
          animationRule = `\n        animation: ${animationStrings.join(', ')};`;
        }

        return `      #${layerId} {
        display: block;
        left: ${posX.value}${posX.unit || 'px'};
        top: ${posY.value}${posY.unit || 'px'};
        width: ${width.value}${width.unit};
        height: ${height.value}${height.unit};${fontSizeRule}${animationRule}
      }`;
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

            const posX = config.positionX;
            const posY = config.positionY;
            const width = config.width;
            const height = config.height;
            
            // Add fontSize for text, richtext, and button layers
            let fontSizeRule = '';
            if ((layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') && config.fontSize) {
              fontSizeRule = `\n          font-size: ${config.fontSize};`;
            }

            // Add animation styles
            let animationRule = '';
            const animations = config.animations;
            if (animations && animations.length > 0) {
              // Always set iteration count to 1, JS will handle looping
              const animationStrings = animations.map(animation => 
                `anim-${layerId}-${animation.id}-${size} ${animation.duration.value}${animation.duration.unit} ${animation.easing} ${animation.delay.value}${animation.delay.unit} 1 forwards`
              );
              animationRule = `\n          animation: ${animationStrings.join(', ')};`;
            }

            return `        #${layerId} {
          display: block;
          left: ${posX.value}${posX.unit || 'px'};
          top: ${posY.value}${posY.unit || 'px'};
          width: ${width.value}${width.unit};
          height: ${height.value}${height.unit};${fontSizeRule}${animationRule}
        }`;
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
        animatedElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const animationNames = style.animationName.split(',').filter(n => n.trim() !== 'none');
          const durations = style.animationDuration.split(',').map(d => parseFloat(d) * 1000);
          const delays = style.animationDelay.split(',').map(d => parseFloat(d) * 1000);
          
          elementAnimCounts.set(element, animationNames.length);
          elementAnimEndCounts.set(element, 0);
          
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
        
        function restartAllAnimations() {          // Reset all videos to the beginning
          document.querySelectorAll('video').forEach(function(video) {
            video.currentTime = 0;
            if (video.autoplay) {
              video.play();
            }
          });
          
          // Restart all animations          animatedElements.forEach(element => {
            const currentStyle = element.style.animation;
            element.style.animation = 'none';
            void element.offsetHeight; // Force reflow
            element.style.animation = currentStyle;
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
        animatedElements.forEach(element => {
          element.addEventListener('animationend', function(event) {
            const totalAnims = elementAnimCounts.get(element);
            const currentEndCount = elementAnimEndCounts.get(element) + 1;
            elementAnimEndCounts.set(element, currentEndCount);
            
            // Only mark as complete when ALL animations on this element have ended
            if (currentEndCount >= totalAnims) {
              completedElements.add(element);
              checkAllComplete();
            }
          });
        });
      })();
    </script>
  </body>
</html>`;
};
