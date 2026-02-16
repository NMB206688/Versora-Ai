'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { generateWritingFeedback } from '@/ai/flows/generate-writing-feedback';
import { generateGradingRubric } from '@/ai/flows/generate-grading-rubric';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Server-side Firebase initialization for both Auth and Firestore.
function getFirebaseServerServices() {
  if (getApps().length === 0) {
    try {
      initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          'Automatic Firebase initialization failed. Falling back to firebase config object.',
          e
        );
      }
      initializeApp(firebaseConfig);
    }
  }
  const app = getApp();
  return {
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

// Existing authenticate action
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const { auth } = getFirebaseServerServices();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // The client-side will handle redirection based on the user's role fetched from Firestore.
    // We just need to signal success. The onAuthStateChanged listener will trigger the profile fetch.
    
  } catch (error: any) {
    if (error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return { message: 'Invalid credentials.' };
            case 'auth/invalid-email':
                return { message: 'Invalid email address.' };
            default:
                return { message: 'An unknown error occurred.' };
        }
    }
    
    return {
      message: 'Something went wrong.',
    };
  }
  // Redirect is handled client-side by the Home page component after state change
}

// Signup Action
const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["student", "instructor"], { required_error: "You need to select a role." }),
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
  const { auth, firestore } = getFirebaseServerServices();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user profile document in Firestore
    const userDocRef = doc(firestore, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      role: role,
      creationDate: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
    });
    
    return {
      message: 'Account created successfully! You can now sign in.',
      success: true,
    }
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return {
        message: 'An account with this email already exists.',
        success: false,
      };
    }
    return {
      message: 'Something went wrong during signup.',
      success: false,
    };
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
  const { auth } = getFirebaseServerServices();

  try {
    await sendPasswordResetEmail(auth, email);
    return { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true
    };
  } catch (error: any) {
    // We don't want to reveal if a user exists or not for security reasons.
    // So we return the same success message regardless of the outcome.
     return { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true
    };
  }
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
