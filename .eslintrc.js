module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  ignorePatterns: ["node_modules/", "webpack.config.js"],
  settings: {
    "react": {
      "pragma": "React",
      "version": "detect",
    },
  },
  rules: {
    "@typescript-eslint/no-use-before-define": ["error", { "functions": false }],
    "@typescript-eslint/explicit-function-return-type": ["warn", {
      "allowTypedFunctionExpressions": true,
      "allowHigherOrderFunctions": true
    }]
  }
};