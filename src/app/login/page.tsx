'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { getUserByUid, createUserDoc } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signIn(email, password);
        let userData = await getUserByUid(userCredential.user.uid);

        if (!userData) {
          // Self-heal: If Auth exists but Firestore profile is missing, create it now!
          const adminEmails = ['pratikrajguru45@gmail.com', '2023.advait.daware@ves.ac.in'];
          const assignedRole = adminEmails.includes(email) ? 'admin' : 'student';
          
          try {
            await createUserDoc(userCredential.user.uid, {
              email,
              name: '', 
              role: assignedRole,
            });
            userData = { id: userCredential.user.uid, email, name: '', role: assignedRole };
          } catch (error) {
            console.error('Failed to create missing profile:', error);
            setError('Missing database permissions. Please update your Firebase Rules!');
            setLoading(false);
            return;
          }
        }

        if (userData.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        const userCredential = await signUp(email, password);
        const adminEmails = ['pratikrajguru45@gmail.com', '2023.advait.daware@ves.ac.in'];
        const assignedRole = adminEmails.includes(email) ? 'admin' : 'student';
        
        await createUserDoc(userCredential.user.uid, {
          email,
          name,
          role: assignedRole,
        });
        
        if (assignedRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Error: ${message}`);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5" />

      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Victory Education" className="h-24 w-auto drop-shadow-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-slate-400 mt-2">{isLogin ? 'Sign in to access your courses' : 'Sign up to start learning'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Signing up...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200"
            >
              {isLogin ? "Don't have an account? Sign up →" : "Already have an account? Log in →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
