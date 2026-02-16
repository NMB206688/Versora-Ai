export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  departmentId: string;
  published: boolean;
  creationDate: string;
  imageUrl: string;
  imageHint: string;
  studentMembers?: Record<string, boolean>;
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  deadline: string;
  pointsPossible: number;
  type: string;
  learningObjectiveIds?: string[];
  order: number;
  // Denormalized for security rules
  courseInstructorId?: string;
  coursePublished?: boolean;
  courseStudentMembers?: Record<string, boolean>;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  // Denormalized for security rules
  courseInstructorId?: string;
  coursePublished?: boolean;
  courseStudentMembers?: Record<string, boolean>;
}

export interface ContentItem {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'video' | 'reading' | 'quiz' | 'link' | 'document';
  contentUrl?: string;
  textContent?: string;
  order: number;
  // Denormalized for security rules
  courseInstructorId?: string;
  coursePublished?: boolean;
  courseStudentMembers?: Record<string, boolean>;
}

export interface Enrollment {
    id: string;
    studentId: string;
    courseId: string;
    enrollmentDate: string;
    completionDate?: string;
    // Denormalized for queries
    courseInstructorId?: string;
}

export interface Rubric {
  id: string;
  assignmentId: string;
  instructorId: string;
  creationDate: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  aiGenerated: boolean;
}

export interface RubricCriterion {
  id: string;
  rubricId: string;
  description: string;
  maxPoints: number;
  levels: {
      levelName: string;
      description: string;
  }[];
  order: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  moduleId: string;
  assignmentTitle: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  submissionDate: string;
  contentUrl?: string;
  textContent?: string;
  grade?: number;
}

export interface Feedback {
  id: string;
  submissionId: string;
  giverId?: string; // Optional because it can be AI
  aiGenerated: boolean;
  content: string;
  creationDate: string;
  type: 'Clarity' | 'Structure' | 'Citation' | 'Grammar' | 'General';
}

export interface Portfolio {
  id: string; // Will typically be the student's UID
  studentId: string;
  title: string;
  description: string;
  creationDate: string;
  lastUpdateDate: string;
}

export interface PortfolioItem {
  id: string;
  portfolioId: string;
  studentId: string;
  submissionId: string;
  reflection: string;
  addedDate: string;
  // Denormalized data for easy display
  assignmentTitle: string;
  courseTitle: string;
  grade: number;
  submissionExcerpt: string;
}
