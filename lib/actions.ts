'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { generateWritingFeedback } from '@/ai/flows/generate-writing-feedback';
import { generateGradingRubric, type GenerateGradingRubricOutput } from '@/ai/flows/generate-grading-rubric';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, updateDoc, getDocs, query, orderBy, limit, writeBatch, where } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { PlaceHolderImages } from './placeholder-images';
import { revalidatePath } from 'next/cache';
import type { ContentItem, Rubric, RubricCriterion } from './definitions';
import { generateFeedbackForSubmission } from '@/ai/flows/generate-feedback-for-submission';

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

async function logAICost(
    userId: string,
    serviceName: string,
    featureUsed: string,
    totalCost: number,
) {
    if (!userId) return;

    try {
        const { firestore } = getFirebaseServerServices();
        await addDoc(collection(firestore, 'aiCostLogs'), {
            timestamp: new Date().toISOString(),
            serviceName,
            featureUsed,
            costPerUnit: totalCost, // simplified for now
            unitsUsed: 1, // simplified for now
            totalCost,
            userId,
        });
    } catch (error) {
        console.error("Failed to log AI cost:", error);
        // We probably don't want to fail the main action if logging fails,
        // so we'll just log the error to the server console.
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
  const userId = formData.get('userId') as string;
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      feedbackItems: null,
    };
  }
  
  try {
    const result = await generateWritingFeedback({ text: validatedFields.data.text });
    await logAICost(userId, 'Gemini', 'Writing Feedback', 0.002);
    return { feedbackItems: result.feedbackItems, errors: {} };
  } catch (e) {
    console.error(e);
    return { feedbackItems: null, message: "Failed to generate feedback. Please try again.", errors: {} };
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
    const userId = formData.get('userId') as string;

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            rubric: null,
        };
    }

    try {
        const result = await generateGradingRubric(validatedFields.data);
        await logAICost(userId, 'Gemini', 'Rubric Generation', 0.005);
        return { rubric: result, errors: {} };
    } catch (e) {
        console.error(e);
        return { rubric: null, message: "Failed to generate rubric. Please try again.", errors: {} };
    }
}

export async function generateRubricForAssignment(prevState: any, formData: FormData) {
    const assignmentDescription = formData.get('assignmentDescription') as string;
    const userId = formData.get('userId') as string;

    if (!assignmentDescription || assignmentDescription.length < 10) {
        return {
             errors: { assignmentDescription: ['Please provide a more detailed assignment description.'] },
             rubric: null,
        }
    }
    
    try {
        const result = await generateGradingRubric({ 
            assignmentPrompt: assignmentDescription,
            learningObjectives: "Demonstrate understanding of key concepts and critical thinking." // Generic objective
        });
        await logAICost(userId, 'Gemini', 'Rubric Generation', 0.005);
        return { rubric: result, errors: {} };
    } catch (e) {
        console.error(e);
        return { rubric: null, message: "Failed to generate rubric. Please try again.", errors: {} };
    }
}


export async function createCourse(prevState: any, formData: FormData) {
  const { firestore } = getFirebaseServerServices();
  const instructorId = formData.get('instructorId') as string;
  const instructorName = formData.get('instructorName') as string;

  if (!instructorId || !instructorName) {
    return { message: 'You must be logged in to create a course.' };
  }

  // Select a random image from placeholders, excluding the user avatar
  const courseImages = PlaceHolderImages.filter(img => img.id.startsWith('course-'));
  const randomImage = courseImages[Math.floor(Math.random() * courseImages.length)];

  try {
    const newCourseRef = await addDoc(collection(firestore, 'courses'), {
      title: 'Untitled Course',
      description: 'Start building your course by adding a description and content.',
      instructorId: instructorId,
      instructorName: instructorName,
      departmentId: '', // Default value
      published: false,
      creationDate: new Date().toISOString(),
      imageUrl: randomImage.imageUrl,
      imageHint: randomImage.imageHint,
    });
    
    // Redirect to the edit page for the newly created course
    redirect(`/instructor/course/${newCourseRef.id}/edit`);

  } catch (error) {
    console.error('Failed to create course:', error);
    // This message will be returned to the client if redirect fails
    return { message: 'An unexpected error occurred while creating the course. Please try again.' };
  }
}

const UpdateCourseSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
});

export async function updateCourse(courseId: string, prevState: any, formData: FormData) {
    const validatedFields = UpdateCourseSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update course. Please check the fields.',
        };
    }

    const { firestore } = getFirebaseServerServices();
    const courseRef = doc(firestore, 'courses', courseId);

    try {
        await updateDoc(courseRef, validatedFields.data);
        revalidatePath(`/instructor/dashboard`);
        revalidatePath(`/instructor/course/${courseId}/edit`);
        return { message: 'Course updated successfully.', errors: {} };
    } catch (error) {
        console.error('Failed to update course:', error);
        return { message: 'An unexpected error occurred while updating the course.' };
    }
}

export async function createModule(courseId: string) {
  if (!courseId) {
    return { error: "Course ID is required." };
  }

  const { firestore } = getFirebaseServerServices();
  const modulesRef = collection(firestore, `courses/${courseId}/modules`);

  try {
    // Find the current highest order number
    const q = query(modulesRef, orderBy("order", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const lastOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order;
    
    // Add the new module with the next order number
    await addDoc(modulesRef, {
      courseId: courseId,
      title: "New Module",
      description: "Add a description for your new module.",
      order: lastOrder + 1,
    });
    
    revalidatePath(`/instructor/course/${courseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create module:", error);
    return { error: "An unexpected error occurred while creating the module." };
  }
}

export async function createContentItem(courseId: string, moduleId: string, type: ContentItem['type']) {
  if (!courseId || !moduleId || !type) {
    return { error: "Course ID, Module ID, and item type are required." };
  }

  const { firestore } = getFirebaseServerServices();
  const contentItemsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/contentItems`);

  try {
    // Find the current highest order number
    const q = query(contentItemsRef, orderBy("order", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const lastOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order;
    
    // Add the new content item with the next order number
    await addDoc(contentItemsRef, {
      moduleId: moduleId,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: "",
      type: type,
      order: lastOrder + 1,
    });
    
    revalidatePath(`/instructor/course/${courseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create content item:", error);
    return { error: "An unexpected error occurred while creating the content item." };
  }
}

export async function createAssignment(courseId: string, moduleId: string) {
  if (!courseId || !moduleId) {
    return { error: "Course ID and Module ID are required." };
  }

  const { firestore } = getFirebaseServerServices();
  const assignmentsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/assignments`);

  try {
    // Find the current highest order number
    const q = query(assignmentsRef, orderBy("order", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const lastOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order;
    
    await addDoc(assignmentsRef, {
      moduleId: moduleId,
      title: "New Assignment",
      description: "Add assignment instructions here.",
      deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // Default deadline 1 week from now
      pointsPossible: 100,
      type: 'Writing',
      order: lastOrder + 1,
    });
    
    revalidatePath(`/instructor/course/${courseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return { error: "An unexpected error occurred while creating the assignment." };
  }
}

const UpdateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  pointsPossible: z.coerce.number().min(0, "Points must be a positive number."),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

export async function updateAssignment(
    courseId: string,
    moduleId: string,
    assignmentId: string,
    prevState: any,
    formData: FormData
) {
    const validatedFields = UpdateAssignmentSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        pointsPossible: formData.get('pointsPossible'),
        deadline: formData.get('deadline'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update assignment. Please check the fields.',
        };
    }

    const { firestore } = getFirebaseServerServices();
    const assignmentRef = doc(firestore, 'courses', courseId, 'modules', moduleId, 'assignments', assignmentId);

    try {
        await updateDoc(assignmentRef, {
            ...validatedFields.data,
            deadline: new Date(validatedFields.data.deadline).toISOString(), // ensure it's ISO string
        });
        revalidatePath(`/instructor/course/${courseId}/module/${moduleId}/assignment/${assignmentId}`);
        revalidatePath(`/instructor/course/${courseId}/edit`);
        return { message: 'Assignment updated successfully.', errors: {} };
    } catch (error) {
        console.error('Failed to update assignment:', error);
        return { message: 'An unexpected error occurred while updating the assignment.' };
    }
}

export async function saveRubric(
  courseId: string,
  moduleId: string,
  assignmentId: string,
  userId: string,
  prevState: any,
  formData: FormData,
) {
  if (!userId) {
    return { success: false, message: "Authentication error: User ID is missing." };
  }

  const rubricDataJSON = formData.get('rubricData') as string;
  if (!rubricDataJSON) {
      return { success: false, message: "No rubric data provided." };
  }

  let rubricData: GenerateGradingRubricOutput;
  try {
    rubricData = JSON.parse(rubricDataJSON);
  } catch (error) {
    return { success: false, message: "Invalid rubric data format." };
  }
  
  const { firestore } = getFirebaseServerServices();
  const rubricRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}/rubric`);
  
  const batch = writeBatch(firestore);

  // 1. Create the main rubric document
  const rubricDoc: Omit<Rubric, 'id'> = {
      assignmentId: assignmentId,
      instructorId: userId,
      creationDate: new Date().toISOString(),
      status: 'Approved',
      aiGenerated: true,
  };
  batch.set(rubricRef, rubricDoc);

  // 2. Create each criterion document in the 'criteria' subcollection
  const criteriaColRef = collection(rubricRef, 'criteria');
  rubricData.criteria.forEach((criterion, index) => {
      const criterionDocRef = doc(criteriaColRef); // Auto-generate ID for each criterion
      const newCriterion: Omit<RubricCriterion, 'id'> = {
          rubricId: rubricRef.id, // This will be the string "rubric"
          description: criterion.description,
          maxPoints: criterion.maxPoints,
          levels: criterion.levels,
          order: index + 1,
      };
      batch.set(criterionDocRef, newCriterion);
  });

  try {
      await batch.commit();
      await logAICost(userId, 'Gemini', 'Rubric Save', 0.001);
      // Revalidate the path to ensure the UI updates with the new rubric
      revalidatePath(`/instructor/course/${courseId}/module/${moduleId}/assignment/${assignmentId}`);
      return { success: true, message: 'Rubric saved successfully.' };
  } catch (error) {
      console.error("Failed to save rubric:", error);
      return { success: false, message: 'An unexpected error occurred while saving the rubric.' };
  }
}

export async function submitAssignment(
  courseId: string,
  moduleId: string,
  assignmentId: string,
  studentId: string,
  studentName: string,
  prevState: any,
  formData: FormData,
) {
  const { firestore } = getFirebaseServerServices();
  const submissionText = formData.get('textContent') as string;

  if (!studentId || !studentName) {
    return { success: false, message: 'You must be logged in to submit an assignment.' };
  }
  if (!submissionText || submissionText.trim().length < 10) {
    return { success: false, message: 'Submission must contain at least 10 characters.' };
  }

  try {
    const submissionsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}/submissions`);

    // Check if the user has already submitted
    const q = query(submissionsRef, where("studentId", "==", studentId), limit(1));
    const existingSubmission = await getDocs(q);
    if (!existingSubmission.empty) {
        return { success: false, message: 'You have already submitted this assignment.' };
    }

    await addDoc(submissionsRef, {
      assignmentId,
      studentId,
      studentName,
      submissionDate: new Date().toISOString(),
      textContent: submissionText,
    });

    revalidatePath(`/student/course/${courseId}/module/${moduleId}/assignment/${assignmentId}`);

    return { success: true, message: 'Your assignment has been submitted successfully.' };
  } catch (error) {
    console.error('Failed to submit assignment:', error);
    return { success: false, message: 'An unexpected error occurred while submitting.' };
  }
}

export async function saveGradeAndFeedback(
  courseId: string,
  moduleId: string,
  assignmentId: string,
  submissionId: string,
  userId: string,
  prevState: any,
  formData: FormData,
) {
  const { firestore } = getFirebaseServerServices();
  const grade = formData.get('grade') as string;
  const feedbackContent = formData.get('feedback') as string;

  // Basic validation
  if (!userId) {
    return { success: false, message: 'Authentication error: User not found.' };
  }
  const numericGrade = parseFloat(grade);
  if (isNaN(numericGrade) || numericGrade < 0) {
    return { success: false, message: 'Please enter a valid, non-negative grade.' };
  }
  if (!feedbackContent || feedbackContent.trim().length < 5) {
      return { success: false, message: 'Please provide meaningful feedback (at least 5 characters).' };
  }

  const submissionRef = doc(firestore, 'courses', courseId, 'modules', moduleId, 'assignments', assignmentId, 'submissions', submissionId);
  const feedbackRef = doc(collection(submissionRef, 'feedback'));

  const batch = writeBatch(firestore);

  // Update submission with grade
  batch.update(submissionRef, { grade: numericGrade });

  // Create new feedback document
  batch.set(feedbackRef, {
      submissionId: submissionId,
      giverId: userId,
      aiGenerated: false,
      content: feedbackContent,
      creationDate: new Date().toISOString(),
      type: 'General',
  });

  try {
    await batch.commit();
    revalidatePath(`/instructor/course/${courseId}/module/${moduleId}/assignment/${assignmentId}`);
    revalidatePath(`/instructor/course/${courseId}/module/${moduleId}/assignment/${assignmentId}/grade/${submissionId}`);
    return { success: true, message: 'Grade and feedback saved successfully.' };
  } catch (error) {
    console.error('Failed to save grade and feedback:', error);
    return { success: false, message: 'An unexpected error occurred while saving.' };
  }
}

export async function getAIAssistedFeedback(
  { submissionText, assignmentDescription, rubricCriteria, userId }: {
    submissionText: string;
    assignmentDescription: string;
    rubricCriteria: RubricCriterion[];
    userId: string;
  }
): Promise<{ feedbackText: string; suggestedGrade: number | null; message?: string }> {
  
  if (!submissionText || !assignmentDescription || !rubricCriteria) {
    return { feedbackText: '', suggestedGrade: null, message: 'Missing required data for AI feedback.' };
  }

  try {
    // The AI flow expects a specific structure, so we map our criteria to it.
    // This is defensive coding in case the structures diverge slightly.
    const aiRubricCriteria = rubricCriteria.map(c => ({
        description: c.description,
        maxPoints: c.maxPoints,
        levels: c.levels.map(l => ({ levelName: l.levelName, description: l.description })),
    }));
      
    const result = await generateFeedbackForSubmission({
        submissionText,
        assignmentDescription,
        rubricCriteria: aiRubricCriteria,
    });
    
    await logAICost(userId, 'Gemini', 'AI Assisted Feedback', 0.003);

    // Format the feedback items into a single string for the textarea
    const feedbackText = result.feedbackItems
      .map(item => `[${item.type}]\n${item.content}`)
      .join('\n\n');
      
    return { 
      feedbackText, 
      suggestedGrade: result.suggestedGrade ?? null,
    };
  } catch (e) {
    console.error(e);
    return { feedbackText: '', suggestedGrade: null, message: 'Failed to generate AI feedback.' };
  }
}
