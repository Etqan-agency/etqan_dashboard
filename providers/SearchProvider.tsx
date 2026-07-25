"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SearchValue {
  query: string;
  setQuery: (q: string) => void;
  /** debounced copy — what pages should actually query with */
  debounced: string;
}

const SearchContext = createContext<SearchValue>({ query: "", setQuery: () => {}, debounced: "" });

export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // clear the box when moving between collections
  useEffect(() => {
    setQuery("");
    setDebounced("");
  }, [pathname]);

  return <SearchContext.Provider value={{ query, setQuery, debounced }}>{children}</SearchContext.Provider>;
}
