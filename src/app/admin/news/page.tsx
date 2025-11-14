"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import upload from "@/assets/upload.png";
import eye from "@/assets/eye.png";
import deleteIcon from "@/assets/delete.png";
import { presignAndUpload, s3KeyFromUrl } from "@/lib/uploadClient";
import NewsCardPreview from "@/components/admin/NewsCardPreview";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type Item = {
  id: string;
  heading: string;
  date?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
  publishedDay?: number;
  publishedMonth?: number;
  publishedYear?: number;
};

export default function NewsPage() {
  const [heading, setHeading] = useState("");
  const [date, setDate] = useState<string>("");
  const [pubDay, setPubDay] = useState<string>("");
  const [pubMonth, setPubMonth] = useState<string>("");
  const [pubYear, setPubYear] = useState<string>("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentHeroImageUrl, setCurrentHeroImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [previewMode, setPreviewMode] = useState<"card" | "news">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; heading: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: "#news-editor-toolbar",
      handlers: {
        undo: function(this: any) {
          if (this?.quill?.history) this.quill.history.undo();
        },
        redo: function(this: any) {
          if (this?.quill?.history) this.quill.history.redo();
        },
      },
    },
    history: { delay: 1000, maxStack: 500, userOnly: true },
  }), []);

  const quillModulesDesc = useMemo(() => ({
    toolbar: {
      container: "#desc-editor-toolbar",
      handlers: {
        undo: function(this: any) {
          if (this?.quill?.history) this.quill.history.undo();
        },
        redo: function(this: any) {
          if (this?.quill?.history) this.quill.history.redo();
        },
      },
    },
    history: { delay: 1000, maxStack: 500, userOnly: true },
  }), []);

  const quillFormats = useMemo(() => [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "blockquote",
    "code-block",
    "clean",
  ], []);

  const handleSelectedFiles = (selected: File[]) => {
    if (!selected || selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const load = async () => {
    setError(null);
    const res = await fetch("/api/news");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to load news cards");
      return;
    }
  const data = await res.json();
  const mapped = (data.items || []).map((n: any) => ({
    id: n.id,
    heading: n.title,
    date: n.publishedAt || "",
    description: n.summary,
    content: n.content,
    imageUrl: n.heroImage,
    createdAt: n.createdAt,
    publishedDay: n.publishedDay ?? undefined,
    publishedMonth: n.publishedMonth ?? undefined,
    publishedYear: n.publishedYear ?? undefined,
  }));
  setItems(mapped);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setHeading(item.heading || "");
    setDescription(item.description || "");
    setContent(item.content || "");
    const d = item.publishedDay;
    const m = item.publishedMonth;
    const y = item.publishedYear;
    if (typeof d === "number" && typeof m === "number" && typeof y === "number") {
      setPubDay(String(d));
      setPubMonth(String(m));
      setPubYear(String(y));
    } else {
      const iso = item.date || item.createdAt;
      try {
        const dt = new Date(iso);
        setPubDay(String(dt.getUTCDate()));
        setPubMonth(String(dt.getUTCMonth() + 1));
        setPubYear(String(dt.getUTCFullYear()));
      } catch {
        setPubDay("");
        setPubMonth("");
        setPubYear("");
      }
    }
    setCurrentHeroImageUrl(item.imageUrl || null);
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) return;
    const finalContent = (content || "").trim() || (description || "").trim();
    if (!finalContent) {
      setError("News content is required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let heroImageUrl: string | undefined;
      let imageUrls: string[] = [];
      if (files.length > 0) {
        const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        // Upload all selected files and collect public URLs
        const uploads = [] as Promise<{ publicUrl: string }> [];
        for (const f of files) {
          uploads.push(presignAndUpload(f, { feature: "news", slug }).then(({ publicUrl }) => ({ publicUrl })));
        }
        const results = await Promise.all(uploads);
        imageUrls = results.map(r => r.publicUrl);
        heroImageUrl = imageUrls[0];
      } else if (editingId) {
        heroImageUrl = currentHeroImageUrl || undefined;
      }

      const payload = {
        title: heading,
        summary: description || undefined,
        content: finalContent,
        heroImageUrl,
        imageUrls,
        isPublished: false,
        publishedDay: pubDay ? Number(pubDay) : undefined,
        publishedMonth: pubMonth ? Number(pubMonth) : undefined,
        publishedYear: pubYear ? Number(pubYear) : undefined,
      } as any;

      let res: Response;
      if (editingId) {
        res = await fetch("/api/news", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setLoading(false);
      if (res.ok) {
        setHeading("");
        setDate("");
        setPubDay("");
        setPubMonth("");
        setPubYear("");
        setDescription("");
        setContent("");
        setFiles([]);
        setEditingId(null);
        setCurrentHeroImageUrl(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (editingId ? "Save failed" : "Upload failed"));
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || (editingId ? "Save failed" : "Upload failed"));
    }
  };

  const confirmDeleteItem = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?id=${encodeURIComponent(confirmDelete.id)}`, { method: "DELETE" });
      setLoading(false);
      if (res.ok) {
        setConfirmDelete(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed");
      }
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Delete failed");
    }
  };

  return (
    <>
      <div className="max-w-7xl h-full mx-auto bg-white shadow border p-6 overflow-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create News</h1>
        </div>

        {/* Form Section */}
        <div className="space-y-8 mb-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#804499]/20 focus:border-[#804499]"
                placeholder=""
                required
              />
            </div>

            {/* Publication Date - Day / Month / Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publication Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={pubDay}
                  onChange={(e) => setPubDay(e.target.value)}
                  className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="DD"
                  aria-label="Publication day"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  value={pubMonth}
                  onChange={(e) => setPubMonth(e.target.value)}
                  className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="MM"
                  aria-label="Publication month"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9999}
                  value={pubYear}
                  onChange={(e) => setPubYear(e.target.value)}
                  className="w-28 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="YYYY"
                  aria-label="Publication year"
                />
              </div>
            </div>

            {/* Description - Rich Text Area */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div id="desc-editor-toolbar" className="ql-toolbar ql-snow flex flex-wrap items-center gap-2 mb-2">
                <span className="ql-formats">
                  <button className="ql-undo mr-2 text-black font-bold" type="button" aria-label="Undo">↶</button>
                  <button className="ql-redo text-black font-bold" type="button" aria-label="Redo">↷</button>
                </span>
                <span className="ql-formats">
                  <select className="ql-header text-black">
                    <option value="1">Heading</option>
                    <option value="2">Heading 2</option>
                    <option selected></option>
                  </select>
                  <select className="ql-size text-black ">
                    <option value="small"></option>
                    <option selected></option>
                    <option value="large"></option>
                    <option value="huge"></option>
                  </select>
                </span>
                <span className="ql-formats">
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-strike" />
                </span>
                <span className="ql-formats">
                  <select className="ql-color" />
                  <select className="ql-background" />
                </span>
                <span className="ql-formats">
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                </span>
                <span className="ql-formats">
                  <select className="ql-align" />
                </span>
                <span className="ql-formats">
                  <button className="ql-clean" />
                </span>
              </div>
              <ReactQuill
                theme="snow"
                value={description || ""}
                onChange={setDescription}
                modules={quillModulesDesc}
                formats={quillFormats}
                placeholder="Type description here..."
                className="w-full quill-desc bg-white rounded-md border border-gray-300 text-black"
                readOnly={false}
              />
            </div>

          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Upload Images</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Left: Upload box */}
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
                  <div 
                    className="cursor-pointer flex flex-col items-center"
                    onClick={() => inputRef.current?.click()}
                  >
                    <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <button
                      type="button"
                      className="rounded-md bg-[#2E3192] text-white px-6 py-2 text-sm font-medium hover:bg-[#2E3192]/90"
                    >
                      Upload File
                    </button>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const list = Array.from(e.target.files || []);
                      if (list.length) handleSelectedFiles(list);
                    }}
                  />
                </div>
                {false && files.length > 0 && (
                  <div className="mt-2 flex items-center justify-between ">
                    <div className="text-xs text-gray-600">Selected: {files.length} file(s)</div>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                      title="Clear all"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Selected info + Thumbnails Grid */}
              <div>
                {files.length > 0 && (
                  <div className="flex items-center justify-end mb-2">
                    <div className="text-xs text-gray-600 mr-2">Selected: {files.length} file(s)</div>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                      title="Clear all"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mounted && files.length > 0 ? (
                    files.map((f, idx) => (
                      <div key={idx} className="relative w-full h-24 bg-gray-100 rounded overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(f)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFileAt(idx)}
                          className="absolute top-1 right-1 px-2 py-1 text-xs rounded-full bg-white/90 border border-gray-300 text-gray-700 shadow hover:bg-white"
                          aria-label={`Remove image ${idx + 1}`}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm flex items-center justify-center">No images selected</div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit/Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button"
                onClick={onSubmit}
                disabled={loading || !heading || !(content || description)} 
                className="rounded-md bg-[#804499] px-6 py-2 text-sm text-white font-medium hover:bg-[#804499]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save" : "Submit")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setHeading("");
                    setDescription("");
                    setContent("");
                    setPubDay("");
                    setPubMonth("");
                    setPubYear("");
                    setFiles([]);
                    setCurrentHeroImageUrl(null);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* News Card List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">News Card List</h2>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-black border border-[#D8D6D6] rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Sr.No</th>
                  <th className="text-left px-4 py-2">Heading</th>
                  <th className="text-center px-4 py-2">Preview</th>
                  <th className="text-center px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border border-[#D8D6D6]">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{item.heading}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMode("card");
                            setPreviewItem(item);
                            setShowPreview(true);
                          }}
                          className="inline-flex items-center rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                          title="Card Preview"
                        >
                          Card
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMode("news");
                            setPreviewItem(item);
                            setShowPreview(true);
                          }}
                          className="inline-flex items-center rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                          title="News Preview"
                        >
                          News
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ id: item.id, heading: item.heading })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                          title="Delete"
                        >
                          <Image src={deleteIcon} alt="Delete" width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-600">
                      No news items yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Responsive, scrollable popup to match provided design */}
          <div className="bg-white rounded-lg w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{previewMode === "card" ? "Card Preview" : "News Preview"}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {previewMode === "card" ? (
                <div>
                  {/* News Card Preview (pixel-perfect) */}
                  {previewItem && (
                    <NewsCardPreview
                      heading={previewItem.heading}
                      description={previewItem.description}
                      imageUrl={previewItem.imageUrl}
                      day={previewItem.publishedDay ?? null}
                      month={previewItem.publishedMonth ?? null}
                      year={previewItem.publishedYear ?? null}
                      fallbackISO={previewItem.date || previewItem.createdAt}
                    />
                  )}
                </div>
              ) : (
                <div>
                  {/* Header and meta */}
                  <h4 className="text-[clamp(22px,3vw,28px)] font-bold text-gray-900 tracking-tight mb-2">{previewItem.heading}</h4>
                  <p className="text-sm text-gray-500 mb-5">
                    {(() => {
                      const d = previewItem.publishedDay;
                      const m = previewItem.publishedMonth;
                      const y = previewItem.publishedYear;
                      if (d && m && y) {
                        const dateObj = new Date(Date.UTC(y, m - 1, d));
                        return dateObj.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
                      }
                      const iso = previewItem.date || previewItem.createdAt;
                      try {
                        return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
                      } catch {
                        return iso || "";
                      }
                    })()}
                  </p>

                  {/* Description first for readability */}
                  {previewItem.description && (
                    <div className="prose prose-sm md:prose text-gray-800 leading-[1.7] break-words mb-6" dangerouslySetInnerHTML={{ __html: previewItem.description }} />
                  )}

                  {/* Full content */}
                  {previewItem.content && (
                    <div className="prose md:prose-lg text-gray-800 leading-[1.75] break-words mb-8" dangerouslySetInnerHTML={{ __html: previewItem.content }} />
                  )}

                  {/* Photo section at the end (or placeholder) */}
                  <div className="mt-4">
                    {previewItem.imageUrl ? (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewItem.imageUrl}
                          alt={previewItem.heading}
                          loading="lazy"
                          decoding="async"
                          className="w-full max-h-[420px] object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[240px] rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-label="No image available">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7zm3 8l4-4 3 3 3-3 4 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-[480px]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">Are you sure you want to delete?</p>
              <p className="mt-2 text-sm font-medium text-gray-900">{confirmDelete.heading}</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  className="rounded-md bg-red-600 px-5 py-2 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        :global(#desc-editor-toolbar) {
          position: relative;
          z-index: 50;
          overflow: visible;
        }
        :global(#news-editor-toolbar) {
          position: relative;
          z-index: 50;
          overflow: visible;
        }
        :global(#desc-editor-toolbar .ql-formats button) {
          padding: 2px 6px;
        }
        :global(.ql-toolbar.ql-snow) {
          background: #ffffff;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 0.375rem; /* rounded-md */
          position: relative;
          z-index: 50;
          overflow: visible;
        }
        :global(.ql-toolbar .ql-picker) {
          position: relative;
          z-index: 60;
        }
        :global(.ql-toolbar .ql-picker .ql-picker-options) {
          z-index: 1000;
        }
        :global(.quill-desc .ql-container) {
          min-height: 160px;
          background: #ffffff;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          position: relative;
          z-index: 1;
          pointer-events: auto;
          overflow: visible;
          box-sizing: border-box;
        }
        :global(.quill-desc .ql-editor) {
          min-height: 120px;
          padding: 0.5rem 0.75rem; /* py-2 px-3 to match inputs */
          cursor: text;
        }
        :global(.quill-desc .ql-editor.ql-blank::before) {
          content: attr(data-placeholder);
          color: #9ca3af; /* gray-400 */
          font-style: normal;
        }
      `}</style>
    </>
  );
}
