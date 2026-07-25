import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  spark: <path d="M12 3l2.2 5.6L20 10.8l-5.8 2.2L12 19l-2.2-6L4 10.8l5.8-2.2L12 3z" />,
  pen: (
    <>
      <path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z" />
      <path d="M12.5 6.5l5 5" />
    </>
  ),
  quote: (
    <>
      <path d="M9 6H5a2 2 0 00-2 2v3a2 2 0 002 2h3v1a3 3 0 01-3 3" />
      <path d="M20 6h-4a2 2 0 00-2 2v3a2 2 0 002 2h3v1a3 3 0 01-3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <path d="M16 5.2a3.4 3.4 0 010 6.6M17.5 20a6.4 6.4 0 00-2-4.6" />
    </>
  ),
  badge: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M4.6 5.2h14.8L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5l1.6-7.8z" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 006 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 14a2 2 0 110-4h.1A1.6 1.6 0 004.6 6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0021 10a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h13" />
      <path d="M12 5l7 7-7 7" />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  trash: <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 20H5a1 1 0 01-1-1V5a1 1 0 011-1h4" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </>
  ),
  code: <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 18l5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
