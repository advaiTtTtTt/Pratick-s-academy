'use client';

import { useState, useEffect } from 'react';
import { getActiveAlert, saveAlert, deactivateAlert, sendManualNotification } from '@/lib/firestore';
import type { Alert } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'bell' | 'banner'>('bell');
  const [loading, setLoading] = useState(true);

  // Bell Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifLink, setNotifLink] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Banner Alert State
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const currentAlert = await getActiveAlert();
        if (currentAlert) {
          setActiveAlert(currentAlert);
          setAlertMessage(currentAlert.message);
          if (currentAlert.targetDate) {
            const d = currentAlert.targetDate;
            const pad = (n: number) => n.toString().padStart(2, '0');
            setAlertDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
          }
        }
      } catch (error) {
        console.error('Error fetching alert:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlert();
  }, []);

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) return;
    setSendingNotif(true);
    try {
      await sendManualNotification(notifTitle, notifMessage, notifLink);
      alert('Notification sent successfully to all students!');
      setNotifTitle('');
      setNotifMessage('');
      setNotifLink('');
    } catch (e) {
      console.error(e);
      alert('Failed to send notification');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSaveAlert = async () => {
    if (!alertMessage) return;
    setSavingAlert(true);
    try {
      await saveAlert({
        message: alertMessage,
        targetDate: alertDate ? new Date(alertDate) : null,
        isActive: true,
      });
      
      const newAlert = await getActiveAlert();
      setActiveAlert(newAlert);
      alert('Banner Alert published successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save alert');
    } finally {
      setSavingAlert(false);
    }
  };

  const handleDeactivateAlert = async () => {
    if (!activeAlert) return;
    setSavingAlert(true);
    try {
      await deactivateAlert(activeAlert.id);
      setActiveAlert(null);
      setAlertMessage('');
      setAlertDate('');
    } catch (e) {
      console.error(e);
      alert('Failed to deactivate alert');
    } finally {
      setSavingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Communications Hub</h1>
        <p className="text-slate-400 mt-1">Send manual notifications and manage the global student banner.</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/80">
          <button
            onClick={() => setActiveTab('bell')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'bell'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            Push Notification (Bell Icon)
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'banner'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            Global Banner Alert
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'bell' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Send Push Notification</h2>
                  <p className="text-sm text-slate-400">Instantly appears in the students&apos; notification dropdown.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Notification Title *</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. Live Class Cancelled Today"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message Body *</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="e.g. Hey everyone, sorry but today's class is cancelled..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Link URL (Optional)</label>
                  <input
                    type="text"
                    value={notifLink}
                    onChange={(e) => setNotifLink(e.target.value)}
                    placeholder="e.g. /lectures/123 (Where should they go when they click?)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSendNotification}
                    disabled={sendingNotif || !notifTitle || !notifMessage}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingNotif ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-amber-400">Global Banner Alert</h2>
                  <p className="text-sm text-slate-400">Displays a sticky banner at the top of the student app.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Banner Message *</label>
                  <input
                    type="text"
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="e.g. Next Live Session starts in..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Countdown Target Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={alertDate}
                    onChange={(e) => setAlertDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none [color-scheme:dark]"
                  />
                  <p className="text-xs text-slate-500 mt-1">If left blank, the banner will just display the message without a countdown timer.</p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  {activeAlert && (
                    <button
                      onClick={handleDeactivateAlert}
                      disabled={savingAlert}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg px-6 py-2.5 transition-colors disabled:opacity-50"
                    >
                      Clear Active Banner
                    </button>
                  )}
                  <button
                    onClick={handleSaveAlert}
                    disabled={savingAlert || !alertMessage}
                    className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeAlert ? 'Update Banner' : 'Publish Banner'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
