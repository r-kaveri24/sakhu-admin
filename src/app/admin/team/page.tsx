"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import uploadIcon from "@/assets/upload.png";
import { presignAndUpload } from "@/lib/uploadClient";

type Member = {
  id: string;
  name: string;
  designation?: string;
  avatarUrl: string;
};

export default function TeamPage() {
  const [selectedGroup, setSelectedGroup] = useState<"team" | "volunteer">("team");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; name: string }>({ open: false, id: null, name: "" });

  const [teamMembers, setTeamMembers] = useState<Member[]>([]);

  const [volunteerMembers, setVolunteerMembers] = useState<Member[]>([]);

  const members = selectedGroup === "team" ? teamMembers : volunteerMembers;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasDesignation = selectedGroup === "team";
  const [formName, setFormName] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFileName, setFormFileName] = useState("No file chosen");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const startUpload = () => {
    setIsEditing(false);
    setEditingId(null);
    setShowUpload(true);
    setFormName("");
    setFormDesignation("");
    setFormFile(null);
    setFormFileName("No file chosen");
    setFormError(null);
  };
  const closeUpload = () => {
    setShowUpload(false);
    setFormName("");
    setFormDesignation("");
    setFormFile(null);
    setFormFileName("No file chosen");
    setSubmitting(false);
    setFormError(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFormFile(f);
    setFormFileName(f ? f.name : "No file chosen");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTeam = selectedGroup === "team";
    try {
      setSubmitting(true);
      setFormError(null);
      if (!formName.trim()) {
        setFormError("Name is required");
        return;
      }
      // Upload image if provided
      let avatarUrl: string | undefined;
      if (formFile) {
        const { publicUrl } = await presignAndUpload(formFile, { feature: isTeam ? "team" : "volunteer" });
        avatarUrl = publicUrl;
      }

      if (isEditing && editingId) {
        const payload: any = { name: formName };
        if (avatarUrl) payload.avatarUrl = avatarUrl; // keep existing if undefined
        if (isTeam) payload.designation = formDesignation || null;

        const res = await fetch(`/api/${isTeam ? "team" : "volunteer"}?id=${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to save changes");
        }
        const updated = await res.json();
        if (isTeam) {
          setTeamMembers((prev) => prev.map((m) => (m.id === editingId ? { id: updated.id, name: updated.name, designation: updated.designation || undefined, avatarUrl: updated.avatarUrl || m.avatarUrl } : m)));
        } else {
          setVolunteerMembers((prev) => prev.map((m) => (m.id === editingId ? { id: updated.id, name: updated.name, avatarUrl: updated.avatarUrl || m.avatarUrl } : m)));
        }
      } else {
        const payload: any = { name: formName, avatarUrl };
        if (isTeam) payload.designation = formDesignation || undefined;
        const res = await fetch(`/api/${isTeam ? "team" : "volunteer"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to create");
        }
        const created = await res.json();
        if (isTeam) {
          setTeamMembers((prev) => [
            ...prev,
            { id: created.id, name: created.name, designation: created.designation || undefined, avatarUrl: created.avatarUrl || avatarUrl || "" },
          ]);
        } else {
          setVolunteerMembers((prev) => [
            ...prev,
            { id: created.id, name: created.name, avatarUrl: created.avatarUrl || avatarUrl || "" },
          ]);
        }
      }
      closeUpload();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Submission failed";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (member: Member) => {
    setIsEditing(true);
    setEditingId(member.id);
    setShowUpload(true);
    setFormName(member.name);
    setFormDesignation(member.designation || "");
    setFormFile(null);
    setFormFileName("No file chosen");
  };

  const beginDelete = (member: Member) => {
    setDeleteConfirm({ open: true, id: member.id, name: member.name });
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirm.id) return;
    const isTeam = selectedGroup === "team";
    try {
      const res = await fetch(`/api/${isTeam ? "team" : "volunteer"}?id=${encodeURIComponent(deleteConfirm.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      if (isTeam) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      } else {
        setVolunteerMembers((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm({ open: false, id: null, name: "" });
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Initial load of team and volunteer lists
  useEffect(() => {
    const load = async () => {
      try {
        const [teamRes, volRes] = await Promise.all([
          fetch("/api/team"),
          fetch("/api/volunteer"),
        ]);
        const teamData = await teamRes.json().catch(() => ({ items: [] }));
        const volData = await volRes.json().catch(() => ({ items: [] }));
        setTeamMembers((teamData.items || []).map((i: any) => ({ id: i.id, name: i.name, designation: i.designation || undefined, avatarUrl: i.avatarUrl || "" })));
        setVolunteerMembers((volData.items || []).map((i: any) => ({ id: i.id, name: i.name, avatarUrl: i.avatarUrl || "" })));
      } catch (err) {
        console.error("Failed to load members", err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto bg-white shadow border p-10 ">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-[#804499] text-white px-4 py-2 text-sm font-semibold shadow"
          >
            {selectedGroup === "team" ? "Our Team" : "Our Volunteer"}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-44 rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup("team");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50"
              >
                Our Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup("volunteer");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50"
              >
                Our Volunteer
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={startUpload}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Image src={uploadIcon} alt="Upload" width={16} height={16} />
          Upload
        </button>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple />
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
            <form onSubmit={onSubmit} className="p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {isEditing
                  ? hasDesignation
                    ? "Edit Team Member"
                    : "Edit Volunteer"
                  : hasDesignation
                    ? "Upload Team Member"
                    : "Upload Volunteer"}
              </h2>
              {formError && (
                <div className="mb-3 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
                  {formError}
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-md text-black border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#804499]"
                placeholder="Enter name"
                required
              />

              {hasDesignation && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full rounded-md text-black border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#804499]"
                    placeholder="Enter designation"
                  />
                </div>
              )}

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
                <button type="submit" disabled={submitting} className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold ${submitting ? "bg-[#804499]/60 cursor-not-allowed text-white" : "bg-[#804499] text-white"}`}>
                  {submitting ? "Submitting..." : isEditing ? "Save" : "Submit"}
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
            <h3 className="text-base font-semibold text-gray-900">Delete {hasDesignation ? "Team Member" : "Volunteer"}</h3>
            <p className="mt-2 text-sm text-gray-700">Are you sure you want to delete "{deleteConfirm.name}"?</p>
            <div className="mt-6 flex items-center gap-3 justify-end">
              <button type="button" onClick={() => setDeleteConfirm({ open: false, id: null, name: "" })} className="inline-flex items-center rounded-md border border-gray-300 bg-white text-gray-700 px-4 py-2 text-sm">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Preview</h3>
        <div className="-mx-1">
          <div className="flex items-stretch gap-4 overflow-x-auto px-1 py-2">
            {members.map((m) => (
              <div key={m.id} className="min-w-[180px] w-[180px] bg-white rounded-md shadow-sm border border-gray-200">
                <div className="h-[140px] w-full overflow-hidden rounded-t-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                </div>
                <div className="px-3 py-3">
                  <p className="text-xs font-semibold text-gray-900 leading-tight uppercase">{m.name}</p>
                  {hasDesignation && m.designation && (
                    <p className="mt-1 text-[11px] text-gray-600">{m.designation}</p>
                  )}
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
                <th className="text-left px-4 py-2">Profile</th>
                <th className="text-left px-4 py-2">Name</th>
                {hasDesignation && (
                  <th className="text-left px-4 py-2">Designation</th>
                )}
                <th className="text-center px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={m.id} className="border border-[#D8D6D6]">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-2">{m.name}</td>
                  {hasDesignation && (
                    <td className="px-4 py-2">{m.designation}</td>
                  )}
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-3">
                      <button type="button" onClick={() => beginEdit(m)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100" title="Edit">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => beginDelete(m)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100" title="Delete">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={hasDesignation ? 5 : 4} className="px-4 py-6 text-center text-gray-600">No entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}