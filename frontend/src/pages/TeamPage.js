import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => api.get('/users/').then(r => { setUsers(r.data.users); setLoading(false); });
  useEffect(() => { load(); }, []);

  const changeRole = async (uid, role) => {
    await api.put(`/users/${uid}/role`, { role });
    setUsers(us => us.map(u => u.id === uid ? { ...u, role } : u));
  };

  const filtered = search ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : users;

  return (
    <div className="page">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div>
          <div className="topbar-title">Team</div>
          <div className="text-sm text-muted" style={{ marginTop: 2 }}>{users.length} members in your workspace</div>
        </div>
      </div>

      <div className="filters-row">
        <input className="search-input" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(u => (
            <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-glow)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>{u.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.name}
                    {u.id === user.id && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>(you)</span>}
                  </div>
                  <div className="text-sm text-muted">{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge badge-${u.role}`}>{u.role}</span>
                {user?.role === 'admin' && u.id !== user.id && (
                  <select className="filter-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ fontSize: '0.78rem' }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
              <div className="text-sm text-muted" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                Joined {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
