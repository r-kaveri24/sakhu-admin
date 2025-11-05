"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-[#FFF0FF] p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}