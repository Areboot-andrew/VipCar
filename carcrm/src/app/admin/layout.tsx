import AdminSidebar from './AdminSidebar';
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
    <div className="flex min-h-screen bg-[#080818] text-[#e4e2e3] font-body-md lg:h-screen lg:overflow-hidden">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        
        {/* Top Header */}
        <header className="min-h-[64px] bg-[#13131a] border-b border-white/10 flex items-center justify-between gap-3 px-4 pl-16 sm:px-5 lg:h-[72px] lg:px-8 lg:pl-8 shrink-0 z-10 shadow-md">
          <div className="min-w-0 truncate font-display-lg text-xl text-white tracking-wide md:text-2xl">Панель Управління</div>
          
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
        <div className="relative flex-1 overflow-y-auto bg-[#080818] p-3 custom-scrollbar sm:p-4 lg:p-5 xl:p-6">
          <div className="absolute top-0 left-0 w-full h-[360px] bg-gradient-to-b from-[#e9c349]/5 to-transparent pointer-events-none z-0"></div>
          
          <div className="relative z-10 w-full min-w-0">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
