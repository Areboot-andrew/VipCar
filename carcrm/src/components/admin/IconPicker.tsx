'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import DynamicIcon from '@/components/ui/DynamicIcon';

const PRESET_ICONS = [
  'Car',
  'CarFront',
  'CarTaxiFront',
  'Bus',
  'Route',
  'MapPin',
  'Navigation',
  'Clock',
  'CalendarDays',
  'Users',
  'User',
  'Baby',
  'Dog',
  'Briefcase',
  'Luggage',
  'ShieldCheck',
  'BadgeCheck',
  'Award',
  'Gem',
  'Sparkles',
  'Star',
  'Crown',
  'Wifi',
  'Snowflake',
  'Armchair',
  'Music',
  'Coffee',
  'BatteryCharging',
  'Fuel',
  'PlugZap',
  'Gauge',
  'Wrench',
  'Settings',
  'CreditCard',
  'Receipt',
  'Banknote',
  'MessageSquare',
  'MessageCircle',
  'Send',
  'Phone',
  'Mail',
  'Globe',
  'Languages',
  'Eye',
  'Camera',
  'Video',
  'Image',
  'CircleCheck',
  'CircleX',
  'AlertCircle',
  'Info',
];

type IconPickerProps = {
  value?: string;
  onChange: (value: string) => void;
};

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(
    () => PRESET_ICONS.filter((iconName) => iconName.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-[#080818] px-3 text-left text-sm text-white outline-none transition-colors hover:border-[#e9c349]/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e9c349]/10 text-[#e9c349]">
            <DynamicIcon name={value || 'Sparkles'} size={17} />
          </span>
          <span className={value ? 'truncate text-white' : 'truncate text-[#8a8a93]'}>
            {value || 'Оберіть іконку'}
          </span>
        </span>
        <ChevronDown size={16} className="text-[#8a8a93]" />
      </button>

      {isOpen && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" type="button" onClick={() => setIsOpen(false)} aria-label="Закрити вибір іконки" />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#13131a] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 p-3">
              <Search size={16} className="text-[#8a8a93]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Пошук англійською..."
                className="h-9 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6f6f78]"
              />
            </div>
            <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto p-3 custom-scrollbar">
              {filteredIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex h-10 items-center justify-center rounded-lg transition-colors ${
                    value === iconName
                      ? 'bg-[#e9c349] text-black'
                      : 'text-[#c7c6ca] hover:bg-white/5 hover:text-[#e9c349]'
                  }`}
                >
                  <DynamicIcon name={iconName} size={19} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
