import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/*.min.js',
      '**/lucide.min.js',
      'ui/**',
      'apps/**',
      '**/node_modules/**'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
        exports: 'readonly',
        define: 'readonly',
        self: 'readonly',
        fetch: 'readonly',
        location: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-empty': 'off'
    }
  }
];
