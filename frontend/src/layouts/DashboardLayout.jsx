import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import '../styles/dashboard.css';

export default function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}