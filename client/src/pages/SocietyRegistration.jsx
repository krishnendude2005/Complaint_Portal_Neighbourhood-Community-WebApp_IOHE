import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { societies } from '../api';
import styles from './SocietyRegistration.module.css';

export default function SocietyRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.adminPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.adminPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const result = await societies.register({
        name: formData.name,
        address: formData.address || null,
        adminEmail: formData.adminEmail,
        adminName: formData.adminName,
        adminPassword: formData.adminPassword
      });

      // Auto-login the newly created admin
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.admin));

      // Redirect to dashboard with success message
      alert(`Welcome ${result.admin.name}! Your society "${result.society.name}" has been created.`);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to register society');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Register Your Society</h1>
        <p className={styles.subtitle}>Create your neighborhood community</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3>Society Details</h3>
            <input
              type="text"
              name="name"
              placeholder="Society Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className={styles.section}>
            <h3>Admin Account</h3>
            <input
              type="email"
              name="adminEmail"
              placeholder="Admin Email"
              value={formData.adminEmail}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="adminName"
              placeholder="Admin Name"
              value={formData.adminName}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="adminPassword"
              placeholder="Password (min 6 characters)"
              value={formData.adminPassword}
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
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Society...' : 'Create Society'}
          </button>
        </form>

        <p className={styles.hint}>
          Already have an account? <a href="/login">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
