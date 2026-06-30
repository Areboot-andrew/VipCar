'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [data, setData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSuccess(true);
        setData({ name: '', phone: '', email: '', message: '' });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="max-w-[1280px] mx-auto px-6 md:px-[64px] mb-[80px]" id="contact">
      <div className="glass-panel p-8 md:p-16 rounded-2xl max-w-4xl mx-auto">
        <h2 className="font-headline-lg text-[48px] text-[#e4e2e3] mb-4 text-center">Зв'яжіться з нами</h2>
        <p className="font-body-md text-[#c7c6ca] mb-10 text-center max-w-xl mx-auto">
          Залиште свої контакти, і ми зв'яжемося з вами найближчим часом. Ви також можете задати будь-яке запитання.
        </p>

        {success ? (
          <div className="text-center py-10 bg-[#e9c349]/10 rounded-xl border border-[#e9c349]/20">
            <span className="material-symbols-outlined text-[#e9c349] text-6xl mb-4">check_circle</span>
            <h3 className="text-2xl font-headline-md text-white mb-2">Дякуємо за звернення!</h3>
            <p className="text-[#c7c6ca]">Ваше повідомлення відправлено. Ми скоро з вами зв'яжемося.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">Ім'я *</label>
                <input required type="text" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                  placeholder="Ваше ім'я" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">Телефон *</label>
                <input required type="tel" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                  placeholder="+380..." value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">Email *</label>
              <input required type="email" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                placeholder="Ваш email" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">Повідомлення *</label>
              <textarea required rows={3} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors resize-none"
                placeholder="Ваше питання..." value={data.message} onChange={e => setData({...data, message: e.target.value})} />
            </div>
            <div className="pt-4 text-center">
              <button type="submit" disabled={isSubmitting} className="gold-button font-bold px-10 py-4 rounded-lg">
                {isSubmitting ? 'Відправка...' : 'Відправити запит'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
