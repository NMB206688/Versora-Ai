'use server';

/**
 * @fileOverview AI-powered grading rubric generator.
 *
 * - generateGradingRubric - A function that generates a grading rubric using AI.
 * - GenerateGradingRubricInput - The input type for the generateGradingRubric function.
 * - GenerateGradingRubricOutput - The return type for the generateGradingRubric function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGradingRubricInputSchema = z.object({
  assignmentPrompt: z.string().describe('The prompt or instructions for the assignment.'),
  learningObjectives: z.string().describe('The learning objectives for the assignment.'),
});
export type GenerateGradingRubricInput = z.infer<
  typeof GenerateGradingRubricInputSchema
>;

const GenerateGradingRubricOutputSchema = z.object({
  rubric: z.string().describe('The generated grading rubric.'),
});
export type GenerateGradingRubricOutput = z.infer<
  typeof GenerateGradingRubricOutputSchema
>;

export async function generateGradingRubric(
  input: GenerateGradingRubricInput
): Promise<GenerateGradingRubricOutput> {
  return generateGradingRubricFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGradingRubricPrompt',
  input: {schema: GenerateGradingRubricInputSchema},
  output: {schema: GenerateGradingRubricOutputSchema},
  prompt: `You are an AI assistant designed to generate grading rubrics for instructors. 

  Based on the assignment prompt and learning objectives provided, generate a comprehensive grading rubric that can be used to fairly and effectively assess student work. 

  Assignment Prompt: {{{assignmentPrompt}}}
  Learning Objectives: {{{learningObjectives}}}

  Grading Rubric:`,
});

const generateGradingRubricFlow = ai.defineFlow(
  {
    name: 'generateGradingRubricFlow',
    inputSchema: GenerateGradingRubricInputSchema,
    outputSchema: GenerateGradingRubricOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
