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

  // Generate all size sections with comments
  const generateAllSizeSections = (): string => {
    return allowedSizes
      .map((size) => {
        const dimensions = HTML5_AD_SIZES[size];
        
        const layerElements = layers
          .filter((layer) => {
            return (
              layer.positionX[size] &&
              layer.positionY[size] &&
              layer.width[size] &&
              layer.height[size]
            );
          })
          .map((layer, index) => {
            const posX = layer.positionX[size]!;
            const posY = layer.positionY[size]!;
            const width = layer.width[size]!;
            const height = layer.height[size]!;
            const zIndex = layers.length - index;
            const opacity = layer.styles.opacity;

            const style = `position: absolute; left: ${posX.value}${posX.unit || 'px'}; top: ${posY.value}${posY.unit || 'px'}; width: ${width.value}${width.unit}; height: ${height.value}${height.unit}; z-index: ${zIndex}; opacity: ${opacity};`;

            let content = '';

            switch (layer.type) {
              case 'image':
                content = `      <img src="${layer.url}" style="${style} object-fit: ${layer.styles.objectFit || 'cover'};" alt="${layer.label}">`;
                break;
              case 'text':
                content = `      <div style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'}; white-space: pre-wrap;">${layer.content}</div>`;
                break;
              case 'richtext':
                content = `      <div style="${style} color: ${layer.styles?.color || '#000000'}; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; text-align: ${layer.styles?.textAlign || 'left'};">${layer.content}</div>`;
                break;
              case 'video':
                if (width.value > 0 && height.value > 0) {
                  const autoplay = layer.properties?.autoplay ? ' autoplay muted' : '';
                  const controls = layer.properties?.controls !== false ? ' controls' : '';
                  content = `      <video src="${layer.url}" style="${style}"${autoplay}${controls}></video>`;
                }
                break;
              case 'button':
                content = `      <a href="${layer.url}" target="_blank" style="${style} display: flex; align-items: center; justify-content: center; background-color: ${layer.styles?.backgroundColor || '#333333'}; color: ${layer.styles?.color || '#ffffff'}; text-decoration: none; font-size: ${layer.styles?.fontSize || '14px'}; font-family: ${layer.styles?.fontFamily || 'Arial'}; cursor: pointer;">${layer.text}</a>`;
                break;
            }

            return content;
          })
          .filter(Boolean)
          .join('\n');

        return `    <!-- ${size} Ad -->
    <div class="ad-size" data-size="${size}" style="width: ${dimensions.width}px; height: ${dimensions.height}px;">
${layerElements}
    </div>
`;
      })
      .join('\n');
  };

  // Generate CSS for responsive behavior
  const generateResponsiveCSS = (): string => {
    const mediaQueries = allowedSizes
      .map((size, index) => {
        const dimensions = HTML5_AD_SIZES[size];
        
        return `
    /* ${size} */
    @media (min-width: ${dimensions.width}px) and (min-height: ${dimensions.height}px) {
      .ad-size[data-size="${size}"] {
        display: block;
      }
      ${allowedSizes.filter(s => s !== size).map(s => `.ad-size[data-size="${s}"] { display: none; }`).join(' ')}
    }`;
      })
      .join('\n');

    // Set default to first size
    const firstSize = allowedSizes[0];
    const firstDimensions = HTML5_AD_SIZES[firstSize];

    return `
      html, body {
        width: 100%;
        height: 100%;
        min-width: ${firstDimensions.width}px;
        min-height: ${firstDimensions.height}px;
      }

      .ad-size {
        display: none;
        position: relative;
        overflow: hidden;
        margin: 0 auto;
      }

      /* Show first size by default */
      .ad-size[data-size="${firstSize}"] {
        display: block;
      }
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
${generateAllSizeSections()}
  </body>
</html>`;
};
