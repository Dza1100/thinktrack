"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiCpu, FiKey, FiSave, FiSettings } from "react-icons/fi";

export default function AISettingsPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    activeModel: "gemini-2.5-flash",
    cognitiveMode: "BALANCED", // Default mode
    apiKey: "",
  });

  useEffect(() => {
    if (status === "loading" || !userId) return;

    fetch(`/api/ai-settings?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          // AUTO-FALLBACK: Mencegah error jika database masih menyimpan data "REMAJA", "ANAK", dll.
          let fetchedMode = data.user?.cognitiveMode ?? "BALANCED";
          if (["ANAK", "REMAJA", "DEWASA"].includes(fetchedMode)) {
            fetchedMode = "BALANCED";
          }

          setConfig({
            ...data,
            cognitiveMode: fetchedMode,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, [userId, status]);

  const saveSettings = async () => {
    if (!userId) return;
    try {
      setSaving(true);

      const res = await fetch("/api/ai-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...config,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan");
      }

      alert("Pengaturan Cognitive Mode berhasil disimpan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen p-6 md:p-10 bg-[#FAFAFC] flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          <div className="h-10 w-1/3 rounded-[12px] bg-gray-200 animate-pulse" />
          <div className="h-32 w-full rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-32 w-full rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 font-sans p-6 md:p-10 pb-32 selection:bg-[#6D28D9] selection:text-white animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 bg-white border border-gray-100 p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6D28D9]/5 blur-[60px] rounded-full pointer-events-none"></div>

          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 tracking-tight relative z-10">
            Pengaturan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6]">
              AI
            </span>
          </h1>
          <p className="text-gray-500 mt-3 text-sm md:text-base max-w-xl leading-relaxed relative z-10">
            Konfigurasi model mesin kognitif AI, API Key pribadi, dan parameter
            respons AI yang paling sesuai dengan target belajar Anda.
          </p>
        </div>

        <div className="space-y-6">
          {/* API KEY */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 md:p-8 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#FF7849]/10 text-[#FF7849] group-hover:bg-[#FF7849] group-hover:text-white transition-colors">
                <FiKey className="text-xl" />
              </div>
              <div>
                <h2 className="font-extrabold font-heading text-lg text-gray-900 group-hover:text-[#FF7849] transition-colors">
                  API Key Pribadi (Opsional)
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tambahkan API Key milik Anda sendiri untuk kuota analisis tak
                  terbatas.
                </p>
              </div>
            </div>

            <input
              type="password"
              value={config.apiKey}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKey: e.target.value,
                })
              }
              placeholder="Masukkan API Key (Opsional)"
              className="w-full rounded-[16px] border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF7849] focus:ring-4 focus:ring-[#FF7849]/10 focus:bg-white transition-all text-sm md:text-base font-mono"
            />
          </div>

          {/* MODEL */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 md:p-8 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] group-hover:bg-[#6D28D9] group-hover:text-white transition-colors">
                <FiCpu className="text-xl" />
              </div>
              <div>
                <h2 className="font-extrabold font-heading text-lg text-gray-900 group-hover:text-[#6D28D9] transition-colors">
                  Model AI Cognitive
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Pilih mesin model AI yang akan mengeksekusi kurikulum dan
                  analitik.
                </p>
              </div>
            </div>

            <select
              value={config.activeModel}
              onChange={(e) =>
                setConfig({
                  ...config,
                  activeModel: e.target.value,
                })
              }
              className="w-full rounded-[16px] border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-[#6D28D9] focus:ring-4 focus:ring-[#6D28D9]/10 focus:bg-white transition-all text-sm md:text-base font-semibold cursor-pointer appearance-none"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          {/* COGNITIVE PROCESSING MODE (3 OPSI) */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 md:p-8 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <FiSettings className="text-xl" />
              </div>
              <div>
                <h2 className="font-extrabold font-heading text-lg text-gray-900 group-hover:text-emerald-500 transition-colors">
                  Cognitive Processing Mode
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sesuaikan cara AI menstrukturisasi roadmap materi dan
                  merespons pertanyaan Anda.
                </p>
              </div>
            </div>

            <select
              value={config.cognitiveMode}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cognitiveMode: e.target.value,
                })
              }
              className="w-full rounded-[16px] border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all text-sm md:text-base font-semibold cursor-pointer appearance-none"
            >
              <option value="FAST">
                ⚡ Fast (Singkat, cepat, efisien, 3 Modul Materi)
              </option>
              <option value="BALANCED">
                ⚖️ Balanced (Seimbang, terstruktur rapi, 5 Modul Materi)
              </option>
              <option value="TEACHER">
                🧑‍🏫 Socratic Tutor (Mendalam, menuntut analisis, 8 Modul Materi)
              </option>
            </select>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] py-5 font-extrabold text-lg text-white transition-all shadow-[0_10px_30px_rgba(109,40,217,0.25)] hover:shadow-[0_15px_40px_rgba(109,40,217,0.35)] hover:-translate-y-1 hover:scale-[1.01] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:shadow-none mt-10"
          >
            <FiSave size={20} />
            {saving ? "Menyimpan Konfigurasi..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
