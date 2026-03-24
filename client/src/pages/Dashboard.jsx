import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaints } from '../api';
import styles from './Dashboard.module.css';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  waiting_for_parts: 'Waiting for Parts', waiting_for_approval: 'Waiting for Approval',
  resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (filter) params.status = filter;
    complaints.list(params).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const stats = {
    total: data.length,
    open: data.filter(c => ['open', 'reopened'].includes(c.status)).length,
    assigned: data.filter(c => c.status === 'assigned').length,
    inProgress: data.filter(c => ['in_progress', 'waiting_for_parts', 'waiting_for_approval'].includes(c.status)).length,
    resolved: data.filter(c => c.status === 'resolved').length,
    closed: data.filter(c => c.status === 'closed').length,
    critical: data.filter(c => c.priority === 'critical').length,
    high: data.filter(c => c.priority === 'high').length
  };

  const recent = data.slice(0, 10);

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <p className={styles.welcome}>Welcome, {user?.name}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat} data-priority="critical">
          <span className={styles.statValue}>{stats.critical}</span>
          <span className={styles.statLabel}>Critical</span>
        </div>
        <div className={styles.stat} data-priority="high">
          <span className={styles.statValue}>{stats.high}</span>
          <span className={styles.statLabel}>High</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.open}</span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.inProgress}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.resolved}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Complaints</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : recent.length === 0 ? (
          <p className={styles.empty}>No complaints found.</p>
        ) : (
          <div className={styles.list}>
            {recent.map((c) => (
              <Link key={c.id} to={`/complaints/${c.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.id}>#{c.id.slice(0, 8)}</span>
                  <span className={styles.priority} style={{ color: PRIORITY_COLORS[c.priority] || '#888' }}>
                    ● {c.priority}
                  </span>
                </div>
                <h3>{c.title}</h3>
                <p className={styles.meta}>
                  Flat {c.flatNumber || '-'} · {c.category} · {STATUS_LABELS[c.status] || c.status}
                </p>
                {c.assignedStaff && (
                  <p className={styles.assigned}>Assigned to {c.assignedStaff.name}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
