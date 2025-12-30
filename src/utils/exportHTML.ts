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
          case 'button':
            additionalStyles = `display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;`;
            content = `<a id="${layerId}" href="${layer.url}" target="_blank" style="${baseStyle} ${additionalStyles}">${layer.text}</a>`;
            break;
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
          const animationIterationCount = animationLoop === -1 ? 'infinite' : animationLoop > 0 ? animationLoop.toString() : '1';
          const animationStrings = animations.map(animation => 
            `anim-${layerId}-${animation.id}-${firstSize} ${animation.duration.value}${animation.duration.unit} ${animation.easing} ${animation.delay.value}${animation.delay.unit} ${animationIterationCount} forwards`
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
              const animationIterationCount = animationLoop === -1 ? 'infinite' : animationLoop > 0 ? animationLoop.toString() : '1';
              const animationStrings = animations.map(animation => 
                `anim-${layerId}-${animation.id}-${size} ${animation.duration.value}${animation.duration.unit} ${animation.easing} ${animation.delay.value}${animation.delay.unit} ${animationIterationCount} forwards`
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
  </body>
</html>`;
};
