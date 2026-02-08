'use server';

/**
 * @fileOverview An AI agent that provides feedback on student writing.
 *
 * - generateWritingFeedback - A function that handles the writing feedback process.
 * - GenerateWritingFeedbackInput - The input type for the generateWritingFeedback function.
 * - GenerateWritingFeedbackOutput - The return type for the generateWritingFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingFeedbackInputSchema = z.object({
  text: z.string().describe('The text to provide feedback on.'),
});
export type GenerateWritingFeedbackInput = z.infer<typeof GenerateWritingFeedbackInputSchema>;

const GenerateWritingFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The AI-generated feedback on the writing.'),
});
export type GenerateWritingFeedbackOutput = z.infer<typeof GenerateWritingFeedbackOutputSchema>;

export async function generateWritingFeedback(input: GenerateWritingFeedbackInput): Promise<GenerateWritingFeedbackOutput> {
  return generateWritingFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingFeedbackPrompt',
  input: {schema: GenerateWritingFeedbackInputSchema},
  output: {schema: GenerateWritingFeedbackOutputSchema},
  prompt: `You are an AI writing assistant that provides feedback to students on their writing.

  Provide feedback on the following text, focusing on clarity, structure, and citation accuracy.

  Text: {{{text}}}
  `,
});

const generateWritingFeedbackFlow = ai.defineFlow(
  {
    name: 'generateWritingFeedbackFlow',
    inputSchema: GenerateWritingFeedbackInputSchema,
    outputSchema: GenerateWritingFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
