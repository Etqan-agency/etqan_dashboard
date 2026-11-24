/**
 * Client mirror of the backend role table (backend/apps/accounts/roles.py).
 * The server is the authority — this only decides what the UI shows. Every
 * write is still checked by the API.
 */
import type { User } from "./types";

export type Role = "writer" | "content_creator" | "editor" | "admin" | "super_admin";

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "writer", label: "Writer", description: "Writes their own articles and sends them for review." },
  {
    value: "content_creator",
    label: "Content creator",
    description: "Writer + edits website content: services, portfolio, testimonials, team, clients, FAQs.",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Content creator + reviews, approves, schedules and publishes all articles; manages authors.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Everything on the site: settings, inbox, redirects and user accounts below admin.",
  },
  { value: "super_admin", label: "Super admin", description: "Full control, including other admins and super admins." },
];

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const RANK: Record<Role, number> = { writer: 10, content_creator: 20, editor: 30, admin: 40, super_admin: 50 };

export type Capability =
  | "dashboard"
  | "uploads"
  | "blog.write_own"
  | "content"
  | "blog.review"
  | "blog.publish"
  | "authors"
  | "redirects"
  | "settings"
  | "messages"
  | "users"
  | "users.admins";

const MIN_ROLE: Record<Capability, Role> = {
  dashboard: "writer",
  uploads: "writer",
  "blog.write_own": "writer",
  content: "content_creator",
  "blog.review": "editor",
  "blog.publish": "editor",
  authors: "editor",
  redirects: "admin",
  settings: "admin",
  messages: "admin",
  users: "admin",
  "users.admins": "super_admin",
};

/** Effective role, matching the backend's legacy fallbacks. */
export function roleOf(user: User | null | undefined): Role | null {
  if (!user) return null;
  if (user.role && user.role in RANK) return user.role as Role;
  if (user.is_staff || user.is_admin) return "admin"; // older API without roles
  return null;
}

export function can(user: User | null | undefined, cap: Capability): boolean {
  if (user?.capabilities) return user.capabilities.includes(cap);
  const role = roleOf(user);
  return role ? RANK[role] >= RANK[MIN_ROLE[cap]] : false;
}

/** Capability needed to open each dashboard section. */
export const SECTION_CAPABILITY: Record<string, Capability> = {
  "/overview": "dashboard",
  "/blog": "blog.write_own",
  "/authors": "authors",
  "/services": "content",
  "/projects": "content",
  "/opinions": "content",
  "/team": "content",
  "/clients": "content",
  "/faqs": "content",
  "/site-texts": "content",
  "/redirects": "redirects",
  "/messages": "messages",
  "/settings": "settings",
  "/users": "users",
};

export function canOpen(user: User | null | undefined, pathname: string): boolean {
  const section = "/" + (pathname.split("/")[1] ?? "");
  const cap = SECTION_CAPABILITY[section];
  return cap ? can(user, cap) : can(user, "dashboard");
}
