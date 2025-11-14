"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import uploadIcon from "@/assets/upload.png";
import { presignAndUpload } from "@/lib/uploadClient";

type PhotoItem = { id: string; title?: string; url: string };
// Video management removed from admin panel

export default function GalleryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; title: string }>(
    { open: false, id: null, title: "" }
  );

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const items = photos;

  const [formTitle, setFormTitle] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFileName, setFormFileName] = useState("No file chosen");

  const startUpload = () => {
    setIsEditing(false);
    setEditingId(null);
    setShowUpload(true);
    setFormTitle("");
    setFormFile(null);
    setFormFileName("No file chosen");
  };
  const closeUpload = () => {
    setShowUpload(false);
    setFormTitle("");
    setFormFile(null);
    setFormFileName("No file chosen");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFormFile(f);
    setFormFileName(f ? f.name : "No file chosen");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoto = true;
    try {
      let mediaUrl: string | undefined;
      let uploadKey: string | undefined;
      if (formFile) {
        const { key, publicUrl } = await presignAndUpload(
          formFile,
          { feature: "gallery_photo" }
        );
        mediaUrl = publicUrl;
        uploadKey = key;
      }

      if (isEditing && editingId) {
        const payload: any = { url: mediaUrl, caption: formTitle || undefined };
        if (uploadKey) payload.key = uploadKey;
        const path = "/api/gallery/photo";
        const res = await fetch(`${path}?id=${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save changes");
        const updated = await res.json();
        setPhotos((prev) => prev.map((p) => (p.id === editingId ? { id: updated.id, title: updated.caption || undefined, url: updated.url || p.url } : p)));
      } else {
        if (!formFile) return;
        const path = "/api/gallery/photo";
        const payload = { key: uploadKey, url: mediaUrl, caption: formTitle || undefined } as any;
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setPhotos((prev) => [{ id: created.id, title: created.caption || undefined, url: created.url || mediaUrl || "" }, ...prev]);
      }
      closeUpload();
    } catch (err) {
      console.error(err);
    }
  };

  const beginEdit = (id: string, title?: string) => {
    setIsEditing(true);
    setEditingId(id);
    setShowUpload(true);
    setFormTitle(title || "");
    setFormFile(null);
    setFormFileName("No file chosen");
  };

  const beginDelete = (id: string, title?: string) => {
    setDeleteConfirm({ open: true, id, title: title || "" });
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirm.id) return;
    const isPhoto = true;
    try {
      const path = "/api/gallery/photo";
      const res = await fetch(`${path}?id=${encodeURIComponent(deleteConfirm.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPhotos((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm({ open: false, id: null, title: "" });
    }
  };

  // Dropdown menu removed

  useEffect(() => {
    const load = async () => {
      try {
        const photoRes = await fetch("/api/gallery/photo");
        const photoData = await photoRes.json().catch(() => ({ items: [] }));
        setPhotos((photoData.items || []).map((i: any) => ({ id: i.id, title: i.caption || undefined, url: i.url })));
      } catch (err) {
        console.error("Failed to load gallery", err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto bg-white shadow border p-10 ">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
         <h3 className="text-lg font-semibold text-gray-900 mb-6">Preview</h3>
        <button
          type="button"
          onClick={startUpload}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Image src={uploadIcon} alt="Upload" width={16} height={16} />
          Upload
        </button>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
            <form onSubmit={onSubmit} className="p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {isEditing ? "Edit Image" : "Upload Image"}
              </h2>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-md text-black border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#804499]"
                placeholder="Enter title"
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                <div className="flex items-center gap-3">
                  <label htmlFor="upload-file" className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-900 cursor-pointer">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16V4H4zm8 12l-4-4 1.41-1.41L11 12.17l3.59-3.58L16 10l-4 4z" />
                    </svg>
                    Choose File
                  </label>
                  <input id="upload-file" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  <span className="text-sm text-gray-600">{formFileName}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button type="submit" className="inline-flex items-center rounded-md bg-[#804499] text-white px-4 py-2 text-sm font-semibold">
                  {isEditing ? "Save" : "Submit"}
                </button>
                <button type="button" onClick={closeUpload} className="inline-flex items-center rounded-md border border-gray-300 bg-white text-gray-700 px-4 py-2 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-lg p-6">
            <h3 className="text-base font-semibold text-gray-900">Delete Image</h3>
            <p className="mt-2 text-sm text-gray-700">Are you sure you want to delete "{deleteConfirm.title}"?</p>
            <div className="mt-6 flex items-center gap-3 justify-end">
              <button type="button" onClick={() => setDeleteConfirm({ open: false, id: null, title: "" })} className="inline-flex items-center rounded-md border border-gray-300 bg-white text-gray-700 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteItem} className="inline-flex items-center rounded-md bg-red-600 text-white px-4 py-2 text-sm font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview section */}
      <div>
       
        <div className="-mx-1">
          <div className="flex items-stretch gap-4 overflow-x-auto px-1 py-2">
            {items.map((it) => (
              <div key={it.id} className="min-w-[180px] w-[180px] bg-white rounded-md shadow-sm border border-gray-200">
                <div className="h-[140px] w-full overflow-hidden rounded-t-md bg-black">
                  {
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt={it.title || "Image"} className="h-full w-full object-cover" />
                  }
                </div>
                <div className="px-3 py-3">
                  {it.title && <p className="text-xs font-semibold text-gray-900 leading-tight uppercase">{it.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm text-black border border-[#D8D6D6] rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Sr.No</th>
                <th className="text-left px-4 py-2">Preview</th>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-center px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border border-[#D8D6D6]">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="h-12 w-12 overflow-hidden bg-gray-100 rounded">
                      {
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.url} alt={it.title || "Image"} className="h-full w-full object-cover" />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-2">{it.title || "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-3">
                      <button type="button" onClick={() => beginEdit(it.id, it.title)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100" title="Edit">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => beginDelete(it.id, it.title)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100" title="Delete">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-600">No entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}