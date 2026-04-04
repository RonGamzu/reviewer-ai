import { useLang } from '../../context/LangContext.jsx';

export default function LangToggle() {
  const { locale, toggleLocale } = useLang();

  return (
    <button
      onClick={toggleLocale}
      aria-label="Toggle language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.375rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        border: 'var(--border-ghost)',
        background: 'var(--surface-container)',
        color: 'var(--on-surface-variant)',
        fontSize: '0.8125rem',
        fontWeight: '700',
        fontFamily: 'var(--font-heading)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        letterSpacing: '0.04em',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--primary)';
        e.currentTarget.style.borderColor = 'rgba(184, 159, 255, 0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--on-surface-variant)';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <span style={{ color: locale === 'en' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>EN</span>
      <span style={{ opacity: 0.4 }}>|</span>
      <span style={{ color: locale === 'he' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>HE</span>
    </button>
  );
}
