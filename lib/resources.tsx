import type { ReactNode } from "react";
import { Badge, StatusBadge, Thumb } from "@/components/ui";
import { formatDate, truncate } from "./utils";
import type { AnyRecord } from "./types";
import type { IconName } from "@/components/Icon";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "markdown"
  | "select"
  | "bool"
  | "chips"
  | "kv"
  | "results"
  | "image";

/** Load select options from another collection, e.g. services or opinions. */
export interface OptionsSource {
  path: string;
  /** record key stored as the option value */
  value: string;
  /** record key shown as the option label */
  label: string;
  /** label of the leading "no value" option (sent as null) */
  empty: string;
}

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
  /** fetch select options from the API instead of a static list */
  optionsFrom?: OptionsSource;
  /** number inputs: an empty box saves as null instead of 0 */
  nullable?: boolean;
  /** read the initial value from a different (read-only) field, e.g. tags → tag_slugs */
  readFrom?: string;
  /** text direction for text/textarea/chips inputs — "rtl" for Arabic fields */
  dir?: "rtl" | "ltr";
  /** initial value for a NEW record (overrides the per-type empty value) */
  default?: unknown;
  /** image inputs: offer "Remove image" (saved as null). Needs a nullable model field. Default true. */
  clearable?: boolean;
  /** kv inputs: every value must be a full http(s) URL */
  urlValues?: boolean;
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

/**
 * Arabic twin of an English field (backend `<name>_ar`). Optional: the public
 * API (`?lang=ar`) falls back to the English value when it is left blank.
 */
const ar = (def: FieldDef): FieldDef => ({
  name: `${def.name}_ar`,
  label: `${def.label} (Arabic)`,
  type: def.type,
  tall: def.tall,
  maxLength: def.maxLength,
  dir: "rtl",
  hint: "Leave blank to use the English text.",
});

/** An English field followed by its Arabic twin. */
const withAr = (def: FieldDef): FieldDef[] => [def, ar(def)];

const ORDER_FIELD: FieldDef = { name: "order", label: "Order", type: "number", hint: "Lower numbers appear first." };
const ACTIVE_FIELD: FieldDef = {
  name: "is_active",
  label: "Active",
  type: "bool",
  hint: "Hidden records are dropped from the public API.",
};

/** SEO overrides shared by services, projects and blog (backend `SeoFields`). */
const META_TITLE: FieldDef = { name: "meta_title", label: "Meta title", type: "text", maxLength: 200, hint: "Leave blank to use the title." };
const META_DESCRIPTION: FieldDef = { name: "meta_description", label: "Meta description", type: "textarea", maxLength: 300 };
const SEO_FIELDS: FieldDef[] = [
  META_TITLE,
  META_DESCRIPTION,
  {
    name: "og_image",
    label: "Social share image",
    type: "image",
    clearable: false,
    hint: "Open Graph image. Falls back to the main image.",
  },
  {
    name: "canonical_url",
    label: "Canonical URL",
    type: "text",
    hint: "Optional full URL (https://…). Leave blank to use this page's own URL.",
  },
  { name: "noindex", label: "Hide from search engines", type: "bool", hint: "Adds noindex to this page." },
];
/** Blog posts also carry Arabic meta title/description. */
const BLOG_SEO_FIELDS: FieldDef[] = [...withAr(META_TITLE), ...withAr(META_DESCRIPTION), ...SEO_FIELDS.slice(2)];

/** Editable URL slug for services, projects, blog posts and authors. `maxLength` mirrors the model's SlugField. */
const slugField = (maxLength: number): FieldDef => ({
  name: "slug",
  label: "Slug",
  type: "text",
  maxLength,
  hint: "Lowercase letters, digits and hyphens. Leave blank to generate from the title. Changing it creates a 301 redirect from the old URL.",
});

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
      { header: "Service", cell: (r) => withThumb(r.image, nameWithSub(r.title, mono(`/${r.slug ?? ""}`))) },
      { header: "Summary", cell: (r) => muted(truncate(r.short_description, 70)) },
      { header: "Tags", cell: (r) => <span className="tag">{(r.features ?? []).length} listed</span> },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      ...withAr({ name: "title", label: "Title", type: "text", required: true, maxLength: 150 }),
      slugField(170),
      ...withAr({
        name: "short_description",
        label: "Short description",
        type: "textarea",
        required: true,
        maxLength: 255,
        hint: "Shown on the website under Our Expertise.",
      }),
      { name: "image", label: "Image", type: "image", hint: "Shown beside the service on the website." },
      {
        name: "icon",
        label: "Icon key",
        type: "text",
        maxLength: 80,
        hint: "Optional short icon name, e.g. code, phone, pen, gear, chip. The backend stores it as free text; the website does not show service icons yet.",
      },
      ...withAr({ name: "long_description", label: "Long description", type: "textarea", tall: true }),
      ...withAr({ name: "features", label: "Tags", type: "chips", hint: "Short tags shown next to the description. Press Enter after each one." }),
      ORDER_FIELD,
      ACTIVE_FIELD,
      ...SEO_FIELDS,
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
        param: "ownership",
        options: [
          ["", "All owners"],
          ["etqan", "ETQAN project"],
          ["team", "Team experience"],
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
        header: "Ownership",
        cell: (r) => (r.ownership === "team" ? <Badge tone="draft">Team experience</Badge> : faint("ETQAN")),
      },
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
      ...withAr({ name: "title", label: "Title", type: "text", required: true, maxLength: 200 }),
      slugField(220),
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
      {
        name: "ownership",
        label: "Ownership",
        type: "select",
        options: [
          ["etqan", "ETQAN project"],
          ["team", "Built by our team (prior experience)"],
        ],
        hint: "Use “team” for work our founder/team built at previous employers — it is labelled as team experience, never as ETQAN client work.",
      },
      ...withAr({
        name: "contribution",
        label: "Our contribution",
        type: "textarea",
        hint: "What ETQAN / our team member actually did on this project.",
      }),
      ...withAr({ name: "summary", label: "Summary", type: "textarea", required: true, maxLength: 300, hint: "Max 300 characters." }),
      ...withAr({
        name: "description",
        label: "What we built",
        type: "textarea",
        tall: true,
        hint: "One feature per line — each line becomes a bullet on the case study.",
      }),
      { name: "cover_image", label: "Cover image", type: "image", hint: "Optional. Projects without a cover show a branded placeholder." },
      ...withAr({ name: "tech_stack", label: "Scope", type: "chips", hint: "e.g. UI/UX Design, Web Development." }),
      ...withAr({ name: "challenge", label: "Challenge", type: "textarea", hint: "Case study: the problem the client had." }),
      ...withAr({ name: "solution", label: "Solution", type: "textarea", hint: "Case study: what we did about it." }),
      ...withAr({ name: "architecture", label: "Architecture", type: "textarea", hint: "Case study: how it is built." }),
      ...withAr({
        name: "results",
        label: "Results",
        type: "results",
        hint: "Real, measured numbers only, each with its source. Never estimates or placeholders.",
      }),
      { name: "year", label: "Year", type: "number", nullable: true, hint: "Year of delivery. Leave blank to hide." },
      ...withAr({ name: "duration", label: "Duration", type: "text", maxLength: 100, hint: "e.g. 12 weeks." }),
      ...withAr({ name: "country", label: "Country", type: "text", maxLength: 100 }),
      ...withAr({ name: "industry", label: "Industry", type: "text", maxLength: 100 }),
      {
        name: "service_slugs",
        label: "Services",
        type: "chips",
        readFrom: "services",
        hint: "Service slugs, e.g. web-development. Inactive services stay linked here but are not shown on the website.",
      },
      {
        name: "testimonial_id",
        label: "Testimonial",
        type: "select",
        optionsFrom: { path: "/api/opinions/", value: "id", label: "author_name", empty: "No testimonial" },
        hint: "Client quote shown on the case study. Hidden testimonials are not shown.",
      },
      { name: "client_name", label: "Client name", type: "text" },
      { name: "live_url", label: "Live URL", type: "text", hint: "Website link." },
      { name: "play_store_url", label: "Google Play URL", type: "text" },
      { name: "app_store_url", label: "App Store URL", type: "text" },
      ORDER_FIELD,
      { name: "is_featured", label: "Featured", type: "bool", hint: "Featured projects are listed first on the Projects page." },
      { name: "published", label: "Published", type: "bool", default: true, hint: "Drafts are hidden from the public API." },
      ...SEO_FIELDS,
    ],
  },

  blog: {
    path: "/api/blog/",
    lookup: "slug",
    title: "Blog",
    noun: "post",
    sub: "Pick the author shown as the byline (defaults to your linked author profile). Publishing stamps published_at the first time only.",
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
      {
        header: "Author",
        cell: (r) => (r.author?.slug ? muted(r.author.name) : r.author?.name ? faint(`${r.author.name} (no profile)`) : faint("—")),
      },
      { header: "Published", cell: (r) => (r.published_at ? mono(formatDate(r.published_at)) : faint("—")) },
      { header: "Status", cell: (r) => <StatusBadge on={r.published} onLabel="Published" offLabel="Draft" /> },
    ],
    fields: [
      ...withAr({ name: "title", label: "Title", type: "text", required: true, maxLength: 220 }),
      slugField(240),
      { name: "cover_image", label: "Cover image", type: "image" },
      ...withAr({ name: "excerpt", label: "Excerpt", type: "textarea", maxLength: 300 }),
      ...withAr({
        name: "body",
        label: "Body",
        type: "markdown",
        required: true,
        hint: "Markdown. Use H2/H3 for sections; images are uploaded and inserted at the cursor.",
      }),
      {
        name: "author_profile",
        label: "Author",
        type: "select",
        optionsFrom: { path: "/api/authors/", value: "slug", label: "name", empty: "No author (uses your account name)" },
        hint: "Byline linking to the author page. Manage authors under Authors.",
      },
      {
        name: "tag_slugs",
        label: "Tags",
        type: "chips",
        readFrom: "tags",
        hint: "Type tag names. Existing tags are matched by name or slug; new ones are created on save.",
      },
      { name: "published", label: "Published", type: "bool", default: false, hint: "New posts start as drafts." },
      ...BLOG_SEO_FIELDS,
    ],
  },

  authors: {
    path: "/api/authors/",
    lookup: "slug",
    title: "Authors",
    noun: "author",
    sub: "Blog bylines. Each author gets a public page at /authors/<slug> listing their published posts.",
    icon: "users",
    ordering: ["name", "created_at"],
    defaultOrder: "name",
    filters: [ACTIVE_FILTER],
    columns: [
      { header: "Author", cell: (r) => withThumb(r.photo, nameWithSub(r.name, mono(`/authors/${r.slug ?? ""}`)), true) },
      { header: "Role", cell: (r) => muted(r.role || "—") },
      { header: "Posts", cell: (r) => mono(r.post_count ?? 0) },
      {
        header: "Profiles",
        cell: (r) => {
          const links: string[] = r.same_as ?? [];
          return links.length ? <span className="tag">{links.length} linked</span> : faint("—");
        },
      },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      ...withAr({ name: "name", label: "Display name", type: "text", required: true, maxLength: 150 }),
      {
        ...slugField(170),
        hint: "Lowercase letters, digits and hyphens. Leave blank to generate from the name. Changing it creates a 301 redirect from the old URL.",
      },
      ...withAr({ name: "role", label: "Role", type: "text", maxLength: 150, hint: "Job title, e.g. Founder & Lead Engineer." }),
      { name: "photo", label: "Photo", type: "image", hint: "Square headshot works best." },
      ...withAr({ name: "bio", label: "Bio", type: "textarea" }),
      {
        name: "same_as",
        label: "Profile links",
        type: "chips",
        hint: "Full URLs (https://…) of this person's LinkedIn, GitHub, X… Used for search-engine author signals.",
      },
      {
        name: "user_email",
        label: "Linked staff login",
        type: "text",
        maxLength: 254,
        hint: "Email of a staff account. Link this author to a staff login so new posts default to this byline. Leave blank for none.",
      },
      { ...ACTIVE_FIELD, hint: "Hidden authors have no public page." },
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
      ...withAr({ name: "quote", label: "Quote", type: "textarea", required: true }),
      { name: "author_name", label: "Author name", type: "text", required: true },
      ...withAr({ name: "author_role", label: "Role / company", type: "text" }),
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
      ...withAr({ name: "role", label: "Role", type: "text", required: true, maxLength: 150 }),
      { name: "photo", label: "Photo", type: "image" },
      ...withAr({ name: "bio", label: "Bio", type: "textarea" }),
      {
        name: "socials",
        label: "Social links",
        type: "kv",
        urlValues: true,
        hint: "Keys such as linkedin, github, x. Use full URLs, e.g. https://www.linkedin.com/in/…",
      },
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

  faqs: {
    path: "/api/faqs/",
    lookup: "id",
    title: "FAQs",
    noun: "FAQ",
    sub: "Questions and answers. Link one to a service, or leave the service blank for a general FAQ.",
    icon: "help",
    ordering: ["order", "created_at"],
    defaultOrder: "order",
    filters: [
      ACTIVE_FILTER,
      {
        param: "general",
        options: [
          ["", "All FAQs"],
          ["true", "General"],
          ["false", "Service FAQs"],
        ],
      },
    ],
    columns: [
      { header: "Question", cell: (r) => nameWithSub(truncate(r.question, 80), truncate(r.answer, 90)) },
      { header: "Service", cell: (r) => (r.service ? mono(r.service) : faint("General")) },
      { header: "Order", cell: (r) => mono(r.order ?? 0) },
      { header: "Status", cell: (r) => <StatusBadge on={r.is_active} onLabel="Active" offLabel="Hidden" /> },
    ],
    fields: [
      ...withAr({ name: "question", label: "Question", type: "text", required: true, maxLength: 300 }),
      ...withAr({ name: "answer", label: "Answer", type: "textarea", required: true }),
      {
        name: "service",
        label: "Service",
        type: "select",
        optionsFrom: { path: "/api/services/", value: "slug", label: "title", empty: "General (no service)" },
      },
      ORDER_FIELD,
      ACTIVE_FIELD,
    ],
  },

  redirects: {
    path: "/api/redirects/",
    lookup: "id",
    title: "Redirects",
    noun: "redirect",
    sub: "Permanent (301) or temporary (302) redirects for the public site. Changing a slug adds one automatically.",
    icon: "arrow",
    ordering: ["created_at", "updated_at", "old_path", "hits"],
    defaultOrder: "-created_at",
    filters: [
      {
        param: "is_permanent",
        options: [
          ["", "All redirects"],
          ["true", "Permanent (301)"],
          ["false", "Temporary (302)"],
        ],
      },
    ],
    columns: [
      { header: "From", cell: (r) => mono(r.old_path) },
      { header: "To", cell: (r) => mono(r.new_path) },
      { header: "Type", cell: (r) => (r.is_permanent ? <Badge tone="blue">301</Badge> : <Badge tone="warn">302</Badge>) },
      { header: "Hits", cell: (r) => mono(r.hits ?? 0) },
      { header: "Updated", cell: (r) => mono(formatDate(r.updated_at)) },
    ],
    fields: [
      {
        name: "old_path",
        label: "Old path",
        type: "text",
        required: true,
        maxLength: 300,
        hint: 'e.g. /services/mobile-apps. Starts with "/", no trailing slash and no /ar prefix (Arabic URLs are covered automatically).',
      },
      {
        name: "new_path",
        label: "New path",
        type: "text",
        required: true,
        maxLength: 300,
        hint: "e.g. /services/mobile-app-development. Site-relative, without the /ar prefix.",
      },
      { name: "is_permanent", label: "Permanent (301)", type: "bool", default: true, hint: "Turn off for a temporary (302) redirect." },
      { name: "hits", label: "Hits", type: "number", readOnly: true, hint: "How many times this redirect was followed." },
    ],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);
