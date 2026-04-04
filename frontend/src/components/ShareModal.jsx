import { useState, useEffect } from 'react';
import { downloadInterviewReport, printScoreCard } from '../utils/exportPDF.js';

// ── Text generators ───────────────────────────────────────────────────────────

function scorecardText({ username, profession, level, avgScore, bestScore, totalInterviews, topTechs }) {
  const techs = (topTechs || []).slice(0, 3).map(t => t.name).join(', ');
  const tier = level <= 5 ? 'Apprentice' : level <= 15 ? 'Professional' : level <= 30 ? 'Senior' : level <= 50 ? 'Expert' : 'Principal';
  return (
    `🚀 My Reviewer.AI Progress\n\n` +
    `👤 @${username} — ${profession || 'Software Engineer'}\n` +
    `⭐ Level ${level} ${tier} · ${totalInterviews} interviews completed\n` +
    `📊 Avg Score: ${avgScore || 'N/A'}/100 · Best: ${bestScore || 'N/A'}/100\n` +
    `💻 Top Skills: ${techs || 'N/A'}\n\n` +
    `#TechInterview #InterviewPrep #CareerGrowth #SoftwareEngineering`
  );
}

function interviewText({ username, category, difficulty, aiScore, questionTitle }) {
  const emoji = aiScore >= 75 ? '🔥' : aiScore >= 50 ? '📈' : '💪';
  const sentiment = aiScore >= 75 ? 'Nailed it!' : aiScore >= 50 ? 'Making progress!' : 'Keep grinding!';
  return (
    `${emoji} Just completed a mock tech interview on Reviewer.AI!\n\n` +
    `📝 Topic: ${category || 'Technical'} · ${difficulty || ''}\n` +
    `❓ "${questionTitle}"\n` +
    `✅ Score: ${aiScore}/100 — ${sentiment}\n\n` +
    `Preparing for my next role as a software engineer 🚀\n` +
    `#TechInterview #InterviewPrep #${(category || 'Tech').replace(/\s+/g, '')}`
  );
}

// ── Platform configs ──────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    textColor: '#fff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    getUrl: text => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    textColor: '#fff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    getUrl: text => `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    textColor: '#fff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: text => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
];

// ── ShareModal ────────────────────────────────────────────────────────────────

export default function ShareModal({ type, data, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const text = type === 'scorecard' ? scorecardText(data) : interviewText(data);

  function handleShare(platform) {
    window.open(platform.getUrl(text), '_blank', 'noopener,noreferrer,width=600,height=600');
  }

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePDF() {
    if (type === 'scorecard') {
      printScoreCard(data);
    } else {
      downloadInterviewReport(data);
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', color: 'var(--on-surface)', fontSize: '1rem' }}>
              Share Your {type === 'scorecard' ? 'Score Card' : 'Result'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
              {type === 'scorecard' ? 'Show off your progress' : 'Share what you practiced'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '0.25rem', lineHeight: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Text preview */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            Preview
          </div>
          <div style={{
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: 'var(--on-surface-variant)',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            maxHeight: '120px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {text}
          </div>
        </div>

        {/* Platform buttons */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => handleShare(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: p.color,
                color: p.textColor,
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '0.9375rem',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {p.icon}
              Share on {p.label}
            </button>
          ))}

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
              color: copied ? 'var(--success)' : 'var(--on-surface)',
              border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '0.9375rem',
              transition: 'all 0.15s',
            }}
          >
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

        {/* Divider + PDF export */}
        <div style={{
          padding: '0 1.5rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1rem',
        }}>
          <button
            onClick={handlePDF}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--on-surface-variant)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: '600', fontSize: '0.875rem',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--on-surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
