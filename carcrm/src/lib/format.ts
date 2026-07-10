// Shared formatting helpers — the single source for labels/formats that used
// to be copy-pasted across admin pages, the driver cabinet and API routes.

export const money = (value?: number | null) =>
  `€${Math.round(Number(value || 0)).toLocaleString('uk-UA')}`;

export const km = (value?: number | null) => `${Number(value || 0).toFixed(0)} км`;

export const shortPlace = (value?: string | null) =>
  ((value || '').split(',')[0] || '').trim() || (value || '');

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Нова',
  CONFIRMED: 'Підтверджена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Скасована',
};

// Chip styling for the admin dark theme (badge with border)
export const BOOKING_STATUS_CLASS: Record<string, string> = {
  PENDING: 'border-white/10 bg-white/5 text-white',
  CONFIRMED: 'border-[#e9c349]/40 bg-[#e9c349]/15 text-[#e9c349]',
  COMPLETED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  CANCELLED: 'border-red-400/30 bg-red-400/10 text-red-300',
};

export const PAY_METHODS = [
  { value: 'CASH', label: 'Готівка' },
  { value: 'CARD', label: 'Карта' },
  { value: 'USDT', label: 'USDT' },
  { value: 'BANK', label: 'Банк. переказ' },
] as const;

export const paymentMethodLabel = (method?: string | null) => {
  const found = PAY_METHODS.find((item) => item.value === method);
  return found ? found.label : method || '';
};
