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
}

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  deadline: string;
  pointsPossible: number;
  type: string;
  learningObjectiveIds?: string[];
  order: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
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
}

export interface Enrollment {
    id: string;
    studentId: string;
    courseId: string;
    enrollmentDate: string;
    completionDate?: string;
}
