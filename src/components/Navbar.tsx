'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOutUser } from '@/lib/auth';

interface NavLink {
  label: string;
  href: string;
}

const studentLinks: NavLink[] = [
  { label: 'Home', href: '/' },
];

const adminLinks: NavLink[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Subjects', href: '/admin/subjects' },
  { label: 'Lectures', href: '/admin/lectures' },
  { label: 'Students', href: '/admin/students' },
];

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true;
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && href !== '/admin' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Brand */}
        <Link href={user?.role === 'admin' ? '/admin' : '/'} className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Academy
          </span>
        </Link>

        {/* Center: Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-white bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: User info + Logout (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <>
              <span className="text-sm text-slate-300">{user.name || user.email}</span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  user.role === 'admin'
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white transition-all duration-200"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-white bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <div className="pt-3 mt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm text-slate-300">{user.name || user.email}</span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full mt-1 px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
