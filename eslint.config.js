import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Disallow && for conditional rendering, require ternary operators instead
      // This prevents issues with 0, NaN, or empty strings being rendered
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // We'll handle this manually
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXExpressionContainer > LogicalExpression[operator="&&"]',
          message:
            'Avoid using && for conditional rendering. Use ternary operator (condition ? <Component /> : null) instead to prevent rendering 0 or false.',
        },
      ],
    },
  },
]);
