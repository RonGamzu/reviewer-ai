import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Layout/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import ShareModal from '../components/ShareModal.jsx';

function ScoreRing({ score }) {
  const deg = Math.round((score / 100) * 360);
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';

  return (
    <div style={{
      position: 'relative',
      width: '140px', height: '140px',
      borderRadius: '50%',
      background: `conic-gradient(${color} ${deg}deg, var(--surface-container-high) ${deg}deg)`,
      margin: '0 auto',
    }}>
      <div style={{
        position: 'absolute', inset: '10px',
        borderRadius: '50%', background: 'var(--surface-container)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '2rem', color: 'var(--on-surface)' }}>
          {score}
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
          /100
        </span>
      </div>
    </div>
  );
}

function LoadingRing() {
  return (
    <div style={{
      position: 'relative',
      width: '140px', height: '140px',
      borderRadius: '50%',
      border: '10px solid var(--surface-container-high)',
      borderTopColor: 'var(--primary)',
      animation: 'spin 1s linear infinite',
      margin: '0 auto',
    }} />
  );
}

export default function Interview() {
  const { user } = useAuth();
  const textareaRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [loadingQ, setLoadingQ] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);

  const loadQuestion = useCallback(async () => {
    setLoadingQ(true);
    setAnswer('');
    setResult(null);
    setError('');
    try {
      const q = await api.getRandomQuestion();
      setQuestion(q);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load question. Please try again.');
    } finally {
      setLoadingQ(false);
    }
  }, []);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  // Cmd/Ctrl+Enter submit
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submitting && !result) {
        handleSubmit();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  async function handleSubmit() {
    if (!answer.trim()) return setError('Please write your answer before submitting.');
    if (!question) return;
    setError('');
    setSubmitting(true);
    try {
      const data = await api.submitInterview({
        question_id: question.id,
        user_answer: answer.trim(),
        language: 'en',
      });
      setResult(data);
      setSessionHistory(prev => [data, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const difficultyColors = {
    Junior: '74, 222, 128',
    Mid: '0, 210, 253',
    'Mid-Senior': '184, 159, 255',
    Senior: '251, 191, 36',
    Principal: '255, 89, 227',
  };
  const dc = difficultyColors[question?.difficulty] || '184, 159, 255';

  return (
    <>
    {shareOpen && result && (
      <ShareModal
        type="interview"
        data={{
          questionTitle: question?.title,
          category: question?.category,
          difficulty: question?.difficulty,
          userAnswer: answer,
          aiScore: result.ai_score,
          aiFeedback: result.ai_feedback,
          interviewerFocus: question?.curator_tip,
          username: user?.username,
        }}
        onClose={() => setShareOpen(false)}
      />
    )}
    <div className="view-root" style={{ display: 'flex', minBlockSize: '100vh' }}>
      <Sidebar />
      <main className="responsive-main" style={{ flex: 1, overflow: 'auto', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Header */}
        <div className="interview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '2rem' }}>
          <div>
            <div className="badge badge-secondary" style={{ marginBlockEnd: '0.5rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              {'AI MOCK INTERVIEW'}
            </div>
            <h2 style={{ color: 'var(--on-surface)' }}>
              {loadingQ ? 'Loading question...' : question?.category || ''}
            </h2>
            {question && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBlockStart: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{'Difficulty:'}</span>
                <span style={{
                  fontSize: '0.875rem', fontWeight: '700',
                  color: `rgb(${dc})`,
                }}>
                  {question.difficulty}
                </span>
                <span style={{ color: 'var(--on-surface-variant)' }}>|</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{user?.profession || 'Software Engineer'}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={loadQuestion} disabled={loadingQ || submitting}>
              {'New Question'}
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 210, 253, 0.08)',
              border: '1px solid rgba(0, 210, 253, 0.15)',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--secondary)', textTransform: 'uppercase' }}>
                {'SESSION ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="interview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Question + Answer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Question Card */}
            <div className="card" style={{ background: 'var(--surface-container)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBlockEnd: '1rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  {'CURRENT SCENARIO'}
                </span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" opacity="0.4">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                </svg>
              </div>
              {loadingQ ? (
                <div style={{ blockSize: '80px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--on-surface-variant)' }}>
                  <span className="spinner" /> Loading question...
                </div>
              ) : (
                <h3 style={{ color: 'var(--on-surface)', fontSize: '1.25rem', lineHeight: 1.4, fontWeight: '700' }}>
                  {question?.title}
                </h3>
              )}
            </div>

            {/* Answer Textarea */}
            <div className="card" style={{ padding: '0' }}>
              <textarea
                ref={textareaRef}
                className="input"
                style={{
                  minBlockSize: '220px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'var(--surface-container)',
                  padding: '1.5rem',
                  fontSize: '0.9375rem',
                  resize: 'vertical',
                }}
                placeholder={'Describe your architectural approach, including specific libraries, hooks, or patterns you would implement...'}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={submitting || !!result}
              />
              <div className="interview-submit-bar" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.875rem 1.25rem',
                background: 'var(--surface-container)',
                borderBlockStart: '1px solid rgba(255,255,255,0.05)',
                borderEndStartRadius: 'var(--radius-lg)',
                borderEndEndRadius: 'var(--radius-lg)',
              }}>
                <span className="submit-hint" style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                  Press Cmd + Enter to submit
                </span>
                {error && <span style={{ fontSize: '0.8125rem', color: 'var(--error)' }}>{error}</span>}
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting || !!result || !answer.trim() || loadingQ}
                  style={{ gap: '0.5rem' }}
                >
                  {submitting ? (
                    <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Evaluating...</>
                  ) : 'Submit Answer →'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Analysis Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ background: 'var(--surface-container)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '1.5rem' }}>
                <h4 style={{ color: 'var(--on-surface)' }}>{'AI Performance Analysis'}</h4>
                {submitting && (
                  <span className="badge badge-secondary" style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}>
                    {'EVALUATING...'}
                  </span>
                )}
              </div>

              <div style={{ marginBlockEnd: '1.5rem', minBlockSize: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                {submitting ? (
                  <LoadingRing />
                ) : result ? (
                  <ScoreRing score={result.ai_score} />
                ) : (
                  <>
                    <div style={{
                      width: '120px', height: '120px', borderRadius: '50%',
                      border: '10px solid var(--surface-container-high)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column',
                    }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.4 }}>
                        {'SCORE'}<br />{'PENDING'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Score breakdown bars */}
              {!result && !submitting && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {[0.7, 0.85, 0.55].map((w, i) => (
                    <div key={i} style={{ blockSize: '8px', borderRadius: 'var(--radius-full)', background: `rgba(255,255,255,0.06)`, overflow: 'hidden' }}>
                      <div style={{ blockSize: '100%', inlineSize: `${w * 100}%`, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  ))}
                </div>
              )}

              {result && (
                <div className="fade-in" style={{ marginBlockStart: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '0.5rem' }}>
                    {'AI Feedback'}
                  </div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--on-surface)' }}>
                    {result.ai_feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Architect's Solution (locked until submission) */}
            <div className="card" style={{ background: 'var(--surface-container)', opacity: result ? 1 : 0.6, transition: 'opacity 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  {"WHAT TO COVER"}
                </span>
                {!result && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </div>
              {result ? (
                <div className="fade-in" style={{ marginBlockStart: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{question?.curator_tip}</p>
                </div>
              ) : (
                <div style={{ marginBlockStart: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ blockSize: '10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.06)', inlineSize: '90%' }} />
                  <div style={{ blockSize: '10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.06)', inlineSize: '75%' }} />
                  <div style={{ blockSize: '10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.06)', inlineSize: '60%' }} />
                  <p style={{ fontSize: '0.75rem', marginBlockStart: '0.25rem', fontStyle: 'italic' }}>{'Locked until submission'}</p>
                </div>
              )}
            </div>

            {/* Interviewer's Focus */}
            {question?.curator_tip && (
              <div style={{
                background: 'rgba(255, 89, 227, 0.06)',
                border: '1px solid rgba(255, 89, 227, 0.12)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <div style={{
                  flexShrink: 0,
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255, 89, 227, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--tertiary)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--tertiary)', marginBlockEnd: '0.25rem' }}>
                    {"Interviewer's Focus"}
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--on-surface-variant)' }}>
                    {question.curator_tip}
                  </p>
                </div>
              </div>
            )}

            {/* Share result — appears after submission */}
            {result && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.8125rem', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShareOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Result
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
