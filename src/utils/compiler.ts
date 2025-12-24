import { type Canvas, type LayerContent, HTML5_AD_SIZES } from '../data';

/**
 * Compiles a Canvas object into a complete HTML string for a specific ad size
 */
const compileCanvasToHTML = (canvas: Canvas, size: keyof typeof HTML5_AD_SIZES): string => {
  const adSize = HTML5_AD_SIZES[size];
  
  if (!adSize) {
    throw new Error(`Unknown ad size: ${size}`);
  }


  const layersHTML = canvas.layers
    .map((layer) => renderLayer(layer, size))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${canvas.name}</title>
</head>
<body>
  ${layersHTML}
</body>
</html>`;
};

/**
 * Renders a single layer into HTML
 */
const renderLayer = (layer: LayerContent, size: keyof typeof HTML5_AD_SIZES): string => {
  const position = layer.position[size];
  const width = layer.width[size];
  const height = layer.height[size];

  if (!position || !width || !height) {
    return ''; // Skip layers that don't have config for this size
  }

  const xValue = typeof position.x === 'number' ? position.x : parseFloat(String(position.x));
  const yValue = typeof position.y === 'number' ? position.y : parseFloat(String(position.y));
  const widthValue = width.value;
  const heightValue = height.value;

  const xUnit = position.unit || 'px';
  const widthUnit = width.unit || 'px';
  const heightUnit = height.unit || 'px';

  const baseStyle = `position: absolute; left: ${xValue}${xUnit}; top: ${yValue}${xUnit}; width: ${widthValue}${widthUnit}; height: ${heightValue}${heightUnit};`;

  switch (layer.type) {
    case 'image':
      return `<div style="${baseStyle}">
        <img src="${layer.url}" alt="${layer.label}" />
      </div>`;

    case 'video':
      return `<div style="${baseStyle}">
        <video controls autoplay muted>
          <source src="${layer.url}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>`;

    case 'text':
      return `<div style="${baseStyle}">
        <span>${escapeHTML(layer.content)}</span>
      </div>`;

    case 'richtext':
      return `<div style="${baseStyle}">
        ${layer.content}
      </div>`;

    default:
      return '';
  }
};

/**
 * Escapes HTML special characters to prevent XSS
 */
const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export { compileCanvasToHTML };
