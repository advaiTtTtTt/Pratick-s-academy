'use client';

import { useState, useEffect } from 'react';
import { getStudents } from '@/lib/firestore';

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data as Student[]);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Registered Students</h1>
        <p className="text-slate-400 mt-1">View all registered student accounts</p>
      </div>

      {/* Info banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 mb-8 flex items-start gap-3">
        <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <p className="text-sm text-indigo-300">
          Students register through the student portal. You can also create student accounts directly via the Firebase Console.
        </p>
      </div>

      {/* Students List */}
      <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <p className="text-slate-400 text-lg font-medium">No students registered yet</p>
            <p className="text-slate-500 text-sm mt-1">Students will appear here once they sign up</p>
          </div>
        ) : (
          <>
            {/* Student count */}
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-400">
                {students.length} student{students.length !== 1 ? 's' : ''} registered
              </h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Name
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-700/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-indigo-400">
                              {(student.name || student.email || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            {student.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {student.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-slate-700/30">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="px-5 py-4 hover:bg-slate-700/30 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-indigo-400">
                        {(student.name || student.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {student.name || '—'}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {student.email}
                      </p>
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
