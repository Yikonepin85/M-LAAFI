'use server';
/**
 * @fileOverview An AI agent for summarizing a patient's medical record.
 *
 * - summarizePatientRecord - A function that handles the patient record summarization.
 * - PatientRecordInput - The input type for the summarizePatientRecord function.
 * - PatientRecordOutput - The return type for the summarizePatientRecord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PatientRecordInputSchema = z.object({
  consultations: z.string().describe("A summary of the patient's past consultations, including dates, doctors, and notes."),
  medications: z.string().describe("A list of the patient's current and past medications, including names and treatment dates."),
  medicalTests: z.string().describe("A list of the patient's medical tests, including names, dates, and results if available."),
  appointments: z.string().describe("A summary of the patient's past and upcoming appointments."),
  vitalsHistory: z.string().describe("A summary of the patient's recent vital signs history."),
  patientInfo: z.string().describe("Basic information about the patient, like name, age, and sex."),
});
export type PatientRecordInput = z.infer<typeof PatientRecordInputSchema>;

const PatientRecordOutputSchema = z.object({
    overview: z.string().describe("Brief intro with patient info (name, age, sex)."),
    keyMedicalHistory: z.string().describe("Highlight major past events, chronic conditions, or significant diagnoses from consultations. Use bullet points."),
    currentStatus: z.string().describe("Focus on the most recent consultations, active medications, and recent test results. Use bullet points."),
    importantTrends: z.string().describe("Note any observable trends in vital signs from the history provided. Use bullet points."),
    upcomingActions: z.string().describe("List any upcoming appointments."),
    potentialRisks: z.string().describe("A summary of potential risks, including potential drug-drug interactions based on the medication list or any concerning trends in vital signs. Use bullet points. If none, state 'Aucun risque immédiat identifié'.")
});
export type PatientRecordOutput = z.infer<typeof PatientRecordOutputSchema>;

export async function summarizePatientRecord(input: PatientRecordInput): Promise<PatientRecordOutput> {
  return summarizePatientRecordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientRecordPrompt',
  input: {schema: PatientRecordInputSchema},
  output: {schema: PatientRecordOutputSchema},
  prompt: `You are an expert medical assistant AI. Your task is to create a professional, structured summary of a patient's medical record based on the data provided. The summary should be easy for a healthcare provider to read quickly. Fill out all fields of the output schema.

  Patient Information:
  {{{patientInfo}}}

  Consultation History:
  {{{consultations}}}

  Medication History:
  {{{medications}}}

  Medical Test History:
  {{{medicalTests}}}
  
  Appointment History:
  {{{appointments}}}

  Vitals History (from consultations):
  {{{vitalsHistory}}}

  Generate the structured summary now. For the 'potentialRisks' section, specifically look for interactions between the medications listed and mention any significant trends from the vitals history.
  `,
});

const summarizePatientRecordFlow = ai.defineFlow(
  {
    name: 'summarizePatientRecordFlow',
    inputSchema: PatientRecordInputSchema,
    outputSchema: PatientRecordOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
