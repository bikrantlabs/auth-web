import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const typedFiles = ["**/*.{ts,tsx,mts}"];

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typedFiles,
  })),
  {
    name: "project/typescript",
    files: typedFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Type-aware rules that already flag the current tree; kept as warnings
      // so adopting the config is non-breaking. Tighten once the code is clean.
      "@typescript-eslint/no-base-to-string": "warn",
      // Next.js Server Actions must be async even when they don't await
      // anything, so this rule would push code toward an invalid signature.
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    name: "project/rules",
    plugins: {
      unicorn,
      "unused-imports": unusedImports,
    },
    rules: {
      // Catch unused code and imports. `unused-imports` is the fixable half;
      // the TypeScript rule above handles variables and arguments. Kept as a
      // warning so pre-existing unused imports don't block lint.
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": "off",

      // Import ordering is handled by @ianvs/prettier-plugin-sort-imports.

      // General correctness and readability.
      curly: ["warn", "multi-line"],
      eqeqeq: ["error", "smart"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-else-return": ["warn", { allowElseIf: false }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next/dist", "next/dist/**"],
              message:
                "Import from Next.js public entry points instead of next/dist internals.",
            },
          ],
        },
      ],
      "no-var": "error",
      "object-shorthand": ["warn", "always"],
      "prefer-const": "error",
      "prefer-template": "warn",

      // A focused subset of Unicorn instead of the full preset, which is
      // intentionally opinionated about naming and project structure.
      "unicorn/better-regex": "warn",
      "unicorn/error-message": "warn",
      "unicorn/explicit-length-check": "warn",
      "unicorn/no-lonely-if": "warn",
      "unicorn/no-negated-condition": "warn",
      "unicorn/no-useless-undefined": "warn",
      "unicorn/prefer-array-flat-map": "warn",
      "unicorn/prefer-includes": "warn",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "warn",
      "unicorn/prefer-optional-catch-binding": "warn",
      "unicorn/prefer-string-replace-all": "warn",
      "unicorn/throw-new-error": "error",
    },
  },
  // Must stay last: turns off stylistic rules that would fight Prettier.
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
