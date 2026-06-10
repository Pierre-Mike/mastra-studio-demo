import { createClaudeCode, createCustomMcpServer } from 'ai-sdk-provider-claude-code';
import { z } from 'zod';
import { getWeather } from '../tools/weather-tool';
import { findProjectRoot } from '../lib/project-root';

// Every model here runs through the LOCAL Claude Code install (the Agent SDK
// spawns `claude` headlessly per request), so auth comes from your Pro/Max
// subscription login — no ANTHROPIC_API_KEY required.
// strictMcpConfig keeps the headless runs hermetic: only MCP servers declared
// here connect — not the ones from your personal ~/.claude.json.
const claude = createClaudeCode({ defaultSettings: { strictMcpConfig: true } });

// Plain chat model: Claude Code's own tools (Bash, Read, Write, ...) disabled.
export const localClaude = claude('sonnet', { tools: [] });

// This provider does NOT forward AI SDK call-level tools to the model — only
// Claude Code's built-in tools and MCP servers reach it. The weather tool is
// therefore bridged as an in-process MCP tool sharing the same fetch logic.
const weatherMcp = createCustomMcpServer({
  name: 'weather',
  tools: {
    get_weather: {
      description:
        'Get current weather for a location. Use this whenever the user asks about weather.',
      inputSchema: z.object({ location: z.string().describe('City name') }),
      handler: async (args) => {
        const result = await getWeather(String(args.location));
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      },
    },
  },
});

export const localClaudeWeather = claude('sonnet', {
  tools: [],
  mcpServers: { weather: weatherMcp },
  allowedTools: ['mcp__weather__get_weather'],
});

// Builder model: instead of Mastra workspace tools (also call-level, so not
// forwarded), the builder uses Claude Code's native file tools rooted at the
// project. acceptEdits auto-approves file writes in headless mode.
export const localClaudeBuilder = claude('sonnet', {
  cwd: findProjectRoot(),
  tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
  permissionMode: 'acceptEdits',
});
