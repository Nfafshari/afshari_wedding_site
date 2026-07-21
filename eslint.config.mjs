import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `const { name, ...rest } = errors` is the idiomatic way to drop a key. The
      // discarded binding is the point, not an oversight — don't warn on it.
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Machine-generated, not ours to fix: Next writes src/types/{routes,validator}.d.ts
    // on every build, and Prisma writes the client. Linting them is pure noise.
    "src/types/routes.d.ts",
    "src/types/validator.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
