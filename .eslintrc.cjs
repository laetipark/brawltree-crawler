module.exports = {
  'env': {
    'node': true, 'es2021': true,
  }, 'extends': ['plugin:prettier/recommended', 'eslint:recommended'], 'overrides': [{
    'env': {
      'node': true,
    }, 'files': ['.eslintrc.{js,cjs}'], 'parserOptions': {
      'sourceType': 'script',
    },
  }],
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'ecmaVersion': 'latest', 'sourceType': 'module', 'babelOptions': {
      'plugins': ['@babel/plugin-syntax-import-assertions'],
    },
  }, 'rules': {},
};
