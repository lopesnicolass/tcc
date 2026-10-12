import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import MobileNavigationBar from '../components/MobileNavigationBar.jsx';
import '../styles/dashboard.css';
import '../styles/adm/AdminArea.css';
import '../styles/mobile-responsive.css';
import '../styles/adm/AdminPolish.css';

export default function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('tenna-mobile-menu-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('tenna-mobile-menu-open');
    };
  }, [mobileMenuOpen]);
  return (
    <div className="dashboard admin-area">
      <MobileNavigationBar label="Administração" menuId="tenna-admin-nav" expanded={mobileMenuOpen} onOpen={() => setMobileMenuOpen(true)} />
      {mobileMenuOpen && <button type="button" className="tenna-mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <AdminSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}