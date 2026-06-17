import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// GET: Mengambil setting saat halaman dimuat
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;

  if (!userId) {
    const { searchParams } = new URL(req.url);
    userId = searchParams.get("userId") || undefined;
  }

  if (!userId || userId === "undefined") {
    return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
  }

  let settings = await prisma.aISettings.findUnique({
    where: { userId },
    include: { user: { select: { cognitiveMode: true } } },
  });

  if (!settings) {
    settings = await prisma.aISettings.create({
      data: {
        userId,
        activeModel: "gemini-2.5-flash",
      },
      include: { user: { select: { cognitiveMode: true } } },
    });
  }

  return NextResponse.json(settings);
}

// PATCH: Menyimpan perubahan
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const userId = body.userId || session?.user?.id;

    if (!userId || userId === "undefined") {
      return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
    }

    const { apiKey, activeModel, cognitiveMode } = body;

    // Gunakan await langsung tanpa deklarasi const jika hasilnya tidak dipakai
    await prisma.aISettings.upsert({
      where: { userId },
      update: { apiKey, activeModel },
      create: { userId, apiKey, activeModel },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { cognitiveMode },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Patch Settings Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan" },
      { status: 500 },
    );
  }
}
