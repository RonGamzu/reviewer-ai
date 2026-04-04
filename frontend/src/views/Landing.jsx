import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchTab(t) {
    setTab(t);
    setError('');
    setForm({ username: '', password: '' });
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) return setError('Username is required.');
    if (!form.password) return setError('Password is required.');

    setLoading(true);
    try {
      const data = await api.login({ username: form.username.trim(), password: form.password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.error || err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="view-root" style={{
      minBlockSize: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed', insetBlockStart: '-20%', insetInlineStart: '-10%',
        inlineSize: '60vw', blockSize: '60vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(184,159,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', insetBlockEnd: '-10%', insetInlineEnd: '-5%',
        inlineSize: '40vw', blockSize: '40vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,253,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header — logo only */}
      <header style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center',
        paddingBlock: '1.25rem',
        paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '1.125rem', color: 'var(--on-surface)' }}>
            Reviewer.AI
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="landing-main" style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', gap: '4rem',
        paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
        paddingBlock: '4rem',
        maxInlineSize: '1200px', marginInline: 'auto', inlineSize: '100%',
      }}>
        {/* Left: Hero */}
        <div className="fade-in">
          <div className="badge badge-primary" style={{ marginBlockEnd: '1.5rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--primary)', animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
            NOW IN TECHNICAL PREVIEW
          </div>
          <h1 style={{ color: 'var(--on-surface)', marginBlockEnd: '1.5rem', lineHeight: 1.05 }}>
            Ace Your Next Tech Interview
          </h1>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, maxInlineSize: '480px', marginBlockEnd: '3rem' }}>
            Reviewer.AI runs personalized AI mock interviews tailored to your tech stack and experience level. Get instant expert feedback on every answer, track your progress, and walk into your next interview with confidence.
          </p>
          <div className="landing-hero-stats" style={{ display: 'flex', gap: '3rem' }}>
            {[
              { value: '500+', label: 'INTERVIEW QUESTIONS' },
              { value: '10+', label: 'TECH DOMAINS' },
              { value: '< 5s', label: 'AI FEEDBACK TIME' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '1.5rem', color: 'var(--secondary)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="card fade-in" style={{ background: 'var(--surface-container)', padding: '2rem', maxInlineSize: '440px', marginInlineStart: 'auto', inlineSize: '100%' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', gap: '0', marginBlockEnd: '1.75rem',
            background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', padding: '4px',
          }}>
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Create Account' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  transition: 'all var(--transition)',
                  background: tab === id
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-container))'
                    : 'transparent',
                  color: tab === id ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">USERNAME</label>
                <input
                  className="input"
                  type="text"
                  placeholder="your_username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label className="input-label">PASSWORD</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,107,107,0.08)',
                  border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)', fontSize: '0.875rem',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginBlockStart: '0.5rem' }}>
                {loading
                  ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Signing in…</>
                  : 'Sign In'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Create your account to start practicing AI-powered mock interviews tailored to your tech stack and experience level.
              </p>
              <ul style={{ paddingInlineStart: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  'AI evaluation after every answer',
                  'XP tracking & level progression',
                  'Personalized tech stack insights',
                ].map(item => (
                  <li key={item} style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => navigate('/register')}
                style={{ marginBlockStart: '0.25rem' }}
              >
                Get Started — It's Free →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer — copyright only, no links */}
      <footer style={{
        position: 'relative', zIndex: 1,
        paddingBlock: '1.25rem',
        paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
        borderBlockStart: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
          © By Ron Gamzu 2026
        </span>
      </footer>
    </div>
  );
}
