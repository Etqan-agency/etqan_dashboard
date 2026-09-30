export function truncate(value: unknown, max: number) {
  const s = String(value ?? "");
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function timeAgo(value?: string | null) {
  if (!value) return "";
  const minutes = (Date.now() - new Date(value).getTime()) / 60000;
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
  return formatDate(value);
}

export function initials(name?: string) {
  if (!name) return "—";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** True for a full http(s) URL such as https://www.linkedin.com/company/etqan. */
export function isHttpUrl(value: unknown) {
  const s = String(value ?? "").trim();
  if (!/^https?:\/\//i.test(s)) return false;
  try {
    return Boolean(new URL(s).hostname);
  } catch {
    return false;
  }
}

/** Keys of a kv object whose values are not full http(s) URLs. */
export function invalidUrlKeys(value: Record<string, unknown> | null | undefined) {
  return Object.entries(value ?? {})
    .filter(([, v]) => !isHttpUrl(v))
    .map(([k]) => k);
}
