import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import ShareModal from '../components/ShareModal.jsx';

// ── Score ring (reused in modal) ──────────────────────────────────────────────
function ScoreRing({ score, size = 72 }) {
  const inner = Math.round(size * 0.74);
  const color = score >= 75 ? '74, 222, 128' : score >= 50 ? '251, 191, 36' : '239, 68, 68';
  const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  return (
    <div
      data-score-level={level}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(rgb(${color}) ${score * 3.6}deg, var(--surface-container-high) ${score * 3.6}deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: inner, height: inner, borderRadius: '50%',
        background: 'var(--surface-container)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-heading)', fontWeight: '800',
        fontSize: Math.round(size * 0.24),
        color: `rgb(${color})`,
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Color palette for per-category lines ─────────────────────────────────────
const CAT_PALETTE = [
  '#b89fff', '#00d2fd', '#4ade80', '#fb923c',
  '#f472b6', '#facc15', '#38bdf8', '#a78bfa',
  '#34d399', '#f87171',
];

// ── Score over time — animated multi-line chart ───────────────────────────────
// Animation: strokeDashoffset draw-on technique (reliable across all browsers)
// Tooltip: HTML overlay positioned via SVG coordinate mapping
function ScoreLineChart({ interviews }) {
  const [tooltip, setTooltip] = useState(null);
  const [animated, setAnimated] = useState(false);

  // Group interviews by category
  const catMap = {};
  interviews.forEach(iv => {
    if (iv.ai_score === null || !iv.category) return;
    if (!catMap[iv.category]) catMap[iv.category] = [];
    catMap[iv.category].push(iv);
  });
  Object.values(catMap).forEach(arr =>
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  );
  const categories = Object.keys(catMap);
  const scored = interviews.filter(i => i.ai_score !== null && i.category);

  // Trigger draw animation whenever the component mounts or data length changes
  useEffect(() => {
    setAnimated(false);
    const id = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(id);
  }, [interviews.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (scored.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
        Complete at least 2 interviews to see your score trend.
      </div>
    );
  }

  const catColors = {};
  categories.forEach((cat, i) => { catColors[cat] = CAT_PALETTE[i % CAT_PALETTE.length]; });

  const W = 400, H = 180;
  const pad = { left: 30, right: 16, top: 14, bottom: 24 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  // Shared time axis across all categories
  const allTs = scored.map(i => new Date(i.created_at).getTime());
  const minT = Math.min(...allTs);
  const maxT = Math.max(...allTs);
  const tRange = maxT - minT || 1;

  // Build per-category point series.
  // Interviews on the same calendar day are merged into one consolidated point
  // so that no two dots from the same series share the same X position.
  const series = categories.map(cat => {
    // 1. Group by calendar date
    const dateGroups = {};
    catMap[cat].forEach(iv => {
      const key = new Date(iv.created_at).toLocaleDateString();
      if (!dateGroups[key]) dateGroups[key] = { scores: [], timestamps: [] };
      dateGroups[key].scores.push(iv.ai_score);
      dateGroups[key].timestamps.push(new Date(iv.created_at).getTime());
    });

    // 2. Sort groups chronologically and build cumulative-average points
    let cumTotal = 0, cumCount = 0;
    const points = Object.keys(dateGroups)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(dateKey => {
        const { scores, timestamps } = dateGroups[dateKey];
        scores.forEach(s => { cumTotal += s; cumCount++; });
        const cumAvg = Math.round(cumTotal / cumCount);
        const avgTs = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
        const dayAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return {
          x: pad.left + ((avgTs - minT) / tRange) * cW,
          y: pad.top + (1 - cumAvg / 100) * cH,
          dayAvg,           // average score of interviews done that day
          sessionCount: scores.length, // how many interviews were merged
          cumAvg,           // running average up to this point
          count: cumCount,  // total interviews for this category so far
          date: dateKey,
          cat,
          color: catColors[cat],
        };
      });

    return { cat, color: catColors[cat], points };
  });

  // Only show categories that have at least 2 distinct time points (i.e. a line)
  const visibleSeries = series.filter(s => s.points.length >= 2);

  if (visibleSeries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
        Complete interviews in at least one category on 2 or more days to see trends.
      </div>
    );
  }

  const gridVals = [0, 25, 50, 75, 100];
  const DASH = 3000;

  return (
    <div>
      {/* Legend — only show categories that are actually rendered */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBlockEnd: '0.75rem' }}>
        {visibleSeries.map(({ cat, color }) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>
            <svg width="22" height="4" style={{ flexShrink: 0 }}>
              <line x1="0" y1="2" x2="22" y2="2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {cat}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          {/* Grid lines */}
          {gridVals.map(v => {
            const y = pad.top + (1 - v / 100) * cH;
            return (
              <g key={v}>
                <line x1={pad.left} y1={y} x2={W - pad.right} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={pad.left - 4} y={y + 4} textAnchor="end"
                  fontSize="9" fill="rgba(255,255,255,0.3)">{v}</text>
              </g>
            );
          })}

          {/* Lines — animated via strokeDashoffset draw-on */}
          {visibleSeries.map(({ cat, color, points }, si) => {
            const d = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ');
            const delay = `${si * 0.18}s`;
            return (
              <path
                key={cat} d={d} fill="none"
                stroke={color} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={DASH}
                style={{
                  strokeDashoffset: animated ? 0 : DASH,
                  transition: `stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1) ${delay}`,
                }}
              />
            );
          })}

          {/* Interactive dots */}
          {visibleSeries.map(({ points }) =>
            points.map((p, i) => {
              const active = tooltip?.cat === p.cat && tooltip?.count === p.count;
              return (
                <g key={`${p.cat}-${i}`}
                  onMouseEnter={() => setTooltip(p)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'crosshair' }}
                >
                  <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                  <circle
                    cx={p.x} cy={p.y}
                    r={active ? 6.5 : 4.5}
                    fill={p.color}
                    stroke="var(--surface-container)" strokeWidth="2"
                    style={{ transition: 'r 0.12s ease' }}
                  />
                </g>
              );
            })
          )}
        </svg>

        {/* Floating tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: '#1e1e2e',
            border: `1px solid ${tooltip.color}66`,
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.9)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 50,
            boxShadow: `0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px ${tooltip.color}22`,
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, color: tooltip.color, marginBlockEnd: '0.15rem' }}>
              {tooltip.cat}
            </div>
            <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>{tooltip.date}</div>
            {tooltip.sessionCount > 1
              ? <div>{tooltip.sessionCount} interviews · avg <strong style={{ color: tooltip.color }}>{tooltip.dayAvg}</strong> / 100</div>
              : <div>Score: <strong style={{ color: tooltip.color }}>{tooltip.dayAvg}</strong> / 100</div>
            }
            <div style={{ opacity: 0.8 }}>
              Total in category: <strong>{tooltip.count}</strong>
            </div>
            <div style={{ opacity: 0.8 }}>
              Running avg: <strong style={{ color: tooltip.color }}>{tooltip.cumAvg}</strong>
            </div>
            {/* Downward arrow */}
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              background: '#1e1e2e',
              borderRight: `1px solid ${tooltip.color}66`,
              borderBottom: `1px solid ${tooltip.color}66`,
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category performance — animated horizontal bar chart ──────────────────────
function CategoryChart({ interviews }) {
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { cat, count, avg, rowY }

  useEffect(() => {
    setAnimated(false);
    const id = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(id);
  }, [interviews.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = {};
  interviews.forEach(iv => {
    if (!iv.category || iv.ai_score === null) return;
    if (!cats[iv.category]) cats[iv.category] = { total: 0, count: 0 };
    cats[iv.category].total += iv.ai_score;
    cats[iv.category].count++;
  });

  const data = Object.entries(cats)
    .map(([cat, d]) => ({ cat, avg: Math.round(d.total / d.count), count: d.count }))
    .sort((a, b) => b.avg - a.avg);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
        No category data yet.
      </div>
    );
  }

  const rowH = 30, gap = 8;
  const H = data.length * (rowH + gap) + 10;
  // Extra valW to fit "67 avg" label comfortably
  const W = 400, labelW = 108, valW = 52;
  const maxBarW = W - labelW - valW - 10;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {data.map((d, i) => {
          const y = i * (rowH + gap) + 5;
          const finalW = Math.max(4, (d.avg / 100) * maxBarW);
          const color = d.avg >= 75 ? '74, 222, 128' : d.avg >= 50 ? '251, 191, 36' : '239, 68, 68';
          const label = d.cat.length > 13 ? d.cat.slice(0, 12) + '…' : d.cat;
          const delay = `${i * 0.07}s`;
          return (
            <g key={d.cat}
              style={{ cursor: 'default' }}
              onMouseEnter={() => setTooltip({ cat: d.cat, count: d.count, avg: d.avg, rowY: y })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Full-row invisible hit area */}
              <rect x={0} y={y} width={W} height={rowH} fill="transparent" />
              <text x={labelW - 6} y={y + rowH / 2 + 4} textAnchor="end"
                fontSize="11" fill="rgba(255,255,255,0.55)">{label}</text>
              {/* Track */}
              <rect x={labelW} y={y} width={maxBarW} height={rowH} rx="4"
                fill="rgba(255,255,255,0.04)" />
              {/* Animated fill */}
              <rect x={labelW} y={y} width={finalW} height={rowH} rx="4"
                fill={`rgba(${color}, 0.2)`} stroke={`rgba(${color}, 0.35)`} strokeWidth="1"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'left center',
                  transform: `scaleX(${animated ? 1 : 0})`,
                  transition: `transform 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}`,
                }}
              />
              {/* Score + "avg" label — fades in with the bar */}
              <text
                x={labelW + finalW + 6} y={y + rowH / 2 + 4}
                fontSize="11" fontWeight="700" fill={`rgb(${color})`}
                style={{ opacity: animated ? 1 : 0, transition: `opacity 0.35s ease ${delay}` }}
              >
                {d.avg}
                <tspan dx="2" fontSize="8" fontWeight="400" opacity="0.65">avg</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip — shows question count */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: `${(tooltip.rowY + rowH / 2) / H * 100}%`,
          transform: 'translate(-50%, calc(-100% - 8px))',
          background: '#1e1e2e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '7px',
          padding: '0.4rem 0.7rem',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.9)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, marginBlockEnd: '0.1rem' }}>{tooltip.cat}</div>
          <div style={{ opacity: 0.75 }}>
            {tooltip.count} question{tooltip.count !== 1 ? 's' : ''} answered
          </div>
          <div style={{ opacity: 0.75 }}>Average score: <strong>{tooltip.avg} / 100</strong></div>
          {/* Downward arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            background: '#1e1e2e',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Interview detail modal ────────────────────────────────────────────────────
function InterviewModal({ interview, onClose, username }) {
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const score = interview.ai_score;
  const scoreColor = score !== null
    ? (score >= 75 ? '74, 222, 128' : score >= 50 ? '251, 191, 36' : '239, 68, 68')
    : null;

  return (
    <>
    {shareOpen && (
      <ShareModal
        type="interview"
        data={{
          questionTitle: interview.question_title,
          category: interview.category,
          difficulty: interview.difficulty,
          userAnswer: interview.user_answer,
          aiScore: interview.ai_score,
          aiFeedback: interview.ai_feedback,
          username,
        }}
        onClose={() => setShareOpen(false)}
      />
    )}
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 400, padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em',
              color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '0.5rem',
            }}>
              {interview.category}
              {interview.difficulty && ` · ${interview.difficulty}`}
              {' · '}{new Date(interview.created_at).toLocaleDateString()}
            </div>
            <h3 style={{ color: 'var(--on-surface)', fontSize: '1.0625rem', lineHeight: 1.45, margin: 0 }}>
              {interview.question_title}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {interview.ai_score !== null && interview.ai_feedback && (
              <button
                onClick={() => setShareOpen(true)}
                title="Share result"
                style={{
                  background: 'rgba(184,159,255,0.1)', border: '1px solid rgba(184,159,255,0.2)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--primary)',
                  cursor: 'pointer', padding: '0.375rem 0.625rem',
                  fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--on-surface-variant)', cursor: 'pointer',
                padding: '0.25rem', lineHeight: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Score + XP */}
        {score !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ScoreRing score={score} size={72} />
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.25rem',
                color: `rgb(${scoreColor})`,
              }}>
                +{score * 15} XP
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBlockStart: '0.25rem' }}>
                {score >= 75 ? 'Strong answer' : score >= 50 ? 'Adequate answer' : 'Needs improvement'}
              </div>
            </div>
          </div>
        )}

        {/* User answer */}
        {interview.user_answer && (
          <div>
            <div style={{
              fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em',
              color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '0.5rem',
            }}>
              Your Answer
            </div>
            <div style={{
              background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.9375rem',
              color: 'var(--on-surface)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {interview.user_answer}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {interview.ai_feedback && (
          <div>
            <div style={{
              fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em',
              color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '0.5rem',
            }}>
              AI Feedback
            </div>
            <div style={{
              background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.9375rem',
              color: 'var(--on-surface)',
              lineHeight: 1.65,
              borderInlineStart: '3px solid var(--primary)',
            }}>
              {interview.ai_feedback}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// ── Pagination helper ─────────────────────────────────────────────────────────
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, i) => {
    if (i > 0 && sorted[i - 1] !== page - 1) result.push('...');
    result.push(page);
  });
  return result;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const DIFFICULTY_COLOR = {
  Junior:       '74, 222, 128',
  Mid:          '0, 210, 253',
  'Mid-Senior': '184, 159, 255',
  Senior:       '251, 191, 36',
  Principal:    '255, 89, 227',
};

export default function Dashboard() {
  const { user } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [scorecardShareOpen, setScorecardShareOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInterviews = useCallback(async () => {
    if (!user?.id) return;
    setLoadingInterviews(true);
    try {
      const data = await api.getUserInterviews(user.id);
      setInterviews(data);
    } catch { /* non-critical */ } finally {
      setLoadingInterviews(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);
  useEffect(() => { setCurrentPage(1); }, [interviews]);

  // ── Stats & XP ──
  const scored = interviews.filter(i => i.ai_score !== null);
  const totalInterviews = interviews.length;
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, i) => s + i.ai_score, 0) / scored.length)
    : 0;
  const bestScore = scored.length > 0 ? Math.max(...scored.map(i => i.ai_score)) : 0;
  const xp = scored.reduce((s, i) => s + i.ai_score * 15, 0);
  const level = xp === 0 ? 1 : Math.max(1, Math.floor(Math.log(Math.max(xp, 101) / 100) / Math.log(1.5)));
  const xpForNextLevel = Math.round(100 * Math.pow(1.5, level + 1));
  const xpProgress = xp === 0 ? 0 : Math.min(100, Math.round((xp / xpForNextLevel) * 100));

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(interviews.length / PAGE_SIZE));
  const pageItems = interviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleGenerateAnalysis() {
    setLoadingAnalysis(true);
    setAnalysisError('');
    try {
      const payload = interviews.slice(0, 50).map(i => ({
        category: i.category,
        difficulty: i.difficulty,
        ai_score: i.ai_score,
        created_at: i.created_at,
        user_answer: i.user_answer?.slice(0, 200),
      }));
      const { analysis: text } = await api.analyzeUser(user.id, payload);
      setAnalysis(text);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to generate analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  return (
    <>
    {scorecardShareOpen && (
      <ShareModal
        type="scorecard"
        data={{
          username: user?.username,
          profession: user?.profession,
          level,
          xp,
          avgScore,
          bestScore,
          totalInterviews,
          topTechs: user?.tech_stack || [],
        }}
        onClose={() => setScorecardShareOpen(false)}
      />
    )}
    <div className="view-root" style={{ display: 'flex', minBlockSize: '100vh' }}>
      <Sidebar />
      <main className="responsive-main" style={{ flex: 1, overflow: 'auto', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* ── Level & XP Hero ── */}
        <section style={{ marginBlockEnd: '1.5rem' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--surface-container) 0%, rgba(184,159,255,0.05) 100%)',
          }}>
            <div className="hero-flex" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>
              {/* Level badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '2.25rem',
                  color: 'var(--on-primary)',
                }}>
                  {level}
                </div>
                <div style={{
                  fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em',
                  color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockStart: '0.5rem',
                }}>
                  LEVEL
                </div>
              </div>
              {/* XP + progress */}
              <div>
                {user?.username && (
                  <div style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: '700', color: 'var(--primary)', marginBlockEnd: '0.5rem' }}>
                    Hi, {user.username}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBlockEnd: '0.625rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: '900',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--on-surface)',
                  }}>
                    {xp.toLocaleString()} XP
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                    · {(xpForNextLevel - xp).toLocaleString()} to next level
                  </span>
                </div>
                <div style={{
                  blockSize: '6px', borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-container-highest)', overflow: 'hidden',
                }}>
                  <div style={{
                    blockSize: '100%', borderRadius: 'var(--radius-full)',
                    inlineSize: `${xpProgress}%`,
                    background: 'linear-gradient(to right, var(--secondary), var(--primary))',
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBlockStart: '0.375rem' }}>
                  MASTERY TIER {Math.ceil(level / 10)} · {xpProgress}% progress
                </div>
              </div>
            </div>
            <div style={{ marginBlockStart: '1.25rem', borderBlockStart: '1px solid rgba(255,255,255,0.06)', paddingBlockStart: '1.25rem' }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.8125rem', gap: '0.5rem', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => setScorecardShareOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Score Card
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{ marginBlockEnd: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '2rem', color: 'var(--primary)' }}>
                {totalInterviews}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockStart: '0.25rem' }}>
                Interviews
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '2rem', color: 'var(--secondary)' }}>
                {avgScore || '—'}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockStart: '0.25rem' }}>
                Average Score
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '2rem', color: 'var(--tertiary)' }}>
                {bestScore || '—'}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockStart: '0.25rem' }}>
                Best Score
              </div>
            </div>
          </div>
        </section>

        {/* ── Insights ── */}
        <section style={{ marginBlockEnd: '2.5rem' }}>
          <h2 style={{ color: 'var(--on-surface)', marginBlockEnd: '1.5rem' }}>Insights</h2>

          {!loadingInterviews && interviews.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--on-surface-variant)' }}>
              Complete interviews to unlock insights and AI analysis.
            </div>
          ) : (
            <>
              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBlockEnd: '1.25rem' }}>
                <div className="card">
                  <div style={{
                    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em',
                    color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '1rem',
                  }}>
                    Score Over Time
                  </div>
                  <ScoreLineChart interviews={interviews} />
                </div>
                <div className="card">
                  <div style={{
                    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em',
                    color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '1rem',
                  }}>
                    Performance by Category
                  </div>
                  <CategoryChart interviews={interviews} />
                </div>
              </div>

              {/* AI Analysis */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBlockEnd: '1rem', gap: '1rem' }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em',
                    color: 'var(--on-surface-variant)', textTransform: 'uppercase',
                  }}>
                    AI Analysis
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.375rem 1rem', fontSize: '0.8125rem', flexShrink: 0 }}
                    onClick={handleGenerateAnalysis}
                    disabled={loadingAnalysis || interviews.length === 0}
                  >
                    {loadingAnalysis ? 'Analyzing…' : analysis ? 'Regenerate' : 'Generate Analysis'}
                  </button>
                </div>
                {analysis ? (
                  <p style={{ color: 'var(--on-surface)', lineHeight: 1.75, margin: 0, fontSize: '0.9375rem' }}>
                    {analysis}
                  </p>
                ) : analysisError ? (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: 0 }}>{analysisError}</p>
                ) : (
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', margin: 0 }}>
                    Click "Generate Analysis" to receive a personalized AI assessment of your interview performance, strengths, and areas to improve.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── Interview History ── */}
        <section>
          <h2 style={{ color: 'var(--on-surface)', marginBlockEnd: '1rem' }}>Interview History</h2>

          {loadingInterviews ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
              <span className="spinner" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              <p style={{ marginBlockEnd: '1.5rem' }}>No interviews completed yet. Start your first mock interview!</p>
              <Link to="/interview" className="btn btn-primary">Start Mock Interview →</Link>
            </div>
          ) : (
            <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {pageItems.map(interview => {
                const score = interview.ai_score;
                const scoreColor = score === null ? 'var(--on-surface-variant)'
                  : score >= 75 ? 'var(--success)'
                  : score >= 50 ? 'var(--warning)'
                  : 'var(--error)';
                const dc = DIFFICULTY_COLOR[interview.difficulty];

                return (
                  <button
                    key={interview.id}
                    onClick={() => setSelectedInterview(interview)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.875rem 1.25rem',
                      background: 'var(--surface-container)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'border-color var(--transition)',
                      gap: '1rem',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,159,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(184,159,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', flexShrink: 0,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600', fontSize: '0.9375rem', color: 'var(--on-surface)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {interview.question_title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBlockStart: '0.125rem' }}>
                          {interview.category}
                          {dc && (
                            <span style={{ color: `rgb(${dc})`, marginInlineStart: '0.375rem' }}>
                              · {interview.difficulty}
                            </span>
                          )}
                          <span style={{ marginInlineStart: '0.375rem' }}>
                            · {new Date(interview.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
                      {score !== null ? (
                        <>
                          <span style={{
                            fontFamily: 'var(--font-heading)', fontWeight: '800',
                            fontSize: '1rem', color: scoreColor,
                          }}>
                            {score}/100
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-heading)', fontWeight: '700',
                            fontSize: '0.8125rem', color: 'var(--on-surface-variant)',
                          }}>
                            +{score * 15} XP
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                          No score
                        </span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div data-testid="pagination" style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '0.25rem', marginBlockStart: '1rem', flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--surface-container)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--on-surface)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8125rem',
                    opacity: currentPage === 1 ? 0.35 : 1,
                  }}
                >
                  ← Prev
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ padding: '0 0.25rem', color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                      style={{
                        padding: '0.375rem 0.625rem',
                        minWidth: '2rem',
                        background: currentPage === page ? 'rgba(184,159,255,0.15)' : 'var(--surface-container)',
                        border: `1px solid ${currentPage === page ? 'rgba(184,159,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: currentPage === page ? 'var(--primary)' : 'var(--on-surface-variant)',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: currentPage === page ? '700' : '400',
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--surface-container)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--on-surface)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.8125rem',
                    opacity: currentPage === totalPages ? 0.35 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            </>
          )}
        </section>
      </main>

      {selectedInterview && (
        <InterviewModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
          username={user?.username}
        />
      )}
    </div>
    </>
  );
}

export { ScoreRing, ScoreLineChart, CategoryChart, getPageNumbers };
