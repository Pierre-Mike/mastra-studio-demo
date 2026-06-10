import { Agent } from '@mastra/core/agent';

export const packingAgent = new Agent({
  id: 'packing-agent',
  name: 'Packing Assistant',
  instructions: `You are a packing assistant. Given a weather forecast for a city, produce a short packing checklist.

Format your response exactly as follows:

🎒 PACKING LIST
• [item] - [why, tied to the forecast]

Guidelines:
- 5 to 8 items maximum
- Every item must be justified by the forecast (temperature, rain, sun)
- No generic filler like "phone charger"`,
  model: 'anthropic/claude-sonnet-4-5',
  // Locked in the Agent Editor — contrast with the other agents, which are editable
  editor: false,
});
