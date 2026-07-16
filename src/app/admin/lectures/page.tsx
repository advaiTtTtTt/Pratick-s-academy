'use client';

import { useState, useEffect } from 'react';
import {
  getSubjects,
  getAllLectures,
  addLecture,
  updateLecture,
  deleteLecture,
} from '@/lib/firestore';
import { Subject, Lecture } from '@/lib/types';

export default function AdminLecturesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'recorded' | 'live'>('recorded');
  const [videoUrl, setVideoUrl] = useState('');
  const [liveJoinUrl, setLiveJoinUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [materialsUrl, setMaterialsUrl] = useState('');

  const fetchData = async () => {
    try {
      const [subjectsList, lecturesList] = await Promise.all([
        getSubjects(),
        getAllLectures(),
      ]);
      setSubjects(subjectsList);
      setLectures(lecturesList);
      if (subjectsList.length > 0 && !subjectId) {
        setSubjectId(subjectsList[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setType('recorded');
    setVideoUrl('');
    setLiveJoinUrl('');
    setScheduledAt('');
    setMaterialsUrl('');
    if (subjects.length > 0) {
      setSubjectId(subjects[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;
    
    // URL Validation
    const isYouTube = (url: string) => /^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/.test(url);
    const isDrive = (url: string) => /^(https?\:\/\/)?(drive\.google\.com)\/.+$/.test(url);

    if (type === 'recorded' && videoUrl.trim() && !isYouTube(videoUrl.trim())) {
      alert("Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }
    if (materialsUrl.trim() && !isDrive(materialsUrl.trim())) {
      alert("Please enter a valid Google Drive link (e.g. https://drive.google.com/...)");
      return;
    }

    setSubmitting(true);

    try {
      const lectureData: Omit<Lecture, 'id'> = {
        subjectId,
        title: title.trim(),
        description: description.trim(),
        type,
        videoUrl: type === 'recorded' ? videoUrl.trim() : '',
        liveJoinUrl: type === 'live' ? liveJoinUrl.trim() : '',
        scheduledAt: type === 'live' && scheduledAt ? new Date(scheduledAt) : null,
        materialsUrl: materialsUrl.trim(),
        createdAt: new Date(),
      };

      if (editingId) {
        await updateLecture(editingId, lectureData);
      } else {
        await addLecture(lectureData);
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving lecture:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setSubjectId(lecture.subjectId);
    setTitle(lecture.title);
    setDescription(lecture.description || '');
    setType(lecture.type);
    setVideoUrl(lecture.videoUrl || '');
    setLiveJoinUrl(lecture.liveJoinUrl || '');
    setMaterialsUrl(lecture.materialsUrl || '');
    setScheduledAt(
      lecture.scheduledAt
        ? new Date(lecture.scheduledAt).toISOString().slice(0, 16)
        : ''
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteLecture(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting lecture:', error);
    }
  };

  const getSubjectName = (id: string) => {
    return subjects.find((s) => s.id === id)?.name || 'Unknown';
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Lectures</h1>
        <p className="text-slate-400 mt-1">Add, edit, or remove lectures from subjects</p>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-5">
          {editingId ? 'Edit Lecture' : 'Add New Lecture'}
        </h2>

        {subjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">You need to create at least one subject before adding lectures.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Subject */}
              <div>
                <label htmlFor="lecture-subject" className="text-sm font-medium text-slate-300 mb-1.5 block">
                  Subject
                </label>
                <div className="relative">
                  <select
                    id="lecture-subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full appearance-none cursor-pointer"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                  Lecture Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setType('recorded')}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 border ${
                      type === 'recorded'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                      </svg>
                      Recorded
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('live')}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 border ${
                      type === 'live'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      Live
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="lecture-title" className="text-sm font-medium text-slate-300 mb-1.5 block">
                Title
              </label>
              <input
                id="lecture-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Calculus"
                required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="lecture-desc" className="text-sm font-medium text-slate-300 mb-1.5 block">
                Description
              </label>
              <textarea
                id="lecture-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the lecture content..."
                rows={3}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full resize-none"
              />
            </div>

            {/* Conditional Fields */}
            {type === 'recorded' ? (
              <div>
                <label htmlFor="lecture-video" className="text-sm font-medium text-slate-300 mb-1.5 block">
                  YouTube Video URL (Unlisted)
                </label>
                <input
                  id="lecture-video"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="lecture-live-url" className="text-sm font-medium text-slate-300 mb-1.5 block">
                    Live Join URL
                  </label>
                  <input
                    id="lecture-live-url"
                    type="url"
                    value={liveJoinUrl}
                    onChange={(e) => setLiveJoinUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
                  />
                </div>
                <div>
                  <label htmlFor="lecture-scheduled" className="text-sm font-medium text-slate-300 mb-1.5 block">
                    Scheduled At
                  </label>
                  <input
                    id="lecture-scheduled"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            {/* Study Materials */}
            <div>
              <label htmlFor="lecture-materials" className="text-sm font-medium text-slate-300 mb-1.5 block">
                Study Materials (Google Drive Link)
              </label>
              <input
                id="lecture-materials"
                type="url"
                value={materialsUrl}
                onChange={(e) => setMaterialsUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
              />
              <p className="mt-2 text-xs text-slate-500">
                Paste a link to Google Drive folders, PDFs, or Notes. Make sure the sharing settings are set to &quot;Anyone with the link&quot;.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !subjectId}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-2.5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {editingId ? 'Updating...' : 'Adding...'}
                  </>
                ) : editingId ? (
                  'Update Lecture'
                ) : (
                  'Add Lecture'
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Lectures List */}
      <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">All Lectures</h2>
          <p className="text-sm text-slate-400 mt-0.5">{lectures.length} lecture{lectures.length !== 1 ? 's' : ''} total</p>
        </div>

        {lectures.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-slate-400">No lectures yet. Add your first lecture above.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Title
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Subject
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Created
                    </th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {lectures.map((lecture) => (
                    <tr
                      key={lecture.id}
                      className="hover:bg-slate-700/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{lecture.title}</div>
                        {lecture.description && (
                          <div className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">
                            {lecture.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {getSubjectName(lecture.subjectId)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                            lecture.type === 'live'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}
                        >
                          {lecture.type === 'live' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                          )}
                          {lecture.type === 'live' ? 'Live' : 'Recorded'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(lecture.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleEdit(lecture)}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lecture.id, lecture.title)}
                            className="text-sm text-rose-400 hover:text-rose-300 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700/30">
              {lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="px-5 py-4 hover:bg-slate-700/30 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="text-white font-medium truncate">{lecture.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {getSubjectName(lecture.subjectId)}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        lecture.type === 'live'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {lecture.type === 'live' ? 'Live' : 'Recorded'}
                    </span>
                  </div>
                  {lecture.description && (
                    <p className="text-sm text-slate-500 mb-2 line-clamp-2">{lecture.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(lecture.createdAt)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(lecture)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lecture.id, lecture.title)}
                        className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
