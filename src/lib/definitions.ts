export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  imageUrl: string;
  imageHint: string;
  progress: number;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
}

export interface Feedback {
  id: string;
  assignmentTitle: string;
  course: string;
  feedbackSummary: string;
  date: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
}
