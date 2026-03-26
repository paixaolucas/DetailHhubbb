import { Users, CheckCircle, Trophy } from "lucide-react";

const steps = [
  { step: "01", title: "Crie sua conta", desc: "Registre-se e configure seu perfil em menos de 5 minutos.", icon: Users },
  { step: "02", title: "Assine o plano", desc: "R$79/mês — acesso imediato a todas as comunidades da plataforma.", icon: CheckCircle },
  { step: "03", title: "Explore e evolua", desc: "Acesse cursos, lives, marketplace e a IA mecânica sem limites.", icon: Trophy },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">Como funciona</h2>
          <p className="text-gray-400 text-lg">Simples, direto e sem fricção.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map(({ step, title, desc, icon: Icon }, i) => (
            <div
              key={step}
              className="text-center animate-slide-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="w-14 h-14 bg-[#006079]/10 border border-[#006079]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#009CD9]" />
              </div>
              <div className="text-[#009CD9] text-xs font-bold mb-2 tracking-widest">{step}</div>
              <h4 className="text-[#EEE6E4] font-semibold mb-2">{title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
