import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div className="page"><p>Failed to load dashboard.</p></div>;

  const { stats, overdue_tasks, my_tasks, projects, status_distribution } = data;

  const statCards = [
    { icon: '◈', label: 'Total Projects', value: stats.total_projects, color: 'var(--accent)' },
    { icon: '✓', label: 'Total Tasks', value: stats.total_tasks, color: 'var(--green)' },
    { icon: '⟳', label: 'In Progress', value: stats.in_progress_tasks, color: 'var(--yellow)' },
    { icon: '⚠', label: 'Overdue', value: stats.overdue_count, color: 'var(--red)' },
    { icon: '◎', label: 'Completed', value: stats.done_tasks, color: 'var(--purple)' },
    { icon: '≡', label: 'My Tasks', value: stats.my_tasks_count, color: 'var(--orange)' },
  ];

  return (
    <div className="page">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: 32, marginTop: '-32px', marginBottom: 28 }}>
        <div>
          <div className="topbar-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} {user?.avatar}</div>
          <div className="text-sm text-muted" style={{ marginTop: 2 }}>Here's what's happening across your workspace</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>＋ New Project</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>＋ New Task</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Status chart */}
        <div className="card">
          <div className="section-header"><div className="section-title">Task Status Overview</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(status_distribution).map(([key, val]) => {
              const total = stats.total_tasks || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, fontSize: '0.78rem', color: 'var(--text2)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: statusColor(key), borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ width: 32, fontSize: '0.78rem', color: 'var(--text2)', textAlign: 'right' }}>{val}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-sm text-muted">Completion rate</span>
            <span className="text-sm" style={{ color: 'var(--green)', fontWeight: 700 }}>{stats.completion_rate}%</span>
          </div>
        </div>

        {/* Overdue tasks */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">⚠ Overdue Tasks</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>{overdue_tasks.length} tasks</span>
          </div>
          {overdue_tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '2rem' }}>✓</div>
              <p>No overdue tasks!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdue_tasks.map(t => (
                <div key={t.id} className="task-card overdue" onClick={() => navigate('/tasks')}>
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <span>{t.project_name}</span>
                    <PriorityBadge priority={t.priority} />
                    {t.due_date && <span style={{ color: 'var(--red)' }}>Due {format(parseISO(t.due_date), 'MMM d')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="section-header">
        <div className="section-title">Recent Projects</div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View all →</button>
      </div>
      <div className="project-grid" style={{ marginBottom: 24 }}>
        {projects.slice(0, 3).map(p => (
          <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
            <div className="project-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div className="project-color-dot" style={{ background: p.color }} />
                  <div className="project-name">{p.name}</div>
                </div>
                <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 6 }}>
                <span>{p.completed_tasks}/{p.task_count} tasks</span>
                <span>{p.progress}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* My tasks */}
      <div className="section-header">
        <div className="section-title">My Assigned Tasks</div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks?my=true')}>View all →</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {my_tasks.length === 0 ? (
          <div className="empty-state"><p>No tasks assigned to you yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due</th>
              </tr></thead>
              <tbody>
                {my_tasks.slice(0, 8).map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                    <td style={{ maxWidth: 220 }}><div style={{ fontWeight: 500 }}>{t.title}</div></td>
                    <td className="text-muted">{t.project_name}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td className="text-sm text-muted">{t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function statusColor(s) {
  return { todo: 'var(--text3)', in_progress: 'var(--accent)', review: 'var(--purple)', done: 'var(--green)' }[s] || 'var(--accent)';
}
