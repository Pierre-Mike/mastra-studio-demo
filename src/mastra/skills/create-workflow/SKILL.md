---
name: create-workflow
description: How to create a new workflow in THIS project — steps with Zod schemas, chaining (.then / .parallel), calling agents from steps, commit, and registration in index.ts. Load before creating any workflow.
metadata:
  author: mastra-studio-demo
  version: "1.0.0"
---

# Create a Workflow in This Project

## Conventions

- One workflow per file: `workflows/<kebab-name>-workflow.ts`
- Read `workflows/trip-planner-workflow.ts` first — it shows every pattern below
- Every step needs `id`, `inputSchema`, `outputSchema` (Zod), `execute`

## Skeleton

```ts
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const stepOne = createStep({
  id: 'step-one',
  description: '...',
  inputSchema: z.object({ ... }),
  outputSchema: z.object({ ... }),
  execute: async ({ inputData, mastra }) => {
    return { ... };
  },
});

const fooWorkflow = createWorkflow({
  id: 'foo-workflow',
  inputSchema: z.object({ ... }),   // = first step's inputSchema
  outputSchema: z.object({ ... }),  // = last step's outputSchema
})
  .then(stepOne);

fooWorkflow.commit(); // REQUIRED before export

export { fooWorkflow };
```

## Calling an agent from a step

```ts
const agent = mastra.getAgent('activityAgent'); // registration key, not id
const response = await agent.stream([{ role: 'user', content: '...' }]);
let text = '';
for await (const chunk of response.textStream) text += chunk;
```

## Parallel branches

`.then(a).parallel([b, c]).then(merge)` — each parallel step's `inputSchema` must match `a`'s output; `merge`'s `inputSchema` is an object keyed by step ids:

```ts
inputSchema: z.object({
  'step-b-id': z.object({ ... }),
  'step-c-id': z.object({ ... }),
}),
```

## Registration (do this LAST — it restarts the dev server)

In `index.ts`: add the import and an entry in the `workflows: { ... }` map. Never remove existing registrations.

## Finish

End your reply with one short line listing the files you wrote.
