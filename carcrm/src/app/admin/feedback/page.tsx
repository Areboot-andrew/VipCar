'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Check, Mail } from 'lucide-react';

export default function FeedbackPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feedback')
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="admin-page-container"><p>Завантаження повідомлень...</p></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Повідомлення клієнтів</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Запити з форми зворотнього зв'язку (дублюються в Telegram).</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {messages.map(msg => (
          <div key={msg.id} className="glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--accent-gold)" />
                  {msg.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  {new Date(msg.createdAt).toLocaleString('uk-UA')}
                </p>
              </div>
              <div style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                backgroundColor: msg.status === 'NEW' ? 'rgba(233, 195, 73, 0.2)' : 'rgba(255,255,255,0.1)',
                color: msg.status === 'NEW' ? '#e9c349' : '#fff'
              }}>
                {msg.status === 'NEW' ? 'Нове' : 'Прочитано'}
              </div>
            </div>
            
            <div style={{ fontSize: '14px', marginBottom: '16px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: '#e4e2e3' }}>
              {msg.message}
            </div>

            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span><strong>Телефон:</strong> <a href={`tel:${msg.phone}`} style={{ color: 'var(--accent-gold)' }}>{msg.phone}</a></span>
              {msg.email && <span><strong>Email:</strong> <a href={`mailto:${msg.email}`} style={{ color: 'var(--accent-gold)' }}>{msg.email}</a></span>}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p>Немає жодного повідомлення.</p>}
      </div>
    </div>
  );
}
