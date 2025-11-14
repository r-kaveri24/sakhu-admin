"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "init" | "logging_in" | "logged_in" | "login_failed" | "error"
  >("init");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      setStatus("logging_in");
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@sakhu.org",
            password: "admin123",
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          setMessage(text || `Login failed with status ${res.status}`);
          setStatus("login_failed");
          return;
        }

        setStatus("logged_in");
        setMessage("Logged in successfully. Redirecting to News page...");
        // Redirect to News management after successful login
        router.replace("/admin/news");
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Unexpected error during login");
      }
    };
    run();
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Auto Login (Dev)</h1>
      <p>Status: {status}</p>
      {message && <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>}
      <p>If not redirected automatically, go to /admin/news manually.</p>
    </div>
  );
}