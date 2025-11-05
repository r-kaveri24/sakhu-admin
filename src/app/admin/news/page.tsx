"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import upload from "@/assets/upload.png";
import eye from "@/assets/eye.png";
import deleteIcon from "@/assets/delete.png";
import { presignAndUpload, s3KeyFromUrl } from "@/lib/uploadClient";

type Item = {
  id: string;
  heading: string;
  date?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

export default function NewsPage() {
  const [heading, setHeading] = useState("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectedFile = (f: File) => {
    setFile(f);
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
    }));
    setItems(mapped);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) return;
    if (!content.trim()) {
      setError("News content is required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let heroImageUrl: string | undefined;
      if (file) {
        const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { publicUrl } = await presignAndUpload(file, { feature: "news", slug });
        heroImageUrl = publicUrl;
      }

      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: heading,
          summary: description || undefined,
          content,
          heroImageUrl,
          isPublished: false,
        }),
      });

      setLoading(false);
      if (res.ok) {
        const newItem = await res.json();
        setHeading("");
        setDate("");
        setDescription("");
        setContent("");
        setFile(null);
        await load();
        router.push(`/admin/news-edit?id=${newItem.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Upload failed");
    }
  };

  const onDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const key = item?.imageUrl ? s3KeyFromUrl(item.imageUrl) : null;
    const url = key
      ? `/api/news?id=${encodeURIComponent(id)}&heroImageKey=${encodeURIComponent(key)}`
      : `/api/news?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      await load();
    }
  };

  return (
    <>
      <div className="max-w-7xl h-full mx-auto bg-white shadow border p-6 overflow-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create News Card</h1>
        </div>

        {/* Form Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#804499]/20 focus:border-[#804499]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discription</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px] text-sm text-gray-700 focus:outline-none resize-none"
                placeholder=""
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button"
                onClick={onSubmit}
                disabled={loading || !heading || !content} 
                className="rounded-md bg-[#804499] px-6 py-2 text-sm text-white font-medium hover:bg-[#804499]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Submit"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (heading && content) {
                    setPreviewItem({
                      id: "preview",
                      heading,
                      date,
                      description: content,
                      content,
                      imageUrl: mounted && file ? URL.createObjectURL(file) : undefined,
                      createdAt: new Date().toISOString()
                    });
                    setShowPreview(true);
                  }
                }} 
                className="rounded-md bg-[#2E3192] px-6 py-2 text-sm text-white font-medium hover:bg-[#2E3192]/90 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
          </div>

          {/* Right Column - Upload & Preview */}
          <div className="space-y-4">
            {/* Upload Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
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
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectedFile(f);
                  }}
                />
              </div>
              {file && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600">Selected: {file.name}</div>
                </div>
              )}
            </div>

            
           
          </div>
          {/* Card Preview */}
           <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Preview</label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
                {heading || content || file ? (
                  <div className="w-full">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {mounted && file && (
                        <div className="w-full h-40 bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        {heading && <h3 className="font-semibold text-gray-900 mb-1">{heading}</h3>}
                        {date && <p className="text-xs text-gray-500 mb-2">{date}</p>}
                        {content && (
                          <p className="text-sm text-gray-600 line-clamp-3">{content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm">
                    Fill in the form to see preview
                  </div>
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
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sr.No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heading</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Preview</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.heading}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewItem(item);
                          setShowPreview(true);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                      >
                        <Image src={eye} alt="Preview" width={20} height={20} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/news-edit?id=${item.id}`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
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
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Card Preview</h3>
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
              {previewItem.imageUrl && (
                <div className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewItem.imageUrl} alt={previewItem.heading} className="w-full h-64 object-cover rounded-lg" />
                </div>
              )}
              <h4 className="text-xl font-bold text-gray-900 mb-2">{previewItem.heading}</h4>
              {previewItem.date && (
                <p className="text-sm text-gray-500 mb-4">{previewItem.date}</p>
              )}
              {previewItem.description && (
                <p className="text-sm text-gray-700 mb-4">{previewItem.description}</p>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{previewItem.content}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
