"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  driver?: {
    salaryRate: number;
  };
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Управління Користувачами та Ролями</h1>

      <div className="bg-[#1a1a1b] rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-sm text-[#c7c6ca]">
          <thead className="bg-white/5 text-white uppercase font-bold">
            <tr>
              <th className="p-4">Ім'я</th>
              <th className="p-4">Email</th>
              <th className="p-4">Телефон</th>
              <th className="p-4">Роль</th>
              <th className="p-4">Деталі (Для Водіїв)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.phone || "—"}</td>
                <td className="p-4">
                  <select
                    className="bg-[#080818] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#e9c349]"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="CLIENT">Клієнт</option>
                    <option value="DRIVER">Водій</option>
                    <option value="ADMIN">Адміністратор</option>
                  </select>
                </td>
                <td className="p-4 text-xs">
                  {u.role === "DRIVER" && u.driver ? (
                    <div className="text-green-400">Ставка: €{u.driver.salaryRate}/день</div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
