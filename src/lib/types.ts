export interface Subject {
  id: string;
  name: string;
  order: number;
}

export interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  type: 'recorded' | 'live';
  videoUrl?: string; // YouTube
  liveJoinUrl?: string;
  materialsUrl?: string; // Google Drive link for notes/PDFs
  scheduledAt?: Date | null;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  name: string;
  phone?: string;
  photoUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lecture_posted' | 'reminder' | 'announcement';
  createdAt: Date;
  link?: string; // Optional link to redirect when clicked
}

export interface Alert {
  id: string;
  message: string;
  targetDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
}
