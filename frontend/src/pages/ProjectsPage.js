import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#4f8ef7','#22c55e','#f59e0b','#a855f7','#ef4444','#f97316','#06b6d4','#ec4899'];

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({ name: project?.name || '', description: project?.description || '', color: project?.color || COLORS[0], deadline: project?.deadline?.split('T')[0] || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let res;
      if (project) res = await api.put(`/projects/${project.id}`, form);
      else res = await api.post('/projects/', form);
      onSave(res.data.project);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{project ? 'Edit Project' : 'New Project'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Project overview..." />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : project ? 'Update' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/projects/').then(r => { setProjects(r.data.projects); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const handleSave = (proj) => {
    setProjects(ps => ps.find(p => p.id === proj.id) ? ps.map(p => p.id === proj.id ? proj : p) : [proj, ...ps]);
    setShowModal(false);
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div className="page">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div className="topbar-title">Projects</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Project</button>
      </div>

      <div className="filters-row">
        {['all', 'active', 'completed', 'on_hold'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} style={{ border: 'none', background: 'none' }} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>＋ Create Project</button>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div className="project-color-dot" style={{ background: p.color }} />
                    <div className="project-name">{p.name}</div>
                  </div>
                  <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
                </div>
                {(user?.role === 'admin' || p.owner_id === user?.id) && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={e => deleteProject(p.id, e)} style={{ marginLeft: 8 }}>🗑</button>
                )}
              </div>
              {p.description && <div className="project-desc">{p.description.substring(0, 100)}{p.description.length > 100 ? '…' : ''}</div>}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 6 }}>
                  <span>{p.completed_tasks}/{p.task_count} tasks</span>
                  <span style={{ fontWeight: 600 }}>{p.progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} /></div>
              </div>
              <div className="project-footer">
                <div className="member-avatars">
                  {p.members.slice(0, 4).map(m => (
                    <div key={m.id} className="member-avatar" title={m.name}>{m.avatar}</div>
                  ))}
                  {p.members.length > 4 && <div className="member-avatar">+{p.members.length - 4}</div>}
                </div>
                {p.deadline && <span>📅 {new Date(p.deadline).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
