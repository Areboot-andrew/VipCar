"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import NavAuth from './NavAuth';

export default function MobileMenu({ c }: { c: Record<string, string> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      <button onClick={() => setIsOpen(true)} className="text-[#c7c6ca] hover:text-[#e4e2e3]">
        <span className="material-symbols-outlined text-3xl">menu</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#080818]/95 z-[60] flex flex-col p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-12">
            <img src="/logo.png" alt="Logo" className="h-[40px] object-contain" />
            <button onClick={() => setIsOpen(false)} className="text-[#c7c6ca] hover:text-[#e4e2e3]">
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-8 text-center text-xl font-headline-md tracking-wider">
            <Link href="#services" onClick={() => setIsOpen(false)} className="text-[#c7c6ca] hover:text-white uppercase">{c['menu_services'] || 'Послуги'}</Link>
            <Link href="#fleet" onClick={() => setIsOpen(false)} className="text-[#c7c6ca] hover:text-white uppercase">{c['menu_fleet'] || 'Автопарк'}</Link>
            <Link href="#gallery" onClick={() => setIsOpen(false)} className="text-[#c7c6ca] hover:text-white uppercase">{c['menu_gallery'] || 'Галерея'}</Link>
            <Link href="#contact" onClick={() => setIsOpen(false)} className="text-[#c7c6ca] hover:text-white uppercase">{c['menu_contact'] || 'Контакти'}</Link>
            <div className="pt-8 border-t border-white/10 flex justify-center">
              <NavAuth loginText={c['menu_login'] || 'Увійти'} />
            </div>
            <Link href="#calculator" onClick={() => setIsOpen(false)} className="gold-button w-full mt-4 py-4 rounded-xl font-bold uppercase tracking-widest text-[14px]">
              {c['btn_book_now'] || 'Бронювати'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
