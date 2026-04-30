import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🧑','👩','🧔','👨‍💻','👩‍💻','🦸','🦹','🧙','🧝','🧛','🧜','🧚','👷','🕵️','🧑‍🎤'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '🧑', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    if (form.password && form.password !== form.confirm) {
      setError('Passwords do not match'); setLoading(false); return;
    }
    try {
      const payload = { name: form.name, avatar: form.avatar };
      if (form.password) payload.password = form.password;
      const res = await api.put('/auth/me', payload);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully!');
      setForm(f => ({ ...f, password: '', confirm: '' }));
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div className="topbar-title">Profile Settings</div>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--accent-glow)', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>{form.avatar}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</div>
              <div className="text-sm text-muted">{user?.email}</div>
              <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>{user?.role}</span>
            </div>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
          {success && <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem', color: 'var(--green)', marginBottom: 14 }}>{success}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {AVATARS.map(a => (
                  <button key={a} type="button" onClick={() => setForm(f => ({ ...f, avatar: a }))}
                    style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${form.avatar === a ? 'var(--accent)' : 'var(--border)'}`, background: form.avatar === a ? 'var(--accent-glow)' : 'var(--bg3)', fontSize: '1.3rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="form-label" style={{ marginBottom: 10, fontSize: '0.85rem', fontWeight: 600 }}>Change Password (optional)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" minLength={form.password ? 6 : 0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Account Info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Email', user?.email], ['Role', user?.role], ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-muted">{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
