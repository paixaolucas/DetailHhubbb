"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import SearchResults from "./SearchResults";

interface SearchData {
  communities: any[];
  posts: any[];
  members: any[];
}

const EMPTY_RESULTS: SearchData = { communities: [], posts: [], members: [] };

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchData>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(EMPTY_RESULTS);
    }
  }, [isOpen]);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&types=communities,posts,members`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 300);
  };

  const close = () => setIsOpen(false);

  const showResults = query.length >= 2;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-colors"
        aria-label="Abrir busca"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-gray-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              {isLoading ? (
                <div className="w-4 h-4 border-[2px] border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Buscar comunidades, posts, membros..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={close}
                className="hidden sm:flex items-center gap-1 text-xs text-gray-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono hover:bg-white/10 transition-colors"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            {showResults ? (
              <SearchResults results={results} query={query} onClose={close} />
            ) : (
              <div className="px-4 py-6 text-center text-xs text-gray-600">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
