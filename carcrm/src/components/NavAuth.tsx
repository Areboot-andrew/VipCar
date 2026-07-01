"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuth({ loginText = "Увійти" }: { loginText?: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-gray-400 text-sm">...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.role === "DRIVER" ? (
          <Link href="/driver" className="text-[#c7c6ca] hover:text-[#e9c349] font-label-caps text-[12px] uppercase transition-colors">
            Кабінет Водія
          </Link>
        ) : (
          <Link href="/profile" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">
            {session.user?.name || "Профіль"}
          </Link>
        )}
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-gray-500 hover:text-red-400 font-label-caps text-[12px] uppercase transition-colors"
        >
          Вийти
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase">
      {loginText}
    </Link>
  );
}
