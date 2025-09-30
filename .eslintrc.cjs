module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['ui/**', '**/node_modules/**', '**/*.min.js', '**/lucide.min.js'],
  rules: {
    'no-unused-vars': ['warn', { args: 'none' }]
  },
  globals: {
    setTimeout: 'readonly',
    console: 'readonly',
    exports: 'readonly',
    define: 'readonly',
    self: 'readonly'
  }
};
