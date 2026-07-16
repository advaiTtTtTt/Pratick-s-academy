'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navbar />
      <main className="pt-20 min-h-screen bg-slate-950">
        {children}
      </main>
    </ProtectedRoute>
  );
}
