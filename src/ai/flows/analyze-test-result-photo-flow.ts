'use server';
/**
 * @fileOverview An AI agent for analyzing medical test result documents from photos.
 *
 * - analyzeTestResultPhoto - A function that handles the analysis of a photo of a medical test result.
 * - AnalyzeTestResultPhotoInput - The input type for the analyzeTestResultPhoto function.
 * - AnalyzeTestResultPhotoOutput - The return type for the analyzeTestResultPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnalyzeTestResultPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a medical test result document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeTestResultPhotoInput = z.infer<typeof AnalyzeTestResultPhotoInputSchema>;


const KeyResultSchema = z.object({
    parameter: z.string().describe("The name of the measured parameter (e.g., 'Hémoglobine', 'Cholestérol total')."),
    value: z.string().describe("The measured value (e.g., '14.5', '2.1')."),
    unit: z.string().describe("The unit of measurement (e.g., 'g/dL', 'g/L', 'mg/dL')."),
    referenceRange: z.string().optional().describe("The reference range for the parameter (e.g., '13.5 - 17.5').")
});

export const AnalyzeTestResultPhotoOutputSchema = z.object({
  testName: z.string().describe("The main title or name of the medical test (e.g., 'Numération Formule Sanguine', 'Bilan Lipidique')."),
  testDate: z.string().describe("The date the test was performed, in YYYY-MM-DD format. If not found, use today's date."),
  patientName: z.string().describe("The full name of the patient as it appears on the document."),
  keyResults: z.array(KeyResultSchema).describe("An array of key results extracted from the document."),
  summary: z.string().describe("A brief, one-sentence summary of the overall result (e.g., 'Les résultats de la numération formule sanguine sont dans les limites de la normale.'). Respond in French."),
});
export type AnalyzeTestResultPhotoOutput = z.infer<typeof AnalyzeTestResultPhotoOutputSchema>;

export async function analyzeTestResultPhoto(input: AnalyzeTestResultPhotoInput): Promise<AnalyzeTestResultPhotoOutput> {
  return analyzeTestResultPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTestResultPhotoPrompt',
  input: {schema: AnalyzeTestResultPhotoInputSchema},
  output: {schema: AnalyzeTestResultPhotoOutputSchema},
  prompt: `You are an expert medical data entry AI. Your task is to analyze the provided image of a medical test result document and extract key information in a structured format. The document is likely in French.

  Analyze the image and extract the following information:
  - The main name of the test.
  - The date the test was conducted. If you cannot find a date, use the current date.
  - The full name of the patient.
  - A list of key parameters, their values, units, and reference ranges if available.
  - A concise one-sentence summary of the results in French.

  Photo of the document: {{media url=photoDataUri}}
  
  Please provide the output in the specified JSON format.`,
});

const analyzeTestResultPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeTestResultPhotoFlow',
    inputSchema: AnalyzeTestResultPhotoInputSchema,
    outputSchema: AnalyzeTestResultPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
