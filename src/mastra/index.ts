import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from '@mastra/observability';
import { MastraEditor } from '@mastra/editor';
import { tripPlannerWorkflow } from './workflows/trip-planner-workflow';
import { weatherAgent } from './agents/weather-agent';
import { activityAgent } from './agents/activity-agent';
import { packingAgent } from './agents/packing-agent';
import { builderAgent } from './agents/builder-agent';
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from './scorers/weather-scorer';

export const mastra = new Mastra({
  workflows: { tripPlannerWorkflow },
  agents: { weatherAgent, activityAgent, packingAgent, builderAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: 'file:./mastra.db',
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
      // Agent Editor drafts/published versions live in their own local db
      editor: new LibSQLStore({
        id: 'mastra-editor',
        url: 'file:./editor.db',
      }),
    },
  }),
  // Agent Editor: edit instructions/tools from Studio with draft/publish versioning
  editor: new MastraEditor(),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra-studio-demo',
        exporters: [
          new MastraStorageExporter(), // Persists traces to local storage (visible in Studio)
          new MastraPlatformExporter(), // Sends traces to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts passwords, tokens, keys
        ],
      },
    },
  }),
});
