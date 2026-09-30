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
    { id: "p1", title: "Fleet tracking platform", slug: "fleet-tracking", category: "web", category_display: "Web", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Live vehicle tracking and route planning for a regional logistics operator.", description: "", cover_image: "", gallery: [], tech_stack: ["Django", "PostgreSQL", "Redis", "Next.js"], client_name: "Confidential", live_url: "", play_store_url: "", app_store_url: "", is_featured: true, published: true, order: 1, created_at: iso(175), updated_at: iso(45) },
    { id: "p2", title: "Driver mobile app", slug: "driver-app", category: "mobile", category_display: "Mobile", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Offline-capable delivery app with proof-of-delivery capture.", description: "", cover_image: "", gallery: [{ id: "g1", image: "https://placehold.co/1200x800.png?text=Route+view", caption: "Route view", caption_ar: "", order: 1, width: 1200, height: 800 }, { id: "g2", image: "https://placehold.co/1200x800.png?text=Delivery", caption: "Delivery capture", caption_ar: "", order: 2, width: 1200, height: 800 }], tech_stack: ["React Native", "Django REST"], client_name: "Confidential", live_url: "", play_store_url: "", app_store_url: "", is_featured: true, published: true, order: 2, created_at: iso(162), updated_at: iso(21) },
    { id: "p3", title: "WhatsApp order bot", slug: "whatsapp-order-bot", category: "enterprise", category_display: "Enterprise", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Webhook-driven ordering and document collection over WhatsApp.", description: "", cover_image: "", gallery: [], tech_stack: ["Node.js", "TypeScript", "Redis"], client_name: "Confidential", live_url: "", play_store_url: "", app_store_url: "", is_featured: false, published: true, order: 3, created_at: iso(139), updated_at: iso(56) },
    { id: "p4", title: "Learning platform", slug: "elemni", category: "web", category_display: "Web", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Course delivery for Egyptian teachers, with DRM-protected video.", description: "", cover_image: "", gallery: [], tech_stack: ["Next.js", "Django", "PostgreSQL"], client_name: "Internal product", live_url: "", play_store_url: "", app_store_url: "", is_featured: true, published: false, order: 4, created_at: iso(67), updated_at: iso(5) },
    { id: "p5", title: "Call centre dashboard", slug: "pbx-dashboard", category: "enterprise", category_display: "Enterprise", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Real-time agent and queue monitoring on top of Asterisk.", description: "", cover_image: "", gallery: [], tech_stack: ["Django Channels", "MariaDB", "Daphne"], client_name: "Confidential", live_url: "", play_store_url: "", app_store_url: "", is_featured: false, published: true, order: 5, created_at: iso(184), updated_at: iso(27) },
    { id: "p6", title: "Design system refresh", slug: "design-system-refresh", category: "uiux", category_display: "UI/UX", ownership: "etqan", ownership_display: "ETQAN project", contribution: "", contribution_ar: "", summary: "Tokens, components, and an RTL pass for a fintech client.", description: "", cover_image: "", gallery: [], tech_stack: ["Figma", "Tailwind"], client_name: "Confidential", live_url: "", play_store_url: "", app_store_url: "", is_featured: false, published: true, order: 6, created_at: iso(114), updated_at: iso(88) },
  ],
  blog: [
    { id: "b1", title: "Why we index before we scale", slug: "index-before-scale", cover_image: "", excerpt: "A missing index on a four-million-row table cost one client three days of degraded service. Here is how we find them now.", body: "", tags: [{ name: "Databases", slug: "databases" }, { name: "Performance", slug: "performance" }], author: { name: "Abdulkhalek", slug: "abdulkhalek" }, author_profile: "abdulkhalek", published: true, published_at: iso(37), meta_title: "", meta_description: "", created_at: iso(40), updated_at: iso(37) },
    { id: "b2", title: "Arabic RTL is not a CSS flag", slug: "rtl-is-not-a-flag", cover_image: "", excerpt: "What actually breaks when you mirror an interface, and how to catch it before a client does.", body: "", tags: [{ name: "Design", slug: "design" }], author: { name: "Islam Badran", slug: "islam-badran" }, author_profile: "islam-badran", published: true, published_at: iso(82), meta_title: "", meta_description: "", created_at: iso(85), updated_at: iso(82) },
    { id: "b3", title: "Shipping LLM features without the demo tax", slug: "llm-without-demo-tax", cover_image: "", excerpt: "Notes on evaluation, cost ceilings, and failing gracefully when the model is wrong.", body: "", tags: [{ name: "AI", slug: "ai" }], author: { name: "Abdulkhalek", slug: "abdulkhalek" }, author_profile: "abdulkhalek", published: false, published_at: null, meta_title: "", meta_description: "", created_at: iso(16), updated_at: iso(4) },
    { id: "b4", title: "A handover checklist that actually works", slug: "handover-checklist", cover_image: "", excerpt: "What to document before you leave a system behind.", body: "", tags: [], author: { name: "Mohamed Abozaid", slug: null }, author_profile: null, published: false, published_at: null, meta_title: "", meta_description: "", created_at: iso(11), updated_at: iso(3) },
  ],
  authors: [
    { id: "a1", name: "Abdulkhalek", name_ar: "", slug: "abdulkhalek", role: "Founder & CEO", role_ar: "", bio: "Full-stack engineer. Django, Node, and everything that runs underneath.", bio_ar: "", photo: "", same_as: ["https://github.com/Abdulkhalek-1"], is_active: true, post_count: 1, created_at: iso(60), updated_at: iso(60) },
    { id: "a2", name: "Islam Badran", name_ar: "", slug: "islam-badran", role: "Product designer", role_ar: "", bio: "Interface design and design systems, with a focus on RTL.", bio_ar: "", photo: "", same_as: [], is_active: true, post_count: 1, created_at: iso(60), updated_at: iso(60) },
  ],
  opinions: [
    { id: "o1", quote: "They shipped in eleven weeks what our previous vendor could not scope in six months.", author_name: "Operations director", author_role: "Logistics, Riyadh", avatar: "", order: 1, is_active: true, created_at: iso(115), updated_at: iso(115) },
    { id: "o2", quote: "The handover documentation was better than our own internal docs.", author_name: "Chief technology officer", author_role: "Fintech, Dubai", avatar: "", order: 2, is_active: true, created_at: iso(74), updated_at: iso(74) },
    { id: "o3", quote: "Arabic support was designed in from day one, not bolted on at the end.", author_name: "Product manager", author_role: "Retail, Cairo", avatar: "", order: 3, is_active: true, created_at: iso(35), updated_at: iso(35) },
    { id: "o4", quote: "Weekly demos meant no surprises at delivery.", author_name: "Programme lead", author_role: "Public sector, Doha", avatar: "", order: 4, is_active: false, created_at: iso(20), updated_at: iso(20) },
  ],
  team: [
    { id: "t1", name: "Abdulkhalek", role: "Founder & CEO", photo: "", bio: "Full-stack engineer. Django, Node, and everything that runs underneath.", socials: { github: "https://github.com/Abdulkhalek-1", linkedin: "https://www.linkedin.com/in/abdulkhalek" }, order: 1, is_active: true, created_at: iso(205), updated_at: iso(54) },
    { id: "t2", name: "Islam Badran", role: "Product designer", photo: "", bio: "Interface design and design systems, with a focus on RTL.", socials: { linkedin: "https://www.linkedin.com/in/islambadran" }, order: 2, is_active: true, created_at: iso(205), updated_at: iso(72) },
    { id: "t3", name: "Mohamed Abozaid", role: "Backend engineer", photo: "", bio: "APIs, infrastructure, and the automation that keeps them quiet.", socials: { github: "https://github.com/abozaid" }, order: 3, is_active: true, created_at: iso(205), updated_at: iso(72) },
  ],
  clients: [
    { id: "c1", name: "Nawa Logistics", logo: "", website: "https://example.com", order: 1, is_active: true, created_at: iso(175), updated_at: iso(175) },
    { id: "c2", name: "Madar Health", logo: "", website: "https://example.com", order: 2, is_active: true, created_at: iso(175), updated_at: iso(175) },
    { id: "c3", name: "Rukn Capital", logo: "", website: "", order: 3, is_active: true, created_at: iso(146), updated_at: iso(146) },
    { id: "c4", name: "Baseel Retail", logo: "", website: "", order: 4, is_active: false, created_at: iso(146), updated_at: iso(146) },
  ],
  faqs: [
    { id: "f1", question: "How long does a typical project take?", answer: "Most web projects ship in 8–16 weeks, depending on scope.", question_ar: "", answer_ar: "", service: null, order: 1, is_active: true, created_at: iso(30), updated_at: iso(30) },
    { id: "f2", question: "Do you build Arabic (RTL) interfaces?", answer: "Yes — RTL is designed in from the start, not mirrored afterwards.", question_ar: "", answer_ar: "", service: "ui-ux-design", order: 2, is_active: true, created_at: iso(30), updated_at: iso(30) },
    { id: "f3", question: "Can you take over an existing Django codebase?", answer: "Yes, starting with a short audit.", question_ar: "", answer_ar: "", service: "web-development", order: 3, is_active: false, created_at: iso(12), updated_at: iso(12) },
  ],
  redirects: [
    { id: "r1", old_path: "/services/mobile-apps", new_path: "/services/mobile-app-development", is_permanent: true, hits: 42, created_at: iso(20), updated_at: iso(20) },
  ],
  messages: [
    { id: "m1", name: "Faisal Al-Harbi", email: "faisal@example.com", phone: "+966 50 000 0000", subject: "Logistics platform enquiry", message: "We run 60 vehicles across three cities and need dispatch software. Can you share a scope and a rough timeline?\n\nHappy to do a call this week.", company: "Example Transport", project_type: "Web application", budget_range: "$50k–100k", service: "web-development", language: "en", status: "new", utm_source: "google", utm_medium: "cpc", utm_campaign: "web-dev-ksa", utm_term: "dispatch software", utm_content: "", gclid: "Cj0KCQ-mock", fbclid: "", referrer: "https://www.google.com/", landing_page: "/services/web-development?utm_source=google&utm_medium=cpc", page_path: "/contact", is_read: false, created_at: iso(0.04), updated_at: iso(0.04) },
    { id: "m2", name: "Dana Kassem", email: "", phone: "+20 100 000 0000", subject: "", message: "Looking for an offline-first app for inspectors. Android first, iOS later.", company: "Example Inspect", project_type: "Mobile application", budget_range: "$20k–50k", service: "mobile-applications", language: "ar", status: "qualified", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "mobile-apps-eg", utm_term: "", utm_content: "carousel-a", gclid: "", fbclid: "IwAR-mock", referrer: "https://m.facebook.com/", landing_page: "/ar/services/mobile-applications", page_path: "/ar/contact", is_read: false, created_at: iso(1), updated_at: iso(1) },
    { id: "m3", name: "Omar Nasser", email: "omar@example.com", phone: "", subject: "Design system audit", message: "Our components have drifted across three products. Do you take on audit work on its own?", company: "", project_type: "UI/UX", budget_range: "Under $20k", service: "ui-ux-design", language: "en", status: "proposal", utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "", gclid: "", fbclid: "", referrer: "https://www.linkedin.com/", landing_page: "/projects/design-system-refresh", page_path: "/contact", is_read: false, created_at: iso(3), updated_at: iso(3) },
    { id: "m4", name: "Layla Ibrahim", email: "layla@example.com", phone: "+971 50 000 0000", subject: "Follow-up on proposal", message: "Thanks for the deck. Our board meets Thursday — can you hold the slot until then?", company: "Example Group", project_type: "", budget_range: "", service: null, language: "en", status: "won", utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "", gclid: "", fbclid: "", referrer: "", landing_page: "/", page_path: "/contact", is_read: true, created_at: iso(6), updated_at: iso(6) },
    { id: "m5", name: "Karim Sabry", email: "karim@example.com", phone: "", subject: "Partnership", message: "We do hardware, you do software. Worth a conversation?", company: "Example Devices", project_type: "", budget_range: "", service: null, language: "en", status: "lost", utm_source: "newsletter", utm_medium: "email", utm_campaign: "", utm_term: "", utm_content: "", gclid: "", fbclid: "", referrer: "", landing_page: "/blog/index-before-scale", page_path: "/contact", is_read: true, created_at: iso(12), updated_at: iso(12) },
  ],
};

/* ---- bring every row in line with lib/types.ts (the real serializers) ---- */

const SEO_DEFAULTS = { meta_title: "", meta_description: "", og_image: null, canonical_url: "", noindex: false };

/** Fields each collection's rows carry when the sample data above leaves them out. */
const ROW_DEFAULTS: Record<string, () => Record<string, any>> = {
  services: () => ({ image: null, icon: "", features: [], title_ar: "", short_description_ar: "", long_description_ar: "", features_ar: [], ...SEO_DEFAULTS }),
  projects: () => ({
    contribution: "", contribution_ar: "", description: "", cover_image: null, cover_width: null, cover_height: null, gallery: [],
    title_ar: "", summary_ar: "", description_ar: "", tech_stack_ar: [],
    challenge: "", solution: "", architecture: "", challenge_ar: "", solution_ar: "", architecture_ar: "",
    results: [], results_ar: [], year: null, duration: "", duration_ar: "", country: "", country_ar: "", industry: "", industry_ar: "",
    services: [], testimonial: null, testimonial_id: null, client_name: "", live_url: "", play_store_url: "", app_store_url: "",
    is_featured: false, published: true, order: 0, ...SEO_DEFAULTS,
  }),
  blog: () => ({ cover_image: null, excerpt: "", body: "", tags: [], author_profile: null, published: false, published_at: null, title_ar: "", excerpt_ar: "", body_ar: "", meta_title_ar: "", meta_description_ar: "", ...SEO_DEFAULTS }),
  authors: () => ({ name_ar: "", role: "", role_ar: "", bio: "", bio_ar: "", photo: null, same_as: [], user_email: "", is_active: true, post_count: 0 }),
  opinions: () => ({ author_role: "", quote_ar: "", author_role_ar: "", avatar: null, order: 0, is_active: true }),
  team: () => ({ photo: null, bio: "", role_ar: "", bio_ar: "", socials: {}, order: 0, is_active: true }),
  clients: () => ({ logo: null, website: "", order: 0, is_active: true }),
  faqs: () => ({ question_ar: "", answer_ar: "", service: null, order: 0, is_active: true }),
  redirects: () => ({ is_permanent: true, hits: 0 }),
  messages: () => ({ phone: "", subject: "", company: "", project_type: "", budget_range: "", service: null, language: "en", status: "new", utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "", gclid: "", fbclid: "", referrer: "", landing_page: "", page_path: "", is_read: false }),
};

const LEAD_STATUS_LABELS: Record<string, string> = { new: "New", qualified: "Qualified", proposal: "Proposal", won: "Won", lost: "Lost", spam: "Spam" };

/** Recompute the read-only fields the API derives from writable ones. */
const derive = (collection: string, row: Record<string, any>) => {
  if (collection === "messages") {
    row.status_display = LEAD_STATUS_LABELS[row.status] ?? row.status;
    row.service_title = row.service ? (db.services.find((s) => s.slug === row.service)?.title ?? null) : null;
  }
  if (collection === "projects") {
    const o = row.testimonial_id ? db.opinions.find((x) => x.id === row.testimonial_id) : null;
    // like the API: hidden opinions are never embedded
    row.testimonial = o && o.is_active ? { id: o.id, quote: o.quote, author_name: o.author_name, author_role: o.author_role, avatar: o.avatar || null } : null;
  }
  return row;
};

const normalise = (collection: string, row: Record<string, any>) =>
  derive(collection, { ...(ROW_DEFAULTS[collection]?.() ?? {}), ...row });

for (const [collection, table] of Object.entries(db)) {
  if (Array.isArray(table)) db[collection] = table.map((row) => normalise(collection, row));
}

/* ---- project gallery (GET/POST /api/projects/<slug>/gallery/, PATCH/DELETE /api/project-images/<id>/) ---- */

const galleryOwner = (imageId: string) => db.projects.find((p) => (p.gallery || []).some((g: any) => g.id === imageId));
const sortGallery = (p: Record<string, any>) => (p.gallery = [...(p.gallery || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
const formValue = (body: any, key: string) => (body instanceof FormData ? body.get(key) : body?.[key]);

async function mockGallery(rawPath: string, method: string, body: any) {
  const list = rawPath.match(/^\/api\/projects\/([^/]+)\/gallery\/$/);
  if (list) {
    const project = db.projects.find((p) => p.slug === decodeURIComponent(list[1]));
    if (!project) throw new Error("Not found.");
    if (method === "POST") {
      const file = formValue(body, "image");
      if (!(file instanceof File)) throw new Error("image: No file was submitted.");
      const image = {
        id: "g" + Math.random().toString(36).slice(2, 9),
        image: URL.createObjectURL(file),
        caption: String(formValue(body, "caption") ?? ""),
        caption_ar: String(formValue(body, "caption_ar") ?? ""),
        order: Number(formValue(body, "order") ?? 0),
        width: null,
        height: null,
      };
      project.gallery = [...(project.gallery || []), image];
      sortGallery(project);
      return image;
    }
    return sortGallery(project);
  }
  const item = rawPath.match(/^\/api\/project-images\/([^/]+)\/$/);
  if (item) {
    const id = decodeURIComponent(item[1]);
    const project = galleryOwner(id);
    if (!project) throw new Error("Not found.");
    const image = project.gallery.find((g: any) => g.id === id);
    if (method === "DELETE") {
      project.gallery = project.gallery.filter((g: any) => g.id !== id);
      return null;
    }
    if (method === "PATCH" || method === "PUT") {
      for (const key of ["caption", "caption_ar", "order"]) {
        const v = formValue(body, key);
        if (v !== undefined && v !== null) image[key] = key === "order" ? Number(v) : String(v);
      }
      const file = formValue(body, "image");
      if (file instanceof File) image.image = URL.createObjectURL(file);
      sortGallery(project);
    }
    return image;
  }
  return undefined;
}

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
  contact_email: "admin@etqanpp.com",
  contact_phone: "+20 000 000 0000",
  address: "Cairo, Egypt",
  social_links: { linkedin: "https://www.linkedin.com/company/etqan-agency", github: "https://github.com/Abdulkhalek-1", x: "https://x.com/etqanagency" },
  hero_title_ar: "",
  hero_subtitle_ar: "",
  announcement_text_ar: "",
  company_about_ar: "",
  mission_ar: "",
  vision_ar: "",
  address_ar: "",
  updated_at: iso(5),
};

const slugify = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Public URL prefix per collection; a slug change adds a 301 like the API. */
const SLUG_PREFIXES: Record<string, string> = { services: "/services/", projects: "/projects/", blog: "/blog/", authors: "/authors/" };

/** Mirror the backend: collapse chains, drop loops, then upsert old → new. */
const mockRedirect = (oldPath: string, newPath: string) => {
  const now = new Date().toISOString();
  db.redirects = db.redirects.filter((r) => r.old_path !== newPath);
  for (const r of db.redirects) {
    if (r.new_path === oldPath) Object.assign(r, { new_path: newPath, updated_at: now });
  }
  const existing = db.redirects.find((r) => r.old_path === oldPath);
  if (existing) Object.assign(existing, { new_path: newPath, is_permanent: true, updated_at: now });
  else
    db.redirects.unshift({
      id: "x" + Math.random().toString(36).slice(2, 9),
      old_path: oldPath,
      new_path: newPath,
      is_permanent: true,
      hits: 0,
      created_at: now,
      updated_at: now,
    });
};

const OWNERSHIP_LABELS: Record<string, string> = {
  etqan: "ETQAN project",
  team: "Built by our team (prior experience)",
};

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  uiux: "UI/UX",
  enterprise: "Enterprise",
};

/** author_profile slug → the public byline the API returns (falls back to the account name). */
const byline = (slug: string | null | undefined) => {
  const a = slug ? db.authors.find((x) => x.slug === slug) : null;
  return a ? { name: a.name, slug: a.slug, role: a.role, photo: a.photo || null, bio: a.bio, same_as: a.same_as ?? [] } : { name: MOCK_USER.name, slug: null };
};

/** service_slugs → the {slug, title, title_ar} refs the API returns (staff see inactive ones too). */
const serviceRefs = (slugs: string[]) =>
  db.services
    .filter((s) => slugs.includes(s.slug))
    .map((s) => ({ slug: s.slug, title: s.title, title_ar: s.title_ar ?? "" }));

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

  if (rawPath === "/api/uploads/" && method === "POST") {
    // No backend: preview the file from memory (the URL only lives for this tab).
    const file = opts.body instanceof FormData ? opts.body.get("image") : null;
    const url = file instanceof File ? URL.createObjectURL(file) : "https://placehold.co/1200x630.png";
    return { url, path: `uploads/mock/${file instanceof File ? file.name : "image.png"}` };
  }

  if (rawPath === "/api/settings/") {
    if (method === "PATCH" || method === "PUT") {
      Object.assign(settings, opts.body || {});
      settings.updated_at = new Date().toISOString();
    }
    return { ...settings };
  }

  const gallery = await mockGallery(rawPath, method, opts.body);
  if (gallery !== undefined) return gallery;

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
      if (collection === "authors") {
        if (!record.slug) record.slug = slugify(record.name || "");
        record.same_as = record.same_as || [];
        record.post_count = 0;
      }
      if (collection === "redirects") record.hits = 0;
      if (collection === "projects") {
        record.category_display = CATEGORY_LABELS[record.category] || "";
        record.ownership = record.ownership || "etqan";
        record.ownership_display = OWNERSHIP_LABELS[record.ownership];
        record.gallery = [];
        record.services = serviceRefs(record.service_slugs || []);
      }
      if (collection === "blog") {
        record.author = byline(record.author_profile);
        record.tags = (record.tag_slugs || []).map((s: string) => ({ name: s, slug: slugify(s) }));
        record.published_at = record.published ? new Date().toISOString() : null;
      }
      const row = normalise(collection, record);
      table.unshift(row);
      return row;
    }

    let rows = [...table];

    if (q.search) {
      const needle = q.search.toLowerCase();
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
    }
    for (const [param, field] of [
      ["is_active", "is_active"],
      ["is_permanent", "is_permanent"],
      ["published", "published"],
      ["featured", "is_featured"],
      ["is_read", "is_read"],
    ] as const) {
      if (q[param] !== undefined && q[param] !== "") {
        rows = rows.filter((r) => String(Boolean(r[field])) === q[param]);
      }
    }
    if (q.category) rows = rows.filter((r) => r.category === q.category);
    if (q.status) rows = rows.filter((r) => r.status === q.status);
    if (q.utm_source) rows = rows.filter((r) => r.utm_source === q.utm_source);
    if (q.ownership) rows = rows.filter((r) => (r.ownership || "etqan") === q.ownership);
    if (q.general) rows = rows.filter((r) => (r.service == null) === (q.general === "true"));
    if (q.service) {
      rows = rows.filter((r) =>
        collection === "faqs" || collection === "messages"
          ? r.service === q.service
          : (r.services || []).some((s: any) => s.slug === q.service),
      );
    }
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
      // multipart PATCH = image uploads: keep an in-memory preview URL per file
      const body: Record<string, any> =
        opts.body instanceof FormData
          ? Object.fromEntries(
              Array.from(opts.body.entries()).map(([k, v]) => [k, v instanceof File ? URL.createObjectURL(v) : v]),
            )
          : { ...(opts.body || {}) };
      const wasPublished = table[index].published;
      const oldSlug = table[index].slug;
      // Like the API: a blank slug keeps the current one.
      if ("slug" in body && !body.slug) delete body.slug;
      Object.assign(table[index], body);
      table[index].updated_at = new Date().toISOString();
      const prefix = SLUG_PREFIXES[collection];
      if (prefix && oldSlug && body.slug && body.slug !== oldSlug) {
        mockRedirect(prefix + oldSlug, prefix + body.slug);
      }
      if (collection === "blog") {
        if ("author_profile" in body) table[index].author = byline(body.author_profile);
        if (body.tag_slugs) table[index].tags = body.tag_slugs.map((s: string) => ({ name: s, slug: slugify(s) }));
        // published_at is stamped once, on first publish
        if (!wasPublished && body.published && !table[index].published_at) {
          table[index].published_at = new Date().toISOString();
        }
      }
      if (collection === "projects" && body.service_slugs) {
        table[index].services = serviceRefs(body.service_slugs);
      }
      if (collection === "projects" && body.category) {
        table[index].category_display = CATEGORY_LABELS[body.category];
      }
      if (collection === "projects" && body.ownership) {
        table[index].ownership_display = OWNERSHIP_LABELS[body.ownership];
      }
      // status_display / service_title / testimonial follow their writable twins
      derive(collection, table[index]);
    }
    return table[index];
  }
  return table[index];
}
