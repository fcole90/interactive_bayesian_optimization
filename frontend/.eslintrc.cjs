/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2020,
    'project': ['tsconfig.json'],
    'sourceType': 'module',
  },
  plugins: ['@typescript-eslint'],
  root: true,
  'rules': {
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['error', 2],
    'jsx-quotes': ['error', 'prefer-double'],
    'no-multiple-empty-lines': 'error',
    'no-multi-spaces': 'error',
    'no-return-await': 'off',
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': ['error', 'properties'],
    'padded-blocks': ['error', 'never'],
    'quotes': ['error', 'single'],
    'require-await': 'off',
    'semi': ['error', 'never'],

    'react/prop-types': 'off',

    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      },
    ],
    '@typescript-eslint/return-await': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
  },
}