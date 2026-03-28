import Link from "next/link";
import { Trophy, Users, ChevronRight, ArrowRight } from "lucide-react";
import { CommunityThumbnail } from "@/components/community/CommunityThumbnail";

const featuredCommunities = [
  {
    name: "Barba",
    slug: "barba",
    primaryColor: "#FA4616",
    bannerUrl: "/photos/barba-thumb.png",
    members: "2.4k",
    description: "Estética automotiva sem enrolação. Queimando mitos.",
  },
  {
    name: "Corujão",
    slug: "corujao",
    primaryColor: "#F7941D",
    bannerUrl: "/photos/corujao-thumb.png",
    members: "1.8k",
    description: "Não é estúdio, não é detail. É zika! @corujaozk",
  },
  {
    name: "Comunidade no Mel",
    slug: "no-mel",
    primaryColor: "#FCB749",
    bannerUrl: "/photos/neto-thumb.png",
    members: "3.1k",
    description: "Educação em estética automotiva do zero ao avançado.",
  },
  {
    name: "Garagem do Gimenez",
    slug: "garagem-do-gimenez",
    primaryColor: "#C0392B",
    bannerUrl: null,
    members: "350",
    description: "A garagem do Gimenez — onde a paixão por carros vira conteúdo.",
  },
  {
    name: "Sala do Gigi",
    slug: "sala-do-gigi",
    primaryColor: "#006079",
    bannerUrl: null,
    members: "350",
    description: "A sala do Gigi — estética automotiva com estilo e precisão.",
  },
];

export function FeaturedCommunitiesSection() {
  return (
    <section id="comunidades" className="bg-[#1A1A1A] py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
            <Trophy className="w-3 h-3" />
            Comunidades em destaque
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4">
            Explore comunidades premium
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Dezenas de comunidades automotivas esperando por você. Uma assinatura, acesso a todas.
          </p>
        </div>

        {/* Horizontal scroll mobile / 5-col grid desktop */}
        <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-visible md:pb-0 snap-x snap-mandatory md:snap-none">
          {featuredCommunities.map((community, i) => (
            <div
              key={community.slug}
              className="flex-shrink-0 w-[78vw] max-w-[280px] md:w-auto glass-card overflow-hidden card-hover snap-start animate-slide-up"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <CommunityThumbnail
                bannerUrl={community.bannerUrl}
                primaryColor={community.primaryColor}
                name={community.name}
                className="h-40 md:h-44"
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#EEE6E4]">{community.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" />
                    {community.members}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{community.description}</p>
                <Link
                  href="/register"
                  className="block w-full text-center text-sm font-semibold py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: community.primaryColor }}
                >
                  Ver comunidade <ChevronRight className="inline w-4 h-4 -mt-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[#009CD9] hover:text-[#007A99] font-medium text-sm border border-[#006079]/20 hover:border-[#006079]/30 px-5 py-2.5 rounded-xl transition-all hover:bg-[#006079]/10"
          >
            Ver todas as comunidades <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
