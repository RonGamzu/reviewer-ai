import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  {
    label: 'Mock Interview',
    path: '/interview',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    path: '/dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const level = Math.floor((user?.id || 1) * 7 % 50) + 1;

  return (
    <>
    <aside className="sidebar-wrap" style={{
      inlineSize: '220px',
      flexShrink: 0,
      background: 'var(--surface-container-low)',
      blockSize: '100vh',
      position: 'sticky',
      insetBlockStart: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      borderInlineEnd: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Brand — clicking navigates to dashboard (home) */}
      <div style={{ paddingInline: '1.25rem', marginBlockEnd: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '0.9375rem', color: 'var(--on-surface)' }}>
              Reviewer.AI
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              LEVEL {level} ARCHITECT
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingInline: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
              background: isActive ? 'rgba(184, 159, 255, 0.08)' : 'transparent',
              borderInlineStart: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              fontFamily: 'var(--font-heading)',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all var(--transition)',
              textDecoration: 'none',
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user info + logout */}
      <div style={{ paddingInline: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <hr className="divider" style={{ margin: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', paddingBlockEnd: '0.25rem' }}>
          <div style={{ fontWeight: '600', color: 'var(--on-surface)' }}>@{user?.username}</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{user?.profession || 'Architect'}</div>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', opacity: 0.4, paddingBlockStart: '0.25rem' }}>
          © By Ron Gamzu 2026
        </div>
        <button
          className="btn btn-ghost"
          style={{ justifyContent: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          onClick={handleLogout}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>

    {/* Mobile bottom navigation */}
    <nav className="mobile-nav">
      {navItems.map(item => {
        const active = item.end
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={`mobile-nav-item${active ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        );
      })}
      <button className="mobile-nav-item" onClick={handleLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </nav>
    </>
  );
}
