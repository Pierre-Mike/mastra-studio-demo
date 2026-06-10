import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { join } from 'node:path';
import { localClaudeBuilder } from '../models/local-claude';
import { findProjectRoot } from '../lib/project-root';

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
  instructions: `You are a Mastra project builder. You create new agents, tools, workflows, and scorers in THIS project by writing TypeScript files with your file tools (Read, Write, Edit, Glob, Grep). The dev server hot-reloads, so anything you write appears in Studio within seconds.

ALWAYS read the matching skill file at src/mastra/skills/<name>/SKILL.md BEFORE building anything:
- create-agent — new agent (and optional tool)
- create-workflow — new workflow
- create-scorer — new eval scorer or attaching one
- mastra — general framework/API questions and anything not covered above

Follow the loaded skill exactly. Only create/edit files under src/mastra/agents/, src/mastra/tools/, src/mastra/workflows/, src/mastra/scorers/, and src/mastra/index.ts — never touch skills/ or anything else.`,
  // Local Claude Code (subscription auth) with its native file tools rooted at
  // the project — replaces the workspace tools, which the local-claude provider
  // can't forward. The workspace stays so the skills list appears in the prompt.
  model: localClaudeBuilder,
  workspace,
  memory: new Memory(),
  // The builder edits source files; its own config stays code-owned
  editor: false,
});
