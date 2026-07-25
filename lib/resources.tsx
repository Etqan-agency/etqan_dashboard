import type { ReactNode } from "react";
import { Badge, StatusBadge, Thumb } from "@/components/ui";
import { formatDate, truncate } from "./utils";
import type { AnyRecord } from "./types";
import type { IconName } from "@/components/Icon";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "bool"
  | "chips"
  | "kv"
  | "image";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  tall?: boolean;
  maxLength?: number;
  options?: [string, string][];
  /** read the initial value from a different (read-only) field, e.g. tags → tag_slugs */
  readFrom?: string;
}

export interface ColumnDef {
  header: string;
  cell: (record: AnyRecord) => ReactNode;
}

export interface FilterDef {
  param: string;
  options: [string, string][];
}

export interface ResourceDef {
  path: string;
  /** which field goes in the detail URL — slug for content, id for the rest */
  lookup: "slug" | "id";
  title: string;
  noun: string;
  sub: string;
  icon: IconName;
  ordering: string[];
  defaultOrder: string;
  filters?: FilterDef[];
  columns: ColumnDef[];
  fields: FieldDef[];
}

const muted = (v: ReactNode) => <span style={{ color: "var(--color-muted)" }}>{v}</span>;
const faint = (v: ReactNode) => <span style={{ color: "var(--color-faint)", fontSize: 12 }}>{v}</span>;
const mono = (v: ReactNode) => (
  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "-0.02em" }}>{v}</span>
);

const nameWithSub = (main: ReactNode, sub: ReactNode) => (
  <>
    <div style={{ fontWeight: 600 }}>{main}</div>
    <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }}>{sub}</div>
  </>
);

const withThumb = (src: string | undefined, body: ReactNode, round?: boolean) => (
  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
    <Thumb src={src} round={round} />
    <div>{body}</div>
  </div>
);

const ACTIVE_FILTER: FilterDef = {
  param: "is_active",
  options: [
    ["", "All statuses"],
    ["true", "Active"],
    ["false", "Hidden"],
  ],
};

const ORDER_FIELD: FieldDef = { name: "order", label: "Order", type: "number", hint: "Lower numbers appear first." };
const ACTIVE_FIELD: FieldDef = {
  name: "is_active",
  label: "Active",
  type: "bool",
  hint: "Hidden records are dropped from the public API.",
};

export const RESOURCES: Record<string, ResourceDef> = {
  services: {
    path: "/api/services/",
    lookup: "slug",
    title: "Services",
    noun: "service",
    sub: "What the agency sells. The public list only returns active services.",
    icon: "spark",
    ordering: ["order", "title", "created_at"],
    defaultOrder: "order",
    filters: [ACTIVE_FILTER],
    columns: [
      { header: "Service", cell: (r) => nameWithSub(r.title, mono(`/${r.slug ?? ""}`)) },
      { header: "Summary", cell: (r) => muted(truncate(r.short_description, 70)) },
      { header: "Features", cell: (r) => <span className="tag">{(r.features ?? []).length} listed</span> },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", readOnly: true, hint: "Generated from the title by the server." },
      { name: "short_description", label: "Short description", type: "textarea" },
      { name: "long_description", label: "Long description", type: "textarea", tall: true },
      { name: "icon", label: "Icon key", type: "text", hint: "Whatever key your frontend icon map expects." },
      { name: "features", label: "Features", type: "chips", hint: "Press Enter after each one." },
      ORDER_FIELD,
      ACTIVE_FIELD,
    ],
  },

  projects: {
    path: "/api/projects/",
    lookup: "slug",
    title: "Portfolio",
    noun: "project",
    sub: "Case studies shown under Work. The public list only returns published projects.",
    icon: "layers",
    ordering: ["order", "created_at", "title"],
    defaultOrder: "order",
    filters: [
      {
        param: "category",
        options: [
          ["", "All categories"],
          ["web", "Web"],
          ["mobile", "Mobile"],
          ["uiux", "UI/UX"],
          ["enterprise", "Enterprise"],
        ],
      },
      {
        param: "featured",
        options: [
          ["", "All projects"],
          ["true", "Featured"],
          ["false", "Not featured"],
        ],
      },
    ],
    columns: [
      {
        header: "Project",
        cell: (r) => withThumb(r.cover_image, nameWithSub(r.title, r.client_name || "—")),
      },
      { header: "Category", cell: (r) => <Badge tone="blue">{r.category_display ?? r.category ?? "—"}</Badge> },
      {
        header: "Stack",
        cell: (r) => {
          const stack: string[] = r.tech_stack ?? [];
          return faint(stack.slice(0, 3).join(" · ") + (stack.length > 3 ? ` +${stack.length - 3}` : ""));
        },
      },
      { header: "Featured", cell: (r) => (r.is_featured ? <Badge tone="warn">Featured</Badge> : faint("—")) },
      { header: "Status", cell: (r) => <StatusBadge on={r.published} onLabel="Published" offLabel="Draft" /> },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", readOnly: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          ["web", "Web"],
          ["mobile", "Mobile"],
          ["uiux", "UI/UX"],
          ["enterprise", "Enterprise"],
        ],
      },
      { name: "summary", label: "Summary", type: "textarea", maxLength: 300, hint: "Max 300 characters." },
      { name: "description", label: "Description", type: "textarea", tall: true },
      { name: "cover_image", label: "Cover image", type: "image" },
      { name: "tech_stack", label: "Tech stack", type: "chips" },
      { name: "client_name", label: "Client name", type: "text" },
      { name: "live_url", label: "Live URL", type: "text" },
      ORDER_FIELD,
      { name: "is_featured", label: "Featured", type: "bool", hint: "Featured projects lead the Work page." },
      { name: "published", label: "Published", type: "bool", hint: "Drafts are hidden from the public API." },
    ],
  },

  blog: {
    path: "/api/blog/",
    lookup: "slug",
    title: "Blog",
    noun: "post",
    sub: "The author is set to you automatically. Publishing stamps published_at the first time only.",
    icon: "pen",
    ordering: ["published_at", "created_at", "title"],
    defaultOrder: "-published_at",
    filters: [
      {
        param: "published",
        options: [
          ["", "All posts"],
          ["true", "Published"],
          ["false", "Drafts"],
        ],
      },
    ],
    columns: [
      { header: "Post", cell: (r) => withThumb(r.cover_image, nameWithSub(r.title, mono(`/${r.slug ?? ""}`))) },
      {
        header: "Tags",
        cell: (r) => {
          const tags = r.tags ?? [];
          if (!tags.length) return faint("—");
          return (
            <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
              {tags.map((t: any) => (
                <span className="tag" key={t.slug ?? t}>
                  {t.name ?? t}
                </span>
              ))}
            </span>
          );
        },
      },
      { header: "Author", cell: (r) => muted(r.author?.name ?? "—") },
      { header: "Published", cell: (r) => (r.published_at ? mono(formatDate(r.published_at)) : faint("—")) },
      { header: "Status", cell: (r) => <StatusBadge on={r.published} onLabel="Published" offLabel="Draft" /> },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", readOnly: true },
      { name: "cover_image", label: "Cover image", type: "image" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "body", label: "Body", type: "textarea", tall: true },
      {
        name: "tag_slugs",
        label: "Tags",
        type: "chips",
        readFrom: "tags",
        hint: "Write-only field. Tags that do not exist yet are created on save.",
      },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea" },
      { name: "published", label: "Published", type: "bool" },
    ],
  },

  opinions: {
    path: "/api/opinions/",
    lookup: "id",
    title: "Testimonials",
    noun: "testimonial",
    sub: 'Quotes for the "What our clients say" section.',
    icon: "quote",
    ordering: ["order", "created_at"],
    defaultOrder: "order",
    filters: [ACTIVE_FILTER],
    columns: [
      { header: "Author", cell: (r) => withThumb(r.avatar, nameWithSub(r.author_name, r.author_role), true) },
      { header: "Quote", cell: (r) => muted(truncate(r.quote, 90)) },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      { name: "quote", label: "Quote", type: "textarea", required: true },
      { name: "author_name", label: "Author name", type: "text", required: true },
      { name: "author_role", label: "Role / company", type: "text" },
      { name: "avatar", label: "Avatar", type: "image" },
      ORDER_FIELD,
      ACTIVE_FIELD,
    ],
  },

  team: {
    path: "/api/team/",
    lookup: "id",
    title: "Team",
    noun: "team member",
    sub: "Profiles shown on the About page.",
    icon: "users",
    ordering: ["order", "name", "created_at"],
    defaultOrder: "order",
    filters: [ACTIVE_FILTER],
    columns: [
      { header: "Member", cell: (r) => withThumb(r.photo, nameWithSub(r.name, r.role), true) },
      { header: "Bio", cell: (r) => muted(truncate(r.bio, 70)) },
      {
        header: "Socials",
        cell: (r) => {
          const keys = Object.keys(r.socials ?? {});
          if (!keys.length) return faint("—");
          return (
            <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
              {keys.map((k) => (
                <span className="tag" key={k}>
                  {k}
                </span>
              ))}
            </span>
          );
        },
      },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text" },
      { name: "photo", label: "Photo", type: "image" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "socials", label: "Social links", type: "kv", hint: "Keys such as linkedin, github, x." },
      ORDER_FIELD,
      ACTIVE_FIELD,
    ],
  },

  clients: {
    path: "/api/clients/",
    lookup: "id",
    title: "Clients",
    noun: "client",
    sub: "Logos for the client strip.",
    icon: "badge",
    ordering: ["order", "name", "created_at"],
    defaultOrder: "order",
    filters: [ACTIVE_FILTER],
    columns: [
      { header: "Client", cell: (r) => withThumb(r.logo, <span style={{ fontWeight: 600 }}>{r.name}</span>) },
      { header: "Website", cell: (r) => (r.website ? mono(truncate(r.website, 40)) : faint("—")) },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "logo", label: "Logo", type: "image" },
      { name: "website", label: "Website", type: "text" },
      ORDER_FIELD,
      ACTIVE_FIELD,
    ],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);
