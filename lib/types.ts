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

export interface Service extends Timestamped {
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  icon: string;
  features: string[];
  order: number;
  is_active: boolean;
}

export interface ProjectImage {
  id: string;
  image: string;
  caption: string;
  order: number;
}

export interface Project extends Timestamped {
  title: string;
  slug: string;
  category: "web" | "mobile" | "uiux" | "enterprise";
  category_display?: string;
  summary: string;
  description: string;
  cover_image: string;
  gallery: ProjectImage[];
  tech_stack: string[];
  client_name: string;
  live_url: string;
  is_featured: boolean;
  published: boolean;
  order: number;
}

export interface Tag {
  id?: string;
  name: string;
  slug: string;
}

export interface Post extends Timestamped {
  title: string;
  slug: string;
  cover_image: string;
  excerpt: string;
  body: string;
  tags: Tag[];
  /** write-only — the API never returns this */
  tag_slugs?: string[];
  author?: { id?: string; name?: string; email?: string };
  published: boolean;
  published_at: string | null;
  meta_title: string;
  meta_description: string;
}

export interface Opinion extends Timestamped {
  quote: string;
  author_name: string;
  author_role: string;
  avatar: string;
  order: number;
  is_active: boolean;
}

export interface TeamMember extends Timestamped {
  name: string;
  role: string;
  photo: string;
  bio: string;
  socials: Record<string, string>;
  order: number;
  is_active: boolean;
}

export interface Client extends Timestamped {
  name: string;
  logo: string;
  website: string;
  order: number;
  is_active: boolean;
}

export interface Message extends Timestamped {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
  project_type: string;
  budget_range: string;
  is_read: boolean;
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
  updated_at?: string;
}

/** Anything the generic resource table can render. */
export type AnyRecord = Record<string, any> & { id: string; slug?: string };
