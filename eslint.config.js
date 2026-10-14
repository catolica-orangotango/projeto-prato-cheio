import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['coverage/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  // Desliga as regras de formatação: quem cuida disso é o Prettier.
  prettier,
];
