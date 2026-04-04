import { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import TechStackInput from '../components/UI/TechStackInput.jsx';

const PROFESSIONS = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
  'DevOps / Platform Engineer', 'Mobile Engineer', 'Data Engineer',
  'ML / AI Engineer', 'Security Engineer', 'QA / Test Engineer',
  'Engineering Manager', 'Solutions Architect', 'CTO / VP Engineering',
  'Student / Bootcamp',
];

const SKILL_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     color: '74, 222, 128' },
  { value: 'intermediate', label: 'Intermediate',  color: '0, 210, 253' },
  { value: 'advanced',     label: 'Advanced',      color: '184, 159, 255' },
  { value: 'expert',       label: 'Expert',        color: '255, 89, 227' },
];

function toNames(stack) {
  return stack.map(t => (typeof t === 'string' ? t : t.name));
}

function mergeNames(newNames, existingStack) {
  return newNames.map(name => {
    const existing = existingStack.find(t => (typeof t === 'string' ? t : t.name) === name);
    return { name, level: existing?.level || 'intermediate' };
  });
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    username: user?.username || '',
    profession: user?.profession || '',
    years_of_experience: user?.years_of_experience || 0,
    tech_stack: (user?.tech_stack || []).map(t =>
      typeof t === 'string' ? { name: t, level: 'intermediate' } : t
    ),
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const updated = await api.updateUser(user.id, {
        username: form.username.trim(),
        profession: form.profession,
        years_of_experience: form.years_of_experience,
        tech_stack: form.tech_stack,
      });
      updateUser(updated);
      setMsg('Profile saved successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  function setTechLevel(techName, newLevel) {
    setForm(f => ({
      ...f,
      tech_stack: f.tech_stack.map(t => t.name === techName ? { ...t, level: newLevel } : t),
    }));
  }

  return (
    <div style={{ display: 'flex', minBlockSize: '100vh', background: 'var(--surface)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        <section style={{ maxInlineSize: '720px' }}>
          <h2 style={{ marginBlockEnd: '1.5rem', color: 'var(--on-surface)' }}>Profile</h2>

          <div className="card">
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">USERNAME</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">@</span>
                    <input
                      className="input input-has-prefix"
                      type="text"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">PROFESSION</label>
                  <select
                    className="input"
                    value={form.profession}
                    onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Select Profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '0.25rem' }}>
                  <label className="input-label">YEARS OF EXPERIENCE</label>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', color: 'var(--secondary)', fontSize: '1rem' }}>
                    {form.years_of_experience >= 20 ? '20+' : form.years_of_experience} Years
                  </span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={0} max={20}
                  value={form.years_of_experience}
                  onChange={e => setForm(f => ({ ...f, years_of_experience: parseInt(e.target.value) }))}
                  style={{
                    background: `linear-gradient(to right, var(--secondary) 0%, var(--primary) ${(form.years_of_experience / 20) * 100}%, var(--surface-container-highest) ${(form.years_of_experience / 20) * 100}%)`,
                  }}
                />
              </div>

              <TechStackInput
                label="TECH STACK"
                value={toNames(form.tech_stack)}
                onChange={newNames => setForm(f => ({
                  ...f,
                  tech_stack: mergeNames(newNames, f.tech_stack),
                }))}
                placeholder="Search technologies (e.g. React, Python, AWS)..."
              />

              {form.tech_stack.length > 0 && (
                <div className="input-group">
                  <label className="input-label" style={{ marginBlockEnd: '0.75rem' }}>SKILL LEVELS</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBlockEnd: '0.75rem', marginBlockStart: 0 }}>
                    Your skill levels determine the difficulty of AI-generated interview questions.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {form.tech_stack.map(tech => (
                      <div key={tech.name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.625rem 1rem',
                        background: 'var(--surface-container-low)',
                        borderRadius: 'var(--radius-md)',
                        gap: '1rem',
                      }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--on-surface)', minInlineSize: '80px' }}>
                          {tech.name}
                        </span>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {SKILL_LEVELS.map(sl => {
                            const active = tech.level === sl.value;
                            return (
                              <button
                                key={sl.value}
                                type="button"
                                onClick={() => setTechLevel(tech.name, sl.value)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: 'var(--radius-full)',
                                  border: `1px solid rgba(${sl.color}, ${active ? '0.6' : '0.2'})`,
                                  background: active ? `rgba(${sl.color}, 0.15)` : 'transparent',
                                  color: active ? `rgb(${sl.color})` : 'var(--on-surface-variant)',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  transition: 'all var(--transition)',
                                  fontFamily: 'var(--font-heading)',
                                }}
                              >
                                {sl.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                {msg && (
                  <span style={{ fontSize: '0.875rem', color: msg.includes('success') ? 'var(--success)' : 'var(--error)' }}>
                    {msg}
                  </span>
                )}
              </div>

            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
