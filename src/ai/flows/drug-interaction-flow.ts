'use server';
/**
 * @fileOverview An AI agent for checking potential drug interactions.
 *
 * - checkDrugInteractions - A function that handles the drug interaction analysis.
 * - DrugInteractionInput - The input type for the checkDrugInteractions function.
 * - DrugInteractionOutput - The return type for the checkDrugInteractions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DrugInteractionInputSchema = z.object({
  medications: z.array(z.string()).describe('A list of medication names to check for interactions.'),
});
export type DrugInteractionInput = z.infer<typeof DrugInteractionInputSchema>;

const InteractionDetailSchema = z.object({
  medicationsInvolved: z.array(z.string()).describe('The specific medications that interact.'),
  severity: z.enum(['Mineure', 'Modérée', 'Sévère']).describe('The severity of the interaction.'),
  description: z.string().describe('A description of the potential interaction and its effects.'),
  recommendation: z.string().describe('Recommendations for managing the interaction (e.g., monitor symptoms, consult doctor).'),
});

const DrugInteractionOutputSchema = z.object({
  hasInteractions: z.boolean().describe('Whether any potential interactions were found.'),
  summary: z.string().describe('A brief summary of the findings.'),
  interactions: z.array(InteractionDetailSchema).describe('A list of detailed potential interactions.'),
});
export type DrugInteractionOutput = z.infer<typeof DrugInteractionOutputSchema>;

export async function checkDrugInteractions(input: DrugInteractionInput): Promise<DrugInteractionOutput> {
  return drugInteractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'drugInteractionPrompt',
  input: {schema: DrugInteractionInputSchema},
  output: {schema: DrugInteractionOutputSchema},
  prompt: `You are an expert pharmacologist AI assistant. Your task is to analyze a list of medications and identify potential drug-drug interactions. Your responses must be in French.

  For the given list of medications, provide a detailed analysis of any potential interactions.
  - If no interactions are found, set hasInteractions to false and provide a reassuring summary.
  - If interactions are found, set hasInteractions to true. For each interaction, detail:
    - The medications involved.
    - The severity level (Mineure, Modérée, Sévère).
    - A clear description of the interaction.
    - A professional recommendation.

  IMPORTANT: Include a disclaimer that this information is for educational purposes and does not replace professional medical advice. The user should always consult a healthcare provider.

  Medications to analyze:
  {{#each medications}}
  - {{{this}}}
  {{/each}}
  `,
});

const drugInteractionFlow = ai.defineFlow(
  {
    name: 'drugInteractionFlow',
    inputSchema: DrugInteractionInputSchema,
    outputSchema: DrugInteractionOutputSchema,
  },
  async (input) => {
    if (input.medications.length < 2) {
        return {
            hasInteractions: false,
            summary: "Au moins deux médicaments sont nécessaires pour vérifier les interactions.",
            interactions: [],
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
