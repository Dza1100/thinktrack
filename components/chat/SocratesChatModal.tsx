"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiSend, FiX, FiCpu, FiUser, FiCheckCircle } from "react-icons/fi";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SocratesChatModalProps {
  bugData: any;
  userId: string;
  subtopicId: string;
  onClose: () => void;
  onComplete: () => void;
  chatMode?: "learn" | "modules"; 
  inlineMode?: boolean; 
}

export function SocratesChatModal({ 
  bugData, 
  userId, 
  subtopicId, 
  onClose, 
  onComplete,
  chatMode = "learn", 
  inlineMode = false 
}: SocratesChatModalProps) {
  
  const getGreetingMessage = () => {
    if (chatMode === "modules") {
      return `Halo! Senang melihatmu kembali untuk memperdalam wawasan mengenai "${bugData?.cognitiveBug || 'materi ini'}". Yuk kita uji kembali logika pemahamanmu. Dari catatan modul yang ada, bagian mana yang masih ingin kamu eksplorasi atau tanyakan?`;
    }
    return `Halo! Mari kita bedah bersama celah pemahamanmu mengenai "${bugData.cognitiveBug}". Jangan khawatir, kita akan meluruskan logikanya selangkah demi selangkah. Menurut pandanganmu sendiri, bagian mana dari konsep ini yang paling membingungkan saat pengerjaan soal tadi?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: getGreetingMessage() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (forcedMessage?: string) => {
    const textToSend = forcedMessage || input;
    if (!textToSend.trim()) return;

    let newMessages = [...messages];
    if (!forcedMessage) {
      newMessages.push({ role: "user", content: textToSend });
      setMessages(newMessages as Message[]);
      setInput("");
    }
    
    setIsLoading(true);

    const systemTerminationMessage = chatMode === "modules"
      ? "Sistem: Sesi diskusi selesai, buat rangkuman pembaruan materi. Segera berikan kesimpulan penutup yang mengapresiasi siswa, set isResolved menjadi true, dan susun poin-poin wawasan baru sekarang."
      : "Sistem: Pengguna ingin mengakhiri sesi. Segera berikan kesimpulan penutup, set isResolved menjadi true, dan buatkan rangkuman cheatsheet-nya sekarang.";

    try {
      const res = await fetch("/api/ai/socrates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subtopicId,
          bugData,
          chatMode, 
          messages: forcedMessage 
            ? [...newMessages, { role: "user", content: systemTerminationMessage }]
            : newMessages
        })
      });

      const data = await res.json();
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }] as Message[]);

      if (data.isResolved) {
        setIsResolved(true);
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chatContent = (
    <div className={`w-full bg-[#FAFAFC] border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
      inlineMode 
        ? "h-full rounded-[32px] shadow-sm" 
        : "md:max-w-4xl md:rounded-[32px] rounded-t-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.1)] h-[85vh] animate-in slide-in-from-bottom-10 duration-500"
    }`}>
      
      {/* HEADER CHAT: Padding diperbesar agar judul lega */}
      <div className="shrink-0 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-8 py-6 md:py-8 text-white flex justify-between items-center shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
            <FiCpu size={26} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold font-heading text-xl md:text-2xl tracking-tight text-white">Socrates AI Tutor</h3>
            <p className="text-sm opacity-90 text-violet-100 mt-1 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {chatMode === "modules" ? "Mode Pendalaman Modul" : "Resolusi Aktif: "}
              <span className="font-bold truncate max-w-[200px] md:max-w-md">{bugData?.cognitiveBug}</span>
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-black/10 rounded-xl hover:bg-black/20 text-white transition-all border border-white/10 relative z-10">
          <FiX size={24} />
        </button>
      </div>

      {/* AREA CHAT BUBBLE: Padding diperbesar, spasi diperlebar (space-y-8) */}
      <div className="flex-1 p-8 md:p-10 overflow-y-auto bg-[#FAFAFC] flex flex-col justify-start space-y-8 pr-4 scrollbar-thin scrollbar-thumb-gray-200">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 md:gap-5 shrink-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-12 h-12 rounded-[16px] bg-white border border-gray-100 flex items-center justify-center text-[#6D28D9] shrink-0 mt-1 shadow-sm">
                <FiCpu size={24} />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[75%] p-6 text-base md:text-lg leading-relaxed shadow-sm ${
              msg.role === "user" 
                ? "bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] text-white rounded-[28px] rounded-tr-sm font-medium" 
                : "bg-white text-gray-800 border border-gray-100 rounded-[28px] rounded-tl-sm"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-12 h-12 rounded-[16px] bg-[#6D28D9]/10 border border-[#6D28D9]/20 flex items-center justify-center text-[#6D28D9] shrink-0 mt-1">
                <FiUser size={24} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-5 justify-start shrink-0">
              <div className="w-12 h-12 rounded-[16px] bg-white border border-gray-100 flex items-center justify-center text-[#6D28D9] shrink-0 shadow-sm">
                <FiCpu size={24} />
              </div>
              <div className="bg-white border border-gray-100 px-8 py-6 rounded-[28px] rounded-tl-sm shadow-sm flex gap-3 items-center">
                <div className="w-3 h-3 bg-[#6D28D9]/40 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-[#6D28D9]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-3 h-3 bg-[#6D28D9] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
        )}
        <div ref={messagesEndRef} className="shrink-0" />
      </div>

      {/* INPUT AREA: Padding diperbesar */}
      <div className="shrink-0 p-6 md:p-8 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgb(0,0,0,0.02)]">
        {isResolved ? (
          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[24px] text-center max-w-2xl mx-auto animate-in zoom-in-95 shadow-sm">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-emerald-50">
              <FiCheckCircle className="text-emerald-500" size={40} />
            </div>
            <h4 className="text-emerald-700 font-extrabold font-heading text-2xl mb-3">
              {chatMode === "modules" ? "Catatan Modul Diperbarui!" : "Pemahaman Kognitif Tercapai!"}
            </h4>
            <p className="text-base text-emerald-600/80 mb-8 max-w-lg mx-auto">
              {chatMode === "modules" 
                ? "Socrates telah merangkum wawasan diskusi tambahan hari ini dan menyimpannya langsung ke dalam modul belajar Anda."
                : "AI telah selesai memvalidasi logikamu dan menyusun catatan ringkasnya di database. Klik tombol di bawah untuk menyematkannya di AI Pocket Book Anda."}
            </p>
            <Button 
              onClick={() => { 
                onComplete(); 
                onClose();    
              }} 
              className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-7 rounded-[16px] shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all hover:scale-105 text-xl"
            >
              {chatMode === "modules" ? "🔄 Muat Ulang & Lihat Perubahan" : "💾 Klaim Catatan Personal AI"}
            </Button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Balas AI Tutor di sini..."
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-[20px] px-8 py-5 text-base md:text-lg focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] focus:bg-white transition-all"
              disabled={isLoading}
            />
            
            <div className="flex gap-3 shrink-0">
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()} 
                className="rounded-[20px] bg-[#FF7849] hover:bg-[#e06336] text-white px-8 py-7 h-auto font-bold flex items-center gap-3 shadow-[0_8px_20px_rgba(255,120,73,0.25)] transition-all text-lg"
              >
                <span className="hidden md:inline">Kirim</span>
                <FiSend size={22} />
              </Button>
              
              <Button 
                onClick={() => handleSend("Paksa Selesai")} 
                disabled={isLoading} 
                variant="outline"
                className="rounded-[20px] border-gray-200 bg-white hover:bg-[#FF7849]/5 hover:border-[#FF7849]/30 hover:text-[#FF7849] text-gray-600 px-6 py-7 h-auto font-bold flex items-center gap-3 transition-all shadow-sm text-lg"
                title={chatMode === "modules" ? "Akhiri diskusi bebas dan perbarui modul" : "Minta AI buatkan catatan ringkas"}
              >
                <FiCheckCircle size={22} />
                <span className="hidden lg:inline">
                  {chatMode === "modules" ? "Perbarui Catatan" : "Buat Catatan"}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inlineMode) {
    return chatContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 backdrop-blur-md p-0 md:p-6 md:items-center font-sans">
      {chatContent}
    </div>
  );
}