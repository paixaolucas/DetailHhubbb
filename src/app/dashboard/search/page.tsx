"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, FileText, User, ArrowLeft, Filter } from "lucide-react";
import SearchResultItem from "@/components/search/SearchResultItem";

type FilterType = "all" | "communities" | "posts" | "members";

interface SearchData {
  communities: any[];
  posts: any[];
  members: any[];
  total: number;
}

const EMPTY: SearchData = { communities: [], posts: [], members: [], total: 0 };

const FILTERS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Todos", icon: Filter },
  { id: "communities", label: "Comunidades", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "members", label: "Membros", icon: User },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-9 h-9 bg-white/5 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/5 rounded w-2/5" />
        <div className="h-2 bg-white/5 rounded w-3/5" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>("all");
  const [results, setResults] = useState<SearchData>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&types=communities,posts,members`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const json = await res.json();
      if (json.success) setResults(json.data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q.length < 2) return;
    setQuery(q);
    router.replace(`/dashboard/search?q=${encodeURIComponent(q)}`);
    doSearch(q);
  };

  const getFilteredCommunities = () =>
    filter === "all" || filter === "communities" ? results.communities : [];
  const getFilteredPosts = () =>
    filter === "all" || filter === "posts" ? results.posts : [];
  const getFilteredMembers = () =>
    filter === "all" || filter === "members" ? results.members : [];

  const visibleTotal =
    getFilteredCommunities().length + getFilteredPosts().length + getFilteredMembers().length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#09090E" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-[#EEE6E4]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-[#EEE6E4]">Busca</h1>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Buscar comunidades, posts, membros..."
                className="w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-[#007A99] hover:bg-[#006079] text-white text-sm font-medium rounded-xl transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === id
                  ? "bg-[#007A99] text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-[#EEE6E4]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id !== "all" && hasSearched && !isLoading && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === id ? "bg-[#009CD9]" : "bg-white/5"
                  }`}
                >
                  {id === "communities" && results.communities.length}
                  {id === "posts" && results.posts.length}
                  {id === "members" && results.members.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {!isLoading && hasSearched && visibleTotal === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">
              Nenhum resultado para{" "}
              <span className="text-[#EEE6E4] font-medium">&quot;{query}&quot;</span>
            </p>
          </div>
        )}

        {!isLoading && hasSearched && visibleTotal > 0 && (
          <div className="space-y-4">
            {/* Communities */}
            {getFilteredCommunities().length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Comunidades ({getFilteredCommunities().length})
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {getFilteredCommunities().map((item) => (
                    <SearchResultItem
                      key={item.id}
                      type="community"
                      item={item}
                      onClick={() => router.push(`/c/${item.slug}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {getFilteredPosts().length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Posts ({getFilteredPosts().length})
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {getFilteredPosts().map((item) => (
                    <SearchResultItem
                      key={item.id}
                      type="post"
                      item={item}
                      onClick={() =>
                        router.push(
                          item.space?.community?.slug
                            ? `/c/${item.space.community.slug}/posts/${item.id}`
                            : `/dashboard`
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Members */}
            {getFilteredMembers().length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Membros ({getFilteredMembers().length})
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {getFilteredMembers().map((item) => (
                    <SearchResultItem
                      key={item.id}
                      type="member"
                      item={item}
                      onClick={() => router.push(`/members/${item.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Digite um termo acima para começar a buscar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
