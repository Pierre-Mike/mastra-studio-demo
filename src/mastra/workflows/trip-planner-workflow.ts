import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string(),
});

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm',
  };
  return conditions[code] || 'Unknown';
}

// Step 1 — plain code, no LLM: fetch a real forecast from Open-Meteo
const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Fetches the weather forecast for a given city',
  inputSchema: z.object({
    city: z.string().describe('The city to plan a trip for'),
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = (await geocodingResponse.json()) as {
      results: { latitude: number; longitude: number; name: string }[];
    };

    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = (await response.json()) as {
      current: { time: string; precipitation: number; weathercode: number };
      hourly: { precipitation_probability: number[]; temperature_2m: number[] };
    };

    return {
      date: new Date().toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0,
      ),
      location: name,
    };
  },
});

// Step 2a — Activity Planner agent (runs in parallel with 2b)
const planActivities = createStep({
  id: 'plan-activities',
  description: 'Suggests activities for the day based on the forecast',
  inputSchema: forecastSchema,
  outputSchema: z.object({ activities: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('activityAgent');
    const response = await agent.stream([
      {
        role: 'user',
        content: `Plan a day in ${inputData.location} given this forecast:\n${JSON.stringify(inputData, null, 2)}`,
      },
    ]);

    let activities = '';
    for await (const chunk of response.textStream) {
      activities += chunk;
    }
    return { activities };
  },
});

// Step 2b — Packing Assistant agent (runs in parallel with 2a)
const buildPackingList = createStep({
  id: 'build-packing-list',
  description: 'Builds a packing checklist based on the forecast',
  inputSchema: forecastSchema,
  outputSchema: z.object({ packingList: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('packingAgent');
    const response = await agent.stream([
      {
        role: 'user',
        content: `Build a packing list for a day in ${inputData.location} given this forecast:\n${JSON.stringify(inputData, null, 2)}`,
      },
    ]);

    let packingList = '';
    for await (const chunk of response.textStream) {
      packingList += chunk;
    }
    return { packingList };
  },
});

// Step 3 — plain code again: merge both agent outputs into one brief
const assembleBrief = createStep({
  id: 'assemble-brief',
  description: 'Merges activities and packing list into a single trip brief',
  inputSchema: z.object({
    'plan-activities': z.object({ activities: z.string() }),
    'build-packing-list': z.object({ packingList: z.string() }),
  }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async ({ inputData }) => {
    const { activities } = inputData['plan-activities'];
    const { packingList } = inputData['build-packing-list'];
    return {
      brief: `# Your Trip Brief\n\n${activities}\n\n${packingList}`,
    };
  },
});

const tripPlannerWorkflow = createWorkflow({
  id: 'trip-planner-workflow',
  inputSchema: z.object({
    city: z.string().describe('The city to plan a trip for'),
  }),
  outputSchema: z.object({ brief: z.string() }),
})
  .then(fetchWeather)
  .parallel([planActivities, buildPackingList])
  .then(assembleBrief);

tripPlannerWorkflow.commit();

export { tripPlannerWorkflow };
