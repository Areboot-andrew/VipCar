'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  CalendarDays,
  Car,
  CreditCard,
  ExternalLink,
  FilePenLine,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  TicketPercent,
  Users,
} from 'lucide-react';
import { withContentDefaults } from '@/lib/contentDefaults';

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ElementType;
  exact?: boolean;
};

function getNavGroups(c: Record<string, string>): { label: string; items: NavItem[] }[] {
  return [
  {
    label: c['admin_group_operations'],
    items: [
      { href: '/admin', label: c['admin_nav_dashboard'], description: c['admin_nav_dashboard_desc'], icon: LayoutDashboard, exact: true },
      { href: '/admin/bookings', label: c['admin_nav_bookings'], description: c['admin_nav_bookings_desc'], icon: CalendarDays },
      { href: '/admin/chat', label: c['admin_nav_chat'], description: c['admin_nav_chat_desc'], icon: MessageSquare },
    ],
  },
  {
    label: c['admin_group_fleet'],
    items: [
      { href: '/admin/fleet', label: c['admin_nav_fleet'], description: c['admin_nav_fleet_desc'], icon: Car },
      { href: '/admin/promotions', label: c['admin_nav_promotions'], description: c['admin_nav_promotions_desc'], icon: TicketPercent },
    ],
  },
  {
    label: c['admin_group_clients'],
    items: [
      { href: '/admin/users', label: c['admin_nav_users'], description: c['admin_nav_users_desc'], icon: Users },
      { href: '/admin/feedback', label: c['admin_nav_feedback'], description: c['admin_nav_feedback_desc'], icon: Inbox },
    ],
  },
  {
    label: c['admin_group_content'],
    items: [
      { href: '/admin/cms', label: c['admin_nav_cms'], description: c['admin_nav_cms_desc'], icon: FilePenLine },
    ],
  },
  {
    label: c['admin_group_finance'],
    items: [
      { href: '/admin/invoices', label: c['admin_nav_invoices'], description: c['admin_nav_invoices_desc'], icon: CreditCard },
    ],
  },
  {
    label: c['admin_group_system'],
    items: [
      { href: '/admin/settings', label: c['admin_nav_settings'], description: c['admin_nav_settings_desc'], icon: Settings },
    ],
  },
  ];
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [content, setContent] = useState<Record<string, string>>(withContentDefaults());
  const navGroups = useMemo(() => getNavGroups(content), [content]);

  useEffect(() => {
    fetch('/api/cms')
      .then((res) => res.json())
      .then((data) => setContent(withContentDefaults(data)))
      .catch(() => setContent(withContentDefaults()));
  }, []);

  return (
    <aside className="w-[304px] bg-[#13131a] border-r border-white/10 flex flex-col shrink-0 z-20">
      <div className="h-[72px] flex items-center px-6 border-b border-white/10">
        <div>
          <h2 className="text-[#e9c349] font-bold text-xl tracking-wider uppercase leading-none">{content['admin_brand_title']}</h2>
          <p className="m-0 mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8a8a93]">{content['admin_brand_subtitle']}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
        <div className="flex flex-col gap-5">
          {navGroups.map((group) => (
            <section key={group.label}>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6f78]">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        active
                          ? 'border-[#e9c349]/40 bg-[#e9c349]/12 text-white'
                          : 'border-transparent text-[#c7c6ca] hover:border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          active ? 'bg-[#e9c349] text-black' : 'bg-white/5 text-[#e9c349] group-hover:bg-[#e9c349]/10'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{item.label}</div>
                        <div className="truncate text-[11px] text-[#8a8a93]">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#e9c349] transition-colors hover:bg-[#e9c349]/10"
          target="_blank"
        >
          <ExternalLink size={18} />
          <span className="text-sm font-bold">{content['admin_open_site']}</span>
        </Link>
      </div>
    </aside>
  );
}
