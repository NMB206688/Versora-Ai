'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { users } from './data';
import { generateWritingFeedback } from '@/ai/flows/generate-writing-feedback';
import { generateGradingRubric } from '@/ai/flows/generate-grading-rubric';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const user = users.find(u => u.email === email);

    if (!user || user.password !== password) {
      return {
        message: 'Invalid credentials.',
      };
    }
    
    redirect(`/${user.role}/dashboard`);

  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    return {
      message: 'Something went wrong.',
    };
  }
}

const WritingFeedbackSchema = z.object({
  text: z.string().min(10, { message: 'Please enter a text with at least 10 characters.' }),
});

export async function getWritingFeedback(prevState: any, formData: FormData) {
  const validatedFields = WritingFeedbackSchema.safeParse({
    text: formData.get('text'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      feedback: null,
    };
  }
  
  try {
    const result = await generateWritingFeedback({ text: validatedFields.data.text });
    return { feedback: result.feedback, errors: {} };
  } catch (e) {
    console.error(e);
    return { feedback: "Failed to generate feedback. Please try again.", errors: {} };
  }
}

const RubricGeneratorSchema = z.object({
  assignmentPrompt: z.string().min(10, { message: 'Please enter a prompt with at least 10 characters.' }),
  learningObjectives: z.string().min(10, { message: 'Please enter objectives with at least 10 characters.' }),
});

export async function createRubric(prevState: any, formData: FormData) {
    const validatedFields = RubricGeneratorSchema.safeParse({
        assignmentPrompt: formData.get('assignmentPrompt'),
        learningObjectives: formData.get('learningObjectives'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            rubric: null,
        };
    }

    try {
        const result = await generateGradingRubric(validatedFields.data);
        return { rubric: result.rubric, errors: {} };
    } catch (e) {
        console.error(e);
        return { rubric: "Failed to generate rubric. Please try again.", errors: {} };
    }
}
