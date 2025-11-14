"use client";
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import upload from "@/assets/upload.png";
import eye from "@/assets/eye.png";
import deleteIcon from "@/assets/delete.png";
import { presignAndUpload, s3KeyFromUrl } from "@/lib/uploadClient";

type Item = { id: string; name: string; role?: string; quote: string; createdAt: string; imageUrl?: string; rating?: number };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState<number>(3);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Item | null>(null);
  // Cropping state
  const [cropping, setCropping] = useState<boolean>(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/testimonials");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to load testimonials");
      return;
    }
    const data = await res.json();
    const mapped = (data.items || []).map((i: any) => ({
      ...i,
      imageUrl: i?.imageUrl ?? i?.avatar ?? undefined,
    }));
    setItems(mapped);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let avatarUrl: string | undefined;
      if (file) {
        const { publicUrl } = await presignAndUpload(file, { feature: "testimonials" });
        avatarUrl = publicUrl;
      }

      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          quote,
          avatarUrl,
          order: 0,
          isActive: true,
          rating,
        }),
      });

      setLoading(false);
      if (res.ok) {
        setName("");
        setRole("");
        setQuote("");
        setRating(3);
        setFile(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add testimonial");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Failed to add testimonial");
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    const item = items.find((i) => i.id === id);
    const imageKey = item?.imageUrl ? s3KeyFromUrl(item.imageUrl) : null;
    const url = imageKey
      ? `/api/testimonials?id=${encodeURIComponent(id)}&imageKey=${encodeURIComponent(imageKey)}`
      : `/api/testimonials?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE" });
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

  const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="p-1"
          onClick={() => onChange?.(n)}
          aria-label={`Set rating ${n}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={n <= value ? "#FFC107" : "none"} stroke={n <= value ? "#FFC107" : "#C8CCD0"}>
            <path d="M12 17.3 6.8 20l1-5.8L4 9.5l5.9-.9L12 3l2.1 5.6 5.9.9-3.8 4.7 1 5.8z"/>
          </svg>
        </button>
      ))}
    </div>
  );

  const previewUrl = file ? URL.createObjectURL(file) : undefined;

  // Crop helpers
  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (e) => reject(e));
      img.src = url;
    });

  const getCroppedBlob = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      }, "image/png");
    });
  };

  const handleSelectedFile = (f: File) => {
    if (!f) return;
    const src = URL.createObjectURL(f);
    setCropSrc(src);
    setCropping(true);
  };

  return (
    <div className="max-w-7xl h-full mx-auto bg-white shadow border p-6 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left form */}
        <form onSubmit={onSubmit} className="md:col-span-2">
          <h2 className="text-xl font-semibold text-black mb-3">Create New Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-black">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-black" />
              <label className="mt-4 block text-sm text-black">Discription</label>
              <textarea value={quote} onChange={(e) => setQuote(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-black h-[120px]" />
              <label className="mt-4 block text-sm text-black">Designation</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-black" />
              <label className="mt-4 block text-sm text-black">Ratings</label>
              <Stars value={rating} onChange={(v) => setRating(v)} />
              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={loading || !name || !quote} className="rounded-md bg-[#804499] px-5 py-2 text-white disabled:opacity-50">Submit</button>
                <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-md bg-[#2E3192] px-5 py-2 text-white">Preview</button>
              </div>
            </div>
            {/* Upload box */}
            <div className="">
              <div className="rounded-lg border p-3 w-full max-w-xs flex flex-col items-center gap-8 shadow-md">
                <p className="text-sm text-gray-700 font-bold">Upload Profile Image</p>
                <div
                  className="mt-3 rounded-lg border-2 border-dashed border-[#2E3192]/40 p-10 text-center cursor-pointer w-58 "
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleSelectedFile(f); }}
                >
                  <div className="flex justify-center">
                    <Image src={upload} alt="Upload" width={54} height={54} />
                  </div>
                  
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelectedFile(f); }} />
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-md bg-[#2E3192] text-white px-4 py-2">Upload File</button>
              </div>
            </div>
          </div>
        </form>

        {/* Right preview */}
        <div className="md:col-span-1">
          <p className="text-sm text-black">Testimonial Preview</p>
          <div className="mt-2 min-h-[280px] rounded-md border bg-white relative p-5">
            {previewOpen && (name || quote || role || previewUrl) ? (
              <>
                <button
                  type="button"
                  aria-label="Close preview"
                  className="absolute top-3 right-3 text-black/80 hover:text-black text-2xl leading-none"
                  onClick={() => setPreviewOpen(false)}
                >
                  ×
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {previewUrl ? (
                      <Image src={previewUrl} alt="Profile" width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-800 line-clamp-3">
                    “{quote || "Your testimonial description will appear here."}”
                  </p>
                  <p className="mt-4 text-2xl font-bold text-black">{name || "Name"}</p>
                  <p className="text-sm text-gray-600">{role || "Designation"}</p>
                  <div className="mt-4"><Stars value={rating} /></div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-sm text-gray-500">No preview</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-8">
        <p className="text-md font-semibold text-black mb-3">Testimonials list</p>
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm text-black border border-[#D8D6D6] rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Sr.No</th>
                <th className="text-left px-4 py-2">Profile</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Designation</th>
                <th className="text-left px-4 py-2">Review</th>
                <th className="text-left px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border border-[#D8D6D6]">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    {it.imageUrl ? (
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-100">
                        <Image src={it.imageUrl} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-200" />
                    )}
                  </td>
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2 text-gray-700 line-clamp-2 max-w-[360px]">{it.quote}</td>
                  <td className="px-4 py-2">{it.role || "-"}</td>
                  <td className="px-4 py-2"><Stars value={it.rating || 0} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="p-1 rounded"
                        aria-label="View"
                        onClick={() => setViewItem(it)}
                      >
                        <Image src={eye} alt="View" width={20} height={20} />
                      </button>
                      <button
                        className="p-1 rounded"
                        aria-label="Delete"
                        onClick={() => setConfirm({ id: it.id, name: it.name })}
                      >
                        <Image src={deleteIcon} alt="Delete" width={18} height={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-600">No testimonials yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
          <div className="relative bg-white rounded-xl shadow-lg border w-[360px] p-6">
            <button className="absolute top-3 right-3 text-black/70 hover:text-black" aria-label="Close" onClick={() => setConfirm(null)}>×</button>
            <p className="text-center text-sm text-black font-medium">Are you sure you want delete?</p>
            {confirm.name && (<p className="mt-2 text-center text-xs text-gray-600 truncate">{confirm.name}</p>)}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-50" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" disabled={deleting} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
          <div className="relative bg-white rounded-2xl shadow-lg border w-[440px] p-6">
            <button className="absolute top-3 right-3 text-black/80 hover:text-black text-2xl leading-none" aria-label="Close view" onClick={() => setViewItem(null)}>×</button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                {viewItem.imageUrl ? (
                  <Image src={viewItem.imageUrl} alt="Profile" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-800 line-clamp-3">“{viewItem.quote}”</p>
              <p className="mt-4 text-2xl font-bold text-black">{viewItem.name}</p>
              <p className="text-sm text-gray-600">{viewItem.role || ""}</p>
              <div className="mt-4"><Stars value={viewItem.rating || 0} /></div>
            </div>
          </div>
        </div>
      )}

      {cropping && cropSrc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-lg w-[90vw] max-w-[640px] p-4">
            <div className="relative w-full h-[360px] bg-gray-100 rounded-md overflow-hidden">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-gray-600">Zoom</span>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
                onClick={() => {
                  setCropping(false);
                  if (cropSrc) URL.revokeObjectURL(cropSrc);
                  setCropSrc(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#2E3192] text-white"
                onClick={async () => {
                  if (!cropSrc || !croppedAreaPixels) return;
                  try {
                    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
                    const croppedFile = new File([blob], "profile-cropped.png", { type: "image/png" });
                    setFile(croppedFile);
                    setCropping(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    URL.revokeObjectURL(cropSrc);
                    setCropSrc(null);
                  }
                }}
              >
                Crop & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}