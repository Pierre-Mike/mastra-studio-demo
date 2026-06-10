import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// The dev server's runtime cwd is not the project root (it can be the bundle
// dir or src/mastra/public). Resolve the root so the workspace targets the
// real source files: strip any .mastra bundle path, then walk up to package.json.
function findProjectRoot(): string {
  let dir = process.cwd();
  const bundleIdx = dir.indexOf(`${'/'}.mastra`);
  if (bundleIdx !== -1) dir = dir.slice(0, bundleIdx);
  while (!existsSync(join(dir, 'package.json')) && dir !== dirname(dir)) {
    dir = dirname(dir);
  }
  return dir;
}

const projectRoot = findProjectRoot();

const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath: join(projectRoot, 'src/mastra') }),
  sandbox: new LocalSandbox({ workingDirectory: projectRoot }),
  // SKILL.md dirs under src/mastra/skills/ — listed in the system prompt by
  // name only; the agent loads full instructions on demand via skill tools
  skills: ['skills'],
});

export const builderAgent = new Agent({
  id: 'builder-agent',
  name: 'Builder Agent',
  description: 'Meta-agent: creates new agents and workflows by writing source files. Hot reload makes them appear in Studio immediately.',
  instructions: `You are a Mastra project builder. You create new agents, tools, workflows, and scorers in THIS project by writing TypeScript files with your workspace tools. The dev server hot-reloads, so anything you write appears in Studio within seconds.

ALWAYS load the matching skill BEFORE building anything:
- create-agent — new agent (and optional tool)
- create-workflow — new workflow
- create-scorer — new eval scorer or attaching one
- mastra — general framework/API questions and anything not covered above

Follow the loaded skill exactly. Only create/edit files under agents/, tools/, workflows/, scorers/, and index.ts — never touch skills/ or anything else.`,
  model: 'anthropic/claude-sonnet-4-5',
  workspace,
  memory: new Memory(),
  // The builder edits source files; its own config stays code-owned
  editor: false,
});
