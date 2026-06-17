"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // Tambahkan ini
import { FiBookOpen, FiCpu, FiZap, FiCheckCircle, FiArrowRight } from "react-icons/fi";

export default function ModulesPage() {
  const [cheatsheets, setCheatsheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCheatsheets = async () => {
      try {
        const res = await fetch(`/api/cheatsheets`);
        const data = await res.json();
        if (data.cheatsheets) setCheatsheets(data.cheatsheets);
      } catch (e) {
        console.error("Gagal memuat catatan", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCheatsheets();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFC] text-gray-900 font-sans p-6 md:p-10 pb-32">
      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {/* HEADER TETAP SAMA */}
        <div className="bg-white border border-gray-100 p-8 rounded-[24px] shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 items-start justify-between mt-4">
           {/* ... (isi header sama seperti sebelumnya) ... */}
           <div className="space-y-4 relative z-10">
              <h1 className="text-3xl font-extrabold text-gray-900">AI Cognitive Modules</h1>
              <p className="text-gray-500 text-sm">Kumpulan Micro-Cheatsheets personalisasi milikmu.</p>
           </div>
        </div>

        {/* LIST CATATAN SEBAGAI NAVIGASI */}
        {!isLoading && cheatsheets.length > 0 && (
          <div className="grid gap-4">
            {cheatsheets.map((sheet) => (
              <Link 
                key={sheet.id} 
                href={`/modules/${sheet.id}`} // Arahkan ke halaman detail baru
                className="group bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 hover:border-[#6D28D9]/30 shadow-sm hover:shadow-lg transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-widest bg-[#6D28D9]/5 px-2 py-0.5 rounded-md mb-2 block w-fit">
                    Resolution Summary
                  </span>
                  <h3 className="font-bold text-lg md:text-xl text-gray-900 group-hover:text-[#6D28D9] transition-colors">
                    {sheet.subtopic?.title || "Penyelesaian Celah Kognitif"}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#6D28D9]/10 group-hover:text-[#6D28D9] transition-colors">
                  <FiArrowRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}