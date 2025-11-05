"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { presignAndUpload } from "@/lib/uploadClient";

export type NewsItemData = {
  id: string;
  title: string;
  summary?: string;
  content: string;
  heroImage?: string;
  publishedAt?: string | null;
  createdAt?: string;
};

type Props = {
  item: NewsItemData;
  onSave: (payload: { id: string; title: string; summary?: string; content: string; heroImageUrl?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  allowEdit?: boolean;
};

export default function NewsUnifiedCard({ item, onSave, onDelete, allowEdit = true }: Props) {
  const [mode, setMode] = useState<"card" | "full" | "edit">("card");
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary || "");
  const [content, setContent] = useState(item.content || "");
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(item.heroImage || undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      let uploadedUrl = heroImageUrl;
      if (imageFile) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { publicUrl } = await presignAndUpload(imageFile, { feature: "news", slug });
        uploadedUrl = publicUrl;
      }
      await onSave({ id: item.id, title, summary: summary || undefined, content, heroImageUrl: uploadedUrl });
      setMode("card");
      setImageFile(null);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children }: { children: string }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
  );

  const dateStr = item.publishedAt || item.createdAt || "";

  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900" id={`news-title-${item.id}`}>{title}</h3>
        <div className="flex items-center gap-2">
          {allowEdit && (
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              onClick={() => setMode((m) => (m === "edit" ? "card" : "edit"))}
              aria-controls={`news-content-${item.id}`}
              aria-expanded={mode === "edit"}
            >
              {mode === "edit" ? "Close Edit" : "Edit"}
            </button>
          )}
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-md bg-[#2E3192] text-white hover:bg-[#2E3192]/90"
            onClick={() => setMode((m) => (m === "full" ? "card" : "full"))}
            aria-controls={`news-content-${item.id}`}
            aria-expanded={mode === "full"}
          >
            {mode === "full" ? "Collapse" : "Read more"}
          </button>
          {onDelete && (
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              onClick={() => onDelete(item.id)}
              aria-label="Delete news"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      {/* Image */}
      {heroImageUrl && (
        <div className={`w-full ${mode === "card" ? "h-40" : "h-64"} bg-gray-100 transition-all`}>{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div id={`news-content-${item.id}`} className="p-4 space-y-3">
        {dateStr && <p className="text-xs text-gray-500">{dateStr}</p>}
        {summary && (
          <p className={`text-sm text-gray-700 ${mode === "card" ? "line-clamp-2" : ""}`}>{summary}</p>
        )}
        <div className={`text-sm text-gray-800 whitespace-pre-wrap ${mode === "card" ? "line-clamp-3" : ""}`} aria-describedby={`news-title-${item.id}`}>
          {content}
        </div>

        {/* Edit mode */}
        {mode === "edit" && allowEdit && (
          <form className="mt-2 space-y-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
              <Label>Heading</Label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                aria-required
              />
            </div>
            <div>
              <Label>Summary</Label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              />
            </div>
            <div>
              <Label>Content</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[140px]"
                aria-required
              />
            </div>

            {/* Shared toolkit */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Toolkit:</span>
              <button type="button" className="px-2 py-1 rounded border" onClick={() => setContent((c) => `**${c}**`)} aria-label="Bold">
                B
              </button>
              <button type="button" className="px-2 py-1 rounded border italic" onClick={() => setContent((c) => `*${c}*`)} aria-label="Italic">
                I
              </button>
              <button type="button" className="px-2 py-1 rounded border" onClick={() => setContent((c) => `- ${c}`)} aria-label="List">
                •
              </button>
            </div>

            {/* Image upload */}
            <div>
              <Label>Hero Image</Label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <button type="button" className="px-3 py-1.5 rounded-md bg-[#2E3192] text-white" onClick={() => fileInputRef.current?.click()}>
                  {imageFile ? "Change Image" : "Upload Image"}
                </button>
                {imageFile && <span className="text-xs text-gray-600">{imageFile.name}</span>}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="px-4 py-2 rounded-md bg-[#804499] text-white disabled:opacity-50" disabled={loading || !title || !content}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" className="px-4 py-2 rounded-md border" onClick={() => { setMode("card"); setImageFile(null); setError(null); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}