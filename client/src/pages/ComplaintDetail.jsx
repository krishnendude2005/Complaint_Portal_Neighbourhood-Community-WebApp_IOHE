import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaints, users, STATUSES } from '../api';
import styles from './ComplaintDetail.module.css';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  waiting_for_parts: 'Waiting for Parts', waiting_for_approval: 'Waiting for Approval',
  resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened'
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [status, setStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionPhotos, setActionPhotos] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const isAdmin = ['admin', 'committee'].includes(user?.role);
  const isStaff = user?.role === 'staff';
  const isResident = user?.role === 'resident';
  const canAssign = isAdmin;
  const canUpdateStatus = isAdmin || (isStaff && complaint?.assignedTo === user?.id);
  const canRate = isResident && complaint?.reporterId === user?.id && complaint?.status === 'resolved';

  useEffect(() => {
    complaints.get(id).then(setComplaint).catch(() => setComplaint(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAdmin) users.getStaff().then(setStaff).catch(() => setStaff([]));
  }, [isAdmin]);

  const handleAssign = async () => {
    if (!assignTo) return;
    setError('');
    try {
      const updated = await complaints.assign(id, assignTo, internalNote);
      setComplaint(updated);
      setAssignTo('');
      setInternalNote('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async () => {
    if (!status) return;
    setError('');
    try {
      const updated = await complaints.updateStatus(id, status, '', actionPhotos.length > 0 ? actionPhotos : undefined);
      setComplaint(updated);
      setStatus('');
      setActionPhotos([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolve = async () => {
    setError('');
    try {
      const updated = await complaints.resolve(id, resolutionNote || undefined, actionPhotos.length > 0 ? actionPhotos : undefined);
      setComplaint(updated);
      setResolutionNote('');
      setActionPhotos([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setError('');
    try {
      const updated = await complaints.addComment(id, comment);
      setComplaint(updated);
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRate = async () => {
    if (rating < 1) return;
    setError('');
    try {
      const updated = await complaints.rate(id, rating, feedback);
      setComplaint(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePriorityChange = async (priority) => {
    if (!isAdmin) return;
    try {
      const updated = await complaints.changePriority(id, priority);
      setComplaint(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await complaints.delete(id);
      navigate('/complaints');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!complaint) return <p>Complaint not found.</p>;

  const handleActionPhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const base64s = await Promise.all(files.map(f => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(f);
      });
    }));
    setActionPhotos(prev => [...prev, ...base64s]);
  };

  const images = complaint.images ? (typeof complaint.images === 'string' ? JSON.parse(complaint.images) : complaint.images) : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{complaint.title}</h1>
          <p className={styles.meta}>
            #{complaint.id.slice(0, 8)} · Flat {complaint.flatNumber || '-'} · {complaint.category}
            {complaint.subcategory && ` → ${complaint.subcategory}`}
          </p>
        </div>
        <div className={styles.badges}>
          <span className={styles.priority} style={{ color: PRIORITY_COLORS[complaint.priority] }}>
            ● {complaint.priority}
          </span>
          <span className={styles.status}>{STATUS_LABELS[complaint.status]}</span>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h3>Description</h3>
            <p>{complaint.description}</p>
            {complaint.location && <p><strong>Location:</strong> {complaint.location}</p>}
          </section>

          {images.length > 0 && (
            <section className={styles.section}>
              <h3>Photos</h3>
              <div className={styles.images}>
                {images.map((img, i) => (
                  <img key={i} src={typeof img === 'string' ? img : img.url || img} alt={`Attachment ${i + 1}`} />
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h3>Updates & Comments</h3>
            <div className={styles.updates}>
              {complaint.updates?.map((u) => (
                <div key={u.id} className={styles.update}>
                  <strong>{u.user?.name}</strong> · {new Date(u.createdAt).toLocaleString()}
                  {u.content && <p>{u.content}</p>}
                  {u.oldStatus && u.newStatus && (
                    <span className={styles.statusChange}>{u.oldStatus} → {u.newStatus}</span>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.commentForm}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
              />
              <button onClick={handleComment} disabled={!comment.trim()}>Post Comment</button>
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h3>Details</h3>
            <p><strong>Reporter:</strong> {complaint.reporter?.name}</p>
            <p><strong>Filed:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
            {complaint.assignedStaff && (
              <p><strong>Assigned to:</strong> {complaint.assignedStaff.name}</p>
            )}
            {complaint.rating && (
              <p><strong>Rating:</strong> {'⭐'.repeat(complaint.rating)} {complaint.rating}/5</p>
            )}
          </section>

          {isAdmin && (
            <section className={styles.section}>
              <h3>Priority</h3>
              <div className={styles.priorityBtns}>
                {['critical', 'high', 'medium', 'low'].map((p) => (
                  <button
                    key={p}
                    className={complaint.priority === p ? styles.active : ''}
                    onClick={() => handlePriorityChange(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </section>
          )}

          {canAssign && complaint.status !== 'closed' && (
            <section className={styles.section}>
              <h3>Assign to Staff</h3>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.activeComplaints || 0} active)</option>
                ))}
              </select>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Internal note (optional)"
                rows={2}
              />
              <button onClick={handleAssign} disabled={!assignTo}>Assign</button>
            </section>
          )}

          {canUpdateStatus && complaint.status !== 'closed' && (
            <section className={styles.section}>
              <h3>Update Status</h3>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select status...</option>
                {STATUSES.filter(s => s !== complaint.status).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
              <button onClick={handleStatusChange} disabled={!status}>Update</button>
              
              {(complaint.status === 'in_progress' || complaint.status === 'assigned') && (
                <div style={{ marginTop: 16 }}>
                  <h4>Resolve Issue</h4>
                  <textarea 
                    value={resolutionNote} 
                    onChange={(e) => setResolutionNote(e.target.value)} 
                    placeholder="Resolution details..." 
                    rows={2} 
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Add Photos</label>
                    <input type="file" multiple accept="image/*" onChange={handleActionPhotoChange} />
                    {actionPhotos.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {actionPhotos.map((img, i) => <img key={i} src={img} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />)}
                      </div>
                    )}
                  </div>
                  <button className={styles.resolveBtn} onClick={handleResolve}>Mark Resolved</button>
                </div>
              )}
            </section>
          )}

          {canRate && (
            <section className={styles.section}>
              <h3>Rate Resolution</h3>
              <div className={styles.rating}>
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    className={rating >= r ? styles.starActive : ''}
                    onClick={() => setRating(r)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback (optional)"
                rows={2}
              />
              <button onClick={handleRate} disabled={rating < 1}>Submit Rating</button>
            </section>
          )}

          {user?.role === 'admin' && (
            <button className={styles.deleteBtn} onClick={handleDelete}>Delete Complaint</button>
          )}
        </aside>
      </div>
    </div>
  );
}
