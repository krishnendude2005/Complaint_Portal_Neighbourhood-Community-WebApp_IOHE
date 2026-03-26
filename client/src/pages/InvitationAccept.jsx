import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invitations } from '../api';
import styles from './InvitationAccept.module.css';

export default function InvitationAccept() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('loading'); // loading, view, register, success

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const data = await invitations.accept(token);
      setInvitation(data.invitation);
      setStep('view');
    } catch (err) {
      setError(err.message || 'Invalid or expired invitation');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setSubmitting(true);
    try {
      const result = await invitations.acceptRegister(token, {
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null
      });

      // Auto-login
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      setStep('success');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Invitation Error</h1>
          <p className={styles.error}>{error}</p>
          <button onClick={() => navigate('/login')} className={styles.button}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Registration Complete!</h1>
          <p>Welcome to {invitation.society.name}</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Accept Invitation</h1>

        <div className={styles.inviteInfo}>
          <h2>{invitation.society.name}</h2>
          {invitation.society.address && (
            <p>{invitation.society.address}</p>
          )}
          <div className={styles.role}>
            <strong>Role:</strong> {invitation.role}
            {invitation.flatNumber && <span> · Flat: {invitation.flatNumber}</span>}
          </div>
          <p className={styles.inviter}>
            Invited by: {invitation.inviter.name} ({invitation.inviter.email})
          </p>
          <p className={styles.expires}>
            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h3>Create Your Account</h3>
          <input
            type="text"
            name="name"
            placeholder="Your Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number (optional)"
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Accept Invitation'}
          </button>
        </form>

        <p className={styles.hint}>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
