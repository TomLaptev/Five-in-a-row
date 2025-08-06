import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Финальные правки
  {
    rules: {
      //  Полностью отключаем правило про неиспользуемые переменные
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Разрешаем any
      "@typescript-eslint/no-explicit-any": "off",

      // Разрешаем выражения без присваивания
      "@typescript-eslint/no-unused-expressions": "off",

      // Не заставляем использовать const вместо let
      "prefer-const": "off",

      // Разрешаем пустые блоки
      "no-empty": "off",
    },
  },
];
