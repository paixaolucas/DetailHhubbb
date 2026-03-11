"use client";

import { useRouter } from "next/navigation";
import SearchResultItem from "./SearchResultItem";

interface SearchResultsProps {
  results: {
    communities: any[];
    posts: any[];
    members: any[];
  };
  query: string;
  onClose: () => void;
}

export default function SearchResults({ results, query, onClose }: SearchResultsProps) {
  const router = useRouter();
  const { communities, posts, members } = results;
  const total = communities.length + posts.length + members.length;

  if (total === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-gray-400">
          Nenhum resultado para <span className="text-gray-900 font-medium">&quot;{query}&quot;</span>
        </p>
      </div>
    );
  }

  const handleCommunityClick = (slug: string) => {
    router.push(`/c/${slug}`);
    onClose();
  };

  const handlePostClick = (postId: string, communitySlug?: string) => {
    if (communitySlug) {
      router.push(`/c/${communitySlug}/posts/${postId}`);
    } else {
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    }
    onClose();
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {communities.length > 0 && (
        <section className="p-2">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Comunidades
          </p>
          {communities.map((item) => (
            <SearchResultItem
              key={item.id}
              type="community"
              item={item}
              onClick={() => handleCommunityClick(item.slug)}
            />
          ))}
        </section>
      )}

      {posts.length > 0 && (
        <section className="p-2">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Posts
          </p>
          {posts.map((item) => (
            <SearchResultItem
              key={item.id}
              type="post"
              item={item}
              onClick={() => handlePostClick(item.id, item.space?.community?.slug)}
            />
          ))}
        </section>
      )}

      {members.length > 0 && (
        <section className="p-2">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Membros
          </p>
          {members.map((item) => (
            <SearchResultItem
              key={item.id}
              type="member"
              item={item}
              onClick={() => handleMemberClick(item.id)}
            />
          ))}
        </section>
      )}

      <div className="border-t border-gray-200 px-4 py-2">
        <button
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          onClick={() => {
            router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            onClose();
          }}
        >
          Ver todos os resultados para &quot;{query}&quot;
        </button>
      </div>
    </div>
  );
}
