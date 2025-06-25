import { config } from 'dotenv';
config();

import '@/ai/flows/health-recommendations.ts';
import '@/ai/flows/drug-interaction-flow.ts';
import '@/ai/flows/summarize-patient-record-flow.ts';
import '@/ai/flows/analyze-test-result-photo-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
