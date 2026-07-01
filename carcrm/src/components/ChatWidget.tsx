"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

type Message = {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
};

export default function ChatWidget({ bookingId, currentUserId, onClose }: { bookingId: string, currentUserId: string, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !imageUrl) return;

    const content = newMessage;
    setNewMessage("");

    try {
      await fetch(`/api/chat/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        sendMessage(undefined, data.url);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[350px] md:w-[400px] h-[500px] bg-[#1a1a1b] rounded-2xl border border-white/20 shadow-2xl flex flex-col z-[100] overflow-hidden">
      {/* Header */}
      <div className="bg-[#e9c349] p-4 flex justify-between items-center">
        <h3 className="font-bold text-[#080818] flex items-center gap-2">
          <span className="material-symbols-outlined">chat</span>
          Чат замовлення
        </h3>
        <button onClick={onClose} className="text-[#080818] hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#080818]">
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div className="text-[10px] text-gray-500 mb-1 flex gap-2">
                <span>{msg.sender.name} ({msg.sender.role})</span>
                <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
              </div>
              <div className={`max-w-[85%] rounded-2xl p-3 ${isMine ? "bg-[#e9c349] text-[#080818]" : "bg-white/10 text-white"}`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="attachment" className="rounded-xl max-w-full mb-2 cursor-pointer" onClick={() => msg.imageUrl && window.open(msg.imageUrl, '_blank')} />
                )}
                {msg.content && <div className="text-sm break-words">{msg.content}</div>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#1a1a1b] border-t border-white/10 flex items-center gap-2">
        <label className="cursor-pointer text-gray-400 hover:text-[#e9c349] transition-colors">
          <span className="material-symbols-outlined">attach_file</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
        </label>
        <form onSubmit={sendMessage} className="flex-1 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e9c349]"
            placeholder={uploading ? "Завантаження..." : "Повідомлення..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={uploading}
          />
          <button type="submit" disabled={uploading || (!newMessage.trim())} className="bg-[#e9c349] text-[#080818] p-2 rounded-xl flex items-center justify-center disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
