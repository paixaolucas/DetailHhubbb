// Saudações escritas com a voz da marca Detailer'HUB:
// direto e confiante · técnico quando necessário · caloroso sem ser informal
// referências ao nicho (polimento, garagem, pista, detalhe) · pertencimento sem arrogância
// fonte: .claude/agents/design/brand-guardian.md

const GREETINGS = {
  morning: [
    (name: string) => `Motor aquecido, ${name}. Vamos ao que importa.`,
    (name: string) => `Cedo na pista, ${name}. Isso é paixão de verdade.`,
    (name: string) => `Dia de detalhar, ${name}. A garagem te espera.`,
    (name: string) => `Bom te ver por aqui, ${name}. O dia começa na garagem.`,
    (name: string) => `Manhã de quem leva a sério, ${name}.`,
  ],
  afternoon: [
    (name: string) => `Na pista, ${name}. Tudo nos trinques.`,
    (name: string) => `Tarde de polimento, ${name}. Detalhe por detalhe.`,
    (name: string) => `Você está aqui, ${name}. Isso já diz tudo.`,
    (name: string) => `A tarde é sua, ${name}. A garagem também.`,
    (name: string) => `Produtivo como sempre, ${name}.`,
  ],
  night: [
    (name: string) => `A garagem nunca fecha, ${name}.`,
    (name: string) => `Noite de quem vive o detalhe, ${name}.`,
    (name: string) => `Luzes acesas, ${name}. A paixão não tem horário.`,
    (name: string) => `Ainda aqui, ${name}. É isso que separa os bons dos melhores.`,
    (name: string) => `A noite é de quem realmente ama o que faz, ${name}.`,
  ],
};

export function getGreeting(firstName: string): string {
  const now = new Date();
  // Sempre usa o fuso de São Paulo, independente do servidor ou browser
  const hour = parseInt(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(now),
    10
  );

  let pool: ((name: string) => string)[];
  if (hour >= 5 && hour < 12) pool = GREETINGS.morning;
  else if (hour >= 12 && hour < 18) pool = GREETINGS.afternoon;
  else pool = GREETINGS.night;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx](firstName);
}
