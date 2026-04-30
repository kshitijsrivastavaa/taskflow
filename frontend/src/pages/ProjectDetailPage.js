import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function TaskModal({ task, projectId, members, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'todo', priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '', due_date: task?.due_date?.split('T')[0] || '',
    tags: task?.tags?.join(', ') || '', project_id: projectId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isAssignee = task?.assignee_id === user?.id;
  const canEdit = isAdmin || !task || isAssignee;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [], assignee_id: form.assignee_id || null };
      let res;
      if (task) res = await api.put(`/tasks/${task.id}`, payload);
      else res = await api.post('/tasks/', payload);
      onSave(res.data.task);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
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
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} disabled={!canEdit}>
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))} disabled={!canEdit}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} disabled={!canEdit} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="frontend, bug, feature" disabled={!canEdit} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : task ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ projectId, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      onAdd(res.data.user);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">Add Member</div><button className="modal-close" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">User Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [memberModal, setMemberModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');

  const load = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/?project_id=${id}`)
    ]);
    setProject(pRes.data.project);
    setTasks(tRes.data.tasks);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = user?.role === 'admin' || project?.member_role === 'admin';

  const filteredTasks = filterPriority ? tasks.filter(t => t.priority === filterPriority) : tasks;
  const byStatus = (s) => filteredTasks.filter(t => t.status === s).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const handleTaskSave = (task) => {
    setTasks(ts => ts.find(t => t.id === task.id) ? ts.map(t => t.id === task.id ? task : t) : [task, ...ts]);
    setTaskModal(null);
  };

  const deleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(ts => ts.filter(t => t.id !== taskId));
  };

  const quickStatus = async (task, newStatus, e) => {
    e.stopPropagation();
    const res = await api.put(`/tasks/${task.id}`, { status: newStatus });
    setTasks(ts => ts.map(t => t.id === task.id ? res.data.task : t));
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${memberId}`);
    setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }));
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <div className="page"><p>Project not found.</p></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Back</button>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
          <div>
            <div className="topbar-title">{project.name}</div>
            <div className="text-sm text-muted">{project.description}</div>
          </div>
          <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
        </div>
        {isAdmin && (
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setMemberModal(true)}>＋ Add Member</button>
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>＋ New Task</button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: tasks.length, color: 'var(--text)' },
          { label: 'To Do', value: tasks.filter(t=>t.status==='todo').length, color: 'var(--text2)' },
          { label: 'In Progress', value: tasks.filter(t=>t.status==='in_progress').length, color: 'var(--accent)' },
          { label: 'Done', value: tasks.filter(t=>t.status==='done').length, color: 'var(--green)' },
          { label: 'Overdue', value: tasks.filter(t=>t.is_overdue).length, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 6 }}>
              <span>Progress</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{project.progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} /></div>
          </div>
        </div>
      </div>

      {/* Tabs + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="tabs" style={{ margin: 0, border: 'none' }}>
          {['kanban','list','members'].map(v => (
            <button key={v} className={`tab ${view===v?'active':''}`} onClick={() => setView(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
        {view !== 'members' && (
          <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {['urgent','high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        )}
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUSES.map(s => (
            <div key={s} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-title" style={{ color: statusColor(s) }}>{STATUS_LABELS[s]}</div>
                <span className="kanban-count">{byStatus(s).length}</span>
              </div>
              <div className="kanban-tasks">
                {byStatus(s).map(t => (
                  <div key={t.id} className={`task-card ${t.is_overdue ? 'overdue' : ''}`} onClick={() => setTaskModal(t)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="task-title" style={{ flex: 1 }}>{t.title}</div>
                      {isAdmin && <button className="btn btn-icon" style={{ padding: 2, color: 'var(--text3)', fontSize: '0.85rem', marginLeft: 4 }} onClick={e => deleteTask(t.id, e)}>✕</button>}
                    </div>
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      {t.assignee && <span className="task-assignee">{t.assignee.avatar} {t.assignee.name}</span>}
                      {t.due_date && <span style={{ color: t.is_overdue ? 'var(--red)' : 'var(--text2)' }}>{format(parseISO(t.due_date), 'MMM d')}</span>}
                    </div>
                    {t.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {t.tags.map(tag => <span key={tag} style={{ background: 'var(--bg4)', borderRadius: 99, padding: '2px 8px', fontSize: '0.7rem', color: 'var(--text2)' }}>{tag}</span>)}
                      </div>
                    )}
                    {/* Quick status */}
                    {s !== 'done' && (
                      <select className="filter-select" style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                        value={t.status} onClick={e => e.stopPropagation()} onChange={e => quickStatus(t, e.target.value, e)}>
                        {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', borderStyle: 'dashed' }} onClick={() => setTaskModal({ status: s, project_id: parseInt(id) })}>
                    ＋ Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredTasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th>{isAdmin && <th></th>}</tr></thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setTaskModal(t)}>
                      <td><div style={{ fontWeight: 500 }}>{t.title}</div>{t.description && <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>{t.description.substring(0, 60)}…</div>}</td>
                      <td><span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                      <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                      <td>{t.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{t.assignee.avatar}</span><span className="text-sm">{t.assignee.name}</span></div> : <span className="text-muted text-sm">—</span>}</td>
                      <td className="text-sm text-muted" style={{ color: t.is_overdue ? 'var(--red)' : undefined }}>{t.due_date ? format(parseISO(t.due_date), 'MMM d, yyyy') : '—'}</td>
                      {isAdmin && <td><button className="btn btn-danger btn-sm btn-icon" onClick={e => deleteTask(t.id, e)}>🗑</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Members view */}
      {view === 'members' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Assigned Tasks</th>{isAdmin && <th></th>}</tr></thead>
              <tbody>
                {project.members.map(m => (
                  <tr key={m.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="user-avatar">{m.avatar}</div><div><div style={{ fontWeight: 500 }}>{m.name}</div>{m.id === project.owner_id && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Owner</span>}</div></div></td>
                    <td className="text-muted text-sm">{m.email}</td>
                    <td><span className={`badge badge-${m.id === project.owner_id ? 'admin' : (project.member_role || 'member')}`}>{m.id === project.owner_id ? 'admin' : 'member'}</span></td>
                    <td className="text-sm">{tasks.filter(t => t.assignee_id === m.id).length} tasks</td>
                    {isAdmin && <td>{m.id !== project.owner_id && <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' ? null : (typeof taskModal === 'object' && taskModal.title !== undefined ? taskModal : { status: taskModal.status, project_id: taskModal.project_id })}
          projectId={parseInt(id)}
          members={project.members}
          onClose={() => setTaskModal(null)}
          onSave={handleTaskSave}
        />
      )}
      {memberModal && <MemberModal projectId={id} onClose={() => setMemberModal(false)} onAdd={(u) => { setProject(p => ({ ...p, members: [...p.members, u] })); setMemberModal(false); }} />}
    </div>
  );
}

function statusColor(s) {
  return { todo: 'var(--text2)', in_progress: 'var(--accent)', review: 'var(--purple)', done: 'var(--green)' }[s];
}
