import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  Plus,
  Check,
  Dumbbell,
  Code,
  GraduationCap,
  Lightbulb,
  Brain,
  Heart,
  Shield,
  Target,
  Users,
  Palette,
  Compass,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import QUEST_LIBRARY, { type LibraryQuest } from '@/lib/quest-library';
import {
  getCategoryLabel,
  getDifficultyColor,
  getDifficultyStars,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_XP,
  type QuestCategory,
  type DifficultyGrade,
} from '@/lib/game-engine';

interface QuestCodexModalProps {
  onClose: () => void;
}

const CODEX_CATEGORIES: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'ALL DIRECTIVES', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'physical', label: 'PHYSICAL', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  { id: 'coding', label: 'CODING', icon: <Code className="w-3.5 h-3.5" /> },
  { id: 'study', label: 'STUDY', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'knowledge', label: 'KNOWLEDGE', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'mental', label: 'MENTAL', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'health', label: 'HEALTH', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'discipline', label: 'DISCIPLINE', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'productivity', label: 'PRODUCTIVITY', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'social', label: 'SOCIAL', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'creative', label: 'CREATIVE', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'personal_development', label: 'PERSONAL DEV', icon: <Compass className="w-3.5 h-3.5" /> },
];

const DIFFICULTY_GRADES: Array<DifficultyGrade | 'ALL'> = ['ALL', 'E', 'D', 'C', 'B', 'A', 'S'];

export const QuestCodexModal: React.FC<QuestCodexModalProps> = ({ onClose }) => {
  const { quests, acceptLibraryQuest } = useHunter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyGrade | 'ALL'>('ALL');

  // Active quest names set for fast lookup
  const activeQuestNames = useMemo(() => {
    return new Set(quests.map(q => q.name.toLowerCase().trim()));
  }, [quests]);

  const filteredQuests = useMemo(() => {
    return QUEST_LIBRARY.filter(q => {
      const matchCat = selectedCategory === 'all' || q.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
      const matchSearch =
        !search.trim() ||
        q.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        q.description.toLowerCase().includes(search.toLowerCase().trim()) ||
        q.stat.toLowerCase().includes(search.toLowerCase().trim());
      return matchCat && matchDiff && matchSearch;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-card quest-codex-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3>ARCHITECT'S QUEST CODEX</h3>
              <p className="modal-subtitle">
                Inspect and accept system directives into your active quest registry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            title="Close Codex"
            aria-label="Close Codex"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls: Search & Difficulty Filter */}
        <div className="codex-controls-bar">
          <div className="codex-search-box">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, trial description, or stat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="codex-search-input"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="codex-search-clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="codex-diff-pills">
            <span className="filter-hint">RANK:</span>
            {DIFFICULTY_GRADES.map(diff => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`codex-diff-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                style={
                  diff !== 'ALL' && selectedDifficulty === diff
                    ? { borderColor: getDifficultyColor(diff), color: getDifficultyColor(diff) }
                    : {}
                }
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="codex-category-tabs">
          {CODEX_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`codex-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Quests Listing Container */}
        <div className="codex-results-meta">
          <span>{filteredQuests.length} DIRECTIVES DISCOVERED</span>
          <span className="text-muted">Total Codex Archive: {QUEST_LIBRARY.length} Trials</span>
        </div>

        <div className="codex-quests-scroll">
          <div className="codex-grid">
            <AnimatePresence>
              {filteredQuests.map((quest: LibraryQuest) => {
                const isActive = activeQuestNames.has(quest.name.toLowerCase().trim());
                const diffColor = getDifficultyColor(quest.difficulty);
                const baseXp = DIFFICULTY_XP[quest.difficulty] || 25;
                const statXp = DIFFICULTY_STAT_XP[quest.difficulty] || 10;

                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`codex-quest-card ${isActive ? 'inscribed' : ''}`}
                  >
                    <div className="codex-card-header">
                      <span className={`quest-category-badge cat-${quest.category}`}>
                        {getCategoryLabel(quest.category as QuestCategory)}
                      </span>
                      <div
                        className="quest-diff-badge"
                        style={{ color: diffColor, borderColor: diffColor }}
                      >
                        <span className="diff-letter">{quest.difficulty}</span>
                        <span className="diff-stars">{getDifficultyStars(quest.difficulty)}</span>
                      </div>
                      <span className="codex-stat-tag">{quest.stat}</span>
                    </div>

                    <h4 className="codex-quest-title">{quest.name}</h4>
                    <p className="codex-quest-desc">{quest.description}</p>

                    <div className="codex-card-footer">
                      <div className="codex-rewards-line">
                        <span className="codex-xp">+{baseXp} XP</span>
                        <span className="codex-statxp">+{statXp} Stat XP</span>
                        <span className="codex-target">
                          {quest.target} {quest.unit}
                        </span>
                      </div>

                      {isActive ? (
                        <div className="inscribed-badge">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>ACTIVE</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acceptLibraryQuest(quest)}
                          className="btn-accept-codex"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>ACCEPT</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredQuests.length === 0 && (
              <div className="codex-empty-state">
                <BookOpen className="w-12 h-12 text-slate-600 mb-2" />
                <h4>No directives match your filter criteria</h4>
                <p>Try clearing your search query or selecting a different category/grade.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('ALL');
                  }}
                  className="btn-system-secondary mt-3"
                >
                  RESET FILTERS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer codex-footer">
          <span className="codex-note">
            Accepted directives will immediately inscribe to your Dashboard Quest Board.
          </span>
          <button type="button" onClick={onClose} className="btn-system-secondary">
            DISMISS CODEX
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestCodexModal;
