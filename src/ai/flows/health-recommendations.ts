
'use server';

/**
 * @fileOverview A health recommendation AI agent that analyzes user data
 * (medications, appointments, vitals, vitals history) and provides personalized
 * recommendations for improving health habits, including an audio version.
 *
 * - getHealthRecommendations - A function that handles the health recommendation process.
 * - HealthRecommendationsInput - The input type for the getHealthRecommendations function.
 * - HealthRecommendationsOutput - The return type for the getHealthRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateSpeech } from './text-to-speech-flow';

const HealthRecommendationsInputSchema = z.object({
  medications: z
    .string()
    .describe('List of medications the user is currently taking.'),
  appointments:
    z.string().describe('List of upcoming and past medical appointments.'),
  vitals: z
    .string()
    .describe(
      'A summary of the user CURRENT vitals including weight, height, blood pressure, heart rate, and temperature.'
    ),
  vitalsHistory: z
    .string()
    .optional()
    .describe(
      "A summary of the user's RECENT vital signs history, if available. E.g., 'Weight: 70kg (15/07), 71kg (22/07). BP: 120/80 (15/07), 125/82 (22/07). etc.'"
    ),
  userPreferences: z
    .string()
    .optional()
    .describe('Any user preferences related to health recommendations.'),
});

export type HealthRecommendationsInput = z.infer<
  typeof HealthRecommendationsInputSchema
>;

const HealthRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'Personalized health recommendations based on the user data provided.'
    ),
  reasoning: z
    .string()
    .describe('Explanation of why the recommendations were made.'),
  audioDataUri: z.string().optional().describe('A data URI for the audio version of the recommendations.'),
});

export type HealthRecommendationsOutput = z.infer<
  typeof HealthRecommendationsOutputSchema
>;

export async function getHealthRecommendations(
  input: HealthRecommendationsInput
): Promise<HealthRecommendationsOutput> {
  return healthRecommendationsFlow(input);
}

// Define a schema for the text-only output of the prompt
const TextOutputSchema = z.object({
  recommendations: HealthRecommendationsOutputSchema.shape.recommendations,
  reasoning: HealthRecommendationsOutputSchema.shape.reasoning,
});


const prompt = ai.definePrompt({
  name: 'healthRecommendationsPrompt',
  input: {schema: HealthRecommendationsInputSchema},
  output: {schema: TextOutputSchema},
  prompt: `You are an AI health assistant providing personalized health recommendations.

  Analyze the user's health data, including medications, appointments, current vitals, and recent vitals history (if provided), to provide actionable recommendations.
  Explain your reasoning for each recommendation. If a vitals history is provided, try to identify any simple trends and consider them in your reasoning.

  Medications: {{{medications}}}
  Appointments: {{{appointments}}}
  Current Vitals: {{{vitals}}}
  Recent Vitals History: {{{vitalsHistory}}}
  User Preferences: {{{userPreferences}}}

  Provide your recommendations and reasoning in the following format:
  Recommendations: [List of recommendations]
  Reasoning: [Explanation of reasoning for the recommendations]`,
});

const healthRecommendationsFlow = ai.defineFlow(
  {
    name: 'healthRecommendationsFlow',
    inputSchema: HealthRecommendationsInputSchema,
    outputSchema: HealthRecommendationsOutputSchema,
  },
  async input => {
    const {output: textOutput} = await prompt(input);
    
    if (!textOutput) {
        throw new Error("Failed to generate text recommendations.");
    }
    
    try {
        const speechResult = await generateSpeech({ text: textOutput.recommendations });
        return {
            ...textOutput,
            audioDataUri: speechResult.media,
        };
    } catch (error) {
        console.error("Failed to generate speech, returning text only.", error);
        return {
            ...textOutput,
            audioDataUri: undefined,
        };
    }
  }
);
