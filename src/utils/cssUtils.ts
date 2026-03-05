/**
 * Scopes all CSS rules in `css` to `scopeSelector`.
 *
 * Selector rewriting rules:
 *  - `&`           → `scopeSelector`           (the layer element itself)
 *  - `&:hover`     → `scopeSelector:hover`      (& prefix replaced)
 *  - `.foo`        → `scopeSelector .foo`       (descendant)
 *  - `&, .foo`     → `scopeSelector, scopeSelector .foo`  (comma lists supported)
 *
 * @-rules (e.g. @keyframes, @media) are passed through unchanged.
 */
export function scopeCSS(css: string, scopeSelector: string): string {
  if (!css || !css.trim()) return '';

  // Match "selector { declarations }" blocks where neither the selector
  // nor the declarations themselves contain nested braces (flat CSS only).
  return css.replace(/([^{}@]+)\{([^{}]*)\}/g, (_match, rawSelector, declarations) => {
    const selector = rawSelector.trim();
    if (!selector) return `{ ${declarations}}`;

    const scoped = selector
      .split(',')
      .map((s: string) => {
        const t = s.trim();
        if (!t) return '';
        // Bare & → the element itself
        if (t === '&') return scopeSelector;
        // & prefix with pseudo-class/element e.g. &:hover, &::before
        if (t.startsWith('&')) return `${scopeSelector}${t.slice(1)}`;
        // & somewhere in the middle
        if (t.includes('&')) return t.replace(/&/g, scopeSelector);
        // Everything else → descendant of the layer
        return `${scopeSelector} ${t}`;
      })
      .filter(Boolean)
      .join(', ');

    return `${scoped} {${declarations}}`;
  });
}
