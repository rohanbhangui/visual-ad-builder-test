import { v4 as uuidv4 } from 'uuid';

// Position type for x, y coordinates
export interface Position {
  x: number | string; // Can be px or %
  y: number | string;
  unit?: 'px' | '%'; // Default unit for both x and y
}

// Size type for width and height
export interface Size {
  value: number;
  unit?: 'px'; // Primarily px for ad dimensions
}

// Union type for layer content based on type
export type LayerContent = TextLayer | RichtextLayer | ImageLayer | VideoLayer | ButtonLayer;

export interface BaseLayer {
  id: string;
  label: string;
  position: Record<string, Position>; // Keyed by ad size
  width: Record<string, Size>; // Keyed by ad size
  height: Record<string, Size>; // Keyed by ad size
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
}

export interface RichtextLayer extends BaseLayer {
  type: 'richtext';
  content: string; // HTML content
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  url: string;
}

export interface VideoLayer extends BaseLayer {
  type: 'video';
  url: string;
}

export interface ButtonLayer extends BaseLayer {
  type: 'button';
  text: string;
  url: string;
}

// Canvas/Document structure
export interface Canvas {
  id: string;
  name: string;
  allowedSizes: Array<keyof typeof HTML5_AD_SIZES>;
  layers: LayerContent[];
  createdAt: Date;
  updatedAt: Date;
}

// Common HTML5 ad sizes
export const HTML5_AD_SIZES = {
  '728x90': { width: 728, height: 90 },
  '336x280': { width: 336, height: 280 },
  '300x250': { width: 300, height: 250 },
  '970x90': { width: 970, height: 90 },
  '120x600': { width: 120, height: 600 },
  '300x600': { width: 300, height: 600 },
  '320x50': { width: 320, height: 50 },
  '250x250': { width: 250, height: 250 },
};

// Sample data with 4-5 layers
export const sampleCanvas: Canvas = {
  id: uuidv4(),
  name: 'Sample HTML5 Ad',
  allowedSizes: ['300x250', '336x280', '728x90'],
  layers: [
    {
      id: uuidv4(),
      label: 'Main Headline',
      type: 'richtext',
      position: {
        '300x250': { x: 10, y: 20, unit: 'px' },
        '336x280': { x: 10, y: 20, unit: 'px' },
        '728x90': { x: 10, y: 5, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 708, unit: 'px' },
      },
      height: {
        '300x250': { value: 60, unit: 'px' },
        '336x280': { value: 60, unit: 'px' },
        '728x90': { value: 30, unit: 'px' },
      },
      content:
        '<h2 style="color: white; font-size: 20px; font-weight: bold; margin: 0;">Amazing Product</h2>',
    },
    {
      id: uuidv4(),
      label: 'Description Text',
      type: 'text',
      position: {
        '300x250': { x: 10, y: 85, unit: 'px' },
        '336x280': { x: 10, y: 85, unit: 'px' },
        '728x90': { x: 10, y: 45, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 708, unit: 'px' },
      },
      height: {
        '300x250': { value: 80, unit: 'px' },
        '336x280': { value: 80, unit: 'px' },
        '728x90': { value: 40, unit: 'px' },
      },
      content: 'Get 50% off on your first purchase. Limited time offer!',
    },
    {
      id: uuidv4(),
      label: 'Demo Video',
      type: 'video',
      position: {
        '300x250': { x: 10, y: 170, unit: 'px' },
        '336x280': { x: 10, y: 170, unit: 'px' },
        '728x90': { x: 0, y: 0, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
      },
      height: {
        '300x250': { value: 50, unit: 'px' },
        '336x280': { value: 50, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
      },
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    },
    {
      id: uuidv4(),
      label: 'CTA Button',
      type: 'button',
      position: {
        '300x250': { x: 100, y: 215, unit: 'px' },
        '336x280': { x: 120, y: 230, unit: 'px' },
        '728x90': { x: 300, y: 30, unit: 'px' },
      },
      width: {
        '300x250': { value: 100, unit: 'px' },
        '336x280': { value: 100, unit: 'px' },
        '728x90': { value: 100, unit: 'px' },
      },
      height: {
        '300x250': { value: 32, unit: 'px' },
        '336x280': { value: 32, unit: 'px' },
        '728x90': { value: 32, unit: 'px' },
      },
      text: 'Shop Now',
      url: 'https://www.google.com',
    },
    {
      id: uuidv4(),
      label: 'Background Image',
      type: 'image',
      position: {
        '300x250': { x: 0, y: 0, unit: 'px' },
        '336x280': { x: 0, y: 0, unit: 'px' },
        '728x90': { x: 0, y: 0, unit: 'px' },
      },
      width: {
        '300x250': { value: 300, unit: 'px' },
        '336x280': { value: 336, unit: 'px' },
        '728x90': { value: 728, unit: 'px' },
      },
      height: {
        '300x250': { value: 250, unit: 'px' },
        '336x280': { value: 280, unit: 'px' },
        '728x90': { value: 90, unit: 'px' },
      },
      url: 'https://images.pexels.com/photos/35025716/pexels-photo-35025716.jpeg',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};
