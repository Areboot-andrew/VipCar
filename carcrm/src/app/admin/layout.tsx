import Link from 'next/link';
import { CalendarDays, Car, Users, LayoutDashboard, Settings, TicketPercent, MessageSquare, ExternalLink } from 'lucide-react';
import '../globals.css';

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
    <div className="flex h-screen bg-[#080818] text-[#e4e2e3] font-body-md overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#13131a] border-r border-white/10 flex flex-col shrink-0 z-20">
        <div className="h-[72px] flex items-center px-6 border-b border-white/10">
          <h2 className="text-[#e9c349] font-bold text-xl tracking-wider uppercase">Car CRM Admin</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 custom-scrollbar">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <LayoutDashboard size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Дашборд (Календар)</span>
          </Link>
          <Link href="/admin/fleet" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <Car size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Автопарк</span>
          </Link>
          <Link href="/admin/bookings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <CalendarDays size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Заявки</span>
          </Link>
          <Link href="/admin/invoices" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <TicketPercent size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Рахунки (Invoices)</span>
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <Users size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Клієнти / Водії</span>
          </Link>
          <Link href="/admin/pricing" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <TicketPercent size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Смарт-Прайсинг</span>
          </Link>
          <Link href="/admin/promotions" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <TicketPercent size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Знижки (Empty Legs)</span>
          </Link>
          <Link href="/admin/cms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <Settings size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">CMS Сайту</span>
          </Link>
          <Link href="/admin/gallery" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <Settings size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Галерея медіа</span>
          </Link>
          <Link href="/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#c7c6ca] hover:text-white transition-colors">
            <MessageSquare size={20} className="text-[#e9c349]" />
            <span className="font-semibold text-sm">Месенджер (Чат)</span>
          </Link>
          
          <hr className="border-white/10 my-2" />
          
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e9c349]/10 text-[#e9c349] transition-colors" target="_blank">
            <ExternalLink size={20} />
            <span className="font-semibold text-sm">Відкрити сайт ↗</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[72px] bg-[#13131a] border-b border-white/10 flex items-center justify-between px-8 shrink-0 z-10 shadow-md">
          <div className="font-display-lg text-2xl text-white tracking-wide">Панель Управління</div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e9c349]/20 flex items-center justify-center text-[#e9c349] font-bold border border-[#e9c349]/50 shadow-[0_0_10px_rgba(233,195,73,0.2)]">
              АД
            </div>
            <div className="hidden md:block text-sm">
              <div className="font-bold text-white">Адміністратор</div>
              <div className="text-[#8a8a93] text-xs">admin@firstline.com</div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar relative bg-[#080818]">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#e9c349]/5 to-transparent pointer-events-none z-0"></div>
          
          <div className="relative z-10 w-full mx-auto max-w-[1400px]">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
