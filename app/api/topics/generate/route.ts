/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

// Pastikan export dari file prompt Anda bernama generateTopicPrompt
// (sesuaikan jika di file Anda namanya getGenerateMateriPrompt)
import { generateTopicPrompt } from "@/lib/ai-prompts/generate-materi-prompt";

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash", // Default menggunakan model gratis terbaru
  groq: "llama-3.3-70b-versatile",
  grok: "llama-3.3-70b-versatile",
};

function sanitizeModel(provider: string, model: string) {
  if (provider === "gemini") {
    // Izinkan gemini-2.5-flash.
    // Jika user menggunakan model lama seperti gemini-pro, paksa pindah ke 3-flash.
    if (
      !model.includes("gemini-2.5-flash") &&
      !model.includes("gemini-2.5-flash") // jaga-jaga jika ada versi non-lite
    ) {
      return "gemini-2.5-flash";
    }
  }

  return model;
}

function resolveProviderAndModel(
  requestedProvider: string,
  requestedModel: string,
  aiSettings: {
    apiKey: string | null;
    activeModel: string;
  },
) {
  const provider = (requestedProvider || "").trim().toLowerCase();

  const providerHasKey = (candidate: string) => {
    switch (candidate) {
      case "gemini":
        return (
          Boolean(aiSettings.apiKey) || Boolean(process.env.GEMINI_API_KEY)
        );

      case "groq":
      case "grok":
        return Boolean(aiSettings.apiKey) || Boolean(process.env.GROQ_API_KEY);

      default:
        return false;
    }
  };

  const resolvedProvider = providerHasKey(provider)
    ? provider
    : ["groq", "grok", "gemini"].find(providerHasKey) || "gemini";

  const resolvedModel =
    resolvedProvider === provider
      ? sanitizeModel(provider, requestedModel)
      : PROVIDER_DEFAULT_MODELS[resolvedProvider];

  return {
    provider: resolvedProvider,
    model: resolvedModel,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      title: string;
      numSubtopics?: number;
      numExercisesPerSubtopic?: number;
    };

    if (!body?.title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // 1. Buat record Topic di DB
    const topic = await prisma.topic.create({
      data: {
        title: body.title,
        userId: session.user.id,
      },
    });

    // 2. Cek & Ambil AI Settings
    let aiSettings = await prisma.aISettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!aiSettings) {
      aiSettings = await prisma.aISettings.create({
        data: {
          userId: session.user.id,
          activeModel: "gemini-2.5-flash", // Default fallback
        },
      });
    }

    // 3. Ambil Cognitive Mode dari Database User
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { cognitiveMode: true },
    });

    if (!userProfile) {
      // Jika session tertinggal di browser tetapi user sudah tidak ada di DB
      return NextResponse.json(
        { error: "User session invalid. Please log out and log in again." },
        { status: 401 },
      );
    }

    // CASTING KE STRING AGAR TYPESCRIPT AMAN DARI ERROR ENUM
    const cognitiveModeStr = String(userProfile?.cognitiveMode || "BALANCED");

    // =============================================================
    // ADAPTIVE COGNITIVE SCAFFOLDING LOGIC (Penentuan Jumlah Modul)
    // =============================================================
    let targetModules = 5; // Default untuk BALANCED dan TEACHER
    
    if (cognitiveModeStr === "FAST") {
      targetModules = 3; // FAST diset ke 3 modul
    }

    // Jika request mengirim parameter manual, utamakan parameter request.
    const finalNumSubtopics = body.numSubtopics ?? targetModules;
    
    // Jumlah latihan soal otomatis dikurangi menjadi 2 agar memperlancar JSON parsing
    const finalNumExercises = body.numExercisesPerSubtopic ?? 2;

    // 4. Generate Prompt menggunakan parameter adaptif yang baru
    const prompt = generateTopicPrompt({
      title: body.title,
      cognitiveMode: cognitiveModeStr,
      numSubtopics: finalNumSubtopics,
      numExercisesPerSubtopic: finalNumExercises,
    });

    // 5. Resolve Provider & Model
    const { provider, model } = resolveProviderAndModel(
      "gemini",
      aiSettings.activeModel,
      {
        apiKey: aiSettings.apiKey,
        activeModel: aiSettings.activeModel,
      },
    );

    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${protocol}://${host}` : null);

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Cannot determine base URL" },
        { status: 500 },
      );
    }

    const cookieHeader = req.headers.get("cookie") || "";

    // 6. Panggil Endpoint Eksekutor AI Internal
    const aiResponse = await fetch(`${baseUrl}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        provider,
        model,
        prompt,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.json().catch(() => null);
      console.error("AI ERROR:", err);
      return NextResponse.json(
        { error: "AI generation failed", aiError: err?.error, aiRaw: err },
        { status: aiResponse.status },
      );
    }

    const aiData = await aiResponse.json();
    const rawText = aiData?.text || (typeof aiData === "string" ? aiData : "");

    if (!rawText) {
      throw new Error("AI returned empty response");
    }

    console.log("START RAW AI OUTPUT");
    console.log(rawText);
    console.log("END RAW AI OUTPUT");

    // 7. Parsing JSON AI
    let cleanedText = rawText.replace(/```json|```/gi, "").trim();
    
    // --- TAMBAHKAN PEMERSIH INI ---
    // 1. Mengubah karakter Enter literal menjadi \n agar valid JSON
    cleanedText = cleanedText.replace(/[\r\n]+/g, "\\n");
    
    // 2. Memperbaiki masalah escape character jika ada backslash tunggal
    cleanedText = cleanedText.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
    // ------------------------------

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      // Fallback manual...
      const start = cleanedText.indexOf("{");
      const end = cleanedText.lastIndexOf("}");
      parsed = JSON.parse(cleanedText.slice(start, end + 1));
    }

    // 8. Simpan Subtopik ke Database
    const createdSubtopics = await Promise.all(
      (parsed.subtopics || []).map((subtopic: any) =>
        prisma.subtopic.create({
          data: {
            topicId: topic.id,
            title: subtopic.title,
            level: subtopic.level || "Menengah",
            content: subtopic.content || "",
          },
        }),
      ),
    );

    // 9. Simpan Exercise/Latihan ke Database (Relasi ke Subtopik)
    const exercisePromises: Promise<any>[] = [];

    parsed.subtopics?.forEach((subtopic: any, index: number) => {
      const created = createdSubtopics[index];
      if (!created) return;

      (subtopic.exercises || []).forEach((exercise: any) => {
        exercisePromises.push(
          prisma.exercise.create({
            data: {
              subtopicId: created.id,
              type: exercise.type || "essay",
              question: exercise.question || "",
              answer: exercise.answer || "",
              explanation: exercise.explanation || "",
            },
          }),
        );
      });
    });

    await Promise.all(exercisePromises);

    return NextResponse.json({
      success: true,
      topic,
      subtopics: createdSubtopics,
    });
  } catch (error: any) {
    console.error("Generate materi error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
