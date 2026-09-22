import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Bell,
  Activity,
  Download,
  RotateCcw,
  X,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  getNotificationConfig,
  saveNotificationConfig,
  playSystemChime,
  type SmartNotificationConfig,
} from '@/lib/notifications';
import { getAnalyticsRecords, type AnalyticsRecord } from '@/lib/analytics';
import { useHunter } from '@/lib/hunter-store';

interface SystemSettingsModalProps {
  onClose: () => void;
  onReplayAwakening?: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  onClose,
  onReplayAwakening,
}) => {
  const { profile, resetHunter } = useHunter();
  const [config, setConfig] = useState<SmartNotificationConfig>(getNotificationConfig());
  const [activeTab, setActiveTab] = useState<'audio_alerts' | 'telemetry' | 'data'>('audio_alerts');
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setAnalytics(getAnalyticsRecords().reverse());
  }, [activeTab]);

  const updateConfig = (updates: Partial<SmartNotificationConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    saveNotificationConfig(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const updateQuietMode = (updates: Partial<SmartNotificationConfig['quietMode']>) => {
    const updated = {
      ...config,
      quietMode: { ...config.quietMode, ...updates },
    };
    setConfig(updated);
    saveNotificationConfig(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const requestBrowserPerms = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        updateConfig({ browserNotifications: true });
        playSystemChime('level');
      } else {
        updateConfig({ browserNotifications: false });
      }
    }
  };

  const handleExportData = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter-profile-${profile.hunter_id || 'backup'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-card system-settings-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Settings className="w-5 h-5 text-cyan-400" />
            <div>
              <h3>SYSTEM CONTROL PANEL</h3>
              <p className="modal-subtitle">Audio harmonics, quiet hours, telemetry, and data configuration.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            title="Close Settings"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="settings-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('audio_alerts')}
            className={`settings-tab-btn ${activeTab === 'audio_alerts' ? 'active' : ''}`}
          >
            <Volume2 className="w-4 h-4 mr-1.5" />
            <span>ALERTS & AUDIO</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`settings-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            <span>SYSTEM TELEMETRY</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`settings-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>DATA & REBOOT</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content-body">
          {/* AUDIO & ALERTS */}
          {activeTab === 'audio_alerts' && (
            <div className="settings-section-stack">
              <div className="settings-group-card">
                <div className="settings-card-title">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>ACOUSTIC SYNTHESIZER (AUDIO)</span>
                </div>

                <div className="setting-toggle-row">
                  <div>
                    <span className="setting-name">Audio Chimes & System Pings</span>
                    <span className="setting-desc">Plays Web Audio synthesizers during level-ups, quest clears, and gates.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                    className={`setting-switch ${config.soundEnabled ? 'on' : 'off'}`}
                  >
                    {config.soundEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                <div className="audio-test-row">
                  <span className="text-xs text-muted">Test Acoustic Chime:</span>
                  <button
                    type="button"
                    onClick={() => playSystemChime('quest')}
                    className="btn-chime-test"
                  >
                    Quest Chime
                  </button>
                  <button
                    type="button"
                    onClick={() => playSystemChime('level')}
                    className="btn-chime-test"
                  >
                    Level-up Triad
                  </button>
                  <button
                    type="button"
                    onClick={() => playSystemChime('alert')}
                    className="btn-chime-test"
                  >
                    Urgent Alert
                  </button>
                </div>
              </div>

              {/* QUIET MODE */}
              <div className="settings-group-card">
                <div className="settings-card-title">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span>QUIET HOURS PROTOCOL</span>
                </div>

                <div className="setting-toggle-row">
                  <div>
                    <span className="setting-name">Enable Quiet Hours</span>
                    <span className="setting-desc">Suppresses non-urgent sounds and toasts during resting hours.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuietMode({ enabled: !config.quietMode.enabled })}
                    className={`setting-switch ${config.quietMode.enabled ? 'on' : 'off'}`}
                  >
                    {config.quietMode.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="quiet-hours-range">
                  <div>
                    <label className="input-label">START HOUR (24H)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.quietMode.startHour}
                      onChange={e => updateQuietMode({ startHour: Number(e.target.value) })}
                      className="system-text-input w-24"
                    />
                  </div>
                  <span className="range-to">to</span>
                  <div>
                    <label className="input-label">END HOUR (24H)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.quietMode.endHour}
                      onChange={e => updateQuietMode({ endHour: Number(e.target.value) })}
                      className="system-text-input w-24"
                    />
                  </div>
                </div>

                <div className="setting-toggle-row mt-3">
                  <div>
                    <span className="setting-name">Allow Urgent Dungeon Warnings</span>
                    <span className="setting-desc">Critical dungeon breaks will bypass quiet hours.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuietMode({ allowUrgent: !config.quietMode.allowUrgent })}
                    className={`setting-switch ${config.quietMode.allowUrgent ? 'on' : 'off'}`}
                  >
                    {config.quietMode.allowUrgent ? 'ALLOWED' : 'MUTED'}
                  </button>
                </div>
              </div>

              {/* BROWSER NOTIFICATIONS */}
              <div className="settings-group-card">
                <div className="settings-card-title">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>BROWSER PUSH NOTIFICATIONS</span>
                </div>

                <div className="setting-toggle-row">
                  <div>
                    <span className="setting-name">Desktop Push Directives</span>
                    <span className="setting-desc">Allows browser-level notifications when the tab is backgrounded.</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestBrowserPerms}
                    className={`setting-switch ${config.browserNotifications ? 'on' : 'off'}`}
                  >
                    {config.browserNotifications ? 'ACTIVE' : 'REQUEST ACCESS'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="telemetry-view">
              <div className="telemetry-header">
                <div>
                  <h4 className="telemetry-title">NEURAL SYSTEM TELEMETRY BUFFER</h4>
                  <p className="text-xs text-muted">
                    Last 100 system state events recorded in local storage.
                  </p>
                </div>
                <span className="telemetry-count">{analytics.length} Events</span>
              </div>

              <div className="telemetry-logs-list">
                {analytics.map((rec, i) => (
                  <div key={i} className="telemetry-log-item">
                    <span className="telemetry-event-name">{rec.event}</span>
                    <span className="telemetry-time">
                      {new Date(rec.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    {rec.properties && (
                      <pre className="telemetry-props">
                        {JSON.stringify(rec.properties, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}

                {analytics.length === 0 && (
                  <div className="text-center py-8 text-muted">No telemetry events recorded yet.</div>
                )}
              </div>
            </div>
          )}

          {/* DATA & REBOOT */}
          {activeTab === 'data' && (
            <div className="settings-section-stack">
              <div className="settings-group-card">
                <div className="settings-card-title">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>BACKUP HUNTER PROFILE</span>
                </div>
                <p className="setting-desc mb-3">
                  Export your awakened soul profile, statistics, unlocked achievements, and lifetime XP to a local JSON archive.
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn-system-primary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>EXPORT PROFILE (.JSON)</span>
                </button>
              </div>

              <div className="settings-group-card danger-zone">
                <div className="settings-card-title text-rose-400">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>CRITICAL: SYSTEM REBOOT</span>
                </div>
                <p className="setting-desc mb-3">
                  Erases all local profile progression, quests, streaks, and achievements, returning you to the unawakened candidate state.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('CRITICAL WARNING: Initiate full System Reboot? All local hunter progression will be deleted.')) {
                      resetHunter();
                      onClose();
                      if (onReplayAwakening) onReplayAwakening();
                    }
                  }}
                  className="btn-reboot w-full justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>INITIATE SYSTEM REBOOT (FACTORY RESET)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {savedNotice && (
            <span className="settings-saved-indicator">
              <Check className="w-3.5 h-3.5 mr-1" />
              Settings Synced
            </span>
          )}
          <button type="button" onClick={onClose} className="btn-system-secondary ml-auto">
            CLOSE CONTROL PANEL
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemSettingsModal;
