import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import '../styles/dashboard.css';
import '../styles/adm/AdminArea.css';

export default function AdminLayout() {
  return (
    <div className="dashboard admin-area">
      <AdminSidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}