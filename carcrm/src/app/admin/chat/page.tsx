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

  if (loading) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#e9c349] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-96px)] min-h-[640px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#080818] shadow-2xl lg:h-[calc(100vh-120px)] lg:min-h-0 lg:flex-row">
      
      {/* Sidebar - Chat List */}
      <div className="flex max-h-[38vh] w-full flex-col border-b border-white/5 bg-[#13131a]/50 backdrop-blur-sm lg:max-h-none lg:w-[340px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-white/5 p-4 lg:p-5">
          <h2 className="m-0 text-white text-xl font-bold font-headline-md tracking-wider">Повідомлення</h2>
          <div className="bg-[#e9c349]/20 text-[#e9c349] text-xs font-bold px-2 py-1 rounded-full">{chats.length}</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {chats.length === 0 ? (
            <div className="p-6 text-[#8a8a93] text-center mt-10">Немає активних чатів</div>
          ) : (
            chats.map(chat => {
              const lastMessage = chat.messages[chat.messages.length - 1];
              const isSelected = activeChatId === chat.id;
              
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-[#e9c349]/10 border-[#e9c349]/30 shadow-[0_4px_20px_rgba(233,195,73,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        chat.platform === 'TELEGRAM' ? 'bg-[#2AABEE]/20 text-[#2AABEE]' : 
                        chat.platform === 'MESSENGER' ? 'bg-[#00B2FF]/20 text-[#00B2FF]' : 'bg-white/10 text-white'
                      }`}>
                        <span className="material-symbols-outlined text-lg">
                          {chat.platform === 'TELEGRAM' ? 'send' : chat.platform === 'MESSENGER' ? 'forum' : 'chat'}
                        </span>
                      </div>
                      <div>
                        <strong className={`block text-sm ${isSelected ? 'text-[#e9c349]' : 'text-white'}`}>
                          {chat.clientName || chat.clientPhone || chat.externalId || 'Анонім'}
                        </strong>
                        <span className="text-[10px] text-[#8a8a93] uppercase tracking-wider font-bold">
                          {chat.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {lastMessage && (
                    <div className="text-sm text-[#8a8a93] truncate pl-12 pr-2">
                      {lastMessage.isFromAdmin ? 'Ви: ' : ''}{lastMessage.content || 'Файл/Зображення'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[#13131a]/30 to-[#080818] relative">
        {activeChat ? (
          <>
            <div className="z-10 flex items-center gap-4 border-b border-white/5 bg-[#13131a]/80 p-4 backdrop-blur-md lg:p-5">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  activeChat.platform === 'TELEGRAM' ? 'bg-[#2AABEE]/20 text-[#2AABEE]' : 
                  activeChat.platform === 'MESSENGER' ? 'bg-[#00B2FF]/20 text-[#00B2FF]' : 'bg-white/10 text-white'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {activeChat.platform === 'TELEGRAM' ? 'send' : activeChat.platform === 'MESSENGER' ? 'forum' : 'chat'}
                  </span>
                </div>
                <div>
                  <h3 className="m-0 text-white text-lg font-bold">
                    {activeChat.clientName || activeChat.clientPhone || activeChat.externalId || 'Анонім'}
                  </h3>
                  <p className="m-0 text-[#8a8a93] text-xs uppercase tracking-wider mt-1">{activeChat.platform} Чат</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 lg:p-5">
              {activeChat.messages.map(msg => (
                <div key={msg.id} className={`flex max-w-[86%] flex-col ${msg.isFromAdmin ? 'ml-auto items-end' : 'mr-auto items-start'} lg:max-w-[70%]`}>
                  <div className={`p-4 rounded-2xl relative ${
                    msg.isFromAdmin 
                      ? 'bg-gradient-to-br from-[#e9c349] to-[#d4af37] text-black rounded-tr-none shadow-[0_5px_15px_rgba(233,195,73,0.2)]' 
                      : 'bg-[#1b1b1c] text-white rounded-tl-none border border-white/5'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="text-[10px] text-[#8a8a93] mt-1 px-1 font-bold">
                    {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="z-10 border-t border-white/5 bg-[#13131a]/80 p-4 backdrop-blur-md lg:p-5">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Введіть повідомлення..." 
                  className="flex-1 bg-[#080818] border border-white/10 text-white px-6 py-4 rounded-full focus:outline-none focus:border-[#e9c349]/50 transition-colors placeholder:text-[#8a8a93]"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-14 h-14 rounded-full bg-[#e9c349] text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_5px_15px_rgba(233,195,73,0.3)]"
                >
                  <span className="material-symbols-outlined text-xl ml-1">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8a8a93]">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">forum</span>
            <p className="text-lg">Оберіть чат для початку спілкування</p>
          </div>
        )}
      </div>
    </div>
  );
}
