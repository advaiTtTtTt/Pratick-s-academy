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
  videoUrl?: string;
  liveJoinUrl?: string;
  scheduledAt?: Date | null;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  name: string;
}
