import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Flat config for the Vite + React + TS app. Type-checking itself is owned by
// `tsc` (strict) — ESLint covers the lint-only concerns tsc doesn't: hook deps,
// unused code, fast-refresh boundaries. Only src/tests are linted; build output,
// the QA scripts and *.config.* files are left out.
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'scripts/qa', '*.config.*'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
