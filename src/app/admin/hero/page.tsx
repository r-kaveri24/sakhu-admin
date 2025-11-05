"use client";
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import upload from "@/assets/upload.png";
import gallary from "@/assets/gallary.png";
import eye from "@/assets/eye.png";
import deleteIcon from "@/assets/delete.png";

type Item = { id: string; url: string; title?: string; createdAt: string };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string>("1728 x 800");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/hero");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to load hero images");
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("image", file);
    const res = await fetch("/api/hero", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      setFile(null);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/hero?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Delete failed");
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    await onDelete(confirm.id);
    setDeleting(false);
    setConfirm(null);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white shadow border p-6 overflow-hidden">
      <div className="mt-2 flex items-center justify-center flex-col gap-4 p-4">
        <p className="text-md text-gray-700 font-bold">Select Size For Images</p>
        <div className="mt-3 flex flex-wrap justify-between border p-3 rounded-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] bg-[#DEDEDE]">
          {[
            "1728 x 800",
            "1440 x 600",
            "769 x 354",
            "430 x 353",
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                size === s
                  ? "bg-[#2E3192] text-white"
                  : "text-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onUpload} className="mt-6 px-20 grid md:grid-cols-2 gap-10 items-start">
        {/* Upload Dropzone */}
        <div className="rounded-lg p-6 shadow-md">
          <div
            className="rounded-lg border-2 border-dashed border-[#2E3192] p-2 space-y-5 mb-4 mx-10 text-center cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex justify-center">
              <Image src={upload} alt="Upload" width={65} height={65} />
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md bg-[#2E3192] text-white px-4 py-2"
              >
                Upload File
              </button>
            </div>
            <p className="mt-2 text-sm text-[#676767]">Drag an image here</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !file}
            className="mt-6 rounded-md bg-[#804499] ml-[35%] px-10 py-2 text-white disabled:opacity-50"
          >
            Submit
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Uploaded Files */}
        <div className="p-2">
          <h3 className="text-md text-black font-bold">Uploaded Files</h3>
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between shadow-sm rounded-md border px-3 py-2">
                <div className="flex items-center gap-3">
                  <Image src={gallary} alt="Upload" width={25} height={25} />
                  <span className="text-sm text-gray-700 truncate max-w-[220px]">{it.title || it.url.split("/").pop()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={it.url} target="_blank" rel="noreferrer" className="rounded hover:bg-gray-100" aria-label="Preview">
                    <Image src={eye} alt="Preview" width={35} height={35} />
                  </a>
                  <button
                    onClick={() => setConfirm({ id: it.id, name: it.title || it.url.split("/").pop() || "" })}
                    className="rounded hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Image src={deleteIcon} alt="Delete" width={25} height={25} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-600">No hero images yet.</p>}
          </div>
        </div>
      </form>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
          <div className="relative bg-white rounded-xl shadow-lg border w-[360px] p-6">
            <button
              className="absolute top-1 right-3 text-black/70 hover:text-black"
              aria-label="Close"
              onClick={() => setConfirm(null)}
            >
              <span className="text-xl font-semibold">x</span>
            </button>
            <p className="text-center text-md text-black font-semibold">Are you sure you want delete?</p>
            {confirm.name && (
              <p className="mt-2 text-center text-xs text-gray-600 truncate">{confirm.name}</p>
            )}
            <div className="mt-6 flex items-center justify-center gap-9">
              <button
                type="button"
                className="px-6 py-2 text-sm rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-500"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}