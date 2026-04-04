import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

const PROFESSIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Engineer', 'Mobile Developer',
  'Machine Learning Engineer', 'Security Engineer', 'QA Engineer', 'Engineering Manager',
];

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

const SUGGESTED_TECHS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'C++',
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
  'GraphQL', 'REST API', 'Kafka', 'System Design', 'Git', 'Linux',
];

const SKIP_KEY = 'reviewer_ai_onboarding_skipped';

export default function OnboardingModal() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState(user?.profession || '');
  const [years, setYears] = useState(user?.years_of_experience ?? 0);
  const [techInput, setTechInput] = useState('');
  const [techs, setTechs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addTech(name) {
    const trimmed = name.trim();
    if (!trimmed || techs.find(t => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    setTechs(prev => [...prev, { name: trimmed, level: 'intermediate' }]);
    setTechInput('');
  }

  function removeTech(name) {
    setTechs(prev => prev.filter(t => t.name !== name));
  }

  function setLevel(name, level) {
    setTechs(prev => prev.map(t => t.name === name ? { ...t, level } : t));
  }

  function handleSkip() {
    sessionStorage.setItem(SKIP_KEY, 'true');
    updateUser({ tech_stack: [] }); // Keep state but signal skip so modal hides this session
    // Force hide by faking a tech_stack with a marker
    // Actually just use a local dismiss via sessionStorage checked in App
    window.dispatchEvent(new CustomEvent('onboarding-skipped'));
  }

  async function handleFinish() {
    if (techs.length === 0) {
      setError('Please add at least one technology to personalise your questions.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateUser(user.id, {
        profession: profession || undefined,
        years_of_experience: years,
        tech_stack: techs,
      });
      updateUser(updated);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2.5rem',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>
        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBlockEnd: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <h2 style={{ color: 'var(--on-surface)', marginBlockEnd: '0.5rem' }}>
            {step === 1 ? 'Welcome to Reviewer.AI' : 'Your Tech Stack'}
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {step === 1
              ? "Let's personalise your experience in 30 seconds so every question fits your level."
              : 'Add the technologies you work with. We use your stack and skill levels to tailor each question.'}
          </p>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBlockStart: '1.25rem' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: '4px', width: '48px', borderRadius: '2px',
                background: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* ── Step 1: Profession + Years ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--on-surface-variant)', display: 'block', marginBlockEnd: '0.5rem' }}>
                Your Role
              </label>
              <select
                className="input"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select your role...</option>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--on-surface-variant)', display: 'block', marginBlockEnd: '0.5rem' }}>
                Years of Professional Experience:{' '}
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>{years}</span>
              </label>
              <input
                type="range" min="0" max="20" value={years}
                onChange={e => setYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBlockStart: '0.25rem' }}>
                <span>0</span><span>5</span><span>10</span><span>15</span><span>20+</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Tech Stack ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Type a technology and press Enter..."
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); } }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={() => addTech(techInput)} disabled={!techInput.trim()}>
                Add
              </button>
            </div>

            {/* Quick-add suggestions */}
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBlockEnd: '0.5rem' }}>
                Quick Add
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {SUGGESTED_TECHS.filter(t => !techs.find(tt => tt.name === t)).slice(0, 24).map(t => (
                  <button
                    key={t}
                    onClick={() => addTech(t)}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--on-surface-variant)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,159,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(184,159,255,0.3)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Added techs */}
            {techs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  Your Stack ({techs.length})
                </div>
                {techs.map(t => (
                  <div key={t.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--surface-container-high)',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontWeight: '600', color: 'var(--on-surface)', fontSize: '0.9375rem', minWidth: '90px', flex: '0 0 auto' }}>
                      {t.name}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                      {SKILL_LEVELS.map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setLevel(t.name, lvl)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.6875rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: 'none',
                            background: t.level === lvl ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                            color: t.level === lvl ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                            transition: 'all var(--transition)',
                          }}
                        >
                          {LEVEL_LABELS[lvl]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => removeTech(t.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '0.25rem', flexShrink: 0, lineHeight: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginBlockStart: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBlockStart: '2rem' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', opacity: 0.7 }}
            onClick={handleSkip}
          >
            Skip for now
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {step === 2 && (
              <button className="btn btn-ghost" onClick={() => { setStep(1); setError(''); }}>
                ← Back
              </button>
            )}
            {step === 1 && (
              <button className="btn btn-primary" onClick={() => { setStep(2); setError(''); }}>
                Next →
              </button>
            )}
            {step === 2 && (
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={saving || techs.length === 0}
              >
                {saving
                  ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Saving...</>
                  : 'Finish Setup →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
