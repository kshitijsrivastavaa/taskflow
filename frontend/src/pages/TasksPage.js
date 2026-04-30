import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

const STATUSES = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

function TaskModal({ task, projects, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'todo', priority: task?.priority || 'medium',
    project_id: task?.project_id || '', assignee_id: task?.assignee_id || '',
    due_date: task?.due_date?.split('T')[0] || '', tags: task?.tags?.join(', ') || ''
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (form.project_id) {
      api.get(`/projects/${form.project_id}`).then(r => setMembers(r.data.project.members)).catch(() => {});
    }
  }, [form.project_id]);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [], assignee_id: form.assignee_id || null };
      let res;
      if (task) res = await api.put(`/tasks/${task.id}`, payload);
      else res = await api.post('/tasks/', payload);
      onSave(res.data.task);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">{task ? 'Edit Task' : 'New Task'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))} placeholder="Task title" required />
            </div>
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-select" value={form.project_id} onChange={e => setForm(f=>({...f, project_id: e.target.value, assignee_id: ''}))} required>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f=>({...f, status: e.target.value}))}>
                  {Object.entries(STATUSES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f=>({...f, priority: e.target.value}))}>
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee_id} onChange={e => setForm(f=>({...f, assignee_id: e.target.value}))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(f=>({...f, due_date: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm(f=>({...f, tags: e.target.value}))} placeholder="bug, feature, urgent" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : task ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', project_id: '', my_tasks: false, search: '' });

  const load = async () => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.my_tasks) params.append('my_tasks', 'true');
    const [tRes, pRes] = await Promise.all([
      api.get(`/tasks/?${params}`),
      api.get('/projects/')
    ]);
    setTasks(tRes.data.tasks);
    setProjects(pRes.data.projects);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters.status, filters.priority, filters.project_id, filters.my_tasks]);

  const displayed = filters.search
    ? tasks.filter(t => t.title.toLowerCase().includes(filters.search.toLowerCase()) || t.project_name?.toLowerCase().includes(filters.search.toLowerCase()))
    : tasks;

  const handleSave = (task) => {
    setTasks(ts => ts.find(t => t.id === task.id) ? ts.map(t => t.id === task.id ? task : t) : [task, ...ts]);
    setShowModal(false); setEditTask(null);
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  const statusUpdate = async (task, status) => {
    const res = await api.put(`/tasks/${task.id}`, { status });
    setTasks(ts => ts.map(t => t.id === task.id ? res.data.task : t));
  };

  return (
    <div className="page">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div className="topbar-title">Tasks</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Task</button>
      </div>

      <div className="filters-row">
        <input className="search-input" placeholder="Search tasks…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {['urgent','high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={filters.project_id} onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.my_tasks} onChange={e => setFilters(f => ({ ...f, my_tasks: e.target.checked }))} />
          My tasks
        </label>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create a new task</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Task</th><th>Project</th><th>Status</th><th>Priority</th>
                <th>Assignee</th><th>Due</th><th></th>
              </tr></thead>
              <tbody>
                {displayed.map(t => (
                  <tr key={t.id}>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {t.tags.map(tag => <span key={tag} style={{ background: 'var(--bg4)', borderRadius: 99, padding: '1px 7px', fontSize: '0.68rem', color: 'var(--text2)' }}>{tag}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="text-sm text-muted">{t.project_name}</td>
                    <td>
                      <select className="filter-select" style={{ fontSize: '0.78rem', padding: '3px 8px' }}
                        value={t.status} onChange={e => statusUpdate(t, e.target.value)}>
                        {Object.entries(STATUSES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td>{t.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span>{t.assignee.avatar}</span><span className="text-sm">{t.assignee.name}</span></div> : <span className="text-muted text-sm">—</span>}</td>
                    <td className="text-sm" style={{ color: t.is_overdue ? 'var(--red)' : 'var(--text2)' }}>{t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditTask(t); setShowModal(true); }}>✏</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteTask(t.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <TaskModal task={editTask} projects={projects} onClose={() => { setShowModal(false); setEditTask(null); }} onSave={handleSave} />}
    </div>
  );
}
