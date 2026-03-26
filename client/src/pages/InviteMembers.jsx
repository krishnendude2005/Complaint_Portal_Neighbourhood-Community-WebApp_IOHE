import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { societies } from '../api';
import styles from './InviteMembers.module.css';

const ROLES = [
  { value: 'resident', label: 'Resident' },
  { value: 'staff', label: 'Staff' },
  { value: 'committee', label: 'Committee Member' },
  { value: 'security', label: 'Security' }
];

export default function InviteMembers() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    role: 'resident',
    flatNumber: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentInvitations, setSentInvitations] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.email) {
      return setError('Email is required');
    }

    setLoading(true);
    try {
      const result = await societies.createInvitation(user.societyId, {
        email: formData.email,
        role: formData.role,
        flatNumber: formData.flatNumber || null
      });

      setMessage(`Invitation sent to ${formData.email}! They will receive an email with instructions.`);
      setSentInvitations([...sentInvitations, result.invitation]);
      setFormData({ email: '', role: 'resident', flatNumber: '' });
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Invite Members</h1>
        <p className={styles.subtitle}>Send invitations to join your society</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="member@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <small>
              {formData.role === 'resident' && 'Can file and view their own complaints'}
              {formData.role === 'staff' && 'Can be assigned and update complaints'}
              {formData.role === 'committee' && 'Full admin access to complaints'}
              {formData.role === 'security' && 'Limited access for security-related features'}
            </small>
          </div>

          <div className={styles.formGroup}>
            <label>Flat Number (optional)</label>
            <input
              type="text"
              name="flatNumber"
              placeholder="e.g., 302, A-101"
              value={formData.flatNumber}
              onChange={handleChange}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        {sentInvitations.length > 0 && (
          <div className={styles.recent}>
            <h3>Recent Invitations</h3>
            <ul>
              {sentInvitations.slice(-5).reverse().map(inv => (
                <li key={inv.id}>
                  {inv.email} - {inv.role} {inv.flatNumber && `(Flat ${inv.flatNumber})`}
                  <span className={styles.expires}>
                    (expires {new Date(inv.expiresAt).toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
