"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import loginbg from "@/assets/loginbg.png";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Clear any existing user data
    localStorage.removeItem('user');
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Navigate to hero page; AuthContext will initialize on route change
        router.replace("/admin/hero");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image src={loginbg} alt="Background" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm rounded-xl bg-white/60  p-6 shadow-2xl"
        >
          <div className="flex justify-center mb-10">
            <Image src={logo} alt="Logo" width={72} height={72} className="rounded-full" />
          </div>

          <div className="space-y-4">
            <div>
              
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white/70 px-3 py-2 text-gray-900 shadow-sm focus:border-purple-600 focus:outline-none"
                placeholder="Admin ID"
                required
              />
            </div>

            <div>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white/70 px-3 py-2 text-gray-900 shadow-sm focus:border-purple-600 focus:outline-none"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3 w-3 rounded border-gray-300"
                />
                Remember me
              </label>
              <a href="#" className="hover:text-purple-700">Forgot password?</a>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-[#2E3192] px-4 py-2 text-white hover:bg-[#2E3192]/90"
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}