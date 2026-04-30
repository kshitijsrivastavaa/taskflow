import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '⊞' },
  { path: '/projects', label: 'Projects', icon: '◈' },
  { path: '/tasks', label: 'Tasks', icon: '✓' },
  { path: '/team', label: 'Team', icon: '◉' },
  { path: '/profile', label: 'Profile', icon: '⊛' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>⬡</span> TaskFlow
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Navigation</div>
          <nav className="sidebar-nav">
            {NAV.map(item => (
              <button
                key={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{user?.avatar}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
