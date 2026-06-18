"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import MarkdownPreview from "@/components/notes/MarkdownPreview";
import { SocratesChatModal } from "@/components/chat/SocratesChatModal";
import { FiMessageCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function CheatsheetDetailPage() {
  const { cheatsheetId } = useParams();
  const [data, setData] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchCheatsheet = useCallback(() => {
    fetch(`/api/cheatsheets/${cheatsheetId}`)
      .then((res) => res.json())
      .then((res) => setData(res.cheatsheet))
      .catch((err) => console.error("Gagal memuat catatan", err));
  }, [cheatsheetId]);

  useEffect(() => {
    fetchCheatsheet();
  }, [fetchCheatsheet]);

  if (!data) return <div className="p-10 text-center font-medium text-gray-500 animate-pulse">Memuat catatan...</div>;

  return (
    // Mengunci tinggi halaman setinggi viewport penuh
    <div className="h-screen bg-[#FAFAFC] p-4 md:p-6 flex flex-col overflow-hidden">
      
      {/* Jika Chat Buka, ubah menjadi max-w-full (tanpa batas margins samping) agar super luas */}
      <div className={`w-full mx-auto flex flex-col flex-1 h-full min-h-0 transition-all duration-500 ease-in-out ${isChatOpen ? 'max-w-full' : 'max-w-4xl'}`}>
        
        {/* HEADER AREA: Di-render secara kondisional (Hanya muncul jika Chat Tertutup) */}
        {!isChatOpen && (
          <div className="shrink-0 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
                AI Pocket Book
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                {data.subtopic?.title || "Catatan Modul"}
              </h1>
            </div>

            <Button 
              onClick={() => setIsChatOpen(true)}
              className="shrink-0 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#5b21b6] hover:to-[#7c3aed] text-white rounded-[16px] px-6 py-6 flex items-center gap-2 shadow-[0_8px_20px_rgba(109,40,217,0.2)] transition-all hover:scale-105 font-bold"
            >
              <FiMessageCircle size={20} />
              <span>Diskusi Lanjutan</span>
            </Button>
          </div>
        )}
        
        {/* AREA FULL SPLIT SCREEN (Menggunakan seluruh sisa porsi tinggi vertikal h-full) */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 h-full min-h-0 w-full pb-2">
          
          {/* SISI KIRI: KONTEN CATATAN (Mengambil 50% Lebar Layar saat chat aktif) */}
          <div className={`bg-white p-6 md:p-10 rounded-[32px] shadow-sm border border-gray-100 flex flex-col min-h-0 h-full transition-all duration-500 ${isChatOpen ? 'lg:w-1/2' : 'w-full'}`}>
            
            {/* Pembungkus scroll isi teks catatan markdown */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col justify-start scrollbar-thin scrollbar-thumb-gray-200">
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-violet-600 prose-p:text-gray-700 prose-li:text-gray-700 marker:text-violet-500">
                <MarkdownPreview content={data.content} />
              </div>
            </div>
          </div>

          {/* SISI KANAN: CHAT SOCRATES INLINE (Mengambil 50% Sisa Lebar Layar) */}
          {isChatOpen && (
            <div className="w-full lg:w-1/2 flex flex-col min-h-0 h-full animate-in slide-in-from-right-8 fade-in duration-500">
              <SocratesChatModal 
                bugData={{ cognitiveBug: `${data.subtopic?.title || 'Materi Modul'}` }}
                userId={data.userId}
                subtopicId={data.subtopicId}
                onClose={() => setIsChatOpen(false)}
                onComplete={() => fetchCheatsheet()}
                chatMode="modules"
                inlineMode={true} // Menandakan chat nempel statis di layout kanan
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}