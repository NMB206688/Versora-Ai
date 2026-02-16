'use server';

/**
 * @fileOverview An AI agent that provides feedback on student writing.
 *
 * - generateWritingFeedback - A function that handles the writing feedback process.
 * - GenerateWritingFeedbackInput - The input type for the generateWritingFeedback function.
 * - GenerateWritingFeedbackOutput - The return type for the generateWritingfeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingFeedbackInputSchema = z.object({
  text: z.string().describe('The text to provide feedback on.'),
});
export type GenerateWritingFeedbackInput = z.infer<typeof GenerateWritingFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    type: z.enum(['Clarity', 'Structure', 'Citation', 'Grammar', 'General'])
      .describe("The category of the feedback provided."),
    content: z.string().describe("The specific feedback text for this category."),
});

const GenerateWritingFeedbackOutputSchema = z.object({
  feedbackItems: z.array(FeedbackItemSchema).describe('An array of feedback items, categorized by type.'),
});
export type GenerateWritingFeedbackOutput = z.infer<typeof GenerateWritingFeedbackOutputSchema>;

export async function generateWritingFeedback(input: GenerateWritingFeedbackInput): Promise<GenerateWritingFeedbackOutput> {
  return generateWritingFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingFeedbackPrompt',
  input: {schema: GenerateWritingFeedbackInputSchema},
  output: {schema: GenerateWritingFeedbackOutputSchema},
  prompt: `You are an AI writing assistant. Your task is to provide structured and constructive feedback on the user's text. 

  Analyze the following text and generate a list of feedback items. Each item should be categorized into one of the following types: 'Clarity', 'Structure', 'Citation', 'Grammar', or 'General'.

  Provide specific, actionable advice for each category.

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
