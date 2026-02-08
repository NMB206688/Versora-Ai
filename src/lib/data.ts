import type { User, Course, Assignment, Feedback, Module } from '@/lib/definitions';
import { PlaceHolderImages } from './placeholder-images';

const courseImage1 = PlaceHolderImages.find(img => img.id === 'course-1');
const courseImage2 = PlaceHolderImages.find(img => img.id === 'course-2');
const courseImage3 = PlaceHolderImages.find(img => img.id === 'course-3');
const courseImage4 = PlaceHolderImages.find(img => img.id === 'course-4');
const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1');

export const users: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'student@versora.ai', role: 'student', avatarUrl: userAvatar?.imageUrl || '' },
  { id: '2', name: 'Dr. Emily Carter', email: 'instructor@versora.ai', role: 'instructor', avatarUrl: userAvatar?.imageUrl || '' },
  { id: '3', name: 'Admin User', email: 'admin@versora.ai', role: 'admin', avatarUrl: userAvatar?.imageUrl || '' },
];

export const courses: Course[] = [
  { 
    id: 'ds101', 
    title: 'Introduction to Data Science', 
    description: 'Learn the fundamentals of data analysis and visualization.', 
    instructor: 'Dr. Emily Carter', 
    imageUrl: courseImage1?.imageUrl || '',
    imageHint: courseImage1?.imageHint || '',
    progress: 65,
  },
  { 
    id: 'cw202', 
    title: 'Creative Writing Workshop', 
    description: 'Hone your storytelling skills and find your unique voice.', 
    instructor: 'Prof. Mark Twain', 
    imageUrl: courseImage2?.imageUrl || '',
    imageHint: courseImage2?.imageHint || '',
    progress: 30,
  },
  { 
    id: 'ma301', 
    title: 'Advanced Calculus', 
    description: 'Explore multi-variable calculus and differential equations.', 
    instructor: 'Dr. Ada Lovelace', 
    imageUrl: courseImage3?.imageUrl || '',
    imageHint: courseImage3?.imageHint || '',
    progress: 80,
  },
  { 
    id: 'wd101', 
    title: 'Web Development Bootcamp', 
    description: 'Master the MERN stack and build full-stack applications.', 
    instructor: 'Dr. Emily Carter',
    imageUrl: courseImage4?.imageUrl || '',
    imageHint: courseImage4?.imageHint || '',
    progress: 15,
  },
];

export const assignments: Assignment[] = [
  { id: '1', title: 'Data Analysis Project Proposal', course: 'Data Science 101', dueDate: '2024-09-15' },
  { id: '2', title: 'Short Story Submission', course: 'Creative Writing', dueDate: '2024-09-20' },
  { id: '3', title: 'Problem Set 5', course: 'Advanced Calculus', dueDate: '2024-09-22' },
];

export const recentFeedback: Feedback[] = [
  { id: '1', assignmentTitle: 'Essay 1: Initial Draft', course: 'Creative Writing', feedbackSummary: 'Good start, but focus on strengthening your thesis statement.', date: '2024-08-28' },
  { id: '2', assignmentTitle: 'Lab 2: Data Cleaning', course: 'Data Science 101', feedbackSummary: 'Excellent use of Python libraries. Some optimizations are possible.', date: '2024-08-25' },
];

export const courseModules: Module[] = [
  {
    id: 'm1',
    title: 'Module 1: Getting Started',
    lessons: [
      { id: 'l1-1', title: 'Course Introduction', type: 'video' },
      { id: 'l1-2', title: 'What is Data Science?', type: 'reading' },
      { id: 'l1-3', title: 'Knowledge Check 1', type: 'quiz' },
    ]
  },
  {
    id: 'm2',
    title: 'Module 2: Python Fundamentals',
    lessons: [
      { id: 'l2-1', title: 'Variables and Data Types', type: 'video' },
      { id: 'l2-2', title: 'Control Flow', type: 'reading' },
      { id: 'l2-3', title: 'Functions', type: 'video' },
      { id: 'l2-4', title: 'Knowledge Check 2', type: 'quiz' },
    ]
  },
  {
    id: 'm3',
    title: 'Module 3: Data Analysis with Pandas',
    lessons: [
      { id: 'l3-1', title: 'Introduction to Pandas', type: 'video' },
      { id: 'l3-2', title: 'DataFrames and Series', type: 'reading' },
    ]
  },
];

export const adminDashboardData = {
  totalMonthlyCost: 12500,
  costPerStudent: 83.33,
  aiUsageCost: 4500,
  costBreakdown: [
    { name: 'Jan', total: 11000, ai: 4000 },
    { name: 'Feb', total: 11200, ai: 4100 },
    { name: 'Mar', total: 11500, ai: 4200 },
    { name: 'Apr', total: 11800, ai: 4350 },
    { name: 'May', total: 12100, ai: 4400 },
    { name: 'Jun', total: 12500, ai: 4500 },
  ],
  aiCostByService: [
    { service: 'Rubric Generation', value: 1800, fill: 'var(--color-chart-1)' },
    { service: 'Writing Feedback', value: 2200, fill: 'var(--color-chart-2)' },
    { service: 'Other', value: 500, fill: 'var(--color-chart-3)' },
  ],
};
