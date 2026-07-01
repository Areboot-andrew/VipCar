"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  amount: number;
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
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
        <table className="w-full text-left text-sm text-[#c7c6ca]">
          <thead className="bg-white/5 text-white uppercase font-bold">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Клієнт</th>
              <th className="p-4">Маршрут / Авто</th>
              <th className="p-4">Сума</th>
              <th className="p-4">Статус</th>
              <th className="p-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-xs">{inv.id.slice(0,8)}</td>
                <td className="p-4">
                  <div className="text-white">{inv.booking.client.name}</div>
                  <div className="text-xs text-gray-500">{inv.booking.client.email}</div>
                </td>
                <td className="p-4">
                  <div className="text-white">{inv.booking.routeFrom} - {inv.booking.routeTo}</div>
                  <div className="text-xs text-gray-500">{inv.booking.car.make} {inv.booking.car.model}</div>
                </td>
                <td className="p-4 text-white font-bold">€{inv.amount}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    inv.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 
                    inv.status === 'UNPAID' ? 'bg-red-500/20 text-red-400' : 
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <Link href={`/invoice/${inv.id}`} target="_blank" className="text-[#e9c349] hover:underline text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span> Переглянути
                  </Link>
                  <select 
                    className="bg-[#080818] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    value={inv.status}
                    onChange={(e) => updateStatus(inv.id, e.target.value)}
                  >
                    <option value="UNPAID">Не оплачено</option>
                    <option value="PAID">Оплачено</option>
                    <option value="CANCELLED">Скасовано</option>
                  </select>
                </td>
              </tr>
            ))}
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
