/** Shapes mirror the DRF serializers documented in the API reference. */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id?: string;
  email: string;
  username?: string;
  name?: string;
  is_staff?: boolean;
  is_admin?: boolean;
  date_joined?: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
  user?: User;
}

interface Timestamped {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/** Per-object SEO overrides (backend `SeoFields` mixin). */
export interface SeoFields {
  meta_title: string;
  meta_description: string;
  og_image: string | null;
  canonical_url: string;
  noindex: boolean;
}

export interface Service extends Timestamped, SeoFields {
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  image: string | null;
  icon: string;
  features: string[];
  title_ar: string;
  short_description_ar: string;
  long_description_ar: string;
  features_ar: string[];
  order: number;
  is_active: boolean;
}

/** A gallery image — managed via /api/projects/<slug>/gallery/ and /api/project-images/<id>/. */
export interface ProjectImage {
  id: string;
  /** absolute URL */
  image: string;
  caption: string;
  caption_ar: string;
  order: number;
  width?: number | null;
  height?: number | null;
}

/** One measured case-study result. Real, sourced numbers only. */
export interface ProjectResult {
  value: string;
  label: string;
  source?: string;
}

export interface ProjectServiceRef {
  slug: string;
  title: string;
  title_ar: string;
}

export interface ProjectTestimonial {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
  avatar: string | null;
}

export interface Project extends Timestamped, SeoFields {
  title: string;
  slug: string;
  category: "web" | "mobile" | "uiux" | "enterprise";
  category_display?: string;
  /** "team" = built by our team at previous employers — never ETQAN client work */
  ownership: "etqan" | "team";
  ownership_display?: string;
  /** what ETQAN / our team member actually did on the project */
  contribution: string;
  contribution_ar: string;
  summary: string;
  description: string;
  cover_image: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  gallery: ProjectImage[];
  tech_stack: string[];
  title_ar: string;
  summary_ar: string;
  description_ar: string;
  tech_stack_ar: string[];
  challenge: string;
  solution: string;
  architecture: string;
  challenge_ar: string;
  solution_ar: string;
  architecture_ar: string;
  results: ProjectResult[];
  results_ar: ProjectResult[];
  year: number | null;
  duration: string;
  duration_ar: string;
  country: string;
  country_ar: string;
  industry: string;
  industry_ar: string;
  /** staff see every linked service (active or not); public responses only active ones. Write via `service_slugs` */
  services: ProjectServiceRef[];
  /** write-only — the API never returns this */
  service_slugs?: string[];
  /** null when unset or the opinion is hidden; write via `testimonial_id` */
  testimonial: ProjectTestimonial | null;
  testimonial_id: string | null;
  client_name: string;
  live_url: string;
  play_store_url: string;
  app_store_url: string;
  is_featured: boolean;
  published: boolean;
  order: number;
}

export interface Tag {
  id?: string;
  name: string;
  slug: string;
}

export interface Post extends Timestamped, SeoFields {
  title: string;
  slug: string;
  cover_image: string | null;
  excerpt: string;
  body: string;
  tags: Tag[];
  /** write-only — the API never returns this */
  tag_slugs?: string[];
  /** public byline; `slug` is null when the post has no author profile */
  author?: AuthorByline | null;
  /** slug of the AuthorProfile (read/write) */
  author_profile?: string | null;
  published: boolean;
  published_at: string | null;
  title_ar: string;
  excerpt_ar: string;
  body_ar: string;
  meta_title_ar: string;
  meta_description_ar: string;
}

export interface Opinion extends Timestamped {
  quote: string;
  author_name: string;
  author_role: string;
  quote_ar: string;
  author_role_ar: string;
  avatar: string | null;
  order: number;
  is_active: boolean;
}

export interface TeamMember extends Timestamped {
  name: string;
  role: string;
  photo: string | null;
  bio: string;
  role_ar: string;
  bio_ar: string;
  socials: Record<string, string>;
  order: number;
  is_active: boolean;
}

export interface Faq extends Timestamped {
  question: string;
  answer: string;
  question_ar: string;
  answer_ar: string;
  /** service slug; null = general FAQ */
  service: string | null;
  order: number;
  is_active: boolean;
}

export interface Client extends Timestamped {
  name: string;
  logo: string | null;
  website: string;
  order: number;
  is_active: boolean;
}

export type LeadStatus = "new" | "qualified" | "proposal" | "won" | "lost" | "spam";

export interface Message extends Timestamped {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  company: string;
  project_type: string;
  budget_range: string;
  service: string | null;
  service_title: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
  fbclid: string;
  referrer: string;
  landing_page: string;
  page_path: string;
  language: string;
  status: LeadStatus;
  status_display?: string;
  is_read: boolean;
}

export interface Redirect extends Timestamped {
  /** site-relative, no trailing slash, no /ar prefix */
  old_path: string;
  new_path: string;
  /** 301 when true (backend default), 302 when false */
  is_permanent: boolean;
  hits: number;
}

export interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  announcement_text: string;
  company_about: string;
  mission: string;
  vision: string;
  values: { title: string; description: string }[];
  stats: Record<string, string | number>;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_links: Record<string, string>;
  hero_title_ar: string;
  hero_subtitle_ar: string;
  announcement_text_ar: string;
  company_about_ar: string;
  mission_ar: string;
  vision_ar: string;
  address_ar: string;
  updated_at?: string;
}

/** Anything the generic resource table can render. */
export type AnyRecord = Record<string, any> & { id: string; slug?: string };

export interface AuthorByline {
  name: string;
  slug: string | null;
  role?: string;
  photo?: string | null;
  bio?: string;
  same_as?: string[];
}

export interface AuthorProfile {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  role: string;
  role_ar: string;
  bio: string;
  bio_ar: string;
  photo: string | null;
  same_as: string[];
  /** staff only: email of the staff login linked to this author (blank = none) */
  user_email?: string;
  is_active: boolean;
  post_count: number;
  created_at: string;
  updated_at: string;
}
