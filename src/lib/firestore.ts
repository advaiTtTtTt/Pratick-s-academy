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
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subject, Lecture, User, Notification, Alert } from '@/lib/types';

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
  // Delete all lectures belonging to this subject to prevent orphans
  const lectures = await getLecturesBySubject(id);
  for (const lecture of lectures) {
    await deleteLecture(lecture.id);
  }
  
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
    materialsUrl: (raw.materialsUrl as string) || undefined,
    scheduledAt: convertTimestamp(raw.scheduledAt),
    createdAt: convertTimestamp(raw.createdAt) ?? new Date(),
  };
}

export async function getLecturesBySubject(subjectId: string): Promise<Lecture[]> {
  const q = query(
    collection(db, 'lectures'),
    where('subjectId', '==', subjectId)
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
  
  // Automatically create a notification for students
  await addDoc(collection(db, 'notifications'), {
    title: 'New Lecture Posted',
    message: data.title,
    type: 'lecture_posted',
    createdAt: serverTimestamp(),
    link: '/lectures/' + ref.id
  });
  
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
  // Find and delete any notifications pointing to this lecture to prevent ghost notifications
  const qNotifications = query(collection(db, 'notifications'), where('link', '==', '/lectures/' + id));
  const snapshot = await getDocs(qNotifications);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }

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

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  // Prevent updating role or id
  const { role, id, ...safeData } = data as any;
  if (Object.keys(safeData).length > 0) {
    await updateDoc(doc(db, 'users', uid), safeData);
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function getRecentNotifications(limitCount = 10): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      ...raw,
      createdAt: convertTimestamp(raw.createdAt) ?? new Date(),
    } as Notification;
  });
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function getActiveAlert(): Promise<Alert | null> {
  const q = query(
    collection(db, 'alerts'),
    where('isActive', '==', true),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const raw = snapshot.docs[0].data();
  return {
    id: snapshot.docs[0].id,
    ...raw,
    targetDate: raw.targetDate ? convertTimestamp(raw.targetDate) : null,
    createdAt: convertTimestamp(raw.createdAt) ?? new Date(),
  } as Alert;
}

export async function saveAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
  // First, deactivate any existing active alerts
  const activeQ = query(collection(db, 'alerts'), where('isActive', '==', true));
  const activeSnapshot = await getDocs(activeQ);
  for (const docSnap of activeSnapshot.docs) {
    await updateDoc(docSnap.ref, { isActive: false });
  }

  // Then add the new alert
  const payload: any = {
    ...data,
    createdAt: serverTimestamp(),
  };
  if (data.targetDate) {
    payload.targetDate = Timestamp.fromDate(data.targetDate);
  }
  const ref = await addDoc(collection(db, 'alerts'), payload);
  return ref.id;
}

export async function deactivateAlert(alertId: string): Promise<void> {
  await updateDoc(doc(db, 'alerts', alertId), { isActive: false });
}

export async function sendManualNotification(title: string, message: string, link?: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'notifications'), {
    title,
    message,
    type: 'announcement',
    link: link || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
