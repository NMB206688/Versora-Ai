'use server';

/**
 * @fileOverview An AI agent that provides grading feedback on a student's submission
 * based on an assignment's description and a grading rubric.
 *
 * - generateFeedbackForSubmission - A function that handles the feedback generation.
 * - GenerateFeedbackForSubmissionInput - The input type for the function.
 * - GenerateFeedbackForSubmissionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RubricCriterionSchemaForAI = z.object({
  description: z.string().describe("The description of the criterion (e.g., 'Clarity and Cohesion')."),
  maxPoints: z.number().describe("The maximum points achievable for this specific criterion."),
  levels: z.array(z.object({
      levelName: z.string().describe("Name of the proficiency level (e.g., 'Exemplary', 'Proficient')."),
      description: z.string().describe("Description of what this level of proficiency looks like for the criterion."),
  })).describe("An ordered list of descriptive proficiency levels for this criterion."),
});


export const GenerateFeedbackForSubmissionInputSchema = z.object({
  submissionText: z.string().describe("The student's submitted text."),
  assignmentDescription: z.string().describe("The original description/prompt for the assignment."),
  rubricCriteria: z.array(RubricCriterionSchemaForAI).describe("The criteria from the grading rubric."),
});
export type GenerateFeedbackForSubmissionInput = z.infer<typeof GenerateFeedbackForSubmissionInputSchema>;

const FeedbackItemSchema = z.object({
    type: z.enum(['Clarity', 'Structure', 'Citation', 'Grammar', 'General', 'RubricAlignment'])
      .describe("The category of the feedback provided."),
    content: z.string().describe("The specific feedback text for this category."),
});

export const GenerateFeedbackForSubmissionOutputSchema = z.object({
  feedbackItems: z.array(FeedbackItemSchema).describe('An array of feedback items, categorized by type.'),
  suggestedGrade: z.number().optional().describe('An optional suggested grade based on the rubric and submission.'),
});
export type GenerateFeedbackForSubmissionOutput = z.infer<typeof GenerateFeedbackForSubmissionOutputSchema>;

export async function generateFeedbackForSubmission(input: GenerateFeedbackForSubmissionInput): Promise<GenerateFeedbackForSubmissionOutput> {
  return generateFeedbackForSubmissionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFeedbackForSubmissionPrompt',
  input: {schema: GenerateFeedbackForSubmissionInputSchema},
  output: {schema: GenerateFeedbackForSubmissionOutputSchema},
  prompt: `You are an expert Teaching Assistant providing feedback on a student's assignment. Your goal is to provide constructive, helpful feedback that guides the student toward improvement.

  **Analyze the student's submission in the context of the assignment description and the provided grading rubric.**

  Provide structured feedback broken down by category. One of your categories MUST be 'RubricAlignment', where you specifically comment on how well the submission meets the criteria outlined in the grading rubric. Also provide a suggested numeric grade.

  **Assignment Description:**
  {{{assignmentDescription}}}

  **Grading Rubric:**
  {{#each rubricCriteria}}
  - **Criterion:** {{description}} ({{maxPoints}} pts)
    {{#each levels}}
    - {{levelName}}: {{description}}
    {{/each}}
  {{/each}}

  **Student's Submission:**
  {{{submissionText}}}

  Generate your feedback as a JSON object adhering to the specified output schema. Be encouraging but also clear and specific in your suggestions.
  `,
});

const generateFeedbackForSubmissionFlow = ai.defineFlow(
  {
    name: 'generateFeedbackForSubmissionFlow',
    inputSchema: GenerateFeedbackForSubmissionInputSchema,
    outputSchema: GenerateFeedbackForSubmissionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
