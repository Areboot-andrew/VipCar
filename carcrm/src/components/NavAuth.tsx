"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type NavAuthProps = {
  loginText: string;
  driverCabinetText: string;
  profileText: string;
  logoutText: string;
};

export default function NavAuth({ loginText, driverCabinetText, profileText, logoutText }: NavAuthProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-gray-400 text-sm">...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.role === "DRIVER" ? (
          <Link href="/driver" className="text-[#c7c6ca] hover:text-[#e9c349] font-label-caps text-[12px] uppercase transition-colors">
            {driverCabinetText}
          </Link>
        ) : (
          <Link href="/profile" className="text-[#c7c6ca] hover:text-[#e4e2e3] font-label-caps text-[12px] uppercase transition-colors">
            {session.user?.name || profileText}
          </Link>
        )}
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-gray-500 hover:text-red-400 font-label-caps text-[12px] uppercase transition-colors"
        >
          {logoutText}
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
