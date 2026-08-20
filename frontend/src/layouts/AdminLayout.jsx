import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import '../styles/dashboard.css';

export default function AdminLayout() {
  return (
    <div className="dashboard">
      <AdminSidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}