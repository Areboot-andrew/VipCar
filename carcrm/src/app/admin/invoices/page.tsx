"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  amount: number;
  depositAmount?: number;
  paidAmount?: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  status: 'UNPAID' | 'PAID' | 'CANCELLED';
  createdAt: string;
  booking: {
    id: string;
    routeFrom: string;
    routeTo: string;
    client: {
      name: string;
      email: string;
    };
    car: {
      make: string;
      model: string;
    }
  }
};

import { PAY_METHODS as METHODS, money, paymentMethodLabel as methodLabel } from "@/lib/format";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodDrafts, setMethodDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const patchInvoice = async (id: string, payload: Record<string, unknown>) => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Управління Рахунками (Invoices)</h1>

      <div className="bg-[#1a1a1b] rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm text-[#c7c6ca]">
          <thead className="bg-white/5 text-white uppercase font-bold">
            <tr>
              <th className="p-4">Клієнт</th>
              <th className="p-4">Маршрут / Авто</th>
              <th className="p-4">Ціна / Завдаток</th>
              <th className="p-4">Оплата</th>
              <th className="p-4">Статус</th>
              <th className="p-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const method = methodDrafts[inv.id] || inv.paymentMethod || "CASH";
              const paid = Number(inv.paidAmount || 0);
              return (
              <tr key={inv.id} className="border-b border-white/5 align-top hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="text-white">{inv.booking.client.name}</div>
                  <div className="text-xs text-gray-500">{inv.booking.client.email}</div>
                </td>
                <td className="p-4">
                  <div className="text-white">{inv.booking.routeFrom} - {inv.booking.routeTo}</div>
                  <div className="text-xs text-gray-500">{inv.booking.car.make} {inv.booking.car.model}</div>
                </td>
                <td className="p-4">
                  <div className="text-white font-bold">{money(inv.amount)}</div>
                  <div className="text-xs text-gray-500">завдаток {money(inv.depositAmount)}</div>
                </td>
                <td className="p-4">
                  <div className={paid > 0 ? "text-green-400 font-bold" : "text-gray-400"}>{money(paid)}</div>
                  {paid > 0 && (
                    <div className="text-xs text-gray-500">
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("uk-UA") : ""}
                      {inv.paymentMethod ? ` • ${methodLabel(inv.paymentMethod)}` : ""}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    inv.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                    inv.status === 'UNPAID' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <select
                      className="bg-[#080818] border border-white/10 rounded px-2 py-1 text-xs text-white"
                      value={method}
                      onChange={(e) => setMethodDrafts((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                    >
                      {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => patchInvoice(inv.id, { paidAmount: inv.depositAmount || 0, paymentMethod: method, paidAt: new Date().toISOString() })}
                        className="rounded border border-[#e9c349]/40 px-2 py-1 text-xs font-bold text-[#e9c349] hover:bg-[#e9c349]/10"
                      >
                        Завдаток
                      </button>
                      <button
                        onClick={() => patchInvoice(inv.id, { status: 'PAID', paymentMethod: method })}
                        className="rounded border border-green-400/40 px-2 py-1 text-xs font-bold text-green-300 hover:bg-green-400/10"
                      >
                        Повна оплата
                      </button>
                      <button
                        onClick={() => patchInvoice(inv.id, { status: 'UNPAID' })}
                        className="rounded border border-white/15 px-2 py-1 text-xs font-bold text-gray-300 hover:bg-white/5"
                      >
                        Скинути
                      </button>
                    </div>
                    <Link href={`/invoice/${inv.id}`} target="_blank" className="text-[#e9c349] hover:underline text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">visibility</span> Переглянути
                    </Link>
                  </div>
                </td>
              </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">Немає рахунків</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
