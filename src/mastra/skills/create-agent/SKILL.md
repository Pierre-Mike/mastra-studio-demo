---
name: create-agent
description: How to create a new agent (and optionally a tool for it) in THIS project — file conventions, template, and registration in index.ts. Load before creating any agent.
metadata:
  author: mastra-studio-demo
  version: "1.0.0"
---

# Create an Agent in This Project

## Conventions

- One agent per file: `agents/<kebab-name>-agent.ts`
- Export name: camelCase, e.g. `export const haikuAgent`
- `id`: kebab-case, e.g. `'haiku-agent'`
- Model: `'anthropic/claude-sonnet-4-5'` unless the user asks otherwise
- Read `agents/weather-agent.ts` first to match style

## Agent template

```ts
import { Agent } from '@mastra/core/agent';

export const fooAgent = new Agent({
  id: 'foo-agent',
  name: 'Foo Agent',
  instructions: `You are ...

Format your response exactly as follows:
...

Guidelines:
- ...`,
  model: 'anthropic/claude-sonnet-4-5',
});
```

## Optional: tool for the agent

One tool per file: `tools/<kebab-name>-tool.ts`. See `tools/weather-tool.ts` for the `createTool` pattern (Zod `inputSchema`/`outputSchema`, async `execute`). Pass it via `tools: { fooTool }` on the agent.

## Registration (do this LAST — it restarts the dev server)

In `index.ts`:
1. Add `import { fooAgent } from './agents/foo-agent';`
2. Add `fooAgent` to the `agents: { ... }` map

Never remove existing registrations.

## Finish

End your reply with one short line listing the files you wrote. The new agent appears in Studio's sidebar after hot reload.
