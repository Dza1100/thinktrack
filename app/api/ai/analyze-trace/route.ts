import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAnalysisPrompt, personas } from "@/lib/ai-prompts/analysis-prompt";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      subtopicId,
      steps,
      inputMethod = "mathquill",
    } = await req.json();

    // Ambil profil pengguna dan setting AI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { aiSettings: true },
    });

    if (!user)
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );

    // Gunakan Key dari database jika ada, jika tidak fallback ke env
    const apiKey = user.aiSettings?.apiKey || process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);

    // Tentukan persona
    const personaPrompt =
      personas[user.cognitiveMode as keyof typeof personas] || personas.REMAJA;
    const prompt = getAnalysisPrompt(personaPrompt, steps);

    const model = genAI.getGenerativeModel({
      model: user.aiSettings?.activeModel || "gemini-2.5-flash",
    });
    const result = await model.generateContent(prompt);

    const jsonString = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const aiResponse = JSON.parse(jsonString);

    // Simpan ke DB
    await prisma.thinkingTrace.create({
      data: {
        userId,
        subtopicId,
        inputMethod,
        stepData: steps,
        misconceptions: aiResponse,
        status: "analyzed",
      },
    });

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses analisis" },
      { status: 500 },
    );
  }
}
