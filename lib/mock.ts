/**
 * In-memory stand-in for the Django API.
 *
 * Used whenever NEXT_PUBLIC_API_BASE is not set, so the dashboard deploys to
 * Vercel and works immediately with no backend. It reproduces the real
 * contract: the {count,next,previous,results} envelope, ?search / ?ordering /
 * ?page / ?page_size, per-collection filters, and slug-vs-id lookups.
 *
 * State lives in module scope, so edits survive client-side navigation but
 * reset on a hard refresh. That is intentional for a demo.
 */
import type { SiteSettings } from "./types";

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString();

type Table = Record<string, any>[];

const db: Record<string, Table> & { settings?: any } = {
  services: [
    { id: "s1", title: "Web Development", slug: "web-development", short_description: "Production web applications on Django and Next.js.", long_description: "We build the API, the frontend, and the infrastructure underneath — then hand over documentation your own team can work from.", icon: "code", features: ["Django REST", "Next.js", "PostgreSQL", "CI/CD"], order: 1, is_active: true, created_at: iso(190), updated_at: iso(53) },
    { id: "s2", title: "Mobile Applications", slug: "mobile-applications", short_description: "Native and cross-platform apps that need no manual to use.", long_description: "Offline-first architecture, store submission, and crash monitoring included.", icon: "phone", features: ["React Native", "Offline-first", "App Store delivery"], order: 2, is_active: true, created_at: iso(190), updated_at: iso(66) },
    { id: "s3", title: "UI/UX Design", slug: "ui-ux-design", short_description: "Interfaces designed around how people actually work.", long_description: "Design systems, prototypes, and a proper Arabic RTL pass rather than a mirrored afterthought.", icon: "pen", features: ["Design systems", "RTL / Arabic", "Prototyping"], order: 3, is_active: true, created_at: iso(190), updated_at: iso(105) },
    { id: "s4", title: "Software Solutions", slug: "software-solutions", short_description: "Integrations, automation, and internal tooling.", long_description: "The unglamorous work that removes manual steps from a business.", icon: "gear", features: ["System integration", "Automation", "LLM features"], order: 4, is_active: true, created_at: iso(190), updated_at: iso(24) },
    { id: "s5", title: "Embedded Systems", slug: "embedded-systems", short_description: "ESP32 and LoRa hardware with a web backend behind it.", long_description: "", icon: "chip", features: ["ESP32", "LoRa", "KiCad"], order: 5, is_active: false, created_at: iso(145), updated_at: iso(145) },
  ],
  projects: [
    { id: "p1", title: "Fleet tracking platform", slug: "fleet-tracking", category: "web", category_display: "Web", summary: "Live vehicle tracking and route planning for a regional logistics operator.", description: "", cover_image: "", gallery: [], tech_stack: ["Django", "PostgreSQL", "Redis", "Next.js"], client_name: "Confidential", live_url: "", is_featured: true, published: true, order: 1, created_at: iso(175), updated_at: iso(45) },
    { id: "p2", title: "Driver mobile app", slug: "driver-app", category: "mobile", category_display: "Mobile", summary: "Offline-capable delivery app with proof-of-delivery capture.", description: "", cover_image: "", gallery: [{ id: "g1", image: "", caption: "Route view", order: 1 }, { id: "g2", image: "", caption: "Delivery capture", order: 2 }], tech_stack: ["React Native", "Django REST"], client_name: "Confidential", live_url: "", is_featured: true, published: true, order: 2, created_at: iso(162), updated_at: iso(21) },
    { id: "p3", title: "WhatsApp order bot", slug: "whatsapp-order-bot", category: "enterprise", category_display: "Enterprise", summary: "Webhook-driven ordering and document collection over WhatsApp.", description: "", cover_image: "", gallery: [], tech_stack: ["Node.js", "TypeScript", "Redis"], client_name: "Confidential", live_url: "", is_featured: false, published: true, order: 3, created_at: iso(139), updated_at: iso(56) },
    { id: "p4", title: "Learning platform", slug: "elemni", category: "web", category_display: "Web", summary: "Course delivery for Egyptian teachers, with DRM-protected video.", description: "", cover_image: "", gallery: [], tech_stack: ["Next.js", "Django", "PostgreSQL"], client_name: "Internal product", live_url: "", is_featured: true, published: false, order: 4, created_at: iso(67), updated_at: iso(5) },
    { id: "p5", title: "Call centre dashboard", slug: "pbx-dashboard", category: "enterprise", category_display: "Enterprise", summary: "Real-time agent and queue monitoring on top of Asterisk.", description: "", cover_image: "", gallery: [], tech_stack: ["Django Channels", "MariaDB", "Daphne"], client_name: "Confidential", live_url: "", is_featured: false, published: true, order: 5, created_at: iso(184), updated_at: iso(27) },
    { id: "p6", title: "Design system refresh", slug: "design-system-refresh", category: "uiux", category_display: "UI/UX", summary: "Tokens, components, and an RTL pass for a fintech client.", description: "", cover_image: "", gallery: [], tech_stack: ["Figma", "Tailwind"], client_name: "Confidential", live_url: "", is_featured: false, published: true, order: 6, created_at: iso(114), updated_at: iso(88) },
  ],
  blog: [
    { id: "b1", title: "Why we index before we scale", slug: "index-before-scale", cover_image: "", excerpt: "A missing index on a four-million-row table cost one client three days of degraded service. Here is how we find them now.", body: "", tags: [{ name: "Databases", slug: "databases" }, { name: "Performance", slug: "performance" }], author: { name: "Abdulkhalek" }, published: true, published_at: iso(37), meta_title: "", meta_description: "", created_at: iso(40), updated_at: iso(37) },
    { id: "b2", title: "Arabic RTL is not a CSS flag", slug: "rtl-is-not-a-flag", cover_image: "", excerpt: "What actually breaks when you mirror an interface, and how to catch it before a client does.", body: "", tags: [{ name: "Design", slug: "design" }], author: { name: "Islam Badran" }, published: true, published_at: iso(82), meta_title: "", meta_description: "", created_at: iso(85), updated_at: iso(82) },
    { id: "b3", title: "Shipping LLM features without the demo tax", slug: "llm-without-demo-tax", cover_image: "", excerpt: "Notes on evaluation, cost ceilings, and failing gracefully when the model is wrong.", body: "", tags: [{ name: "AI", slug: "ai" }], author: { name: "Abdulkhalek" }, published: false, published_at: null, meta_title: "", meta_description: "", created_at: iso(16), updated_at: iso(4) },
    { id: "b4", title: "A handover checklist that actually works", slug: "handover-checklist", cover_image: "", excerpt: "What to document before you leave a system behind.", body: "", tags: [], author: { name: "Mohamed Abozaid" }, published: false, published_at: null, meta_title: "", meta_description: "", created_at: iso(11), updated_at: iso(3) },
  ],
  opinions: [
    { id: "o1", quote: "They shipped in eleven weeks what our previous vendor could not scope in six months.", author_name: "Operations director", author_role: "Logistics, Riyadh", avatar: "", order: 1, is_active: true, created_at: iso(115), updated_at: iso(115) },
    { id: "o2", quote: "The handover documentation was better than our own internal docs.", author_name: "Chief technology officer", author_role: "Fintech, Dubai", avatar: "", order: 2, is_active: true, created_at: iso(74), updated_at: iso(74) },
    { id: "o3", quote: "Arabic support was designed in from day one, not bolted on at the end.", author_name: "Product manager", author_role: "Retail, Cairo", avatar: "", order: 3, is_active: true, created_at: iso(35), updated_at: iso(35) },
    { id: "o4", quote: "Weekly demos meant no surprises at delivery.", author_name: "Programme lead", author_role: "Public sector, Doha", avatar: "", order: 4, is_active: false, created_at: iso(20), updated_at: iso(20) },
  ],
  team: [
    { id: "t1", name: "Abdulkhalek", role: "Founder & CEO", photo: "", bio: "Full-stack engineer. Django, Node, and everything that runs underneath.", socials: { github: "Abdulkhalek-1", linkedin: "abdulkhalek" }, order: 1, is_active: true, created_at: iso(205), updated_at: iso(54) },
    { id: "t2", name: "Islam Badran", role: "Product designer", photo: "", bio: "Interface design and design systems, with a focus on RTL.", socials: { linkedin: "islambadran" }, order: 2, is_active: true, created_at: iso(205), updated_at: iso(72) },
    { id: "t3", name: "Mohamed Abozaid", role: "Backend engineer", photo: "", bio: "APIs, infrastructure, and the automation that keeps them quiet.", socials: { github: "abozaid" }, order: 3, is_active: true, created_at: iso(205), updated_at: iso(72) },
  ],
  clients: [
    { id: "c1", name: "Nawa Logistics", logo: "", website: "https://example.com", order: 1, is_active: true, created_at: iso(175), updated_at: iso(175) },
    { id: "c2", name: "Madar Health", logo: "", website: "https://example.com", order: 2, is_active: true, created_at: iso(175), updated_at: iso(175) },
    { id: "c3", name: "Rukn Capital", logo: "", website: "", order: 3, is_active: true, created_at: iso(146), updated_at: iso(146) },
    { id: "c4", name: "Baseel Retail", logo: "", website: "", order: 4, is_active: false, created_at: iso(146), updated_at: iso(146) },
  ],
  messages: [
    { id: "m1", name: "Faisal Al-Harbi", email: "faisal@example.com", subject: "Logistics platform enquiry", message: "We run 60 vehicles across three cities and need dispatch software. Can you share a scope and a rough timeline?\n\nHappy to do a call this week.", company: "Example Transport", project_type: "Web application", budget_range: "$50k–100k", is_read: false, created_at: iso(0.04), updated_at: iso(0.04) },
    { id: "m2", name: "Dana Kassem", email: "dana@example.com", subject: "Mobile app for field teams", message: "Looking for an offline-first app for inspectors. Android first, iOS later.", company: "Example Inspect", project_type: "Mobile application", budget_range: "$20k–50k", is_read: false, created_at: iso(1), updated_at: iso(1) },
    { id: "m3", name: "Omar Nasser", email: "omar@example.com", subject: "Design system audit", message: "Our components have drifted across three products. Do you take on audit work on its own?", company: "", project_type: "UI/UX", budget_range: "Under $20k", is_read: false, created_at: iso(3), updated_at: iso(3) },
    { id: "m4", name: "Layla Ibrahim", email: "layla@example.com", subject: "Follow-up on proposal", message: "Thanks for the deck. Our board meets Thursday — can you hold the slot until then?", company: "Example Group", project_type: "", budget_range: "", is_read: true, created_at: iso(6), updated_at: iso(6) },
    { id: "m5", name: "Karim Sabry", email: "karim@example.com", subject: "Partnership", message: "We do hardware, you do software. Worth a conversation?", company: "Example Devices", project_type: "", budget_range: "", is_read: true, created_at: iso(12), updated_at: iso(12) },
  ],
};

const settings: SiteSettings = {
  hero_title: "We build whatever you imagine",
  hero_subtitle:
    "Full-service software agency delivering end-to-end digital solutions, from web and mobile apps to system integrations.",
  announcement_text: "Now taking projects for Q4 2026",
  company_about:
    "Etqan is a Cairo-based software agency building web, mobile, and integration work for clients across the region.",
  mission: "Deliver software that teams can actually run, long after we hand it over.",
  vision: "The default engineering partner for ambitious companies across MENA.",
  values: [
    { title: "Clarity first", description: "Scope, price, and timeline in writing before any work starts." },
    { title: "Own the handover", description: "Documentation and access transfer are part of delivery, not an afterthought." },
    { title: "Build for the maintainer", description: "The next engineer to open the codebase is the real user." },
  ],
  stats: { projects: 8, clients: 7, industries: 7, satisfaction: 92, awards: 3 },
  contact_email: "work@etqan.agency",
  contact_phone: "+20 000 000 0000",
  address: "Cairo, Egypt",
  social_links: { linkedin: "etqan-agency", github: "Abdulkhalek-1", x: "etqanagency" },
  updated_at: iso(5),
};

const slugify = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  uiux: "UI/UX",
  enterprise: "Enterprise",
};

export const MOCK_USER = {
  id: "u1",
  name: "Abdulkhalek",
  email: "work@etqan.agency",
  username: "abdulkhalek",
  is_staff: true,
  is_admin: true,
  date_joined: iso(400),
};

export interface MockRequest {
  method: string;
  body?: any;
}

/** Route a request against the in-memory tables. */
export async function mockRequest(path: string, opts: MockRequest = { method: "GET" }) {
  await new Promise((r) => setTimeout(r, 180)); // keep loading states honest

  const [rawPath, query] = path.split("?");
  const q = Object.fromEntries(new URLSearchParams(query || ""));
  const method = (opts.method || "GET").toUpperCase();

  if (rawPath === "/api/auth/me/") return MOCK_USER;
  if (rawPath === "/api/auth/login/") return { access: "mock.access", refresh: "mock.refresh", user: MOCK_USER };
  if (rawPath === "/api/auth/logout/") return null;

  if (rawPath === "/api/settings/") {
    if (method === "PATCH" || method === "PUT") {
      Object.assign(settings, opts.body || {});
      settings.updated_at = new Date().toISOString();
    }
    return { ...settings };
  }

  const match = rawPath.match(/^\/api\/([a-z]+)\/(.*)$/);
  if (!match) return { count: 0, next: null, previous: null, results: [] };

  const [, collection, rest] = match;
  const table = db[collection];
  if (!table) return { count: 0, next: null, previous: null, results: [] };

  // ---- collection level ----
  if (rest === "") {
    if (method === "POST") {
      const record: any = {
        id: "x" + Math.random().toString(36).slice(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...opts.body,
      };
      if (record.title && !record.slug) record.slug = slugify(record.title);
      if (collection === "projects") {
        record.category_display = CATEGORY_LABELS[record.category] || "";
        record.gallery = [];
      }
      if (collection === "blog") {
        record.author = { name: MOCK_USER.name };
        record.tags = (record.tag_slugs || []).map((s: string) => ({ name: s, slug: slugify(s) }));
        record.published_at = record.published ? new Date().toISOString() : null;
      }
      table.unshift(record);
      return record;
    }

    let rows = [...table];

    if (q.search) {
      const needle = q.search.toLowerCase();
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
    }
    for (const [param, field] of [
      ["is_active", "is_active"],
      ["published", "published"],
      ["featured", "is_featured"],
      ["is_read", "is_read"],
    ] as const) {
      if (q[param] !== undefined && q[param] !== "") {
        rows = rows.filter((r) => String(Boolean(r[field])) === q[param]);
      }
    }
    if (q.category) rows = rows.filter((r) => r.category === q.category);
    if (q.tag) rows = rows.filter((r) => (r.tags || []).some((t: any) => t.slug === q.tag));

    if (q.ordering) {
      const desc = q.ordering.startsWith("-");
      const field = q.ordering.replace(/^-/, "");
      rows.sort((a, b) => {
        const x = a[field] ?? "";
        const y = b[field] ?? "";
        return (x > y ? 1 : x < y ? -1 : 0) * (desc ? -1 : 1);
      });
    }

    const size = Math.min(Number(q.page_size || 12), 100);
    const page = Number(q.page || 1);
    const count = rows.length;
    return {
      count,
      next: page * size < count ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: rows.slice((page - 1) * size, page * size),
    };
  }

  // ---- detail level ----
  const isMarkRead = rest.includes("mark-read");
  const key = decodeURIComponent(rest.replace(/\/$/, "").replace(/\/mark-read$/, ""));
  const index = table.findIndex((r) => r.id === key || r.slug === key);
  if (index < 0) throw new Error("Not found.");

  if (method === "DELETE") {
    table.splice(index, 1);
    return null;
  }
  if (method === "PATCH" || method === "PUT") {
    if (isMarkRead) {
      table[index].is_read = true;
    } else {
      const body = opts.body instanceof FormData ? {} : opts.body || {};
      const wasPublished = table[index].published;
      Object.assign(table[index], body);
      table[index].updated_at = new Date().toISOString();
      if (body.title) table[index].slug = slugify(body.title);
      if (collection === "blog") {
        if (body.tag_slugs) table[index].tags = body.tag_slugs.map((s: string) => ({ name: s, slug: slugify(s) }));
        // published_at is stamped once, on first publish
        if (!wasPublished && body.published && !table[index].published_at) {
          table[index].published_at = new Date().toISOString();
        }
      }
      if (collection === "projects" && body.category) {
        table[index].category_display = CATEGORY_LABELS[body.category];
      }
    }
    return table[index];
  }
  return table[index];
}
