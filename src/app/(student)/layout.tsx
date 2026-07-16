'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="pt-20">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
