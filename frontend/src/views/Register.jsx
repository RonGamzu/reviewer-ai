import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import TechStackInput from '../components/UI/TechStackInput.jsx';

function FeatureItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <div style={{
        flexShrink: 0,
        width: '40px', height: '40px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(184,159,255,0.1)',
        border: '1px solid rgba(184,159,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary)',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--on-surface)', marginBlockEnd: '0.25rem' }}>
          {title}
        </div>
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

const PROFESSIONS = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
  'DevOps / Platform Engineer', 'Mobile Engineer', 'Data Engineer',
  'ML / AI Engineer', 'Security Engineer', 'QA / Test Engineer',
  'Engineering Manager', 'Solutions Architect', 'CTO / VP Engineering',
  'Student / Bootcamp',
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: '',
    profession: '',
    years_of_experience: 8,
    tech_stack: ['React', 'Python', 'Tailwind CSS'],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) return setError('Username is required.');
    if (!form.password) return setError('Password is required.');

    setLoading(true);
    try {
      const data = await api.register({
        username: form.username.trim(),
        password: form.password,
        profession: form.profession,
        years_of_experience: form.years_of_experience,
        tech_stack: form.tech_stack,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const yoe = form.years_of_experience;
  const yoeLabel = yoe >= 20 ? '20+' : `${yoe}`;
  const sliderFill = `${(yoe / 20) * 100}%`;

  return (
    <div className="view-root" style={{
      minBlockSize: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', insetBlockStart: '0', insetInlineStart: '0',
        inlineSize: '50vw', blockSize: '100vh',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(184,159,255,0.04) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Left Column */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        paddingInline: 'clamp(2rem, 5vw, 4rem)',
        paddingBlock: '3rem',
        justifyContent: 'center',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBlockEnd: '3rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Reviewer.AI</h2>
        </Link>

        <h1 style={{ color: 'var(--on-surface)', marginBlockEnd: '0.75rem', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
          Start Acing Your Tech Interviews
        </h1>
        <p style={{ marginBlockEnd: '3rem', fontSize: '0.9375rem', lineHeight: 1.7, maxInlineSize: '400px' }}>
          Set up your profile so every question is tailored to your tech stack, role, and experience level.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <FeatureItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            }
            title="Personalized Questions"
            desc="Questions are matched to your tech stack and adjusted to your experience level."
          />
          <FeatureItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            }
            title="Track Your Progress"
            desc="Earn XP, level up, and see your scores improve with every practice session."
          />
        </div>

        <div style={{ position: 'absolute', insetBlockEnd: '1.5rem', insetInlineStart: 'clamp(2rem,5vw,4rem)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>
          © By Ron Gamzu 2026
        </div>
      </div>

      {/* Right Column — Form */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'rgba(19,19,19,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          inlineSize: '100%', maxInlineSize: '480px',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          boxShadow: 'var(--shadow)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username */}
            <div className="input-group">
              <label className="input-label">USERNAME</label>
              <div className="input-wrapper">
                <span className="input-prefix">@</span>
                <input
                  className="input input-has-prefix"
                  type="text"
                  placeholder="neon_curator"
                  value={form.username}
                  onChange={e => update('username', e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Profession */}
            <div className="input-group">
              <label className="input-label">PROFESSION</label>
              <select
                className="input"
                value={form.profession}
                onChange={e => update('profession', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select Profession</option>
                {PROFESSIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Years of Experience Slider */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '0.25rem' }}>
                <label className="input-label">YEARS OF EXPERIENCE</label>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: '800',
                  color: 'var(--secondary)', fontSize: '1rem',
                }}>
                  {yoeLabel} Years
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="range"
                  className="range-slider"
                  min={0} max={20}
                  value={form.years_of_experience}
                  onChange={e => update('years_of_experience', parseInt(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, var(--secondary) 0%, var(--primary) ${sliderFill}, var(--surface-container-highest) ${sliderFill})`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBlockStart: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>0</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>10</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>20+</span>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <TechStackInput
              label="TECH STACK"
              value={form.tech_stack}
              onChange={val => update('tech_stack', val)}
              placeholder="Search technologies (e.g. React, Python, AWS)..."
            />

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginBlockStart: '0.5rem', paddingBlock: '1rem', fontSize: '1rem' }}>
              {loading ? (
                <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Initializing...</>
              ) : 'Complete Registration →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginBlockStart: '1.25rem', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
            Already have an account?{' '}
            <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
