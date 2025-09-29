module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [ 'eslint:recommended' ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['ui/**','apps/**','**/node_modules/**'],
  rules: {
    'no-unused-vars': ['warn', { args: 'none' }],
    'no-undef': 'error'
  }
}

