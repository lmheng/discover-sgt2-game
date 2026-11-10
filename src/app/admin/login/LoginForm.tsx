"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <form
      className="w-full max-w-sm rounded-2xl border p-6"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ passcode }),
        });
        setBusy(false);
        if (res.ok) {
          router.replace("/admin");
          return;
        }
        setPasscode("");
        setError(
          res.status === 503
            ? "Admin access is not configured on this server (set ADMIN_PASSCODE_HASH and ADMIN_SESSION_SECRET)."
            : res.status === 429
              ? "Too many attempts. Wait a minute and try again."
              : "Incorrect passcode.",
        );
      }}
    >
      <h1 className="text-xl font-bold">Admin sign-in</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Authorised SG Translate 2.0 team members only.
      </p>
      <label className="mt-4 flex flex-col gap-1 text-sm font-semibold">
        Passcode
        <input
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="min-h-11 rounded-lg border px-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          data-testid="admin-passcode"
          required
        />
      </label>
      {error ? (
        <p className="mt-3 text-sm font-medium" style={{ color: "#d03b3b" }} role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 min-h-11 w-full rounded-lg font-semibold text-white disabled:opacity-60"
        style={{ background: "#1c5cab" }}
        data-testid="admin-login"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
