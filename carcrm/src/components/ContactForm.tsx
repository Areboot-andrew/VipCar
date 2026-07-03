'use client';

import { useState } from 'react';
import { withContentDefaults } from '../lib/contentDefaults';

export default function ContactForm({ cmsSettings = {} }: { cmsSettings?: Record<string, string> }) {
  const c = withContentDefaults(cmsSettings);
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
        <h2 className="font-headline-lg text-[48px] text-[#e4e2e3] mb-4 text-center">{c['contact_section_title']}</h2>
        <p className="font-body-md text-[#c7c6ca] mb-10 text-center max-w-xl mx-auto">
          {c['contact_section_subtitle']}
        </p>

        {success ? (
          <div className="text-center py-10 bg-[#e9c349]/10 rounded-xl border border-[#e9c349]/20">
            <span className="material-symbols-outlined text-[#e9c349] text-6xl mb-4">check_circle</span>
            <h3 className="text-2xl font-headline-md text-white mb-2">{c['contact_success_title']}</h3>
            <p className="text-[#c7c6ca]">{c['contact_success_message']}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">{c['contact_name_label']}</label>
                <input required type="text" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                  placeholder={c['contact_name_placeholder']} value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">{c['contact_phone_label']}</label>
                <input required type="tel" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                  placeholder={c['contact_phone_placeholder']} value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">{c['contact_email_label']}</label>
              <input required type="email" className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors"
                placeholder={c['contact_email_placeholder']} value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-[#c7c6ca] mb-1 uppercase tracking-widest font-bold">{c['contact_message_label']}</label>
              <textarea required rows={3} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-[#e9c349] outline-none transition-colors resize-none"
                placeholder={c['contact_message_placeholder']} value={data.message} onChange={e => setData({...data, message: e.target.value})} />
            </div>
            <div className="pt-4 text-center">
              <button type="submit" disabled={isSubmitting} className="gold-button font-bold px-10 py-4 rounded-lg">
                {isSubmitting ? c['contact_submitting'] : c['contact_submit']}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
