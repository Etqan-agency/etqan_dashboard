"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/ui";
import { Field } from "@/components/fields";
import { BrandLockup, LanguageToggle } from "@/components/Brand";
import { USE_MOCK } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useAuth } from "@/providers/AuthProvider";

const alertStyle = (tone: "clay" | "amber") => ({
  background: `var(--color-${tone}-tint)`,
  color: `var(--color-${tone})`,
  borderRadius: "var(--radius-md)",
  padding: "10px 13px",
  fontSize: 12.5,
  fontWeight: 600,
  marginBottom: 14,
});

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired")) setError(t("Your session ended. Sign in again."));
  }, []);

  async function submit() {
    setError("");
    if (!loginId || !password) {
      setError(t("Enter your login and password."));
      return;
    }
    setBusy(true);
    try {
      await signIn(loginId, password);
      router.push("/overview");
    } catch (err: any) {
      setError(
        err?.status === 401
          ? t("Wrong login or password.")
          : err?.status === 429
            ? t("Too many attempts. Wait a few minutes and try again.")
            : err?.message || t("Sign in failed."),
      );
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
        background: "var(--login-bg)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 30, boxShadow: "var(--shadow-e3)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
          <div style={{ marginInlineStart: -8 }}>
            <BrandLockup />
          </div>
          <div style={{ marginInlineStart: "auto" }}>
            <LanguageToggle />
          </div>
        </div>

        <h1 style={{ fontSize: 23, letterSpacing: "-0.02em", fontWeight: 700 }}>{t("Sign in to manage the site")}</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 13, margin: "6px 0 22px" }}>
          {t("Staff accounts only. Everything you publish here goes live on etqan.agency.")}
        </p>

        {USE_MOCK ? (
          <div style={alertStyle("amber")}>
            {t("Running on sample data — no backend attached. Set NEXT_PUBLIC_API_BASE to connect the real API.")}
          </div>
        ) : null}

        {error ? (
          <div role="alert" style={alertStyle("clay")}>
            {error}
          </div>
        ) : null}

        {USE_MOCK ? (
          <PrimaryButton className="btn-wide" onClick={() => router.push("/overview")}>
            {t("Open the dashboard")}
          </PrimaryButton>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label={t("Email or username")}>
              <input
                className="input"
                dir="ltr"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </Field>
            <Field label={t("Password")}>
              <div style={{ position: "relative" }} dir="ltr">
                <input
                  className="input"
                  dir="ltr"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingInlineEnd: 44 }}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("Hide password") : t("Show password")}
                  aria-pressed={showPassword}
                  title={showPassword ? t("Hide password") : t("Show password")}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                </button>
              </div>
            </Field>
            <PrimaryButton type="submit" className="btn-wide" disabled={busy}>
              {busy ? t("Signing in…") : t("Sign in")}
            </PrimaryButton>
          </form>
        )}
      </div>
    </main>
  );
}
