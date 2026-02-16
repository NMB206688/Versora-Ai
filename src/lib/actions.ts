'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { users } from './data';
import { generateWritingFeedback } from '@/ai/flows/generate-writing-feedback';
import { generateGradingRubric } from '@/ai/flows/generate-grading-rubric';

// Existing authenticate action
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

  } catch (error: any) {
    if (error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    return {
      message: 'Something went wrong.',
    };
  }
}

// Signup Action
const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["student", "instructor"]),
});

export async function signup(prevState: any, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create account. Please check the fields.',
      success: false,
    };
  }

  const { name, email, password, role } = validatedFields.data;

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return {
      message: 'An account with this email already exists.',
      success: false,
    };
  }
  
  // In a real app, you'd save to a database. Here we just add to the mock array.
  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password,
    role,
    avatarUrl: '', // placeholder
  };
  users.push(newUser);

  // redirect('/login'); // We can't redirect from here because we need to show a success message
  return {
    message: 'Account created successfully! You can now sign in.',
    success: true,
  }
}

// Password Reset Action
const ResetSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const validatedFields = ResetSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid email.",
      success: false
    };
  }
  
  const { email } = validatedFields.data;
  const user = users.find(u => u.email === email);

  if (!user) {
    // Don't reveal if a user does or doesn't exist
    return { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true
    };
  }
  
  // In a real app, you would generate a token and send an email.
  console.log(`Password reset requested for ${email}`);
  
  return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      success: true
  };
}


// Existing writing feedback action
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


// Existing rubric generator action
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
