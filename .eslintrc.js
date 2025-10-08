module.exports = {
  root: true,
  extends: 'airbnb-typescript/base',
  plugins: ['prettier', 'no-secrets'],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    'no-var': 'error',
    'no-console': 'error',
    'no-secrets/no-secrets':['error', { 
      'ignoreIdentifiers':[
        'RANDOM_CHAR', 
        'DEFAULT_IMG_URL',
        'DEFAULT_MONGODB_URL', 
        'DEFAULT_FE_URL', 
        'DEFAULT_TANANT_CONNECTION',
        'DEFAULT_DOMAIN_CONNECTION',
      ] }],
    'import/extensions': [
      'off',
      'ignorePackages',
      {
        'js': 'never',
        'jsx': 'never',
        'ts': 'never',
        'tsx': 'never',
      },
    ],
    'import/no-extraneous-dependencies': 'off',
  },
  env: {
    node: true,
  },
};
