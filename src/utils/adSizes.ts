import { HTML5_AD_SIZES } from '../consts';
import type { AdSize, LayerContent, SizeConfig } from '../data';

export const AD_SIZE_NAMES: Record<AdSize, string> = {
  '728x90': 'Leaderboard',
  '336x280': 'Large Rectangle',
  '300x250': 'Medium Rectangle',
  '970x90': 'Large Leaderboard',
  '120x600': 'Skyscraper',
  '160x600': 'Wide Skyscraper',
  '300x600': 'Half Page',
  '320x50': 'Mobile Banner',
  '250x250': 'Square',
};

const SIZE_ORDER = Object.keys(HTML5_AD_SIZES) as AdSize[];

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const scaleNumericStyle = (value: number | undefined, scale: number) => {
  if (value === undefined) return undefined;
  return Math.max(0, Math.round(value * scale));
};

const scaleFontSize = (fontSize: string | undefined, scale: number) => {
  if (!fontSize) return undefined;
  const match = fontSize.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)$/);
  if (!match) return fontSize;

  const numericValue = Number(match[1]);
  const unit = match[2];
  return `${roundToTwoDecimals(Math.max(0, numericValue * scale))}${unit}`;
};

const parseFontSizePx = (fontSize: string | undefined): number | undefined => {
  if (!fontSize) return undefined;
  const match = fontSize.trim().match(/^(\d+(?:\.\d+)?)px$/);
  return match ? parseFloat(match[1]) : undefined;
};

const stripHtmlTags = (html: string): string => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ');

/**
 * Estimate how many lines a block of text will occupy at a given width and font size.
 * Uses two independent methods and returns the larger:
 *  1. Character-density: chars / chars-per-line (content-aware, catches source boxes that were already clipping)
 *  2. Height-based: box height / (fontSize × lineHeight) (geometric fallback)
 */
const estimateTextLines = (
  originalHeightPx: number,
  originalFontPx: number,
  originalWidthPx: number,
  lineHeight: number,
  content?: string,
  layerType?: string,
): number => {
  // Method 1: height-based (can under-estimate if source was already clipping)
  const heightBased = Math.max(1, originalHeightPx / (originalFontPx * lineHeight));

  if (!content) return heightBased;

  // Method 2: character density
  // Strip HTML for richtext; use raw string for text layers
  const plainText = layerType === 'richtext' ? stripHtmlTags(content) : content;
  if (!plainText.trim()) return heightBased;

  // Average character width ≈ 0.55× font size for typical proportional fonts
  const avgCharWidthPx = originalFontPx * 0.55;
  const charsPerLine = Math.max(1, Math.floor(originalWidthPx / avgCharWidthPx));
  const charBased = Math.ceil(plainText.length / charsPerLine);

  return Math.max(heightBased, charBased);
};

/**
 * Render text content into a hidden off-screen element at the target dimensions
 * and read back the exact scrollHeight the browser would use. Returns null when
 * the DOM is unavailable or measurement fails (e.g. test environments).
 */
const measureTextHeight = (
  content: string,
  widthPx: number,
  fontSizePx: number,
  fontFamily: string | undefined,
  _layerType: string,
): number | null => {
  if (typeof document === 'undefined') return null;
  try {
    const el = document.createElement('div');
    // Match Canvas.tsx text/richtext rendering exactly:
    //   - both types use dangerouslySetInnerHTML (so innerHTML, not textContent)
    //   - both have className="whitespace-pre-wrap" so \n is a real line break
    //   - no explicit line-height is set, so browser uses its default "normal"
    el.style.cssText = [
      'position:fixed',
      'visibility:hidden',
      'pointer-events:none',
      `width:${widthPx}px`,
      `font-size:${fontSizePx}px`,
      `font-family:${fontFamily ? `${fontFamily}, Arial, sans-serif` : 'Arial, sans-serif'}`,
      'white-space:pre-wrap',      // matches Canvas className="whitespace-pre-wrap"
      'word-wrap:break-word',
      'overflow-wrap:break-word',
      'box-sizing:border-box',
      'padding:0',
      'margin:0',
      'top:-99999px',
      'left:-99999px',
    ].join(';');

    // Both text and richtext use innerHTML in Canvas (dangerouslySetInnerHTML)
    el.innerHTML = content;

    document.body.appendChild(el);
    const measured = el.scrollHeight;
    document.body.removeChild(el);

    return measured > 0 ? measured : null;
  } catch {
    return null;
  }
};

const scaleBorderRadius = (
  borderRadius: SizeConfig['borderRadius'],
  scale: number
): SizeConfig['borderRadius'] => {
  if (borderRadius === undefined) return undefined;
  if (typeof borderRadius === 'number') {
    return Math.max(0, Math.round(borderRadius * scale));
  }

  return {
    topLeft: Math.max(0, Math.round(borderRadius.topLeft * scale)),
    topRight: Math.max(0, Math.round(borderRadius.topRight * scale)),
    bottomRight: Math.max(0, Math.round(borderRadius.bottomRight * scale)),
    bottomLeft: Math.max(0, Math.round(borderRadius.bottomLeft * scale)),
  };
};

const scaleDimensionValue = (
  value: SizeConfig['positionX'],
  scale: number
): SizeConfig['positionX'] => {
  if (value.unit === '%') {
    return { ...value };
  }

  return {
    ...value,
    value: roundToTwoDecimals(value.value * scale),
  };
};

export const sortAdSizes = (sizes: AdSize[]) =>
  [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

export const getAvailableAdSizes = (allowedSizes: AdSize[]) =>
  SIZE_ORDER.filter((size) => !allowedSizes.includes(size));

export const findClosestSize = (targetSize: AdSize, candidateSizes: AdSize[]) => {
  const target = HTML5_AD_SIZES[targetSize];

  return candidateSizes.reduce<AdSize | null>((best, candidate) => {
    if (!target) return best;

    const dims = HTML5_AD_SIZES[candidate];
    const aspectScore = Math.abs(target.width / target.height - dims.width / dims.height);
    const areaScore = Math.abs(target.width * target.height - dims.width * dims.height) / (target.width * target.height);
    const orientationPenalty =
      (target.width >= target.height) === (dims.width >= dims.height) ? 0 : 10;
    const score = aspectScore * 3 + areaScore + orientationPenalty;

    if (!best) return candidate;

    const bestDims = HTML5_AD_SIZES[best];
    const bestAspectScore = Math.abs(target.width / target.height - bestDims.width / bestDims.height);
    const bestAreaScore =
      Math.abs(target.width * target.height - bestDims.width * bestDims.height) /
      (target.width * target.height);
    const bestOrientationPenalty =
      (target.width >= target.height) === (bestDims.width >= bestDims.height) ? 0 : 10;
    const bestScore = bestAspectScore * 3 + bestAreaScore + bestOrientationPenalty;

    return score < bestScore ? candidate : best;
  }, null);
};

export const inheritSizeConfig = (
  sourceConfig: SizeConfig,
  sourceSize: AdSize,
  targetSize: AdSize,
  layerType?: string,
  content?: string,
  fontFamily?: string,
): SizeConfig => {
  const sourceDimensions = HTML5_AD_SIZES[sourceSize];
  const targetDimensions = HTML5_AD_SIZES[targetSize];
  const scaleX = targetDimensions.width / sourceDimensions.width;
  const scaleY = targetDimensions.height / sourceDimensions.height;
  const scalarScale = Math.sqrt(scaleX * scaleY);

  const originalWidthPx = sourceConfig.width.value;
  const originalHeightPx = sourceConfig.height.value;
  const newWidthPx = originalWidthPx * scaleX;

  let scaledHeight = scaleDimensionValue(sourceConfig.height, scaleY);

  if (layerType === 'text' || layerType === 'richtext') {
    const originalFontPx = parseFontSizePx(sourceConfig.fontSize);

    if (originalFontPx !== undefined) {
      const newFontPx = originalFontPx * scalarScale;
      const LINE_HEIGHT = 1.35;
      const geometricHeight = Math.round(originalHeightPx * scaleY);

      // Primary: DOM measurement at target dimensions — exactly what the browser renders
      const domMeasured = content
        ? measureTextHeight(content, newWidthPx, newFontPx, fontFamily, layerType)
        : null;

      let newHeight: number;

      if (domMeasured !== null) {
        // +2px absolute buffer handles sub-pixel descender rounding; keep tight to content
        newHeight = Math.max(Math.ceil(domMeasured) + 2, geometricHeight);
      } else {
        // Fallback: dual static estimation (height-based + char-density), take larger
        const originalLines = estimateTextLines(
          originalHeightPx,
          originalFontPx,
          originalWidthPx,
          LINE_HEIGHT,
          content,
          layerType,
        );
        const widthRatio = originalWidthPx / Math.max(newWidthPx, 1);
        const estimatedLines = Math.max(1, Math.ceil(originalLines * widthRatio));
        const contentDrivenHeight = Math.ceil(estimatedLines * newFontPx * LINE_HEIGHT * 1.15);
        const minFontHeight = Math.ceil(newFontPx * LINE_HEIGHT * 1.5);
        newHeight = Math.max(contentDrivenHeight, minFontHeight, geometricHeight);
      }

      scaledHeight = { ...sourceConfig.height, value: newHeight };
    }
  } else if (layerType === 'button') {
    const originalFontPx = parseFontSizePx(sourceConfig.fontSize);

    if (originalFontPx !== undefined) {
      const newFontPx = originalFontPx * scalarScale;

      // Treat padding as an independent component that scales with font
      const originalPaddingTotal = Math.max(0, originalHeightPx - originalFontPx);
      const scaledPaddingTotal = Math.max(16, Math.round(originalPaddingTotal * scalarScale));
      const fontDrivenHeight = Math.round(newFontPx + scaledPaddingTotal);

      // Don't shrink below geometric scale
      const geometricHeight = Math.round(originalHeightPx * scaleY);
      scaledHeight = { ...sourceConfig.height, value: Math.max(fontDrivenHeight, geometricHeight) };
    }
  }

  return {
    ...sourceConfig,
    positionX: scaleDimensionValue(sourceConfig.positionX, scaleX),
    positionY: scaleDimensionValue(sourceConfig.positionY, scaleY),
    width: scaleDimensionValue(sourceConfig.width, scaleX),
    height: scaledHeight,
    fontSize: scaleFontSize(sourceConfig.fontSize, scalarScale),
    iconSize: scaleNumericStyle(sourceConfig.iconSize, scalarScale),
    borderRadius: scaleBorderRadius(sourceConfig.borderRadius, scalarScale),
    animations: sourceConfig.animations ? [...sourceConfig.animations] : sourceConfig.animations,
    animationLoopDelay: sourceConfig.animationLoopDelay
      ? { ...sourceConfig.animationLoopDelay }
      : sourceConfig.animationLoopDelay,
    animationResetDuration: sourceConfig.animationResetDuration
      ? { ...sourceConfig.animationResetDuration }
      : sourceConfig.animationResetDuration,
  };
};

export const inheritLayerForSize = (
  layer: LayerContent,
  targetSize: AdSize,
  fallbackSizes: AdSize[]
) => {
  if (layer.sizeConfig[targetSize]) {
    return layer;
  }

  const layerSizes = fallbackSizes.filter((size) => layer.sizeConfig[size]);
  if (layerSizes.length === 0) {
    return layer;
  }

  const sourceSize = findClosestSize(targetSize, layerSizes) ?? layerSizes[0];
  const sourceConfig = layer.sizeConfig[sourceSize];
  if (!sourceConfig) {
    return layer;
  }

  // Extract text content and font family for DOM-based height measurement
  const textContent =
    (layer.type === 'text' || layer.type === 'richtext') && 'content' in layer
      ? (layer.content as string)
      : undefined;

  const fontFamily =
    (layer.type === 'text' || layer.type === 'richtext') && 'styles' in layer
      ? (layer.styles as { fontFamily?: string }).fontFamily
      : undefined;

  return {
    ...layer,
    sizeConfig: {
      ...layer.sizeConfig,
      [targetSize]: inheritSizeConfig(sourceConfig, sourceSize, targetSize, layer.type, textContent, fontFamily),
    },
  };
};
