# Mastra Studio Demo

Everything Mastra offers — **agents, tools, workflows, evals (scorers), traces, memory** — in one tiny project, all visible in a local UI, runnable with one command.

The use case is deliberately simple: **a trip planner**. The point is not the AI — it's how little code it takes to get a production-grade agent stack with a full developer UI.

## Quickstart

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY
bun install            # or: npm install
bun run dev            # or: npm run dev
```

Open **http://localhost:4111** — that's [Mastra Studio](https://mastra.ai/docs/studio/overview).

## What's inside

| Feature | Where | What to look at |
|---|---|---|
| **Agents** | `src/mastra/agents/` | 3 agents: a Weather Agent (with a tool + memory), an Activity Planner, a Packing Assistant |
| **Tools** | `src/mastra/tools/` | `weatherTool` — calls the free Open-Meteo API, typed input/output with Zod |
| **Workflow** | `src/mastra/workflows/` | `trip-planner-workflow`: code step → **two agents in parallel** → code step that merges results |
| **Evals / Scorers** | `src/mastra/scorers/` | 2 built-in scorers (tool-call accuracy, completeness) + 1 custom LLM-judged scorer |
| **Traces** | `src/mastra/index.ts` | Observability enabled — every agent call and workflow run is traced and stored locally |
| **Memory** | `agents/weather-agent.ts` | Conversation memory backed by local LibSQL |
| **Agent Editor** | `src/mastra/index.ts` (`MastraEditor`) | Edit agent instructions/tools from Studio — no code, no redeploy. Draft/publish versioning stored in `editor.db` |
| **Builder Agent (Workspace)** | `agents/builder-agent.ts` | Meta-agent with a `Workspace` (filesystem + sandbox) pointed at this project's own `src/mastra` — ask it to create a new agent and watch it appear in Studio via hot reload |

## 5-minute demo script

1. **Agents** → open *Weather Agent* → ask *"What's the weather in Paris?"*
   - Watch it call `weatherTool` live; inspect the tool call in the chat.
2. **Workflows** → open *trip-planner-workflow* → see the **graph**: the two agent steps fan out in parallel and merge back.
   - Run it with `{ "city": "Tokyo" }` and watch each step light up with its inputs/outputs.
3. **Observability** → open the trace of the run you just did — every step, LLM call, token count, and latency, nested as spans.
4. **Scorers** → see eval scores attached to the agent runs (sampling is set to 100% so every run is scored).
   - The custom scorer (`translation-quality-scorer`) is an LLM judge defined in ~50 lines: preprocess → analyze → score → reason.
5. **Agent Editor** → open *Weather Agent* → edit its instructions **directly in Studio** → *Save* (draft) → *Publish*.
   - Versions are stored in `editor.db`, not your source files — compare, roll back, full history. Code stays the source of truth for `id`/`name`/`model`.
   - *Packing Assistant* is locked (`editor: false` in code) — show the contrast.
6. **Builder Agent** (the showstopper) → open *Builder Agent* → say *"Create a haiku agent that answers everything as a haiku"*.
   - It writes `agents/haiku-agent.ts` and registers it in `index.ts` with its workspace tools; hot reload makes the new agent appear in the sidebar seconds later.
   - Note: editing `index.ts` restarts the dev server, so the builder's reply may cut off — the new agent is still created. An agent that builds agents, live.
7. Edit any agent's instructions in `src/mastra/agents/` — Studio hot-reloads.

## Why this sells itself

- **One file** (`src/mastra/index.ts`) wires the whole platform: storage, logging, tracing, agents, workflows, scorers.
- **Typed end-to-end**: workflow steps validate input/output with Zod schemas.
- **Evals are not an afterthought**: attach a scorer to an agent with 5 lines; it runs async in the background and never blocks responses.
- **The UI is free**: Studio (`mastra dev`) gives chat, workflow graphs, traces, and eval results with zero extra setup.

## Stack

- [Mastra](https://mastra.ai) `@mastra/core` + Studio
- Anthropic Claude (via Mastra's model router — swap providers by changing one string)
- LibSQL + DuckDB for local storage/traces (no external services)
- Open-Meteo for real weather data (free, no key needed)
