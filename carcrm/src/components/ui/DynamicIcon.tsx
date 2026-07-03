import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';

const iconAliases: Record<string, string> = {
  add: 'Plus',
  arrow_forward: 'ArrowRight',
  badge_check: 'BadgeCheck',
  calendar_month: 'CalendarDays',
  call: 'Phone',
  cancel: 'CircleX',
  chat: 'MessageCircle',
  check: 'Check',
  check_circle: 'CircleCheck',
  close: 'X',
  diamond: 'Gem',
  directions_car: 'Car',
  forum: 'MessageSquare',
  location_on: 'MapPin',
  mail: 'Mail',
  menu: 'Menu',
  my_location: 'LocateFixed',
  person: 'User',
  play_circle: 'CirclePlay',
  receipt: 'Receipt',
  route: 'Route',
  schedule: 'Clock',
  send: 'Send',
  star: 'Star',
  sync: 'RefreshCw',
  verified_user: 'ShieldCheck',
  visibility: 'Eye',
  workspace_premium: 'Award',
};

function normalizeIconName(name?: string | null) {
  if (!name) return 'Sparkles';
  if (iconAliases[name]) return iconAliases[name];
  if (name.includes('-') || name.includes('_')) {
    return name
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  return name;
}

export default function DynamicIcon({ name, ...props }: LucideProps & { name?: string | null }) {
  const normalizedName = normalizeIconName(name);
  const Icon = (Icons as unknown as Record<string, ComponentType<LucideProps>>)[normalizedName] || Icons.Sparkles;

  return <Icon {...props} />;
}
