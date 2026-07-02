'use client';

import React, { useEffect, useState, useRef } from 'react';

type Message = {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
};

type ChatRoom = {
  id: string;
  platform: string;
  externalId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  updatedAt: string;
  messages: Message[];
};

export default function AdminChatPage() {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setChats(data);
      if (loading) setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000); // Polling every 3s
    return () => clearInterval(interval);
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;

    const tempMsg = inputMessage;
    setInputMessage('');

    // Optimistic update
    const newMsg: Message = {
      id: Math.random().toString(),
      content: tempMsg,
      isFromAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [...c.messages, newMsg], updatedAt: new Date().toISOString() };
      }
      return c;
    }));

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatRoomId: activeChatId, content: tempMsg })
    });
    
    fetchChats();
  };

  if (loading) return <div className="admin-page-container">Завантаження чатів...</div>;

  return (
    <div className="admin-page-container" style={{ padding: 0, height: 'calc(100vh - 80px)', display: 'flex', overflow: 'hidden' }}>
      
      {/* Sidebar - Chat List */}
      <div style={{ width: '350px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>Повідомлення</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Немає активних чатів</div>
          ) : (
            chats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    backgroundColor: activeChatId === chat.id ? 'rgba(233, 195, 73, 0.1)' : 'transparent',
                    borderLeft: activeChatId === chat.id ? '4px solid var(--accent-gold)' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'white' }}>{chat.clientName || chat.clientPhone || 'Невідомий клієнт'}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: '#13131a', padding: '2px 6px', borderRadius: '4px' }}>
                      {chat.platform}
                    </span>
                  </div>
                  {lastMsg && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastMsg.isFromAdmin ? 'Ви: ' : ''}{lastMsg.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#080812' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
              <h3 style={{ margin: 0, color: 'white' }}>{activeChat.clientName || activeChat.clientPhone || 'Клієнт'}</h3>
              <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>Через {activeChat.platform}</span>
            </div>

            {/* Messages container */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeChat.messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Немає повідомлень. Напишіть першим!</div>
              ) : (
                activeChat.messages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      alignSelf: msg.isFromAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      backgroundColor: msg.isFromAdmin ? 'var(--accent-gold)' : '#1e1e2d',
                      color: msg.isFromAdmin ? '#000' : 'white',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderBottomRightRadius: msg.isFromAdmin ? '0' : '12px',
                      borderBottomLeftRadius: msg.isFromAdmin ? '12px' : '0',
                    }}
                  >
                    <div style={{ lineHeight: '1.4' }}>{msg.content}</div>
                    <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right', opacity: 0.7 }}>
                      {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Введіть повідомлення..." 
                  style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#13131a', color: 'white' }}
                />
                <button type="submit" style={{ padding: '0 32px', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Надіслати
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>
            Оберіть чат зліва, щоб розпочати спілкування
          </div>
        )}
      </div>

    </div>
  );
}
