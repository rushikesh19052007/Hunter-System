import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Trash2,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  Award,
  Clock,
  Radio,
} from 'lucide-react';
import {
  getNotificationLogs,
  type HunterNotification,
} from '@/lib/notifications';

interface NotificationCenterModalProps {
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<HunterNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'quest' | 'milestone' | 'urgent'>('all');

  useEffect(() => {
    setLogs(getNotificationLogs());
  }, []);

  const handleClearLogs = () => {
    localStorage.removeItem('hunter_notification_logs');
    setLogs([]);
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'quest') return log.category === 'quest';
    if (filter === 'milestone') return log.category === 'level_up' || log.category === 'rank_up';
    if (filter === 'urgent') return log.priority === 'urgent' || log.priority === 'high';
    return true;
  });

  const getLogIcon = (log: HunterNotification) => {
    if (log.category === 'level_up' || log.category === 'rank_up') {
      return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
    if (log.category === 'quest') {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (log.priority === 'urgent' || log.priority === 'high') {
      return <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />;
    }
    return <Radio className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-card notification-center-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, x: 50, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Bell className="w-5 h-5 text-cyan-400" />
            <div>
              <h3>SYSTEM TRANSMISSION ARCHIVE</h3>
              <p className="modal-subtitle">Directives, milestones, and mana warnings recorded by the System.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            title="Close Transmissions"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="notif-controls-bar">
          <div className="notif-filter-pills">
            {(['all', 'quest', 'milestone', 'urgent'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`notif-pill-btn ${filter === f ? 'active' : ''}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="btn-clear-logs"
              title="Clear Notification History"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-400 hover:text-rose-400" />
              <span>CLEAR</span>
            </button>
          )}
        </div>

        {/* Transmissions List */}
        <div className="notif-list-container">
          <AnimatePresence>
            {filteredLogs.map(log => {
              const isUrgent = log.priority === 'urgent' || log.priority === 'high';
              const dateStr = new Date(log.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`notif-log-card ${isUrgent ? 'urgent' : ''}`}
                >
                  <div className="notif-icon-col">{getLogIcon(log)}</div>
                  <div className="notif-body-col">
                    <div className="notif-meta-line">
                      <span className="notif-category-tag">[{log.category || 'SYSTEM'}]</span>
                      <span className="notif-title-text">{log.title}</span>
                      <span className="notif-timestamp">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {dateStr}
                      </span>
                    </div>
                    <p className="notif-message-text">{log.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="notif-empty-state">
              <Radio className="w-10 h-10 text-slate-600 mb-2" />
              <p>No transmissions in this category.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="text-muted text-xs">
            The System retains up to 50 recent neural transmissions in local memory.
          </span>
          <button type="button" onClick={onClose} className="btn-system-secondary">
            DISMISS
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationCenterModal;
