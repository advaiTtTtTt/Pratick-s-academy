'use client';

import { useState, useEffect } from 'react';
import { getSubjects, addSubject, updateSubject, deleteSubject } from '@/lib/firestore';
import { Subject } from '@/lib/types';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState<number>(0);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await addSubject({ name: newName.trim(), order: newOrder });
      setNewName('');
      setNewOrder(0);
      await fetchSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditOrder(subject.order);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditOrder(0);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      await updateSubject(id, { name: editName.trim(), order: editOrder });
      setEditingId(null);
      await fetchSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteSubject(id);
      await fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === subjects.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const currentSubject = subjects[index];
    const targetSubject = subjects[newIndex];

    setSubmitting(true);
    try {
      await Promise.all([
        updateSubject(currentSubject.id, { order: targetSubject.order }),
        updateSubject(targetSubject.id, { order: currentSubject.order }),
      ]);
      await fetchSubjects();
    } catch (error) {
      console.error('Error reordering subjects:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Subjects</h1>
        <p className="text-slate-400 mt-1">Add, edit, or remove subjects from the curriculum</p>
      </div>

      {/* Add Subject Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Add New Subject</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="subject-name" className="text-sm font-medium text-slate-300 mb-1.5 block">
              Subject Name
            </label>
            <input
              id="subject-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mathematics"
              required
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
            />
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor="subject-order" className="text-sm font-medium text-slate-300 mb-1.5 block">
              Order
            </label>
            <input
              id="subject-order"
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Subject
            </button>
          </div>
        </form>
      </div>

      {/* Subjects List */}
      <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-slate-400">No subjects yet. Add your first subject above.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 bg-slate-800/80 px-6 py-3">
              <div className="col-span-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Name
              </div>
              <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Order
              </div>
              <div className="col-span-5 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-700/30">
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className="px-6 py-4 hover:bg-slate-700/30 transition-colors duration-150"
                >
                  {editingId === subject.id ? (
                    /* Edit Mode */
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(subject.id)}
                          disabled={submitting}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 font-medium transition-all duration-200 text-sm disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 py-2.5 font-medium transition-all duration-200 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                      <div className="sm:col-span-5">
                        <span className="text-white font-medium">{subject.name}</span>
                      </div>
                      <div className="hidden sm:flex sm:col-span-2 items-center gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0 || submitting}
                          className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === subjects.length - 1 || submitting}
                          className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>
                      <div className="sm:col-span-5 flex gap-2 sm:justify-end">
                        <button
                          onClick={() => handleStartEdit(subject)}
                          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id, subject.name)}
                          className="text-sm text-rose-400 hover:text-rose-300 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
