"use client";

import { t } from "@/lib/i18n";
import { useLocale } from "@/providers/LocaleProvider";
import { Icon } from "./Icon";

/** ETQAN logo lockup (same artwork as the public site) with the panel label. */
export function BrandLockup({ compact }: { compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 8px" }}>
      {/* Logo artwork is Latin and must never be mirrored in RTL. */}
      <img
        src="/brand/etqan-logo.png"
        alt="ETQAN"
        width={compact ? 112 : 138}
        height={compact ? 35 : 43}
        style={{ width: compact ? 112 : 138, height: "auto", display: "block" }}
        dir="ltr"
      />
      <div
        style={{
          fontSize: 10.5,
          color: "var(--color-faint)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {t("Control panel")}
      </div>
    </div>
  );
}

/** EN / ع switch. */
export function LanguageToggle({ variant = "button" }: { variant?: "button" | "nav" }) {
  const { lang, toggle } = useLocale();
  const label = lang === "ar" ? t("Switch to English") : t("Switch to Arabic");
  return (
    <button
      type="button"
      className={variant === "nav" ? "nav-item" : "btn btn-ghost btn-sm lang-toggle"}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon name="globe" size={variant === "nav" ? 18 : 15} style={{ opacity: 0.8, flex: "none" }} />
      <span lang={lang === "ar" ? "en" : "ar"}>{lang === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
