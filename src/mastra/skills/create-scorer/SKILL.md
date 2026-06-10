---
name: create-scorer
description: How to create an eval scorer (built-in or custom LLM-judge) in THIS project and attach it to an agent. Load before creating or attaching any scorer.
metadata:
  author: mastra-studio-demo
  version: "1.0.0"
---

# Create a Scorer in This Project

## Conventions

- Scorers live in `scorers/` — read `scorers/weather-scorer.ts` first, it has all three patterns
- Register new scorers in `index.ts` under `scorers: { ... }` so they show in Studio

## Built-in scorers (prefer when one fits)

```ts
import { createCompletenessScorer, createToolCallAccuracyScorerCode } from '@mastra/evals/scorers/prebuilt';

export const myCompleteness = createCompletenessScorer();
```

## Custom LLM-judge scorer

```ts
import { createScorer } from '@mastra/core/evals';
import { z } from 'zod';

export const fooScorer = createScorer({
  id: 'foo-scorer',
  name: 'Foo Quality',
  description: '...',
  type: 'agent',
  judge: { model: 'anthropic/claude-sonnet-4-5', instructions: '...' },
})
  .preprocess(({ run }) => ({ /* extract text from run.input / run.output */ }))
  .analyze({
    description: '...',
    outputSchema: z.object({ ... }),
    createPrompt: ({ results }) => `...${results.preprocessStepResult...}...`,
  })
  .generateScore(({ results }) => /* number 0..1 */)
  .generateReason(({ results, score }) => `...`);
```

## Attach to an agent

```ts
scorers: {
  fooQuality: {
    scorer: fooScorer,
    sampling: { type: 'ratio', rate: 1 }, // 1 = score every run (demo); lower in prod
  },
},
```

## Registration (do this LAST — it restarts the dev server)

Add the scorer to `scorers: { ... }` in `index.ts`, and to the target agent's `scorers` map.

## Finish

End your reply with one short line listing the files you wrote.
