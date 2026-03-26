const influencers = [
  { name: "Barba", handle: "@barbecocar", initials: "B" },
  { name: "Corujão", handle: "@corujaozk", initials: "C" },
  { name: "Gimenez", handle: "@garagemgimenez", initials: "G" },
  { name: "Neto", handle: "@nopedal_neto", initials: "N" },
  { name: "Geovane", handle: "@geovane_detailing", initials: "GE" },
];

// 4× para garantir loop sempre visível em qualquer largura de tela
const loop = [...influencers, ...influencers, ...influencers, ...influencers];

export function InfluencerStripSection() {
  return (
    <section className="bg-[#161616] border-y border-white/5 py-6 overflow-hidden">
      <p className="text-xs text-gray-600 font-bold tracking-[2.5px] uppercase mb-5 text-center px-4">
        Aprenda com os maiores nomes da estética automotiva no Brasil
      </p>

      <div className="relative">
        {/* Fade nas bordas */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[#161616] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[#161616] to-transparent z-10" />

        {/*
          Cada item usa mr-10 em vez de gap no pai.
          Isso garante que o último item também tenha 40px de espaçamento
          antes do "reinício" do loop, eliminando o salto visual.
        */}
        <div className="flex animate-marquee w-max items-center">
          {loop.map(({ name, handle, initials }, i) => (
            <div
              key={`${handle}-${i}`}
              className="flex items-center gap-2.5 flex-shrink-0 mr-14"
            >
              <div className="w-9 h-9 rounded-full bg-[#006079]/20 border border-[#006079]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[#009CD9] text-xs font-bold">{initials}</span>
              </div>
              <div>
                <p className="text-[#EEE6E4] text-sm font-semibold leading-tight whitespace-nowrap">{name}</p>
                <p className="text-gray-500 text-xs leading-tight whitespace-nowrap">{handle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
