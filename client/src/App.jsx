import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import NewComplaint from './pages/NewComplaint';
import SocietyRegistration from './pages/SocietyRegistration';
import InvitationAccept from './pages/InvitationAccept';
import InviteMembers from './pages/InviteMembers';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register/society" element={<SocietyRegistration />} />
        <Route path="/invite/accept/:token?" element={<InvitationAccept />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/new" element={<NewComplaint />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="invite/members" element={<InviteMembers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
