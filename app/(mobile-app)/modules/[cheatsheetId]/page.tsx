"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MarkdownPreview from "@/components/notes/MarkdownPreview";

export default function CheatsheetDetailPage() {
  const { cheatsheetId } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Pastikan Anda membuat API route GET /api/cheatsheets/[cheatsheetId]
    fetch(`/api/cheatsheets/${cheatsheetId}`)
      .then((res) => res.json())
      .then((res) => setData(res.cheatsheet));
  }, [cheatsheetId]);

  if (!data) return <div className="p-10 text-center">Memuat catatan...</div>;

  return (
    <div className="min-h-screen bg-white p-6 md:p-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">{data.subtopic.title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownPreview content={data.content} />
      </div>
    </div>
  );
}