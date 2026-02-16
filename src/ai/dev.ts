import { config } from 'dotenv';
config();

import '@/ai/flows/generate-writing-feedback.ts';
import '@/ai/flows/generate-grading-rubric.ts';
import '@/ai/flows/generate-feedback-for-submission.ts';
