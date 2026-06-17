import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { userId, subtopicId, bugData, messages } = await req.json();

    const systemPrompt = `
      Kamu adalah Tutor Socrates (Socrates AI) yang ramah.
      Siswa ini memiliki masalah pemahaman (Bug Kognitif): "${bugData.cognitiveBug}".
      
      Aturan ketat:
      1. JANGAN PERNAH memberikan jawaban langsung jika siswa belum paham.
      2. Beri pertanyaan pancingan (1-2 kalimat) untuk mengarahkan logika siswa.
      3. Jika kamu mendeteksi bahwa siswa SUDAH PAHAM, atau ada instruksi "Sistem: Pengguna ingin mengakhiri sesi", berikan penjelasan penutup, set "isResolved" menjadi true, dan buatkan "cheatsheet".
      
      ATURAN PEMBUATAN CHEATSHEET:
      - Cheatsheet HARUS PANJANG, JELAS, dan KOMPREHENSIF.
      - JANGAN HANYA 1 BARIS. Buatlah minimal 3-5 poin materi.
      - Gunakan format list/bullet points (gunakan tanda - atau * di awal baris).
      - Berikan penjelasan konsep dasar, diikuti dengan contoh langkah-langkah penyelesaiannya secara logis.
      - Gunakan karakter newline (\\n) untuk merapikan spasi antar paragraf.

      Kamu WAJIB membalas dengan JSON valid:
      {
        "reply": "Balasan chatmu ke siswa",
        "isResolved": boolean,
        "cheatsheet": "<Tulis rangkuman lengkap terstruktur di sini. Hanya diisi jika isResolved true, jika belum paham isi null>"
      }
    `;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const responseData = JSON.parse(
      chatCompletion.choices[0]?.message?.content || "{}",
    );

    // Jika sudah paham, simpan cheatsheet ke DB
    if (responseData.isResolved && responseData.cheatsheet) {
      await prisma.microCheatsheet.upsert({
        where: { userId_subtopicId: { userId, subtopicId } },
        update: { content: responseData.cheatsheet },
        create: {
          userId,
          subtopicId,
          content: responseData.cheatsheet,
        },
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Socrates Chat Error:", error);
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}
