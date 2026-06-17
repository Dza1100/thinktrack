import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, expectedAnswer, selectedOption, scratchpad, type, subtopicId } = await req.json();

    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { cognitiveMode: true } 
    });
    const mode = user?.cognitiveMode || "BALANCED";

    const systemPrompt = `
      Kamu adalah AI Evaluator Pendidikan yang sangat detail.
      
      [DATA]
      Pertanyaan: ${question} | Kunci: ${expectedAnswer} | Jawaban Siswa: ${selectedOption} | Logika: ${scratchpad}

      [ATURAN DIAGNOSA MIKRO]
      - JANGAN berikan feedback umum (seperti "Salah penjumlahan").
      - WAJIB diagnosa spesifik teknis (Contoh: "Kegagalan Sifat Komutatif pada bilangan negatif", "Salah dalam urutan operasi PEMDAS").
      - Masukkan diagnosa ini ke field "cognitiveBug".

      [ATURAN PENULISAN CATATAN (cheatsheetContent)]
      - JIKA salah, buatkan catatan pembelajaran yang MENDALAM.
      - STRUKTUR WAJIB: 
        1. Judul teknis konsep yang salah.
        2. Penjelasan mengapa logika siswa tadi keliru (Analisis Miskonsepsi).
        3. Penjelasan konsep yang benar secara komprehensif (Minimal 3 paragraf).
        4. Contoh kasus dengan rumus LaTeX (gunakan double backslash \\\\frac).
      - FORMAT: Gunakan '\\n\\n' untuk memisahkan setiap paragraf. JANGAN gunakan baris baru literal.
      - GAYA BAHASA (Mode: ${mode}): 
        FAST (To-the-point & bullet), BALANCED (Logis & Terstruktur), TEACHER (Socratic/Analogi).

      WAJIB merespon HANYA dengan JSON valid:
      {
        "score": <number>, "is_correct": <boolean>, "feedback": "<string>",
        "cognitiveBug": "<string spesifik>", 
        "resolutionType": "LOCAL_BUG" | "FOUNDATIONAL_GAP" | "NONE",
        "cheatsheetContent": "<string panjang dengan \\n\\n>"
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.1-8b-instant", // Jika merasa kurang panjang, gunakan model 70b
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const cleanContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const evaluationResult = JSON.parse(cleanContent);

    if (evaluationResult.cheatsheetContent) {
      const subtopicExists = await prisma.subtopic.findUnique({ where: { id: String(subtopicId) } });
      if (subtopicExists) {
        await prisma.microCheatsheet.upsert({
          where: { userId_subtopicId: { userId: session.user.id, subtopicId: String(subtopicId) } },
          update: { content: evaluationResult.cheatsheetContent },
          create: { userId: session.user.id, subtopicId: String(subtopicId), content: evaluationResult.cheatsheetContent }
        });
      }
    }

    return NextResponse.json({ evaluation: evaluationResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengevaluasi" }, { status: 500 });
  }
}