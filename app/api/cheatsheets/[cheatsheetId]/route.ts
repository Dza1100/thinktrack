import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ cheatsheetId: string }> }) {
  const { cheatsheetId } = await params;
  const cheatsheet = await prisma.microCheatsheet.findUnique({
    where: { id: cheatsheetId },
    include: { subtopic: true }
  });
  return NextResponse.json({ cheatsheet });
}