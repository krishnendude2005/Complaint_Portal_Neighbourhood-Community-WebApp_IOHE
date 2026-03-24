import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaints, CATEGORIES } from '../api';
import styles from './Complaints.module.css';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  waiting_for_parts: 'Waiting for Parts', waiting_for_approval: 'Waiting for Approval',
  resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened'
};

export default function Complaints() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    complaints.list(params).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  return (
    <div className={styles.page}>
      <h1>Complaints</h1>
      <div className={styles.filters}>
        <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
          <option value="">All Category</option>
          {Object.keys(CATEGORIES || {}).map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {data.map((c) => (
            <Link key={c.id} to={`/complaints/${c.id}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.id}>#{c.id.slice(0, 8)}</span>
                <span className={styles.priority} style={{ color: PRIORITY_COLORS[c.priority] || '#888' }}>
                  ● {c.priority}
                </span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.flatNumber ? `Flat ${c.flatNumber}` : '-'} {c.location ? `· ${c.location} ` : ''}· {c.category}</p>
              <span className={styles.status}>{STATUS_LABELS[c.status] || c.status}</span>
              {c.assignedStaff && <p className={styles.assigned}>{c.assignedStaff.name}</p>}
            </Link>
          ))}
        </div>
      )}
      {!loading && data.length === 0 && (
        <p className={styles.empty}>No complaints match your filters.</p>
      )}
    </div>
  );
}
