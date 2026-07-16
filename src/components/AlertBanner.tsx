'use client';

import { useState, useEffect } from 'react';
import { getActiveAlert } from '@/lib/firestore';
import type { Alert } from '@/lib/types';

export default function AlertBanner() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const active = await getActiveAlert();
        setAlert(active);
      } catch (err) {
        console.error('Failed to fetch alert:', err);
      }
    };
    fetchAlert();
  }, []);

  useEffect(() => {
    if (!alert || !alert.targetDate) return;

    const calculateTimeLeft = () => {
      if (!alert.targetDate) return;
      const difference = alert.targetDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-50 font-medium">{alert.message}</span>
        </div>
        
        {alert.targetDate && (
          timeLeft ? (
            <div className="flex items-center gap-2 font-mono text-amber-400 bg-amber-950/50 px-3 py-1 rounded-lg border border-amber-500/20">
              {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
              <span>{timeLeft.h.toString().padStart(2, '0')}h</span>
              <span>{timeLeft.m.toString().padStart(2, '0')}m</span>
              <span>{timeLeft.s.toString().padStart(2, '0')}s</span>
            </div>
          ) : (
            <span className="font-bold text-emerald-400 uppercase tracking-widest text-sm bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              Happening Now!
            </span>
          )
        )}
      </div>
    </div>
  );
}
