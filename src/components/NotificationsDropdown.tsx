'use client';

import { useState, useEffect, useRef } from 'react';
import { getRecentNotifications } from '@/lib/firestore';
import type { Notification } from '@/lib/types';
import Link from 'next/link';

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastReadNotificationAt');
    if (saved) {
      setLastReadAt(parseInt(saved, 10));
    }
  }, []);

  const markAsRead = () => {
    const now = Date.now();
    setLastReadAt(now);
    localStorage.setItem('lastReadNotificationAt', now.toString());
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await getRecentNotifications(10);
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen((prev) => {
          if (prev) markAsRead();
          return false;
        });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          if (isOpen) markAsRead();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800/50 transition-colors relative"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {notifications.some(n => n.createdAt.getTime() > lastReadAt) && !isOpen && (
          <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map((n) => {
                  const isUnread = n.createdAt.getTime() > lastReadAt;
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>}
                      </div>
                      <p className={`text-sm mt-0.5 ${isUnread ? 'text-slate-300' : 'text-slate-400'}`}>{n.message}</p>
                      <p className={`text-xs mt-2 font-mono ${isUnread ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {n.createdAt.toLocaleDateString()} {n.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </>
                  );

                  return n.link ? (
                    <Link
                      href={n.link}
                      key={n.id}
                      onClick={() => { markAsRead(); setIsOpen(false); }}
                      className={`block px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${isUnread ? 'bg-slate-800/80' : 'bg-transparent opacity-75'}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id} className={`px-4 py-3 hover:bg-slate-700/50 transition-colors ${isUnread ? 'bg-slate-800/80' : 'bg-transparent opacity-75'}`}>
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
