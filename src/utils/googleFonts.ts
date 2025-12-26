import { GOOGLE_FONTS } from '../consts';

const loadedFonts = new Set<string>();
let linkElement: HTMLLinkElement | null = null;

export function loadGoogleFonts(fonts: string[]) {
  // Filter to only Google Fonts (exclude system fonts like Arial)
  const googleFontsToLoad = fonts.filter((font) => 
    GOOGLE_FONTS.includes(font) && font !== 'Arial'
  );

  if (googleFontsToLoad.length === 0) {
    return;
  }

  // Add new fonts to the set
  googleFontsToLoad.forEach((font) => loadedFonts.add(font));

  // Build the Google Fonts URL with weights 300, 400, 700
  const fontFamilies = Array.from(loadedFonts)
    .map((font) => `family=${encodeURIComponent(font)}:wght@300;400;700`)
    .join('&');

  const url = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

  // Update or create the link element
  if (!linkElement) {
    linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    document.head.appendChild(linkElement);
  }

  linkElement.href = url;
}

export function getGoogleFontsLink(fonts: string[]): string {
  // Filter to only Google Fonts (exclude system fonts like Arial) and deduplicate
  const uniqueFonts = [...new Set(fonts.filter((font) => 
    GOOGLE_FONTS.includes(font) && font !== 'Arial'
  ))];

  if (uniqueFonts.length === 0) {
    return '';
  }

  // Build the Google Fonts URL with weights 300, 400, 700
  const fontFamilies = uniqueFonts
    .map((font) => `family=${encodeURIComponent(font)}:wght@300;400;700`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;
}
