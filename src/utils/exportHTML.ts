import { type LayerContent, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';
import { getGoogleFontsLink } from './googleFonts';

export const generateResponsiveHTML = (
  layers: LayerContent[],
  allowedSizes: AdSize[],
  backgroundColor: string = '#ffffff'
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
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'}; white-space: pre-wrap;`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'richtext':
            additionalStyles = `color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};`;
            content = `<div id="${layerId}" style="${baseStyle} ${additionalStyles}">${layer.content}</div>`;
            break;
          case 'video':
            const autoplay = layer.properties?.autoplay ? ' autoplay muted playsinline loop' : '';
            const controls = layer.properties?.controls !== false ? ' controls' : '';
            content = `<video id="${layerId}" src="${layer.url}" style="${baseStyle}"${autoplay}${controls}></video>`;
            break;
          case 'button':
            additionalStyles = `display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;`;
            content = `<a id="${layerId}" href="${layer.url}" target="_blank" style="${baseStyle} ${additionalStyles}">${layer.text}</a>`;
            break;
        }

        return `    ${content}`;
      })
      .filter(Boolean)
      .join('\n');
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
        const posX = layer.positionX[firstSize];
        const posY = layer.positionY[firstSize];
        const width = layer.width[firstSize];
        const height = layer.height[firstSize];

        if (!posX || !posY || !width || !height) {
          return `      #${layerId} { display: none; }`;
        }

        return `      #${layerId} {
        display: block;
        left: ${posX.value}${posX.unit || 'px'};
        top: ${posY.value}${posY.unit || 'px'};
        width: ${width.value}${width.unit};
        height: ${height.value}${height.unit};
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
            const posX = layer.positionX[size];
            const posY = layer.positionY[size];
            const width = layer.width[size];
            const height = layer.height[size];

            if (!posX || !posY || !width || !height) {
              return `        #${layerId} { display: none; }`;
            }

            return `        #${layerId} {
          display: block;
          left: ${posX.value}${posX.unit || 'px'};
          top: ${posY.value}${posY.unit || 'px'};
          width: ${width.value}${width.unit};
          height: ${height.value}${height.unit};
        }`;
          })
          .join('\n');

        return `
      /* ${size} */
      @media (min-width: ${dimensions.width}px) and (min-height: ${dimensions.height}px) {
        .ad-container {
          width: ${dimensions.width}px;
          height: ${dimensions.height}px;
        }
${layerStyles}
      }`;
      })
      .join('\n');

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
