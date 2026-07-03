'use client';

import { useEffect, useState } from 'react';
import { Inbox, Mail, MessageSquare, Phone } from 'lucide-react';

type FeedbackMessage = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: 'NEW' | 'READ' | string;
  createdAt: string;
};

export default function FeedbackPage() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feedback')
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Завантаження повідомлень...</div>;
  }

  return (
    <div className="min-h-screen bg-[#080818] p-4 text-[#e4e2e3] md:p-8">
      <div className="mb-6 flex items-start gap-3 border-b border-white/10 pb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e9c349]/10 text-[#e9c349]">
          <Inbox size={22} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-bold text-white md:text-3xl">Зворотний звʼязок</h1>
          <p className="m-0 mt-1 max-w-3xl text-sm leading-6 text-[#8a8a93]">
            Запити з форми сайту: хто написав, коли, що просить і яким каналом краще відповісти.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {messages.map((message) => {
          const isNew = message.status === 'NEW';

          return (
            <article key={message.id} className="rounded-xl border border-white/10 bg-[#13131a] p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="m-0 flex items-center gap-2 text-lg font-bold text-white">
                    <MessageSquare size={18} className="text-[#e9c349]" />
                    {message.name}
                  </h2>
                  <p className="m-0 mt-1 text-xs text-[#8a8a93]">{new Date(message.createdAt).toLocaleString('uk-UA')}</p>
                </div>
                <div className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${isNew ? 'bg-[#e9c349]/15 text-[#e9c349]' : 'bg-white/10 text-[#c7c6ca]'}`}>
                  {isNew ? 'Нове' : 'Опрацьовано'}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#080818] p-4 text-sm leading-6 text-[#e4e2e3]">
                {message.message}
              </div>

              <div className="mt-4 flex flex-col gap-3 text-sm text-[#c7c6ca] sm:flex-row sm:flex-wrap">
                <a href={`tel:${message.phone}`} className="inline-flex items-center gap-2 text-[#e9c349] hover:text-white">
                  <Phone size={15} /> {message.phone}
                </a>
                {message.email && (
                  <a href={`mailto:${message.email}`} className="inline-flex items-center gap-2 text-[#e9c349] hover:text-white">
                    <Mail size={15} /> {message.email}
                  </a>
                )}
              </div>
            </article>
          );
        })}

        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#13131a] p-8 text-center text-sm text-[#8a8a93]">
            <Inbox className="mx-auto mb-3 text-[#e9c349]" />
            Немає жодного повідомлення.
          </div>
        )}
      </div>
    </div>
  );
}
