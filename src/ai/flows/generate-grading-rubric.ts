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

const RubricCriterionSchema = z.object({
  description: z.string().describe("The description of the criterion (e.g., 'Clarity and Cohesion')."),
  maxPoints: z.number().describe("The maximum points achievable for this specific criterion."),
  levels: z.array(z.object({
      levelName: z.string().describe("Name of the proficiency level (e.g., 'Exemplary', 'Proficient')."),
      description: z.string().describe("Description of what this level of proficiency looks like for the criterion."),
  })).describe("An ordered list of descriptive proficiency levels for this criterion."),
});

const GenerateGradingRubricOutputSchema = z.object({
  criteria: z.array(RubricCriterionSchema).describe("An array of criteria that make up the rubric."),
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
  prompt: `You are an AI assistant designed to generate structured grading rubrics for instructors. 

  Based on the assignment prompt and learning objectives provided, generate a comprehensive grading rubric as a JSON object that adheres to the provided output schema.

  The rubric should consist of several distinct criteria. Each criterion must have a clear description, the maximum points a student can earn for it, and multiple proficiency levels (e.g., 'Exemplary', 'Proficient', 'Developing', 'Beginning'). For each level, provide a detailed description of the expected performance.

  Assignment Prompt: {{{assignmentPrompt}}}
  Learning Objectives: {{{learningObjectives}}}
  `,
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
