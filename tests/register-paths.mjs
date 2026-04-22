import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

process.env.DATABASE_URL ??= "postgres://postgres:postgres@127.0.0.1:5432/kxoxxydex_test";
process.env.AUTH_URL ??= "http://localhost:3000";
process.env.AUTH_SECRET ??= "test-auth-secret";

const projectRoot = process.cwd();
const shimPaths = new Map([
  ["server-only", "tests/shims/server-only.mjs"],
  ["next/server", "tests/shims/next-server.mjs"],
  ["next/cache", "tests/shims/next-cache.mjs"],
]);

registerHooks({
  resolve(specifier, context, defaultResolve) {
    const shimPath = shimPaths.get(specifier);

    if (shimPath) {
      const resolvedUrl = pathToFileURL(path.join(projectRoot, shimPath)).href;
      return defaultResolve(resolvedUrl, context);
    }

    if (specifier.startsWith("@/")) {
      const relativePath = specifier.slice(2);
      const filename = path.extname(relativePath) === "" ? `${relativePath}.ts` : relativePath;
      const resolvedUrl = pathToFileURL(path.join(projectRoot, filename)).href;
      return defaultResolve(resolvedUrl, context);
    }

    return defaultResolve(specifier, context);
  },
});
