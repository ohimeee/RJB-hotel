// Resolution hooks that let plain Node import the app's modules.
//
// Two things TypeScript does that Node does not:
//   1. the `@/…` path alias from tsconfig.json
//   2. extensionless imports — `@/lib/db` means `lib/db.ts`
//
// Node 24 strips the types out of a .ts file by itself, so once specifiers
// resolve, the real application code runs unmodified. Loaded by ts-alias.mjs.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = new URL("../", import.meta.url);

const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs"];

/** `lib/db` -> `lib/db.ts`, and `lib/foo` -> `lib/foo/index.ts`. */
const withExtension = (url) => {
  if (existsSync(fileURLToPath(url)) && !url.href.endsWith("/")) return url;

  for (const extension of EXTENSIONS) {
    const candidate = new URL(url.href + extension);
    if (existsSync(fileURLToPath(candidate))) return candidate;
  }

  for (const extension of EXTENSIONS) {
    const candidate = new URL(`${url.href}/index${extension}`);
    if (existsSync(fileURLToPath(candidate))) return candidate;
  }

  return url;
};

export const resolve = async (specifier, context, next) => {
  if (specifier.startsWith("@/")) {
    const target = withExtension(new URL(specifier.slice(2), projectRoot));
    return next(target.href, context);
  }

  // Relative imports between .ts files have the same extensionless habit.
  if (specifier.startsWith(".") && context.parentURL?.includes("/lib/")) {
    const target = withExtension(new URL(specifier, context.parentURL));
    return next(target.href, context);
  }

  return next(specifier, context);
};
