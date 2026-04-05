import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Sparkles, Users, Package, Stethoscope, Building2,
  ShoppingCart, Receipt, Target, UserPlus, Calendar,
  ArrowRight, Loader2, ChevronRight, Command, TrendingUp,
  Pill, Home, AlertCircle
} from 'lucide-react';

interface SearchResult {
  type: string;
  category: string;
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  meta: string[];
  route: string;
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
  totalCount: number;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Medical Representative': Users,
  'Product': Pill,
  'Doctor': Stethoscope,
  'Pharmacy': Building2,
  'Hospital': Building2,
  'Sale': ShoppingCart,
  'Expense': Receipt,
  'Target': Target,
  'Lead': UserPlus,
  'Visit Schedule': Calendar,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Medical Representative': '#6366f1',
  'Product': '#8b5cf6',
  'Doctor': '#0ea5e9',
  'Pharmacy': '#10b981',
  'Hospital': '#f59e0b',
  'Sale': '#22c55e',
  'Expense': '#f97316',
  'Target': '#ef4444',
  'Lead': '#ec4899',
  'Visit Schedule': '#14b8a6',
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  blue: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  yellow: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  red: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  purple: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  orange: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  gray: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
};

const QUICK_ACTIONS = [
  { label: 'MR Management', route: '/mrs', icon: Users, hint: 'View all Medical Representatives' },
  { label: 'Product Portfolio', route: '/products', icon: Pill, hint: 'Browse all products' },
  { label: 'Healthcare Directory', route: '/directory', icon: Stethoscope, hint: 'Doctors, Pharmacies & Hospitals' },
  { label: 'Sales Tracking', route: '/sales', icon: TrendingUp, hint: 'View sales records' },
  { label: 'Expense Manager', route: '/expenses', icon: Receipt, hint: 'Manage expenses' },
  { label: 'Visit Schedule', route: '/schedule', icon: Calendar, hint: 'View doctor visit schedule' },
  { label: 'Leads Management', route: '/leads', icon: UserPlus, hint: 'Manage leads' },
  { label: 'Dashboard', route: '/', icon: Home, hint: 'Go to main dashboard' },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'ai'>('all');
  const [aiError, setAiError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Detect if query is a natural-language question (not just a keyword)
  const isNaturalLanguageQuery = (q: string): boolean => {
    const nlWords = ['how', 'what', 'when', 'where', 'who', 'why', 'which', 'show', 'give', 'list',
      'tell', 'many', 'much', 'total', 'today', 'yesterday', 'this', 'last', 'best', 'worst',
      'top', 'all', 'any', 'each', 'per', 'summary', 'report', 'compare', 'status', 'update',
      'completed', 'pending', 'scheduled', 'sales', 'performance', 'did', 'does', 'was', 'were',
      'have', 'has', 'are', 'is', 'can', 'could', 'should', 'would'];
    const words = q.toLowerCase().trim().split(/\s+/);
    return words.length >= 3 || words.some(w => nlWords.includes(w));
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
      setAiAnswer(null);
      setAiError(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const allResults = results?.results || [];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleNavigate(allResults[selectedIndex].route);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, allResults, selectedIndex]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults(null);
      setAiAnswer(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=60`);
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
    } catch {
      setResults(null);
    }
    setIsSearching(false);
  }, []);

  const doAiSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 3) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      setAiAnswer(data.answer || null);
    } catch {
      setAiError('AI answer unavailable. Check your GEMINI_API_KEY configuration.');
      setAiAnswer(null);
    }
    setIsAiLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    clearTimeout(aiTimeoutRef.current);

    if (!query.trim()) {
      setResults(null);
      setAiAnswer(null);
      setIsSearching(false);
      setIsAiLoading(false);
      setActiveTab('all');
      return;
    }

    const isNL = isNaturalLanguageQuery(query);

    // Auto-switch to AI tab for natural language questions
    if (isNL) {
      setActiveTab('ai');
      setIsAiLoading(true);
    }

    setIsSearching(true);

    // Always run keyword search
    searchTimeoutRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);

    // Always run AI search (with slight delay to avoid every keystroke)
    // For NL queries fire immediately; for short keywords wait a bit longer
    const aiDelay = isNL ? 600 : 900;
    aiTimeoutRef.current = setTimeout(() => {
      doAiSearch(query);
    }, aiDelay);

    return () => {
      clearTimeout(searchTimeoutRef.current);
      clearTimeout(aiTimeoutRef.current);
    };
  }, [query]);

  const handleNavigate = (route: string) => {
    onClose();
    navigate(route);
  };

  const renderBadge = (badge: string, color: string) => {
    const c = BADGE_COLORS[color] || BADGE_COLORS.gray;
    return (
      <span style={{
        background: c.bg,
        color: c.text,
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {badge}
      </span>
    );
  };

  const renderResult = (result: SearchResult, globalIdx: number) => {
    const Icon = CATEGORY_ICONS[result.category] || Search;
    const iconColor = CATEGORY_COLORS[result.category] || '#64748b';
    const isSelected = selectedIndex === globalIdx;

    return (
      <div
        key={`${result.type}-${result.id}`}
        onClick={() => handleNavigate(result.route)}
        onMouseEnter={() => setSelectedIndex(globalIdx)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          cursor: 'pointer',
          borderRadius: '10px',
          margin: '2px 0',
          background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
          border: isSelected ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
          background: `${iconColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.title}
            </span>
            {renderBadge(result.badge, result.badgeColor)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.subtitle}
          </div>
          {result.meta && result.meta.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
              {result.meta.slice(0, 3).filter(Boolean).map((m, i) => (
                <span key={i} style={{ fontSize: '11px', color: '#475569' }}>{m}</span>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        {isSelected && <ChevronRight size={14} style={{ color: '#6366f1', flexShrink: 0 }} />}
      </div>
    );
  };

  const renderAiAnswer = (text: string) => {
    // Basic markdown to styled JSX
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const boldified = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      const isBullet = line.trimStart().startsWith('- ') || line.trimStart().startsWith('• ');
      if (isBullet) {
        const content = boldified.replace(/^[\s]*[-•]\s*/, '');
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', marginTop: '8px', flexShrink: 0 }} />
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      }
      return (
        <p key={i} style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: boldified }}
        />
      );
    });
  };

  if (!isOpen) return null;

  const groupedEntries = results ? Object.entries(results.grouped) : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Search Modal */}
      <div style={{
        position: 'fixed',
        top: '8vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '100%',
        maxWidth: '760px',
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '20px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)',
        overflow: 'hidden',
        animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.9)',
        }}>
          <div style={{ flexShrink: 0, color: '#6366f1' }}>
            {isSearching ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={20} />}
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask anything — 'today sales', 'scheduled visits per MR', 'pending expenses'..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f1f5f9',
              fontSize: '16px',
              fontFamily: 'inherit',
              caretColor: '#6366f1',
            }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 4 }}
            >
              <X size={16} />
            </button>
          )}

          <kbd style={{
            padding: '2px 8px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.08)',
            color: '#64748b', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0,
          }}>
            esc
          </kbd>
        </div>

        {/* Tabs (if results exist) */}
        {results && results.totalCount > 0 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['all', 'ai'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'all' | 'ai')}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: activeTab === tab ? '#a5b4fc' : '#64748b',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {tab === 'ai' && <Sparkles size={11} />}
                {tab === 'all' ? `All Results (${results.totalCount})` : 'AI Answer'}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px' }}>

          {/* === NO QUERY: Show Quick Actions === */}
          {!query && (
            <div>
              <div style={{ padding: '8px 6px', color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Quick Navigation
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.route}
                      onClick={() => handleNavigate(action.route)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      <Icon size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '13px' }}>{action.label}</div>
                        <div style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  <Sparkles size={12} />
                  AI-Powered Search Tips
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
                  Try: <span style={{ color: '#94a3b8' }}>"how was today sales"</span> · <span style={{ color: '#94a3b8' }}>"scheduled visits per MR and how many completed"</span> · <span style={{ color: '#94a3b8' }}>"pending expenses"</span> · <span style={{ color: '#94a3b8' }}>"top MR performance"</span> · <span style={{ color: '#94a3b8' }}>"Rajesh Kumar"</span>
                </div>
              </div>
            </div>
          )}

          {/* === LOADING === */}
          {isSearching && query && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#475569' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '12px' }} />
              <span style={{ fontSize: '14px' }}>Searching across all data...</span>
            </div>
          )}

          {/* === NO RESULTS === */}
          {!isSearching && query && results && results.totalCount === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
              <Search size={32} style={{ color: '#334155', marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>No results found</div>
              <div style={{ fontSize: '13px' }}>Try different keywords or check spelling</div>
            </div>
          )}

          {/* === RESULTS: ALL TAB === */}
          {!isSearching && results && results.totalCount > 0 && activeTab === 'all' && (
            <div>
              {/* AI Answer preview (collapsed in All tab) */}
              {(aiAnswer || isAiLoading) && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    marginBottom: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveTab('ai')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a5b4fc', fontSize: '12px', fontWeight: 600 }}>
                    <Sparkles size={12} />
                    AI Answer
                    {isAiLoading && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                  </div>
                  {isAiLoading && !aiAnswer && <div style={{ color: '#64748b', fontSize: '13px' }}>Generating smart answer...</div>}
                  {aiAnswer && (
                    <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, padding: '0' }}>
                      {aiAnswer.substring(0, 200)}...
                      <span style={{ color: '#6366f1', marginLeft: '4px' }}>Read more →</span>
                    </div>
                  )}
                </div>
              )}

              {/* Grouped results */}
              {(() => {
                let globalIdx = 0;
                return groupedEntries.map(([category, items]) => (
                  <div key={category}>
                    <div style={{
                      padding: '6px 6px 2px',
                      color: '#475569', fontSize: '11px', fontWeight: 600,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      {(() => { const Icon = CATEGORY_ICONS[category] || Search; return <Icon size={10} style={{ color: CATEGORY_COLORS[category] }} />; })()}
                      {category} ({items.length})
                    </div>
                    {items.map(item => {
                      const node = renderResult(item, globalIdx);
                      globalIdx++;
                      return node;
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* === RESULTS: AI TAB === */}
          {activeTab === 'ai' && (
            <div style={{ padding: '4px' }}>
              {/* AI Answer Box */}
              <div style={{
                padding: '20px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.2)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} style={{ color: 'white' }} />
                  </div>
                  <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '14px' }}>
                    AI Answer
                  </span>
                  {isAiLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginLeft: 'auto' }} />}
                </div>

                {isAiLoading && !aiAnswer && (
                  <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      {[80, 60, 90, 70].map((w, i) => (
                        <div key={i} style={{ height: 12, borderRadius: 6, background: 'rgba(99,102,241,0.15)', width: `${w}px`, animation: `pulse 1.5s ease ${i * 0.1}s infinite` }} />
                      ))}
                    </div>
                    <div style={{ height: 12, borderRadius: 6, background: 'rgba(99,102,241,0.1)', width: '70%', animation: 'pulse 1.5s ease 0.4s infinite' }} />
                  </div>
                )}

                {aiError && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#f87171', fontSize: '13px' }}>
                    <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    {aiError}
                  </div>
                )}

                {aiAnswer && (
                  <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.7 }}>
                    {renderAiAnswer(aiAnswer)}
                  </div>
                )}

                {!isAiLoading && !aiAnswer && !aiError && (
                  <div style={{ color: '#475569', fontSize: '13px' }}>
                    AI answer will appear here once you search. Ask anything about your MRs, sales, doctors, or products.
                  </div>
                )}
              </div>

              {/* Top results below AI answer */}
              {results && results.results.length > 0 && (
                <div>
                  <div style={{ padding: '4px 6px 6px', color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Top Matches
                  </div>
                  {results.results.slice(0, 8).map((r, i) => renderResult(r, i))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {[
              { keys: ['↑', '↓'], label: 'Navigate' },
              { keys: ['↵'], label: 'Open' },
              { keys: ['esc'], label: 'Close' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {item.keys.map(k => (
                  <kbd key={k} style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '10px', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)' }}>{k}</kbd>
                ))}
                <span style={{ fontSize: '11px', color: '#475569' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#334155' }}>
            <Sparkles size={11} style={{ color: '#6366f1' }} />
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.8 } }
      `}</style>
    </>
  );
}
