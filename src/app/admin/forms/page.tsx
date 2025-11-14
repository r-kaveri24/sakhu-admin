"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/admin/Header";

type FormType = "donation" | "contact" | "volunteer";

type DonationRow = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  state?: string;
  address?: string;
  amount?: number | null;
  donationType?: string | null;
  adharCardNo?: string;
  panCardNo?: string;
  adharFileUrl?: string | null;
  panFileUrl?: string | null;
  createdAt: string;
};

type ContactRow = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  note?: string;
  createdAt: string;
};

type VolunteerRow = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  occupation?: string;
  areasOfWork?: string | null;
  availability?: string | null;
  fromTime?: string | null;
  toTime?: string | null;
  hoursPerDay?: number | null;
  preferredCity?: string;
  createdAt: string;
};

export default function FormsAdminPage() {
  const [type, setType] = useState<FormType>("donation");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<DonationRow | ContactRow | VolunteerRow>>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<DonationRow | ContactRow | VolunteerRow | null>(null);

  const endpoint = useMemo(() => {
    switch (type) {
      case "donation":
        return "/api/forms/donation";
      case "contact":
        return "/api/forms/contact";
      case "volunteer":
        return "/api/forms/volunteer";
    }
  }, [type]);

  const title = useMemo(() => "Forms", []);
  const dropdownLabel = useMemo(() => {
    return type === "donation" ? "Donation" : type === "contact" ? "Contact" : "Volunteer";
  }, [type]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load submissions");
        const data = await res.json();
        if (!ignore) setRows(data.items || []);
      } catch (e:any) {
        if (!ignore) setError(e.message || "Failed to load submissions");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [endpoint]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this submission?")) return;
    try {
      const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  return (
    <div className="h-full bg-white rounded-md flex flex-col">
      <div className="flex-1 p-4 overflow-auto">
        {/* Top bar: dropdown and refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-black">Forms</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FormType)}
              className="shadow rounded px-2 py-1 text-black"
            >
              <option value="donation">Donation</option>
              <option value="contact">Contact</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <button
            className="bg-[#804499] text-white px-3 py-2 rounded"
            onClick={() => {
              // trigger reload
              const ev = new Event("reload");
              // no-op; we just re-run effect by nudging state
              setType((t) => t);
            }}
          >
            Refresh
          </button>
        </div>

        {/* Preview panel, mirrors Gallery style with a right-side card-like area */}
        <div className=" gap-4 mb-6">
          <div className="w-full">
            <div className="bg-white rounded-md shadow border">
              <div className="p-4 border-b">
                <div className="font-semibold text-black">{dropdownLabel} Form Preview</div>
              </div>
              <div className="p-4 text-sm text-gray-700">
                {type === "donation" && (
                  <div>
                    <div className="font-medium mb-2">Personal Information (Donor)</div>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Name, Email, Mobile, State, Address</li>
                      <li>Amount, Type of Donation</li>
                      <li>Adhar Card No, Pan Card No, file uploads</li>
                      <li>Payment: Card Holder Name, Card Number, Expiry</li>
                    </ul>
                  </div>
                )}
                {type === "contact" && (
                  <div>
                    <div className="font-medium mb-2">Contact Form</div>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Name, Email, Mobile, Address</li>
                      <li>Note/Message</li>
                    </ul>
                  </div>
                )}
                {type === "volunteer" && (
                  <div>
                    <div className="font-medium mb-2">Volunteer Form</div>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Personal info and current occupation</li>
                      <li>Areas of work, availability, city preference</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
          </div>
        </div>

        {/* Table of submissions, standardized to testimonial table UI */}
        <div className="rounded-md border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold text-black">{dropdownLabel} Submissions</div>
            {loading && <div className="text-sm text-gray-600">Loading...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-black border border-[#D8D6D6] rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Mobile</th>
                  <th className="text-left px-4 py-2">Created</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-600">No submissions yet.</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border border-[#D8D6D6]">
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">{"email" in r ? (r.email || "") : ""}</td>
                      <td className="px-4 py-2">{"mobile" in r ? (r.mobile || "") : ""}</td>
                      <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="text-[#2E3192] hover:underline mr-3"
                          onClick={() => { setSelected(r); setViewOpen(true); }}
                        >
                          View
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => handleDelete(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewOpen && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-[90vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">{dropdownLabel} Submission</h3>
                <button className="text-gray-600 hover:text-black" onClick={() => setViewOpen(false)}>Close</button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input className="w-full border rounded px-3 py-2" value={selected.name || ""} readOnly />
                  </div>
                  {"email" in selected && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input className="w-full border rounded px-3 py-2" value={selected.email || ""} readOnly />
                    </div>
                  )}
                  {"mobile" in selected && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Mobile</label>
                      <input className="w-full border rounded px-3 py-2" value={selected.mobile || ""} readOnly />
                    </div>
                  )}
                  {"address" in selected && (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Address</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as any).address || ""} readOnly />
                    </div>
                  )}
                </div>

                {type === "donation" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Donation Amount</label>
                      <input className="w-full border rounded px-3 py-2" value={typeof (selected as DonationRow).amount === 'number' ? String((selected as DonationRow).amount) : ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Type of Donation</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as DonationRow).donationType || ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">State</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as DonationRow).state || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Adhar Card No</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as DonationRow).adharCardNo || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pan Card No</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as DonationRow).panCardNo || ""} readOnly />
                    </div>
                    {(selected as DonationRow).adharFileUrl && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Adhar File</label>
                        <a href={(selected as DonationRow).adharFileUrl || undefined} target="_blank" className="text-[#2E3192] underline break-all">{(selected as DonationRow).adharFileUrl}</a>
                      </div>
                    )}
                    {(selected as DonationRow).panFileUrl && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Pan File</label>
                        <a href={(selected as DonationRow).panFileUrl || undefined} target="_blank" className="text-[#2E3192] underline break-all">{(selected as DonationRow).panFileUrl}</a>
                      </div>
                    )}
                    <div className="md:col-span-2 mt-2">
                      <div className="font-medium text-gray-800 mb-2">Payment Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Card Holder Name</label>
                          <input className="w-full border rounded px-3 py-2" value={(selected as any).cardHolderName || ''} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Card Number</label>
                          <input className="w-full border rounded px-3 py-2" value={(selected as any).cardNumberLast4 ? `**** **** **** ${(selected as any).cardNumberLast4}` : ''} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Expiry</label>
                          <input className="w-full border rounded px-3 py-2" value={(selected as any).cardExpiry || ''} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">SVC/CVV</label>
                          <input className="w-full border rounded px-3 py-2" value={(selected as any).cardSVC ? '***' : 'Not stored for security'} readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {type === "contact" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Note</label>
                    <textarea className="w-full border rounded px-3 py-2" value={(selected as ContactRow).note || ""} readOnly rows={4} />
                  </div>
                )}

                {type === "volunteer" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Occupation</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).occupation || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Preferred City</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).preferredCity || ""} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Areas Of Work</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).areasOfWork || ""} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Availability</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).availability || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From Time</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).fromTime || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To Time</label>
                      <input className="w-full border rounded px-3 py-2" value={(selected as VolunteerRow).toTime || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hours Per Day</label>
                      <input className="w-full border rounded px-3 py-2" value={String((selected as VolunteerRow).hoursPerDay ?? "")} readOnly />
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">Created: {new Date(selected.createdAt).toLocaleString()}</div>
                <div className="flex justify-end pt-2">
                  <button className="bg-[#804499] text-white px-3 py-2 rounded" onClick={() => setViewOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}