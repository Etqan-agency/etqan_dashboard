"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/ui";
import { Field } from "@/components/fields";
import { API_BASE, USE_MOCK } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loginId, setLoginId] = useState("work@etqan.agency");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (!loginId || !password) {
      setError("Enter your login and password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(loginId, password);
      router.push("/overview");
    } catch (err: any) {
      setError(err?.status === 401 ? "Wrong login or password." : err.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "linear-gradient(170deg, var(--color-sky), var(--color-paper) 46%)",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 420, padding: 30, boxShadow: "var(--shadow-e3)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--color-ink)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
            }}
          >
            <Icon name="layers" size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: 16 }}>ETQAN</div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--color-faint)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Admin
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 23, letterSpacing: "-0.035em", fontWeight: 800 }}>Sign in to manage the site</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 13, margin: "6px 0 22px" }}>
          Staff accounts only. Everything you publish here goes live on etqan.agency.
        </p>

        {USE_MOCK ? (
          <div
            style={{
              background: "var(--color-amber-tint)",
              color: "var(--color-amber)",
              borderRadius: "var(--radius-md)",
              padding: "11px 13px",
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Running on sample data — no backend attached. Set NEXT_PUBLIC_API_BASE to connect the real API.
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              background: "var(--color-clay-tint)",
              color: "var(--color-clay)",
              borderRadius: "var(--radius-md)",
              padding: "10px 13px",
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        {USE_MOCK ? (
          <PrimaryButton className="btn-wide" onClick={() => router.push("/overview")}>
            Open the dashboard
          </PrimaryButton>
        ) : (
          <>
            <Field label="Email or username">
              <input
                className="input"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
            <PrimaryButton className="btn-wide" onClick={submit} disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </PrimaryButton>
            <p className="hint" style={{ marginTop: 14, textAlign: "center", fontFamily: "var(--font-mono)" }}>
              {API_BASE}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
