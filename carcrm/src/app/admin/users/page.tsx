"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck, UserCog } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  driver?: {
    licenseNum: string;
    salaryPerKm: number;
    salaryPerHour: number;
    dailyAllowance: number;
    overnightAllowance: number;
    telegramId?: string | null;
    status?: string;
  } | null;
};

type ChatRoom = {
  id: string;
  platform: string;
  externalId: string | null;
  clientName: string | null;
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [driverDrafts, setDriverDrafts] = useState<Record<string, { salaryPerKm: string; salaryPerHour: string; dailyAllowance: string; overnightAllowance: string; telegramId: string; licenseNum: string; status: string }>>({});
  const [notice, setNotice] = useState("");

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setChats(data.filter((chat: ChatRoom) => chat.platform === "TELEGRAM"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = (await res.json()) as User[];
        setUsers(data);
        const drafts = data.reduce((acc, user) => {
          acc[user.id] = {
            salaryPerKm: String(user.driver?.salaryPerKm ?? 0.15),
            salaryPerHour: String(user.driver?.salaryPerHour ?? 12),
            dailyAllowance: String(user.driver?.dailyAllowance ?? 0),
            overnightAllowance: String(user.driver?.overnightAllowance ?? 90),
            telegramId: user.driver?.telegramId || "",
            licenseNum: user.driver?.licenseNum || "NEW_DRIVER",
            status: user.driver?.status || "ACTIVE",
          };
          return acc;
        }, {} as Record<string, { salaryPerKm: string; salaryPerHour: string; dailyAllowance: string; overnightAllowance: string; telegramId: string; licenseNum: string; status: string }>);
        setDriverDrafts(drafts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchChats();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setNotice("");
    await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setNotice("Роль оновлено.");
    fetchUsers();
  };

  const handlePasswordSave = async (userId: string) => {
    const password = passwordDrafts[userId] || "";
    setNotice("");

    const res = await fetch(`/api/users/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setPasswordDrafts((prev) => ({ ...prev, [userId]: "" }));
      setNotice("Пароль оновлено.");
    } else {
      setNotice("Пароль має бути мінімум 6 символів.");
    }
  };

  const updateDriverDraft = (userId: string, key: "salaryPerKm" | "salaryPerHour" | "dailyAllowance" | "overnightAllowance" | "telegramId" | "licenseNum" | "status", value: string) => {
    setDriverDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { salaryPerKm: "0.15", salaryPerHour: "12", dailyAllowance: "0", overnightAllowance: "90", telegramId: "", licenseNum: "NEW_DRIVER", status: "ACTIVE" }),
        [key]: value,
      },
    }));
  };

  const handleDriverSave = async (userId: string) => {
    const draft = driverDrafts[userId];
    setNotice("");

    await fetch(`/api/users/${userId}/driver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salaryPerKm: Number(draft?.salaryPerKm || 0),
        salaryPerHour: Number(draft?.salaryPerHour || 0),
        dailyAllowance: Number(draft?.dailyAllowance || 0),
        overnightAllowance: Number(draft?.overnightAllowance || 0),
        telegramId: draft?.telegramId || "",
        licenseNum: draft?.licenseNum || "NEW_DRIVER",
        status: draft?.status || "ACTIVE",
      }),
    });

    setNotice("Дані водія оновлено.");
    fetchUsers();
  };

  if (loading) return <div className="p-8 text-white">Завантаження...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <UserCog size={30} className="text-[#e9c349]" />
        <div>
          <h1 className="m-0 text-3xl font-bold text-white">Користувачі, ролі і доступи</h1>
          <p className="m-0 mt-1 text-sm text-[#8a8a93]">Паролі, ролі, водійські ставки і прив'язка Telegram в одному місці.</p>
        </div>
      </div>

      {notice && <div className="mb-5 rounded-lg border border-[#e9c349]/30 bg-[#e9c349]/10 px-4 py-3 text-sm text-[#e9c349]">{notice}</div>}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#13131a]">
        <table className="w-full min-w-[1100px] text-left text-sm text-[#c7c6ca]">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-widest text-white">
            <tr>
              <th className="p-4">Користувач</th>
              <th className="p-4">Контакти</th>
              <th className="p-4">Роль</th>
              <th className="p-4">Пароль</th>
              <th className="p-4">Водій</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const driverDraft = driverDrafts[user.id] || { salaryPerKm: "0.15", salaryPerHour: "12", dailyAllowance: "0", overnightAllowance: "90", telegramId: "", licenseNum: "NEW_DRIVER", status: "ACTIVE" };
              return (
                <tr key={user.id} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                  <td className="p-4">
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="mt-1 text-xs text-[#8a8a93]">ID: {user.id.slice(0, 8)}</div>
                  </td>
                  <td className="p-4">
                    <div>{user.email}</div>
                    <div className="mt-1 text-[#8a8a93]">{user.phone || "Телефон не вказано"}</div>
                  </td>
                  <td className="p-4">
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                      <ShieldCheck size={14} /> Роль
                    </label>
                    <select
                      className="h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    >
                      <option value="CLIENT">Клієнт</option>
                      <option value="DRIVER">Водій</option>
                      <option value="ADMIN">Адміністратор</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
                      <KeyRound size={14} /> Новий пароль
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={passwordDrafts[user.id] || ""}
                        onChange={(event) => setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))}
                        className="h-10 w-44 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                        placeholder="мін. 6 символів"
                      />
                      <button
                        onClick={() => handlePasswordSave(user.id)}
                        disabled={!passwordDrafts[user.id]}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#e9c349] px-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        <Save size={14} /> Зберегти
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.role === "DRIVER" ? (
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={driverDraft.licenseNum}
                            onChange={(event) => updateDriverDraft(user.id, "licenseNum", event.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            placeholder="Ліцензія"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={driverDraft.salaryPerKm}
                            onChange={(event) => updateDriverDraft(user.id, "salaryPerKm", event.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            placeholder="EUR/км"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={driverDraft.salaryPerHour}
                            onChange={(event) => updateDriverDraft(user.id, "salaryPerHour", event.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            placeholder="EUR/год"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={driverDraft.overnightAllowance}
                            onChange={(event) => updateDriverDraft(user.id, "overnightAllowance", event.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            placeholder="Нічліг EUR"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={driverDraft.dailyAllowance}
                            onChange={(event) => updateDriverDraft(user.id, "dailyAllowance", event.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            placeholder="Добові EUR"
                          />
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <select
                            className="h-10 rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
                            value={driverDraft.telegramId}
                            onChange={(event) => updateDriverDraft(user.id, "telegramId", event.target.value)}
                          >
                            <option value="">Telegram не прив'язано</option>
                            {chats.map((chat) => (
                              <option key={chat.id} value={chat.externalId || ""}>
                                {chat.clientName || chat.externalId}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDriverSave(user.id)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e9c349]/40 px-3 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/10"
                          >
                            <Save size={14} /> Водій
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#8a8a93]">Не водій</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
