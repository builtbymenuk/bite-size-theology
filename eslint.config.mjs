import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Strapi app lints/tests in its own CI job; linting it from here also swept its build output.
    "cms/**",
    // Test artifacts.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    ".playwright-mcp/**",
  ]),
]);

export default eslintConfig;
