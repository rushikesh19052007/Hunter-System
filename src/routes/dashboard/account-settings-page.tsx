import React, { useState, useRef, useEffect } from 'react';
import { useHunter } from '@/lib/hunter-store';
import {
  ShieldAlert, Download, Upload, RefreshCcw, HardDrive, User, Calendar,
  Trash2, Wifi, WifiOff, Monitor, Globe, Cpu, CheckCircle,
} from 'lucide-react';
import { playSystemChime } from '@/lib/notifications';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// System Vitals Panel
const SystemVitalsPanel: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const screenRes = `${window.screen.width}×${window.screen.height}`;
  const viewportSize = `${window.innerWidth}×${window.innerHeight}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad/i.test(ua);
  const browser = ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Edg') ? 'Edge'
    : ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Safari') ? 'Safari'
    : 'Unknown';

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-emerald-400" /> System Vitals
      </h2>
      <div className="space-y-3 text-sm text-slate-300">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 flex items-center gap-1">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            Network
          </span>
          <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {isOnline ? '● ONLINE' : '● OFFLINE'}
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Screen</span>
          <span className="font-mono text-xs">{screenRes} (viewport: {viewportSize})</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500">Device Type</span>
          <span>{isMobile ? '📱 Mobile' : '🖥️ Desktop'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500">Browser</span>
          <span>{browser}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Timezone</span>
          <span className="font-mono text-xs">{timezone}</span>
        </div>
      </div>
    </div>
  );
};

export const AccountSettingsPage: React.FC = () => {
  const { profile, resetHunter } = useHunter();
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [backupExists, setBackupExists] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const importRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const daysActive = Math.max(1, Math.floor((Date.now() - (new Date(profile.created_at || Date.now())).getTime()) / (1000 * 60 * 60 * 24)));

  // Export full profile + quests + achievements as JSON
  const handleExportBackup = () => {
    const quests = (() => {
      try { return JSON.parse(localStorage.getItem('hunter_system_quests') || '[]'); } catch { return []; }
    })();
    const achievements = (() => {
      try { return JSON.parse(localStorage.getItem('hunter_system_achievements') || '[]'); } catch { return []; }
    })();

    const backupData = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      profile,
      quests,
      achievements,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter-backup-${profile.hunter_id || 'profile'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSystemChime('level');
  };

  // Import a previously exported backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        if (!data.profile || !data.profile.id) throw new Error('Invalid backup format');
        localStorage.setItem('hunter_system_profile', JSON.stringify(data.profile));
        if (Array.isArray(data.quests)) {
          localStorage.setItem('hunter_system_quests', JSON.stringify(data.quests));
        }
        if (Array.isArray(data.achievements)) {
          localStorage.setItem('hunter_system_achievements', JSON.stringify(data.achievements));
        }
        setImportStatus('success');
        playSystemChime('level');
        setTimeout(() => { window.location.reload(); }, 1500);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (importRef.current) importRef.current.value = '';
  };

  const handleResetAccount = async () => {
    if (resetConfirmText !== 'RESET') return;
    setIsResetting(true);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('backup_profiles').upsert({
          ...profile,
          reset_timestamp: new Date().toISOString(),
          retention_days: 30,
        });
        await supabase.from('notifications').delete().eq('user_id', profile.id);
        await supabase.from('system_log_events').delete().eq('user_id', profile.id);
        await supabase.from('achievements').delete().eq('user_id', profile.id);
        await supabase.from('profiles').update({
          has_backup: true,
          total_xp: 15,
          current_level: 1,
          quests_completed: 0,
        }).eq('id', profile.id);
      } catch (e) {
        console.error('Reset error', e);
      }
    }

    resetHunter();
    playSystemChime('alert');
    setIsResetting(false);
    setShowWarning(false);
    setBackupExists(true);
  };

  const handleRecover = () => {
    if (confirm('Restore all data from backup? This will overwrite your current state.')) {
      alert('Recovery initiated (Simulated). Your data is being restored.');
      setBackupExists(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6 border-b border-slate-800 pb-4">
        ACCOUNT SETTINGS
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Identity */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" /> Account Identity
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Hunter ID</span>
              <span className="font-mono text-cyan-400">{profile.hunter_id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Alias</span>
              <span>{profile.display_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Rank</span>
              <span className="text-amber-400 font-bold">{profile.current_rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Age</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {daysActive} Days</span>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-400" /> Data & Storage
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Quests Completed</span>
              <span>{profile.quests_completed} Records</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">System Log Entries</span>
              <span>{profile.system_log?.length || 0} Entries</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Total XP Earned</span>
              <span className="text-cyan-400">{profile.total_xp.toLocaleString()} XP</span>
            </div>

            {/* Export */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={handleExportBackup}
                className="text-sm bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Backup
              </button>

              {/* Import */}
              <label className="text-sm bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import Backup
                <input
                  ref={importRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </label>
            </div>

            {importStatus === 'success' && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs mt-1">
                <CheckCircle className="w-3.5 h-3.5" /> Backup imported! Reloading…
              </div>
            )}
            {importStatus === 'error' && (
              <div className="flex items-center gap-2 text-rose-400 text-xs mt-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Invalid backup file. Please use a Hunter System export.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Vitals */}
      <SystemVitalsPanel />

      {/* Danger Zone */}
      <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-6 mt-8">
        <h2 className="text-xl font-bold text-rose-400 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm text-slate-400 mb-6 max-w-2xl">
          Account reset will wipe your current progress, level, stats, and quests. A temporary backup will be kept for 30 days.
          <strong className="text-amber-400 ml-1">Export a backup first!</strong>
        </p>

        {!showWarning ? (
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowWarning(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500 text-rose-400 py-2 px-6 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              RESET ACCOUNT
            </button>
            {backupExists && (
              <button
                onClick={handleRecover}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500 text-cyan-400 py-2 px-6 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                RECOVER ACCOUNT
              </button>
            )}
          </div>
        ) : (
          <div className="bg-rose-950/40 p-5 rounded-lg border border-rose-500/50">
            <h3 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> WARNING: ACCOUNT RESET
            </h3>
            <div className="text-sm text-rose-200/80 mb-4 space-y-2">
              <p>This action CANNOT be undone immediately.</p>
              <p>You will lose: All quests history, levels, ranks, stats, and customization.</p>
              <p>Your data will be kept in backup for 30 days.</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-rose-300 block mb-1">Type "RESET" to confirm (case-sensitive)</label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                className="bg-black/50 border border-rose-500/50 rounded p-2 text-white outline-none focus:border-rose-400 w-full max-w-sm"
                placeholder="RESET"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWarning(false);
                  setResetConfirmText('');
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAccount}
                disabled={resetConfirmText !== 'RESET' || isResetting}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isResetting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
