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
    <div className="flex h-screen bg-[#080818] text-[#e4e2e3] font-body-md overflow-hidden">
      <AdminSidebar />

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
