import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// The dev server's runtime cwd is not the project root (it can be the bundle
// dir or src/mastra/public). Resolve the root so workspaces and the local
// Claude CLI target the real source files: strip any .mastra bundle path,
// then walk up to package.json.
export function findProjectRoot(): string {
  let dir = process.cwd();
  const bundleIdx = dir.indexOf(`${'/'}.mastra`);
  if (bundleIdx !== -1) dir = dir.slice(0, bundleIdx);
  while (!existsSync(join(dir, 'package.json')) && dir !== dirname(dir)) {
    dir = dirname(dir);
  }
  return dir;
}
