// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// Interface yang jelas untuk request payload
interface AIRequest {
  provider?: string;
  model?: string;
  prompt: string;
  instruction?: string;
}

// Interface untuk payload Gemini
interface GeminiPayload {
  contents: { role: string; parts: { text: string }[] }[];
  systemInstruction?: { parts: { text: string }[] };
}

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash", // Menggunakan versi flash yang lebih standar
  grok: "llama-3.3-70b-versatile",
  groq: "llama-3.3-70b-versatile",
};

function normalizeGeminiModel(model: string) {
  let normalized = (model || "").trim().toLowerCase();

  if (normalized.startsWith("models/")) {
    normalized = normalized.replace("models/", "");
  }

  // Jika kosong atau memakai nama lama, set ke gemini-2.5-flash
  if (
    !normalized ||
    normalized === "gemini-pro" ||
    normalized === "gemini 2.5 flash" ||
    normalized.includes("3-flash") ||
    normalized.includes("3.1-flash") // Menangani typo yang ada sebelumnya
  ) {
    return "gemini-2.5-flash";
  }

  return normalized;
}

function getProviderFromModel(model: string): string {
  const m = (model || "").toLowerCase();
  if (m.includes("gemini")) return "gemini";
  if (m.includes("llama") || m.includes("grok") || m.includes("groq"))
    return "groq";
  return "gemini";
}

function resolveProviderAndModel(
  requestedProvider: string,
  requestedModel: string,
  aiSettings: { apiKey: string | null },
) {
  const provider = (requestedProvider || "").trim().toLowerCase();

  const providerHasKey = (candidate: string) => {
    switch (candidate) {
      case "gemini":
        return Boolean(aiSettings.apiKey || process.env.GEMINI_API_KEY);
      case "groq":
      case "grok":
        return Boolean(process.env.GROQ_API_KEY);
      default:
        return false;
    }
  };

  const resolvedProvider = providerHasKey(provider)
    ? provider
    : ["gemini", "groq"].find(providerHasKey) || "gemini";

  const resolvedModel =
    resolvedProvider === provider
      ? requestedModel
      : PROVIDER_DEFAULT_MODELS[resolvedProvider];

  return {
    provider: resolvedProvider,
    model: resolvedModel,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json()) as AIRequest;
    const { model, prompt, instruction } = body;
    let { provider } = body;

    let aiSettings = await prisma.aISettings.findUnique({
      where: { userId: user.id },
    });

    if (!aiSettings) {
      aiSettings = await prisma.aISettings.create({
        data: {
          userId: user.id,
          activeModel: "gemini-2.5-flash", // Menggunakan default yang standar
        },
      });
    }

    if (!provider) {
      provider = getProviderFromModel(model || aiSettings.activeModel);
    }
    const targetModel = model || aiSettings.activeModel;

    let apiKey: string | null = null;
    let response: { provider: string; model: string; text: string };

    const resolved = resolveProviderAndModel(
      provider,
      normalizeGeminiModel(targetModel),
      aiSettings,
    );

    switch (resolved.provider) {
      case "gemini":
        try {
          apiKey = aiSettings.apiKey || process.env.GEMINI_API_KEY || null;
          response = await callGemini(
            resolved.model,
            prompt,
            instruction,
            apiKey,
          );

          if (!response?.text?.trim()) {
            throw new Error("Gemini returned empty response");
          }
        } catch (geminiError) {
          console.error("Gemini failed, fallback to Groq:", geminiError);
          const groqKey = process.env.GROQ_API_KEY || null;

          if (!groqKey) {
            throw new Error("Gemini failed and GROQ_API_KEY not configured");
          }

          response = await callGroq(
            "llama-3.3-70b-versatile",
            prompt,
            instruction,
            groqKey,
          );

          if (!response?.text?.trim()) {
            throw new Error("Groq returned empty response");
          }
        }
        break;

      case "groq":
      case "grok":
        response = await callGroq(
          resolved.model,
          prompt,
          instruction,
          process.env.GROQ_API_KEY || null,
        );

        if (!response?.text?.trim()) {
          throw new Error("Groq returned empty response");
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${resolved.provider}` },
          { status: 400 },
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error calling AI provider:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function callGemini(
  model: string,
  prompt: string,
  instruction: string | undefined,
  apiKey: string | null,
) {
  if (!apiKey) throw new Error("Gemini API key not configured");

  const candidate = normalizeGeminiModel(model);

  const payload: GeminiPayload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  if (instruction?.trim()) {
    payload.systemInstruction = {
      parts: [{ text: instruction }],
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error("Gemini Error:", errorPayload);
    throw new Error(`Gemini API Error (${response.status}): ${errorPayload}`);
  }

  // Menggunakan tipe unknown agar typescript aman tanpa "any"
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
  };

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

  return { provider: "gemini", model: candidate, text };
}

async function callGroq(
  model: string,
  prompt: string,
  instruction: string | undefined,
  apiKey: string | null,
) {
  if (!apiKey) throw new Error("Groq API key not configured");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          ...(instruction ? [{ role: "system", content: instruction }] : []),
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  const data = (await response.json()) as {
    error?: { message: string };
    choices?: Array<{ message?: { content: string } }>;
  };

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `Groq API Error (${response.status})`,
    );
  }

  const text = data?.choices?.[0]?.message?.content ?? "";

  if (!text.trim()) throw new Error("Groq returned empty content");

  return { provider: "groq", model, text };
}
