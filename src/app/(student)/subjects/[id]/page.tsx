'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSubject, getLecturesBySubject } from '@/lib/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Subject {
  id: string;
  name: string;
  order: number;
}

interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  type: 'recorded' | 'live';
  videoUrl?: string;
  liveJoinUrl?: string;
  scheduledAt?: Date | { toDate(): Date };
  createdAt?: Date | { toDate(): Date };
}

type FirestoreDate = Date | { toDate(): Date };

function toJsDate(d: FirestoreDate): Date {
  return 'toDate' in d && typeof d.toDate === 'function' ? d.toDate() : new Date(d as Date);
}

function formatScheduledTime(scheduledAt: FirestoreDate | undefined): string {
  if (!scheduledAt) return '';
  const date = toJsDate(scheduledAt);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectData, lecturesData] = await Promise.all([
          getSubject(id),
          getLecturesBySubject(id),
        ]);
        setSubject(subjectData as Subject);
        setLectures(lecturesData as Lecture[]);
      } catch (error) {
        console.error('Failed to fetch subject data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-slate-400">Subject not found.</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block transition-colors">
          ← Back to subjects
        </Link>
      </div>
    );
  }

  // Live sessions: upcoming ones sorted by scheduledAt ascending
  const liveLectures = lectures
    .filter((l) => l.type === 'live')
    .sort((a, b) => {
      const dateA = a.scheduledAt ? toJsDate(a.scheduledAt) : new Date(0);
      const dateB = b.scheduledAt ? toJsDate(b.scheduledAt) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

  // Recorded lectures sorted by createdAt descending
  const recordedLectures = lectures
    .filter((l) => l.type === 'recorded')
    .sort((a, b) => {
      const dateA = a.createdAt ? toJsDate(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? toJsDate(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors duration-200 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to subjects
      </Link>

      {/* Subject heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
        <p className="text-slate-400 mt-2">
          {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'} available
        </p>
      </div>

      {lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">No lectures available yet</p>
          <p className="text-slate-500 text-sm mt-1">Lectures will appear here once added</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Live Sessions */}
          {liveLectures.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h2 className="text-xl font-semibold text-white">Live Sessions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveLectures.map((lecture) => (
                  <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
                    <div className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 h-full cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                          LIVE
                        </span>
                        <svg
                          className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors duration-300 mb-2">
                        {lecture.title}
                      </h3>
                      {lecture.description && (
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                          {lecture.description}
                        </p>
                      )}
                      {lecture.scheduledAt && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                          {formatScheduledTime(lecture.scheduledAt)}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recorded Lectures */}
          {recordedLectures.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <h2 className="text-xl font-semibold text-white">Recorded Lectures</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordedLectures.map((lecture) => (
                  <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
                    <div className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 h-full cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          RECORDED
                        </span>
                        <svg
                          className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors duration-300 mb-2">
                        {lecture.title}
                      </h3>
                      {lecture.description && (
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {lecture.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
