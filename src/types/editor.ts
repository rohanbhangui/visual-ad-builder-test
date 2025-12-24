import { Canvas, LayerContent, HTML5_AD_SIZES } from '../data';

interface EditorLayer extends LayerContent {
  isSelected?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
}

interface EditorState {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  currentSize: keyof typeof HTML5_AD_SIZES;
}

export type { EditorState, EditorLayer };
