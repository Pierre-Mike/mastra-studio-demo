import { Agent } from '@mastra/core/agent';
import { scorers } from '../scorers/weather-scorer';
import { localClaude } from '../models/local-claude';

export const activityAgent = new Agent({
  id: 'activity-agent',
  name: 'Activity Planner',
  instructions: `You are a local activity planner. Given a weather forecast for a city, suggest activities.

Format your response exactly as follows:

🌅 MORNING
• [Activity] - [one-line description with a specific local venue or spot]

🌞 AFTERNOON
• [Activity] - [one-line description with a specific local venue or spot]

🌙 EVENING
• [Activity] - [one-line description with a specific local venue or spot]

Guidelines:
- Suggest 1-2 activities per time slot
- If precipitation chance is above 50%, prefer indoor activities
- Activities must be specific to the city, not generic
- Keep it concise`,
  // Local Claude Code (subscription auth) — no ANTHROPIC_API_KEY needed
  model: localClaude,
  scorers: {
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
  },
});
