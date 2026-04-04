import { useState, useRef, useEffect } from 'react';

const TECH_DICTIONARY = [
  'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Remix', 'Astro',
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift',
  'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Elixir', 'Scala', 'Clojure',
  'Node.js', 'Express.js', 'Fastify', 'NestJS', 'Django', 'FastAPI', 'Flask',
  'Spring Boot', 'Rails', 'Laravel', 'Phoenix',
  'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
  'Elasticsearch', 'CockroachDB', 'PlanetScale', 'Supabase', 'Firebase',
  'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Cloudflare', 'DigitalOcean',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Helm', 'Istio',
  'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'ArgoCD',
  'GraphQL', 'REST', 'gRPC', 'WebSockets', 'Kafka', 'RabbitMQ', 'NATS',
  'Tailwind CSS', 'Sass', 'CSS Modules', 'Styled Components', 'Emotion',
  'Vite', 'Webpack', 'Rollup', 'esbuild', 'Turbopack',
  'Jest', 'Vitest', 'Playwright', 'Cypress', 'Testing Library',
  'Prisma', 'Drizzle', 'TypeORM', 'Sequelize',
  'OpenAI API', 'LangChain', 'Pinecone', 'Weaviate', 'Hugging Face',
];

export default function TechStackInput({ value = [], onChange, placeholder, label }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const filtered = query.length > 0
    ? TECH_DICTIONARY.filter(
        t => t.toLowerCase().includes(query.toLowerCase()) && !value.includes(t)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function addItem(item) {
    if (!value.includes(item)) {
      onChange([...value, item]);
    }
    setQuery('');
    setShowDropdown(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  function removeItem(item) {
    onChange(value.filter(v => v !== item));
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        addItem(filtered[activeIdx]);
      } else if (query.trim()) {
        addItem(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setQuery('');
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      removeItem(value[value.length - 1]);
    }
  }

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            padding: '0.625rem 1rem',
            background: 'var(--surface-container-low)',
            border: 'var(--border-ghost)',
            borderRadius: 'var(--radius-md)',
            minBlockSize: '52px',
            cursor: 'text',
            transition: 'border-color var(--transition)',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--on-surface-variant)',
            paddingInlineEnd: '0.25rem',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          {value.map(item => (
            <span key={item} className="chip">
              {item}
              <button
                type="button"
                className="chip-remove"
                onClick={(e) => { e.stopPropagation(); removeItem(item); }}
                aria-label={`Remove ${item}`}
              >×</button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setActiveIdx(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            style={{
              flex: '1',
              minInlineSize: '120px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--on-surface)',
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-body)',
              padding: '0.125rem 0',
            }}
          />
        </div>

        {showDropdown && filtered.length > 0 && (
          <div className="autocomplete-dropdown">
            {filtered.map((item, idx) => (
              <div
                key={item}
                className={`autocomplete-option${activeIdx === idx ? ' active' : ''}`}
                onMouseDown={e => { e.preventDefault(); addItem(item); }}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
