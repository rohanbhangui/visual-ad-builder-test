import { useMemo } from 'react';
import { type Canvas, HTML5_AD_SIZES } from '../data';
import { compileCanvasToHTML } from '../utils/compiler';

interface CanvasPreviewProps {
  canvas: Canvas;
  size?: keyof typeof HTML5_AD_SIZES;
}

/**
 * Renders a Canvas in an iframe for isolated, performant display
 */
const CanvasPreview = ({ canvas, size = '300x250' }: CanvasPreviewProps) => {
  const htmlContent = useMemo(() => {
    try {
      return compileCanvasToHTML(canvas, size);
    } catch (error) {
      console.error('Failed to compile canvas:', error);
      return '<html><body><p>Error rendering canvas</p></body></html>';
    }
  }, [canvas, size]);

  const adSize = HTML5_AD_SIZES[size];

  return (
    <div className="canvas-preview">
      <iframe
        title={`Canvas Preview - ${size}`}
        srcDoc={htmlContent}
        style={{
          width: `${adSize.width}px`,
          height: `${adSize.height}px`,
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#fff',
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export { CanvasPreview };
