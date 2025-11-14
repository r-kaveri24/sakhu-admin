"use client";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: fetch notifications when API is added
    setLoading(false);
  }, []);

  return (
    <div className="max-w-ful h-full mx-auto bg-white rounded-md shadow border p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>
      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-600">No notifications yet.</div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="p-4 border rounded-md">
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-gray-700">{n.message}</div>
              <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}