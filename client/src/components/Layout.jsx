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
        <h1>Complaint Management</h1>
        <div className={styles.user}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className={styles.logout}>Logout</button>
        </div>
      </header>
      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink>
        <NavLink to="/complaints" className={({ isActive }) => isActive ? styles.active : ''}>Complaints</NavLink>
        {['resident', 'admin', 'committee', 'security'].includes(user?.role) && (
          <NavLink to="/complaints/new" className={({ isActive }) => isActive ? styles.active : ''}>New Complaint</NavLink>
        )}
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
