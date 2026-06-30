import Link from 'next/link';
import { CalendarDays, DollarSign, LogOut } from 'lucide-react';
import '../globals.css';

export const metadata = {
  title: 'Портал Водія - First Line Transfer',
  description: 'Управління рейсами та розрахунками',
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {/* Sidebar (Using admin styles for consistency) */}
      <aside className="admin-sidebar" style={{ backgroundColor: '#1a1c1c' }}>
        <div className="admin-sidebar-header">
          <h2 style={{ color: '#ffe088' }}>Кабінет Водія</h2>
        </div>
        <nav className="admin-nav">
          <Link href="/driver" className="admin-nav-link">
            <CalendarDays size={20} />
            <span>Мої Рейси</span>
          </Link>
          <Link href="/driver/settlements" className="admin-nav-link">
            <DollarSign size={20} />
            <span>Розрахунки</span>
          </Link>
          <Link href="/" className="admin-nav-link" style={{ marginTop: 'auto', color: '#ffb4ab' }}>
            <LogOut size={20} />
            <span>Вийти</span>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">Особистий кабінет</div>
          <div className="admin-user-menu">Водій</div>
        </header>
        <div className="admin-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
