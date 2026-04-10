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

/**
 * Measure the minimum single-line width of text rendered in a button, so the
 * button width is never narrower than its label. Returns null if DOM unavailable.
 */
const measureButtonTextWidth = (
  text: string,
  fontSizePx: number,
  fontFamily: string | undefined,
): number | null => {
  if (typeof document === 'undefined' || !text.trim()) return null;
  try {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'visibility:hidden',
      'pointer-events:none',
      'width:max-content',
      `font-size:${fontSizePx}px`,
      `font-family:${fontFamily ? `${fontFamily}, Arial, sans-serif` : 'Arial, sans-serif'}`,
      'white-space:nowrap',
      'padding:0',
      'margin:0',
      'top:-99999px',
      'left:-99999px',
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    const measured = el.scrollWidth;
    document.body.removeChild(el);
    return measured > 0 ? measured : null;
  } catch {
    return null;
  }
};

// Snap threshold: within this many px of an edge/centre the layer is considered "aligned"
const ALIGN_THRESHOLD = 4;

/**
 * Detect the horizontal alignment intent of a layer within its source canvas.
 * Returns the target positionX that preserves that intent in the new canvas.
 */
const resolvePositionX = (
  posXPx: number,
  layerWidthPx: number,
  sourceCanvasW: number,
  targetCanvasW: number,
  newLayerW: number,
): number => {
  const rightGap = sourceCanvasW - posXPx - layerWidthPx;

  // Full-width span
  if (posXPx <= ALIGN_THRESHOLD && rightGap <= ALIGN_THRESHOLD) {
    return 0;
  }
  // Horizontally centred
  if (Math.abs(posXPx - (sourceCanvasW - layerWidthPx) / 2) <= ALIGN_THRESHOLD) {
    return Math.round((targetCanvasW - newLayerW) / 2);
  }
  // Pinned to right edge
  if (rightGap <= ALIGN_THRESHOLD) {
    return Math.round(targetCanvasW - newLayerW);
  }
  // Pinned to left edge
  if (posXPx <= ALIGN_THRESHOLD) {
    return 0;
  }
  // Default: proportional scale
  return roundToTwoDecimals(posXPx * (targetCanvasW / sourceCanvasW));
};

/**
 * Same as resolvePositionX but for the vertical axis.
 */
const resolvePositionY = (
  posYPx: number,
  layerHeightPx: number,
  sourceCanvasH: number,
  targetCanvasH: number,
  newLayerH: number,
): number => {
  const bottomGap = sourceCanvasH - posYPx - layerHeightPx;

  // Full-height span
  if (posYPx <= ALIGN_THRESHOLD && bottomGap <= ALIGN_THRESHOLD) {
    return 0;
  }
  // Vertically centred
  if (Math.abs(posYPx - (sourceCanvasH - layerHeightPx) / 2) <= ALIGN_THRESHOLD) {
    return Math.round((targetCanvasH - newLayerH) / 2);
  }
  // Pinned to bottom edge
  if (bottomGap <= ALIGN_THRESHOLD) {
    return Math.round(targetCanvasH - newLayerH);
  }
  // Pinned to top edge
  if (posYPx <= ALIGN_THRESHOLD) {
    return 0;
  }
  // Default: proportional scale
  return roundToTwoDecimals(posYPx * (targetCanvasH / sourceCanvasH));
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
  aspectRatioLocked?: boolean,
  buttonText?: string,
): SizeConfig => {
  const sourceDimensions = HTML5_AD_SIZES[sourceSize];
  const targetDimensions = HTML5_AD_SIZES[targetSize];
  const scaleX = targetDimensions.width / sourceDimensions.width;
  const scaleY = targetDimensions.height / sourceDimensions.height;
  const scalarScale = Math.sqrt(scaleX * scaleY);

  const originalWidthPx = sourceConfig.width.value;
  const originalHeightPx = sourceConfig.height.value;

  // ── Width ────────────────────────────────────────────────────────────────

  // Full-bleed: layer spans ≥95% of canvas width → stretch to full target width
  const isFullBleedX = originalWidthPx >= sourceDimensions.width * 0.95;
  let newWidthPx = isFullBleedX
    ? targetDimensions.width
    : originalWidthPx * scaleX;

  // ── Height ───────────────────────────────────────────────────────────────

  const isFullBleedY = originalHeightPx >= sourceDimensions.height * 0.95;
  let newHeightPx: number;

  if (isFullBleedY) {
    newHeightPx = targetDimensions.height;
  } else if (layerType === 'image' || layerType === 'video') {
    if (aspectRatioLocked) {
      // Preserve aspect ratio: scale to fit within target box (letterbox)
      const ratio = originalWidthPx / originalHeightPx;
      const fitByWidth = newWidthPx / ratio;
      const fitByHeight = (originalHeightPx * scaleY) * ratio;
      if (fitByWidth <= targetDimensions.height) {
        newHeightPx = Math.round(fitByWidth);
      } else {
        newWidthPx = Math.round(fitByHeight);
        newHeightPx = Math.round(originalHeightPx * scaleY);
      }
    } else {
      newHeightPx = Math.round(originalHeightPx * scaleY);
    }
  } else if (layerType === 'text' || layerType === 'richtext') {
    const originalFontPx = parseFontSizePx(sourceConfig.fontSize);

    if (originalFontPx !== undefined) {
      const newFontPx = originalFontPx * scalarScale;
      const LINE_HEIGHT = 1.35;
      const geometricHeight = Math.round(originalHeightPx * scaleY);

      const domMeasured = content
        ? measureTextHeight(content, newWidthPx, newFontPx, fontFamily, layerType)
        : null;

      if (domMeasured !== null) {
        newHeightPx = Math.max(Math.ceil(domMeasured) + 2, geometricHeight);
      } else {
        const originalLines = estimateTextLines(
          originalHeightPx, originalFontPx, originalWidthPx, LINE_HEIGHT, content, layerType,
        );
        const widthRatio = originalWidthPx / Math.max(newWidthPx, 1);
        const estimatedLines = Math.max(1, Math.ceil(originalLines * widthRatio));
        const contentDrivenHeight = Math.ceil(estimatedLines * newFontPx * LINE_HEIGHT * 1.15);
        const minFontHeight = Math.ceil(newFontPx * LINE_HEIGHT * 1.5);
        newHeightPx = Math.max(contentDrivenHeight, minFontHeight, geometricHeight);
      }
    } else {
      newHeightPx = Math.round(originalHeightPx * scaleY);
    }
  } else if (layerType === 'button') {
    const originalFontPx = parseFontSizePx(sourceConfig.fontSize);

    if (originalFontPx !== undefined) {
      const newFontPx = originalFontPx * scalarScale;

      // Height: font + scaled padding
      const originalPaddingTotal = Math.max(0, originalHeightPx - originalFontPx);
      const scaledPaddingTotal = Math.max(16, Math.round(originalPaddingTotal * scalarScale));
      const fontDrivenHeight = Math.round(newFontPx + scaledPaddingTotal);
      newHeightPx = Math.max(fontDrivenHeight, Math.round(originalHeightPx * scaleY));

      // Width: never narrower than the button's own text label + horizontal padding
      if (buttonText) {
        const measuredTextW = measureButtonTextWidth(buttonText, newFontPx, fontFamily);
        if (measuredTextW !== null) {
          const hPadding = Math.max(24, Math.round(scaledPaddingTotal));
          newWidthPx = Math.max(newWidthPx, measuredTextW + hPadding * 2);
        }
      }
    } else {
      newHeightPx = Math.round(originalHeightPx * scaleY);
    }
  } else {
    newHeightPx = Math.round(originalHeightPx * scaleY);
  }

  newWidthPx = Math.round(newWidthPx);
  newHeightPx = Math.round(newHeightPx);

  // ── Position ─────────────────────────────────────────────────────────────

  let newPosX: number;
  let newPosY: number;

  if (sourceConfig.positionX.unit === '%') {
    newPosX = sourceConfig.positionX.value; // carry % through unchanged
  } else {
    newPosX = resolvePositionX(
      sourceConfig.positionX.value,
      originalWidthPx,
      sourceDimensions.width,
      targetDimensions.width,
      newWidthPx,
    );
  }

  if (sourceConfig.positionY.unit === '%') {
    newPosY = sourceConfig.positionY.value;
  } else {
    newPosY = resolvePositionY(
      sourceConfig.positionY.value,
      originalHeightPx,
      sourceDimensions.height,
      targetDimensions.height,
      newHeightPx,
    );
  }

  // ── Clamp to canvas bounds ───────────────────────────────────────────────
  // Keep at least 1px of the layer visible — don't hard-clamp fully since
  // layers are intentionally allowed outside bounds (clipping is optional).
  // Only clamp when the layer would be entirely outside.
  if (sourceConfig.positionX.unit !== '%') {
    newPosX = Math.max(-(newWidthPx - 1), Math.min(newPosX, targetDimensions.width - 1));
  }
  if (sourceConfig.positionY.unit !== '%') {
    newPosY = Math.max(-(newHeightPx - 1), Math.min(newPosY, targetDimensions.height - 1));
  }

  return {
    ...sourceConfig,
    positionX: { value: newPosX, unit: sourceConfig.positionX.unit || 'px' },
    positionY: { value: newPosY, unit: sourceConfig.positionY.unit || 'px' },
    width: { value: newWidthPx, unit: sourceConfig.width.unit || 'px' },
    height: { value: newHeightPx, unit: sourceConfig.height.unit || 'px' },
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
    (layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button') && 'styles' in layer
      ? (layer.styles as { fontFamily?: string }).fontFamily
      : undefined;

  const buttonText = layer.type === 'button' ? layer.text : undefined;

  return {
    ...layer,
    sizeConfig: {
      ...layer.sizeConfig,
      [targetSize]: inheritSizeConfig(
        sourceConfig,
        sourceSize,
        targetSize,
        layer.type,
        textContent,
        fontFamily,
        layer.aspectRatioLocked,
        buttonText,
      ),
    },
  };
};
