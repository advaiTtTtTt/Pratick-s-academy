import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subject, Lecture, User } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function convertTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export async function getSubjects(): Promise<Subject[]> {
  const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
}

export async function getSubject(id: string): Promise<Subject | null> {
  const snap = await getDoc(doc(db, 'subjects', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Subject;
}

export async function addSubject(data: Omit<Subject, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'subjects'), data);
  return ref.id;
}

export async function updateSubject(
  id: string,
  data: Partial<Omit<Subject, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'subjects', id), data);
}

export async function deleteSubject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'subjects', id));
}

export async function getSubjectLectureCount(subjectId: string): Promise<number> {
  const q = query(
    collection(db, 'lectures'),
    where('subjectId', '==', subjectId)
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

// ─── Lectures ───────────────────────────────────────────────────────────────

function docToLecture(d: { id: string; data: () => Record<string, unknown> }): Lecture {
  const raw = d.data() as Record<string, unknown>;
  return {
    id: d.id,
    subjectId: raw.subjectId as string,
    title: raw.title as string,
    description: raw.description as string,
    type: raw.type as 'recorded' | 'live',
    videoUrl: (raw.videoUrl as string) || undefined,
    liveJoinUrl: (raw.liveJoinUrl as string) || undefined,
    scheduledAt: convertTimestamp(raw.scheduledAt),
    createdAt: convertTimestamp(raw.createdAt) ?? new Date(),
  };
}

export async function getLecturesBySubject(subjectId: string): Promise<Lecture[]> {
  const q = query(
    collection(db, 'lectures'),
    where('subjectId', '==', subjectId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToLecture);
}

export async function getLecture(id: string): Promise<Lecture | null> {
  const snap = await getDoc(doc(db, 'lectures', id));
  if (!snap.exists()) return null;
  return docToLecture(snap);
}

export async function addLecture(data: Omit<Lecture, 'id'>): Promise<string> {
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: serverTimestamp(),
  };
  if (data.scheduledAt instanceof Date) {
    payload.scheduledAt = Timestamp.fromDate(data.scheduledAt);
  }
  const ref = await addDoc(collection(db, 'lectures'), payload);
  return ref.id;
}

export async function updateLecture(
  id: string,
  data: Partial<Omit<Lecture, 'id'>>
): Promise<void> {
  const payload: Record<string, unknown> = { ...data };
  if (data.scheduledAt instanceof Date) {
    payload.scheduledAt = Timestamp.fromDate(data.scheduledAt);
  }
  await updateDoc(doc(db, 'lectures', id), payload);
}

export async function deleteLecture(id: string): Promise<void> {
  await deleteDoc(doc(db, 'lectures', id));
}

export async function getAllLectures(): Promise<Lecture[]> {
  const q = query(collection(db, 'lectures'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToLecture);
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUserByUid(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function getStudents(): Promise<User[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
}

export async function createUserDoc(
  uid: string,
  data: Omit<User, 'id'>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), data);
}
