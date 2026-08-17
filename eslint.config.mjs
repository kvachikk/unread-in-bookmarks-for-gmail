import configMetarhia from 'eslint-config-metarhia';
import globals from 'globals';

const [baseConfig] = configMetarhia;

export default [
  {
    // dist/ is a copy of src/ with one manifest swapped in — linting it would
    // only report every finding twice more.
    ignores: ['dist/*', 'artifacts/*', 'node_modules/*'],
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
    // The extension ships ES modules: both browsers load the background as
    // `"type": "module"`, and the options page as a module script.
    files: ['src/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'module',
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
