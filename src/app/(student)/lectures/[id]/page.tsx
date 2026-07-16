'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLecture } from '@/lib/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

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
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // Handle youtu.be/ID format
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Handle youtube.com/watch?v=ID format
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // Handle youtube.com/embed/ID format
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function formatScheduledTime(scheduledAt: FirestoreDate | undefined): string {
  if (!scheduledAt) return '';
  const date = toJsDate(scheduledAt);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getLiveStatus(scheduledAt: FirestoreDate | undefined): 'upcoming' | 'live' | 'past' {
  if (!scheduledAt) return 'past';
  const date = toJsDate(scheduledAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  // Consider "live" if within 30 minutes window around scheduled time
  if (diffMs > 30 * 60 * 1000) return 'upcoming';
  if (diffMs > -90 * 60 * 1000) return 'live';
  return 'past';
}

export default function LecturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const data = await getLecture(id);
        setLecture(data as Lecture);
      } catch (error) {
        console.error('Failed to fetch lecture:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLecture();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-slate-400">Lecture not found.</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block transition-colors">
          ← Back to subjects
        </Link>
      </div>
    );
  }

  const youtubeId = lecture.type === 'recorded' && lecture.videoUrl ? extractYouTubeId(lecture.videoUrl) : null;
  const liveStatus = lecture.type === 'live' ? getLiveStatus(lecture.scheduledAt) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href={`/subjects/${lecture.subjectId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors duration-200 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to subject
      </Link>

      {/* Lecture header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          {lecture.type === 'live' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              RECORDED
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">{lecture.title}</h1>
        {lecture.description && (
          <p className="text-slate-300 mt-3 text-lg leading-relaxed">{lecture.description}</p>
        )}
      </div>

      {/* Recorded lecture — YouTube Player */}
      {lecture.type === 'recorded' && (
        <div className="mt-6">
          {youtubeId ? (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={lecture.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-slate-600 mx-auto mb-3"
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
                <p className="text-slate-500">Video unavailable</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live lecture — Status & Join Button */}
      {lecture.type === 'live' && (
        <div className="mt-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            {/* Scheduled time */}
            {lecture.scheduledAt && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Scheduled for</p>
                  <p className="text-white font-medium">{formatScheduledTime(lecture.scheduledAt)}</p>
                </div>
              </div>
            )}

            {/* Status indicator */}
            {liveStatus === 'upcoming' && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-indigo-300 text-sm font-medium">This session hasn&apos;t started yet. Come back at the scheduled time.</p>
                </div>
              </div>
            )}

            {liveStatus === 'live' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-emerald-300 text-sm font-medium">This session is happening now!</p>
                </div>
              </div>
            )}

            {liveStatus === 'past' && (
              <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-slate-400 text-sm">This session has ended.</p>
                </div>
              </div>
            )}

            {/* Join button */}
            {liveStatus !== 'past' && lecture.liveJoinUrl && (
              <a
                href={lecture.liveJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 py-4 font-medium text-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                Join Live Class
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
