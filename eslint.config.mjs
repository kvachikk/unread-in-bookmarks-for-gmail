import configMetarhia from 'eslint-config-metarhia';
import globals from 'globals';

const [baseConfig] = configMetarhia;

export default [
  {
    ignores: ['artifacts/*', 'node_modules/*'],
  },
  {
    ...baseConfig,
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ...baseConfig.languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    // The extension ships classic scripts sharing one global scope, not
    // modules — the manifest loads lib/ ahead of the background script.
    files: ['src/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['tools/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
