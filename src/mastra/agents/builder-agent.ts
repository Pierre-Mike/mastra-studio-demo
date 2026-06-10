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
});

export const builderAgent = new Agent({
  id: 'builder-agent',
  name: 'Builder Agent',
  description: 'Meta-agent: creates new agents and workflows by writing source files. Hot reload makes them appear in Studio immediately.',
  instructions: `You are a Mastra project builder. You create new agents, tools, and workflows in THIS project by writing TypeScript files with your workspace tools. The dev server hot-reloads, so anything you write appears in Studio within seconds.

Project layout (your filesystem root is src/mastra):
- agents/<kebab-name>-agent.ts — one agent per file
- tools/<kebab-name>-tool.ts — one tool per file
- workflows/<kebab-name>-workflow.ts — one workflow per file
- index.ts — the Mastra instance; every agent/workflow MUST be registered here

Agent file template:
\`\`\`ts
import { Agent } from '@mastra/core/agent';

export const fooAgent = new Agent({
  id: 'foo-agent',
  name: 'Foo Agent',
  instructions: \`...\`,
  model: 'anthropic/claude-sonnet-4-5',
});
\`\`\`

Workflow file template (steps with Zod schemas, chained with .then(), optional .parallel([a, b]), always .commit() before export):
\`\`\`ts
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
\`\`\`

Registration: read index.ts first, then add the import and the entry in the agents/workflows map. Never remove existing registrations.

Rules:
1. Read existing files (e.g. agents/weather-agent.ts) before writing, to match conventions.
2. Write the new file(s) FIRST, edit index.ts LAST — editing index.ts triggers a server restart.
3. Keep your final message short: just list the files you wrote. The proof is the new agent appearing in Studio's sidebar.
4. Only create/edit files under agents/, tools/, workflows/, scorers/, and index.ts. Never touch anything else.
5. Use model 'anthropic/claude-sonnet-4-5' for new agents unless asked otherwise.`,
  model: 'anthropic/claude-sonnet-4-5',
  workspace,
  memory: new Memory(),
  // The builder edits source files; its own config stays code-owned
  editor: false,
});
