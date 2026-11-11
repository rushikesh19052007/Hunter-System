import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useHunter } from '@/lib/hunter-store';
import {
  ShieldAlert,
  Download,
  Upload,
  User,
  Calendar,
  Trash2,
  Wifi,
  WifiOff,
  Monitor,
  Globe,
  Cpu,
  CheckCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
} from 'lucide-react';
import { audioService } from '@/lib/audio-service';
import { getRankBadgeInfo } from '@/lib/game-engine';

export const AccountSettingsPage: React.FC = () => {
  const { profile, resetHunter, deleteAccount } = useHunter();
  const [dangerAction, setDangerAction] = useState<'none' | 'reset' | 'delete'>('none');
  const [confirmText, setConfirmText] = useState('');
  const [isProcessingDanger, setIsProcessingDanger] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedId, setCopiedId] = useState(false);
  const [isMuted, setIsMuted] = useState(audioService.isMuted());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const importRef = useRef<HTMLInputElement>(null);

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

  const daysActive = useMemo(() => {
    if (!profile?.created_at) return 1;
    const created = new Date(profile.created_at).getTime();
    return Math.max(1, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
  }, [profile?.created_at]);

  if (!profile) return null;

  const rankInfo = getRankBadgeInfo(profile.current_rank);
  const screenRes = `${window.screen.width}×${window.screen.height}`;
  const viewportSize = `${window.innerWidth}×${window.innerHeight}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad/i.test(ua);
  const browser = ua.includes('Firefox')
    ? 'Firefox'
    : ua.includes('Edg')
    ? 'Edge'
    : ua.includes('Chrome')
    ? 'Chrome'
    : ua.includes('Safari')
    ? 'Safari'
    : 'Unknown';

    const handleCopyId = () => {
    audioService.playClick();
    navigator.clipboard.writeText(profile.hunter_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleAudio = () => {
    const nextMute = !isMuted;
    audioService.setMuted(nextMute);
    setIsMuted(nextMute);
    if (!nextMute) {
      audioService.playSuccess();
    }
  };

  // Export full profile + quests + achievements as JSON
  const handleExportBackup = () => {
    audioService.playClick();
    const quests = (() => {
      try {
        const key = profile?.id ? `hunter_system_quests_${profile.id}` : 'hunter_system_quests';
        return JSON.parse(localStorage.getItem(key) || localStorage.getItem('hunter_system_quests') || '[]');
      } catch {
        return [];
      }
    })();
    const achievements = (() => {
      try {
        const key = profile?.id ? `hunter_system_achievements_${profile.id}` : 'hunter_system_achievements';
        return JSON.parse(localStorage.getItem(key) || localStorage.getItem('hunter_system_achievements') || '[]');
      } catch {
        return profile?.badges || [];
      }
    })();

    const backupData = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      profile,
      quests,
      achievements,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter-backup-${profile.hunter_id || 'profile'}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    audioService.playSuccess();
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
        const uid = data.profile.id;
        localStorage.setItem(`hunter_system_profile_${uid}`, JSON.stringify(data.profile));
        localStorage.setItem('hunter_system_profile', JSON.stringify(data.profile));
        if (Array.isArray(data.quests)) {
          localStorage.setItem(`hunter_system_quests_${uid}`, JSON.stringify(data.quests));
          localStorage.setItem('hunter_system_quests', JSON.stringify(data.quests));
        }
        if (Array.isArray(data.achievements)) {
          localStorage.setItem(`hunter_system_achievements_${uid}`, JSON.stringify(data.achievements));
          localStorage.setItem('hunter_system_achievements', JSON.stringify(data.achievements));
        }
        setImportStatus('success');
        audioService.playLevelUp();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  const handleResetProgression = async () => {
    if (confirmText.trim() !== 'RESET') return;
    setIsProcessingDanger(true);
    setDangerError(null);
    try {
      audioService.playDungeonAlert();
      await resetHunter();
      setDangerAction('none');
      setConfirmText('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDangerError(e?.message || 'Failed to reset hunter progression.');
    } finally {
      setIsProcessingDanger(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== 'DELETE') return;
    setIsProcessingDanger(true);
    setDangerError(null);
    try {
      audioService.playDungeonAlert();
      await deleteAccount();
      // AuthGate automatically redirects to login screen when user is deleted
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'auth/requires-recent-login') {
        setDangerError('For security, deleting your account requires a recent sign-in. Please log out, sign in again, and retry account deletion.');
      } else {
        setDangerError(e?.message || 'Failed to delete account.');
      }
      setIsProcessingDanger(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '28px 20px 80px',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 26, 64, 0.2)',
          marginBottom: '28px',
        }}
      >
        <Sparkles className="w-7 h-7 text-rose-500" />
        <div>
          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              letterSpacing: '2px',
              margin: 0,
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(255, 26, 64, 0.4)',
            }}
          >
            ACCOUNT & SYSTEM SETTINGS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Manage Hunter license identity, local data backups, system diagnostics, and security controls.
          </p>
        </div>
      </div>

      {/* 2-Column Grid of Settings Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Account Identity */}
        <div
          style={{
            backgroundColor: '#0c1020',
            borderRadius: '16px',
            border: '1px solid #1c253d',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid #1a233a',
            }}
          >
            <User className="w-5 h-5 text-rose-500" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '1px' }}>
              HUNTER IDENTITY
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Hunter ID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#ff1a40',
                    fontSize: '13px',
                  }}
                >
                  {profile.hunter_id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copy Hunter ID"
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255, 26, 64, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    color: copiedId ? '#10b981' : '#ff1a40',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Alias / Name</span>
              <span style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                {profile.display_name}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Class / Rank</span>
              <span
                style={{
                  padding: '4px 10px',
                  backgroundColor: `${rankInfo.color}22`,
                  border: `1px solid ${rankInfo.color}`,
                  borderRadius: '6px',
                  color: rankInfo.color,
                  fontWeight: 900,
                  fontSize: '12px',
                }}
              >
                {rankInfo.label}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Equipped Title</span>
              <span style={{ color: '#ffb300', fontWeight: 700, fontSize: '13px' }}>
                〔{profile.equipped_title || 'The Awakened'}〕
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Account Age</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <Calendar className="w-3.5 h-3.5 text-rose-500" /> {daysActive} Days Active
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Data & Storage */}
        <div
          style={{
            backgroundColor: '#0c1020',
            borderRadius: '16px',
            border: '1px solid #1c253d',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid #1a233a',
            }}
          >
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '1px' }}>
              CLOUD DATA & BACKUPS
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Quests Completed</span>
              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                {profile.quests_completed} Cleared
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>System Logs</span>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                {profile.system_log?.length || 0} Recorded
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Total Accumulated XP</span>
              <span style={{ fontWeight: 900, color: '#ffb300', fontSize: '14px' }}>
                {profile.total_xp.toLocaleString()} XP
              </span>
            </div>

            {/* Backup Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 26, 64, 0.4)',
                  backgroundColor: 'rgba(255, 26, 64, 0.1)',
                  color: '#67e8f9',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>EXPORT BACKUP</span>
              </button>

              <button
                type="button"
                onClick={() => importRef.current?.click()}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  color: '#d8b4fe',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>IMPORT BACKUP</span>
              </button>

              <input
                ref={importRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportBackup}
              />
            </div>

            {importStatus === 'success' && (
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '8px',
                  color: '#6ee7b7',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Backup verified and imported. Synchronizing...</span>
              </div>
            )}

            {importStatus === 'error' && (
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Invalid backup format. Please select an exported Hunter file.</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: System Vitals & Diagnostics */}
        <div
          style={{
            backgroundColor: '#0c1020',
            borderRadius: '16px',
            border: '1px solid #1c253d',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid #1a233a',
            }}
          >
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '1px' }}>
              SYSTEM VITALS & DIAGNOSTICS
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
                Network Sync
              </span>
              <span
                style={{
                  color: isOnline ? '#34d399' : '#f87171',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                {isOnline ? '● ONLINE (LIVE SYNC)' : '● OFFLINE (CACHE)'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Monitor className="w-4 h-4 text-rose-500" /> Display
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                {screenRes} ({viewportSize})
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Client Platform</span>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                {isMobile ? '📱 Mobile Browser' : '🖥️ Desktop Web Client'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Browser Engine</span>
              <span style={{ fontSize: '13px', color: '#67e8f9', fontWeight: 700 }}>
                {browser}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe className="w-4 h-4 text-indigo-400" /> Timezone
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                {timezone}
              </span>
            </div>

            {/* Audio Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-rose-500" />}
                Audio Feedback
              </span>
              <button
                type="button"
                onClick={handleToggleAudio}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: isMuted ? '1px solid #334155' : '1px solid #ff1a40',
                  backgroundColor: isMuted ? 'transparent' : 'rgba(255, 26, 64, 0.1)',
                  color: isMuted ? '#64748b' : '#ff1a40',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isMuted ? 'SOUND MUTED' : 'SOUND ACTIVE'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Danger Zone */}
        <div
          style={{
            backgroundColor: '#0c1020',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f87171', letterSpacing: '1px' }}>
              DANGER ZONE
            </h2>
          </div>

          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            Choose whether to reset your Hunter progression or permanently delete your account. Both actions completely remove your presence from the Global Leaderboard.
          </p>

          {dangerError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              {dangerError}
            </div>
          )}

          {dangerAction === 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setDangerAction('reset');
                  setConfirmText('');
                  setDangerError(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>RESET HUNTER PROGRESSION & LEADERBOARD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDangerAction('delete');
                  setConfirmText('');
                  setDangerError(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.25)',
                  color: '#fca5a5',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>PERMANENTLY DELETE ACCOUNT & ALL DATA</span>
              </button>
            </div>
          )}

          {dangerAction === 'reset' && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <p
                style={{
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 700,
                  margin: '0 0 10px 0',
                }}
              >
                Type <strong style={{ color: '#fff' }}>RESET</strong> below to confirm wiping your Hunter license, stats, quests, and removing yourself from the Global Leaderboard:
              </p>
              <input
                type="text"
                placeholder='Type "RESET"'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#060812',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={confirmText.trim() !== 'RESET' || isProcessingDanger}
                  onClick={handleResetProgression}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: confirmText.trim() === 'RESET' ? '#ef4444' : '#475569',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: confirmText.trim() === 'RESET' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessingDanger ? 'WIPING...' : 'CONFIRM RESET & REMOVE FROM LEADERBOARD'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDangerAction('none');
                    setConfirmText('');
                    setDangerError(null);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {dangerAction === 'delete' && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <p
                style={{
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 700,
                  margin: '0 0 10px 0',
                }}
              >
                Type <strong style={{ color: '#fff' }}>DELETE</strong> below to permanently delete your account, purge all Hunter data, and remove yourself from the Global Leaderboard forever:
              </p>
              <input
                type="text"
                placeholder='Type "DELETE"'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#060812',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={confirmText.trim() !== 'DELETE' || isProcessingDanger}
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: confirmText.trim() === 'DELETE' ? '#dc2626' : '#475569',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: confirmText.trim() === 'DELETE' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessingDanger ? 'DELETING ACCOUNT...' : 'CONFIRM PERMANENT ACCOUNT DELETION'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDangerAction('none');
                    setConfirmText('');
                    setDangerError(null);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
