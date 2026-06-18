"use client";

import { useEffect, useState, use } from "react";
import {
  FiBookOpen,
  FiChevronRight,
  FiLoader,
  FiPieChart,
  FiTrendingUp,
  FiAward,
  FiList,
  FiEye,
  FiCheckCircle,
  FiArrowLeft,
  FiAlertTriangle,
  FiCpu,
} from "react-icons/fi";
import { FaGem } from "react-icons/fa";
import Link from "next/link";
import { SocratesChatModal } from "@/components/chat/SocratesChatModal";

export default function LearnPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const [viewMode, setViewMode] = useState<"materi" | "latihan">("materi");

  const [topicTitle, setTopicTitle] = useState<string>("");
  const [subtopics, setSubtopics] = useState<
    Array<{ id: string; title: string; level: string; content: string }>
  >([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [dbResults, setDbResults] = useState<any[]>([]);

  // State Adaptive Learning
  const [activeSocratesBug, setActiveSocratesBug] = useState<any | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("view") === "latihan") setViewMode("latihan");
    const subId = urlParams.get("subtopicId");
    if (subId) setSelectedSubtopicId(subId);

    const load = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(`/api/topics/${topicId}`);
        if (!res.ok) throw new Error("Gagal memuat topik");
        const data = await res.json();
        setTopicTitle(data?.topic?.title || "");
        setSubtopics(data?.subtopics || []);

        const resultsRes = await fetch(`/api/topics/${topicId}/results`);
        const resultsData = await resultsRes.json();
        if (resultsData.results) {
          setDbResults(resultsData.results);
        }
      } catch {
        setTopicTitle("");
        setSubtopics([]);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [topicId]);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 pb-56 font-sans relative selection:bg-[#6D28D9] selection:text-white">
      
      {/* HEADER TABS (Glassmorphism Light) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setViewMode("materi")}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                viewMode === "materi" 
                  ? "border-b-2 border-[#6D28D9] text-[#6D28D9] bg-[#6D28D9]/5" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiBookOpen size={16} /> Learning Roadmap
              </div>
            </button>
            <button
              onClick={() => {
                setViewMode("latihan");
                setSelectedSubtopicId(null);
                window.history.pushState({}, "", `/learn/${topicId}?view=latihan`);
              }}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                viewMode === "latihan" 
                  ? "border-b-2 border-[#FF7849] text-[#FF7849] bg-[#FF7849]/5" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiPieChart size={16} /> Cognitive Analytics
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MODE MATERI (PETA MATERI) */}
      {viewMode === "materi" && (
        <div className="max-w-6xl mx-auto p-5 md:p-8 mt-4 md:mt-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-start relative gap-8 md:gap-0">
            
            {/* KARTU TOPIK (KIRI) */}
            <div className="md:w-5/12 w-full relative z-20 md:pr-10 lg:pr-14 mb-6 md:mb-0">
              <div className="w-full bg-white border border-gray-100 rounded-[32px] p-8 md:p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6]" />
                
                <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6D28D9]/10 border border-[#6D28D9]/10 text-[#6D28D9] mb-6 shadow-sm">
                  <FaGem size={28} className="animate-pulse" />
                </div>
                
                <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#6D28D9]/5 border border-[#6D28D9]/10 rounded-lg inline-block mb-4">
                  Mastery Target
                </span>
                
                <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-gray-900 leading-tight">
                  {loadingData ? "Memuat..." : topicTitle || "Topik Belajar"}
                </h1>
                
                <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                  Roadmap pembelajaran terstruktur yang di-dekomposisi khusus untuk mengoptimalkan penyerapan kognitif Anda.
                </p>
              </div>
            </div>

            {/* TIMELINE LIST MATERI (KANAN) */}
            <div className="md:w-7/12 w-full relative z-10 flex flex-col gap-6">
              <div className="hidden md:block absolute left-0 top-10 bottom-10 w-1 bg-gray-100 rounded-full -ml-[2px]" />
              
              {loadingData ? (
                <div className="w-full rounded-[24px] border border-gray-100 bg-white p-12 flex flex-col items-center justify-center gap-4 text-gray-400 ml-0 md:ml-8 lg:ml-12 shadow-sm">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6D28D9] rounded-full animate-spin mb-2"></div>
                  Menyiapkan peta konsep AI...
                </div>
              ) : (
                subtopics.map((item, index) => (
                  <div key={item.id} className="relative group pl-0 md:pl-8 lg:pl-12">
                    {/* Node connector line */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-8 lg:w-12 h-1 bg-gray-100 group-hover:bg-[#6D28D9]/30 transition-colors rounded-r-full" />
                    {/* Node circle */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-3 h-3 mt-[-6px] -ml-[6px] rounded-full border-2 border-white bg-gray-300 group-hover:bg-[#6D28D9] transition-colors shadow-sm" />

                    <Link
                      href={`/materi-detail/${item.id}`}
                      target="_blank"
                      className="flex items-center gap-5 rounded-[24px] border border-gray-100 bg-white p-5 hover:-translate-y-1 hover:border-[#6D28D9]/30 hover:shadow-[0_12px_40px_rgba(109,40,217,0.06)] transition-all duration-300 group"
                    >
                      <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-[#6D28D9]/10 group-hover:text-[#6D28D9] group-hover:scale-110 transition-all duration-300">
                        <span className="font-heading font-extrabold text-xl">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1 uppercase tracking-wider">
                          Module {index + 1}
                        </span>
                        <h3 className="font-bold font-heading text-gray-900 text-lg group-hover:text-[#6D28D9] transition-colors truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {item.content}
                        </p>
                      </div>
                      
                      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#6D28D9] group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                        <FiChevronRight size={20} />
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE ANALISIS (LATIHAN) */}
      {viewMode === "latihan" && (
        <div className="max-w-4xl mx-auto p-5 md:p-8 mt-4 md:mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {selectedSubtopicId === null ? (
            /* =========================================
               DAFTAR LIST SUB-BAB (DARI DATABASE) 
               ========================================= */
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF7849]/5 blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#FF7849]/10 text-[#FF7849] flex items-center justify-center">
                  <FiList size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-gray-900 tracking-tight">
                  Cognitive Mastery List
                </h2>
              </div>
              <p className="text-gray-500 text-sm md:text-base mb-8 leading-relaxed max-w-2xl relative z-10">
                Pilih modul di bawah ini untuk melihat hasil bedah kognitif AI dan rekomendasi belajar adaptif berdasarkan rekam jejak (*Thinking Trace*) Anda.
              </p>

              <div className="flex flex-col gap-4 relative z-10">
                {subtopics.map((item, index) => {
                  const currentDBResult = dbResults.find((r) => r.subtopicId === item.id);
                  const scoreNum = currentDBResult && currentDBResult.score !== null ? currentDBResult.score : null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedSubtopicId(item.id);
                        window.history.pushState({}, "", `/learn/${topicId}?view=latihan&subtopicId=${item.id}`);
                      }}
                      className="w-full flex items-center justify-between gap-4 rounded-[20px] border border-gray-100 bg-white p-5 hover:border-[#FF7849]/40 hover:shadow-[0_8px_20px_rgba(255,120,73,0.05)] hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-[#FF7849]/10 group-hover:text-[#FF7849] font-extrabold font-heading text-lg transition-colors">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold font-heading text-gray-900 text-base md:text-lg group-hover:text-[#FF7849] transition-colors truncate">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mt-1">
                            Modul Evaluasi
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className={`text-base md:text-xl font-extrabold font-heading tracking-wide ${
                            scoreNum !== null 
                              ? (scoreNum >= 80 ? "text-emerald-500" : scoreNum >= 50 ? "text-amber-500" : "text-rose-500") 
                              : "text-gray-300"
                          }`}>
                            {scoreNum !== null ? `${scoreNum}%` : "No Data"}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-[#FF7849]/10 group-hover:text-[#FF7849] transition-all">
                          <FiChevronRight size={20} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* =========================================
               DETAIL ROADMAP DINAMIS (HYBRID ADAPTIVE) 
               ========================================= */
            (() => {
              const currentSubtopic = subtopics.find((st) => st.id === selectedSubtopicId);
              const currentDBResult = dbResults.find((r) => r.subtopicId === selectedSubtopicId);

              const hasTakenQuiz = !!currentDBResult;
              const scoreNum = hasTakenQuiz ? (currentDBResult.score || 0) : 0;
              
              let parsedAnalysis: any[] = [];
              if (hasTakenQuiz && currentDBResult.detailedAnalysis) {
                try {
                  if (Array.isArray(currentDBResult.detailedAnalysis)) {
                    parsedAnalysis = currentDBResult.detailedAnalysis;
                  } else if (typeof currentDBResult.detailedAnalysis === 'string') {
                    parsedAnalysis = JSON.parse(currentDBResult.detailedAnalysis);
                  }
                } catch (e) {
                  console.error("Gagal parsing detailed analysis", e);
                  parsedAnalysis = []; 
                }
              }

              const localBugs = parsedAnalysis.filter((q: any) => q.resolutionType === "LOCAL_BUG" && (q.isCorrect === false || String(q.isCorrect) === "false"));
              const foundationalGaps = parsedAnalysis.filter((q: any) => q.resolutionType === "FOUNDATIONAL_GAP" && (q.isCorrect === false || String(q.isCorrect) === "false"));
              const correctCount = parsedAnalysis.filter((q: any) => q.isCorrect === true || String(q.isCorrect) === "true").length;
              const totalQuestions = parsedAnalysis.length;

              let category = "Perlu Peningkatan";
              let badgeColor = "bg-rose-50 text-rose-600 border-rose-200";
              let scoreColor = "from-rose-500 to-orange-500";

              if (scoreNum >= 80) {
                category = "Sangat Baik";
                badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                scoreColor = "from-emerald-400 to-teal-500";
              } else if (scoreNum >= 50) {
                category = "Cukup Baik";
                badgeColor = "bg-amber-50 text-amber-600 border-amber-200";
                scoreColor = "from-amber-400 to-yellow-500";
              }

              return (
                <div className="space-y-6">
                  <button
                    onClick={() => {
                      setSelectedSubtopicId(null);
                      window.history.pushState({}, "", `/learn/${topicId}?view=latihan`);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF7849] bg-white px-4 py-2.5 rounded-full border border-gray-200 shadow-sm transition-all hover:shadow group w-fit"
                  >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar
                  </button>

                  {/* HERO SCORE CARD */}
                  <div className="bg-gradient-to-br from-[#6D28D9] to-[#4c1d95] rounded-[32px] p-8 md:p-14 text-center shadow-[0_20px_50px_rgba(109,40,217,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <span className="inline-block px-3 py-1 bg-white/10 text-violet-200 rounded-lg text-xs font-bold uppercase tracking-widest mb-4">
                      Cognitive Evaluation
                    </span>
                    <h2 className="text-2xl md:text-4xl font-extrabold font-heading text-white mb-3 relative z-10 tracking-tight leading-tight">
                      {currentSubtopic?.title}
                    </h2>
                    <p className="text-violet-200 text-sm md:text-base max-w-xl mx-auto relative z-10">
                      Evaluasi cerdas dari AI berdasarkan jejak berpikir (Trace) Anda saat menyelesaikan latihan ini.
                    </p>

                    <div className="mt-10 relative z-10 flex flex-col items-center">
                      <div className={`text-7xl md:text-8xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r ${scoreColor} mb-4 drop-shadow-sm`}>
                        {hasTakenQuiz ? `${scoreNum}%` : "-"}
                      </div>
                      {hasTakenQuiz && (
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm tracking-wider uppercase shadow-sm ${badgeColor}`}>
                          <FiAward size={18} /> Kategori: {category}
                        </div>
                      )}
                    </div>

                    <div className="mt-10 relative z-10">
                      <Link
                        href={`/exercise/${selectedSubtopicId}`}
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#6D28D9] font-bold py-3.5 px-8 rounded-full transition-all shadow-lg hover:scale-105"
                      >
                        <FiEye size={18} /> Lihat Log Ujian (Trace)
                      </Link>
                    </div>
                  </div>

                  {hasTakenQuiz && (
                    <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#FF7849]"></div>

                      <div className="mb-10 border-b border-gray-100 pb-8">
                        <h3 className="text-2xl md:text-3xl font-extrabold font-heading text-gray-900 mb-3 flex items-center gap-3">
                          <FiCpu className="text-[#FF7849]" size={28} /> AI Trace Analysis
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                          {totalQuestions > 0 && totalQuestions === correctCount 
                            ? "Luar biasa! Konsep kognitif Anda sangat solid, tidak ditemukan miskonsepsi apa pun."
                            : totalQuestions === 0 
                            ? "Gagal memproses data jawaban. Silakan ulangi kuis."
                            : "Sistem mendeteksi beberapa miskonsepsi (Bug Kognitif). Selesaikan langkah di bawah untuk memulihkan pemahaman Anda."}
                        </p>
                      </div>

                      <div className="space-y-8">
                        
                        {/* SKENARIO B: WARP PORTAL (FOUNDATIONAL GAP) */}
                        {foundationalGaps.length > 0 && (
                          <div className="bg-rose-50 p-8 rounded-[24px] border border-rose-200 shadow-sm relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                            
                            <h3 className="text-xl md:text-2xl font-black font-heading text-rose-700 flex items-center gap-3 mb-3 relative z-10">
                              <FiAlertTriangle size={24} /> Foundational Gap Detected!
                            </h3>
                            <p className="text-rose-900/80 text-sm md:text-base mb-8 relative z-10 leading-relaxed font-medium">
                              AI mendeteksi fondasi yang rapuh pada konsep prasyaratmu. Melangkah maju sekarang akan sangat menyulitkanmu. Mari warp kembali sebentar ke konsep dasar!
                            </p>
                            
                            <div className="space-y-4 relative z-10">
                              {foundationalGaps.map((gap: any, idx: number) => (
                                <Link 
                                  key={idx}
                                  href={`/materi-detail/${gap.foundationalTopicTarget || subtopics[0].id}`} 
                                  className="w-full text-left p-5 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 hover:shadow-[0_8px_20px_rgba(225,29,72,0.08)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                                >
                                  <div>
                                    <span className="block text-[11px] text-rose-500 font-bold uppercase mb-1 tracking-wider">Akar Masalah Kognitif:</span>
                                    <span className="font-bold font-heading text-gray-900 text-lg group-hover:text-rose-600 transition-colors">
                                      {gap.cognitiveBug || "Kelemahan Konsep Dasar"}
                                    </span>
                                  </div>
                                  <span className="bg-rose-500 group-hover:bg-rose-600 text-white px-5 py-2.5 text-sm rounded-xl font-bold transition-all shadow-sm whitespace-nowrap group-hover:scale-105">
                                    Warp Kembali 🚀
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                       {/* SKENARIO A: SOCRATES CHAT (LOCAL BUGS) */}
                        {localBugs.length > 0 && (
                          (() => {
                            const rawBugs = localBugs.map((b: any) => b.cognitiveBug || b.concept).filter((bug: string) => bug && bug !== "LOCAL_BUG" && bug !== "NONE" && bug.trim() !== "");
                            const uniqueBugs = Array.from(new Set(rawBugs));
                            
                            if (uniqueBugs.length === 0) {
                              uniqueBugs.push(currentSubtopic?.title || "Konsep Inti Bab");
                            }

                            const bugNamesString = uniqueBugs.join(", ");

                            return (
                              <div className="bg-[#FFF8E7] p-8 md:p-10 rounded-[24px] border border-[#FF7849]/20 relative overflow-hidden shadow-sm">
                                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#FF7849]/10 blur-[50px] rounded-full pointer-events-none"></div>
                                
                                <h3 className="text-xl md:text-2xl font-extrabold font-heading text-[#FF7849] flex items-center gap-3 mb-4 relative z-10">
                                  <span className="text-2xl">🕵️</span> Local Miskonsepsi
                                </h3>
                                
                                <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6 relative z-10">
                                  Berdasarkan rekam jejak (*Thinking Trace*) pengerjaanmu, sistem mendeteksi ada logika yang tersandung khusus pada materi ini. Terutama pada poin-poin berikut:
                                </p>

                                <div className="bg-white p-5 md:p-6 rounded-[20px] border border-[#FF7849]/20 mb-8 relative z-10 shadow-sm">
                                  <ul className="space-y-3">
                                    {uniqueBugs.map((bug: string, index: number) => (
                                      <li key={index} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#FF7849]/10 text-[#FF7849] flex items-center justify-center shrink-0 mt-0.5">
                                          <span className="text-xs font-bold">{index + 1}</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold leading-relaxed">
                                          {bug}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8 relative z-10">
                                  Mari kita diskusikan poin-poin di atas bersama <strong className="text-[#6D28D9]">AI Tutor Socrates</strong> untuk meluruskan pemahamanmu. Dapatkan hadiah <strong className="text-[#FF7849]">Micro-Cheatsheet</strong> personal setelah diskusi selesai!
                                </p>
                                
                                <div className="relative z-10">
                                  <button 
                                    onClick={() => setActiveSocratesBug({ cognitiveBug: bugNamesString })} 
                                    className="w-full flex items-center justify-center gap-3 bg-[#FF7849] hover:bg-[#e06336] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_10px_25px_rgba(255,120,73,0.3)] hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(255,120,73,0.4)]"
                                  >
                                    Mulai Resolusi Kognitif (Socrates Chat) <FiChevronRight size={22} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* JIKA BENAR SEMUA */}
                        {totalQuestions > 0 && totalQuestions === correctCount && hasTakenQuiz && (
                          <div className="bg-emerald-50 p-10 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                              <FiCheckCircle className="text-emerald-500" size={40} />
                            </div>
                            <h3 className="text-2xl font-extrabold font-heading text-emerald-700 mb-3">Flawless Logic!</h3>
                            <p className="text-emerald-800/80 text-base max-w-md mx-auto">
                              Pemahaman Anda sudah sangat solid. Tidak ada celah miskonsepsi yang ditemukan. Pertahankan performa ini untuk modul berikutnya!
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* RENDER MODAL SOCRATES JIKA AKTIF */}
      {activeSocratesBug && (
  <SocratesChatModal 
    bugData={activeSocratesBug}
    userId={dbResults[0]?.userId || "user-id-placeholder"}
    subtopicId={selectedSubtopicId!}
    onClose={() => setActiveSocratesBug(null)}
    onComplete={() => {
      alert("🎉 Hebat! Micro-Cheatsheet berhasil ditambahkan di ujung Ruang Belajar.");
      // Opsional: Anda bisa memanggil fungsi refresh untuk memuat ulang daftar modul/cheatsheet di sini
    }}
    chatMode="learn" // <--- Tambahkan baris ini
  />
)}
    </div>
  );
}