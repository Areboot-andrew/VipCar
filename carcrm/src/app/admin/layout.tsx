import Link from 'next/link';
import { CalendarDays, Car, Users, LayoutDashboard, Settings, TicketPercent, MessageSquare } from 'lucide-react';
import '../globals.css'; // Ensure we have globals

export const metadata = {
  title: 'Admin Panel - Car CRM',
  description: 'Manage bookings, fleet, and drivers',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Car CRM Admin</h2>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-link">
            <LayoutDashboard size={20} />
            <span>Дашборд (Календар)</span>
          </Link>
          <Link href="/admin/fleet" className="admin-nav-link">
            <Car size={20} />
            <span>Автопарк</span>
          </Link>
          <Link href="/admin/bookings" className="admin-nav-link">
            <CalendarDays size={20} />
            <span>Заявки</span>
          </Link>
          <Link href="/admin/users" className="admin-nav-link">
            <Users size={20} />
            <span>Клієнти / Водії</span>
          </Link>
          <Link href="/admin/promotions" className="admin-nav-link">
            <TicketPercent size={20} />
            <span>Знижки (Empty Legs)</span>
          </Link>
          <Link href="/admin/cms" className="admin-nav-link">
            <Settings size={20} />
            <span>CMS Сайту</span>
          </Link>
          <Link href="/admin/feedback" className="admin-nav-link">
            <MessageSquare size={20} />
            <span>Повідомлення</span>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">Панель Управління</div>
          <div className="admin-user-menu">Адміністратор</div>
        </header>
        <div className="admin-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
