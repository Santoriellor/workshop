const js = require('@eslint/js')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    // eslint.config.js itself is CommonJS tooling config, not application
    // source; .eslintrc.js was excluded the same way by ESLint's default
    // dotfile ignore, which does not apply to this un-dotted filename.
    ignores: ['build/**', 'dist/**', 'node_modules/**', 'eslint.config.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Was `env: { browser: true, es2021: true }` in .eslintrc.js.
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        btoa: 'readonly',
        // vitest globals, enabled by `test.globals: true` in vite.config.js.
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
      },
    },
    plugins: { react, 'react-hooks': reactHooks, prettier },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      // Copied verbatim from .eslintrc.js - same rules, same severities.
      'prettier/prettier': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    // getUserNameById reads `users` via closure and is redefined every
    // render; adding it (or `users`) to the useMemo deps would make the
    // memo recompute every render, which is a behaviour change this
    // formatting pass must not make. Deferred - see
    // docs/decisions/0005-deferred-findings.md, "Found during Task 15".
    files: ['src/components/reports/ReportCard.jsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]
