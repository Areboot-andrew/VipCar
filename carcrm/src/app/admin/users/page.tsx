"use client";

import { useEffect, useState } from "react";
import { BadgePercent, KeyRound, Save, ShieldCheck, UserCog } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  personalDiscountPercent?: number;
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

type DriverDraft = {
  salaryPerKm: string;
  salaryPerHour: string;
  dailyAllowance: string;
  overnightAllowance: string;
  telegramId: string;
  licenseNum: string;
  status: string;
};

const defaultDriverDraft = (driver?: User["driver"] | null): DriverDraft => ({
  salaryPerKm: String(driver?.salaryPerKm ?? 0.15),
  salaryPerHour: String(driver?.salaryPerHour ?? 12),
  dailyAllowance: String(driver?.dailyAllowance ?? 0),
  overnightAllowance: String(driver?.overnightAllowance ?? 90),
  telegramId: driver?.telegramId || "",
  licenseNum: driver?.licenseNum || "NEW_DRIVER",
  status: driver?.status || "ACTIVE",
});

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [driverDrafts, setDriverDrafts] = useState<Record<string, DriverDraft>>({});
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
          acc[user.id] = defaultDriverDraft(user.driver);
          return acc;
        }, {} as Record<string, DriverDraft>);
        setDriverDrafts(drafts);
        setDiscountDrafts(data.reduce((acc, user) => {
          acc[user.id] = String(user.personalDiscountPercent ?? 0);
          return acc;
        }, {} as Record<string, string>));
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

  const handleDiscountSave = async (userId: string) => {
    setNotice("");
    const res = await fetch(`/api/users/${userId}/discount`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalDiscountPercent: Number(discountDrafts[userId] || 0) }),
    });
    if (res.ok) {
      setNotice("Персональну знижку оновлено.");
      fetchUsers();
    } else {
      setNotice("Не вдалося оновити знижку.");
    }
  };

  const updateDriverDraft = (userId: string, key: keyof DriverDraft, value: string) => {
    setDriverDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || defaultDriverDraft()),
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

  const driverInputClass = "h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60";
  const driverHintClass = "mt-1 text-[11px] leading-4 text-[#6f6f78]";
  const roleSelectClass = "h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60";

  const renderRoleControl = (user: User) => (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
        <ShieldCheck size={14} /> Роль
      </span>
      <select className={roleSelectClass} value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
        <option value="CLIENT">Клієнт</option>
        <option value="DRIVER">Водій</option>
        <option value="ADMIN">Адміністратор</option>
      </select>
    </label>
  );

  const renderPasswordControl = (user: User) => (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
        <KeyRound size={14} /> Новий пароль
      </span>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[176px_auto]">
        <input
          type="password"
          value={passwordDrafts[user.id] || ""}
          onChange={(event) => setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
          placeholder="мін. 6 символів"
        />
        <button
          type="button"
          onClick={() => handlePasswordSave(user.id)}
          disabled={!passwordDrafts[user.id]}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-3 text-sm font-bold text-black disabled:opacity-50"
        >
          <Save size={14} /> Зберегти
        </button>
      </div>
    </label>
  );

  const renderDiscountControl = (user: User) => (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8a8a93]">
        <BadgePercent size={14} /> Персон. знижка, %
      </span>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[120px_auto]">
        <input
          type="number"
          min="0"
          max="90"
          value={discountDrafts[user.id] ?? "0"}
          onChange={(event) => setDiscountDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#080818] px-3 text-white outline-none focus:border-[#e9c349]/60"
          placeholder="0"
        />
        <button
          type="button"
          onClick={() => handleDiscountSave(user.id)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e9c349] px-3 text-sm font-bold text-black"
        >
          <Save size={14} /> Зберегти
        </button>
      </div>
      <span className="mt-1 block text-[11px] leading-4 text-[#6f6f78]">Коли клієнт залогінений — на сайті бачить «вашу ціну» з цією знижкою.</span>
    </label>
  );

  const renderDriverControl = (user: User) => {
    if (user.role !== "DRIVER") return <span className="text-[#8a8a93]">Не водій</span>;

    const driverDraft = driverDrafts[user.id] || defaultDriverDraft(user.driver);

    return (
      <div className="grid gap-3">
        <div className="rounded-lg border border-[#e9c349]/20 bg-[#e9c349]/10 p-3 text-xs leading-5 text-[#c7c6ca]">
          Дані водія впливають на собівартість рейсу: ставка за км, ставка за години роботи, добові та нічліг потрапляють у фінансовий розрахунок і прибуток.
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Посвідчення / ID</span>
            <input value={driverDraft.licenseNum} onChange={(event) => updateDriverDraft(user.id, "licenseNum", event.target.value)} className={driverInputClass} placeholder="Ліцензія" />
            <span className={driverHintClass}>Внутрішній номер або дані посвідчення водія.</span>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">ЗП €/км</span>
            <input type="number" step="0.01" value={driverDraft.salaryPerKm} onChange={(event) => updateDriverDraft(user.id, "salaryPerKm", event.target.value)} className={driverInputClass} placeholder="EUR/км" />
            <span className={driverHintClass}>Оплата водію за кожен км повного пробігу рейсу.</span>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">ЗП €/год</span>
            <input type="number" step="0.01" value={driverDraft.salaryPerHour} onChange={(event) => updateDriverDraft(user.id, "salaryPerHour", event.target.value)} className={driverInputClass} placeholder="EUR/год" />
            <span className={driverHintClass}>Оплата за час у дорозі, очікування, митницю і робочий час.</span>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Нічліг €</span>
            <input type="number" step="0.01" value={driverDraft.overnightAllowance} onChange={(event) => updateDriverDraft(user.id, "overnightAllowance", event.target.value)} className={driverInputClass} placeholder="Нічліг EUR" />
            <span className={driverHintClass}>Витрата на готель, якщо рейс довший за глобальний ліміт годин.</span>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Добові €</span>
            <input type="number" step="0.01" value={driverDraft.dailyAllowance} onChange={(event) => updateDriverDraft(user.id, "dailyAllowance", event.target.value)} className={driverInputClass} placeholder="Добові EUR" />
            <span className={driverHintClass}>Денна компенсація водію для майбутніх розширених розрахунків.</span>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8a93]">Telegram чат водія</span>
            <select className={driverInputClass} value={driverDraft.telegramId} onChange={(event) => updateDriverDraft(user.id, "telegramId", event.target.value)}>
              <option value="">Telegram не прив'язано</option>
              {chats.map((chat) => (
                <option key={chat.id} value={chat.externalId || ""}>
                  {chat.clientName || chat.externalId}
                </option>
              ))}
            </select>
            <span className={driverHintClass}>Куди CRM надсилатиме рейси, нотатки і зміни для цього водія.</span>
          </label>
          <button
            type="button"
            onClick={() => handleDriverSave(user.id)}
            className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg border border-[#e9c349]/40 px-3 text-sm font-bold text-[#e9c349] hover:bg-[#e9c349]/10"
          >
            <Save size={14} /> Зберегти
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="text-[#e4e2e3]">
      <div className="mb-6 flex items-start gap-3 border-b border-white/10 pb-6">
        <UserCog size={30} className="text-[#e9c349]" />
        <div>
          <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Користувачі, ролі і доступи</h1>
          <p className="m-0 mt-1 text-sm text-[#8a8a93]">Паролі, ролі, водійські ставки і прив'язка Telegram в одному місці.</p>
        </div>
      </div>

      {notice && <div className="mb-5 rounded-lg border border-[#e9c349]/30 bg-[#e9c349]/10 px-4 py-3 text-sm text-[#e9c349]">{notice}</div>}

      <div className="grid gap-4 xl:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-xl border border-white/10 bg-[#13131a] p-4">
            <div className="mb-4 flex flex-col gap-1 border-b border-white/10 pb-4">
              <div className="font-bold text-white">{user.name}</div>
              <div className="text-xs text-[#8a8a93]">ID: {user.id.slice(0, 8)}</div>
              <div className="mt-2 text-sm text-[#c7c6ca]">{user.email}</div>
              <div className="text-sm text-[#8a8a93]">{user.phone || "Телефон не вказано"}</div>
            </div>
            <div className="grid gap-5">
              {renderRoleControl(user)}
              {renderPasswordControl(user)}
              {renderDiscountControl(user)}
              {renderDriverControl(user)}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-[#13131a] xl:block">
        <table className="w-full min-w-[1480px] text-left text-sm text-[#c7c6ca]">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-widest text-white">
            <tr>
              <th className="p-4">Користувач</th>
              <th className="p-4">Контакти</th>
              <th className="p-4">Роль</th>
              <th className="p-4">Пароль</th>
              <th className="p-4">Знижка</th>
              <th className="p-4">Водій</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
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
                    {renderRoleControl(user)}
                  </td>
                  <td className="p-4">
                    {renderPasswordControl(user)}
                  </td>
                  <td className="p-4">
                    {renderDiscountControl(user)}
                  </td>
                  <td className="p-4">
                    {renderDriverControl(user)}
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
