module.exports = {
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  arrowParens: 'avoid',
  semi: true,
  printWidth: 80,
  useTabs: true,
  tabWidth: 2,
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.json'],
      options: {
        singleQuote: false,
        semi: false,
      },
    },
  ],
};
