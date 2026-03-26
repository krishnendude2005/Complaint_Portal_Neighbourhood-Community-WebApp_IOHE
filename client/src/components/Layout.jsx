import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Complaint Management</h1>
          {user?.societyId && (
            <span className={styles.societyId}>Society ID: {user.societyId.slice(0, 8)}...</span>
          )}
        </div>
        <div className={styles.user}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className={styles.logout}>Logout</button>
        </div>
      </header>
      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink>
        <NavLink to="/complaints" end className={({ isActive }) => isActive ? styles.active : ''}>Complaints</NavLink>
        {['resident', 'admin', 'committee', 'security'].includes(user?.role) && (
          <NavLink to="/complaints/new" className={({ isActive }) => isActive ? styles.active : ''}>New Complaint</NavLink>
        )}
        {['admin', 'committee'].includes(user?.role) && (
          <NavLink to="/invite/members" className={({ isActive }) => isActive ? styles.active : ''}>Invite Members</NavLink>
        )}
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
