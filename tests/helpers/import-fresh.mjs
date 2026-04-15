import path from "node:path";
import { pathToFileURL } from "node:url";

export async function importFresh(modulePath) {
  const resolvedUrl = pathToFileURL(path.join(process.cwd(), modulePath)).href;
  return import(`${resolvedUrl}?t=${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
