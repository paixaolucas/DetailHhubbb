export const metadata = { title: "Termos de Uso — DetailHub" };

export default function TermosPage() {
  return (
    <div className="text-gray-900">
      {/* Hero */}
      <div className="bg-[#F0EEFF] border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Termos de Uso</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Última atualização: março de 2025
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <section className="prose prose-gray max-w-none">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceitação dos termos</h2>
          <p className="text-gray-600 leading-relaxed">
            Ao acessar ou usar o DetailHub, você concorda com estes Termos de Uso. Se não concordar com qualquer parte deles,
            não utilize a plataforma.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Descrição do serviço</h2>
          <p className="text-gray-600 leading-relaxed">
            O DetailHub é uma plataforma de comunidades automotivas premium. Com uma assinatura anual, membros têm acesso a
            todas as comunidades da plataforma, seus conteúdos, eventos, lives e marketplace.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Cadastro e conta</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Você deve ter pelo menos 18 anos para criar uma conta</li>
            <li>É responsável pela veracidade das informações fornecidas</li>
            <li>É responsável por manter a confidencialidade da sua senha</li>
            <li>Cada pessoa pode ter apenas uma conta na plataforma</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Assinatura e pagamento</h2>
          <p className="text-gray-600 leading-relaxed">
            A assinatura da plataforma custa R$837/ano e dá acesso a todas as comunidades. O pagamento é processado via Stripe
            e cobrado antecipadamente pelo período contratado. Não há reembolso após 7 dias corridos do pagamento,
            conforme o Código de Defesa do Consumidor.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Conduta dos usuários</h2>
          <p className="text-gray-600 leading-relaxed">É proibido:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Publicar conteúdo ofensivo, discriminatório ou ilegal</li>
            <li>Fazer spam ou enviar mensagens não solicitadas</li>
            <li>Violar direitos de propriedade intelectual de terceiros</li>
            <li>Tentar acessar áreas restritas da plataforma sem autorização</li>
            <li>Usar a plataforma para fins comerciais não autorizados</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Conteúdo dos criadores</h2>
          <p className="text-gray-600 leading-relaxed">
            Os criadores (Influencer Admins) são responsáveis pelo conteúdo publicado em suas comunidades. O DetailHub
            reserva-se o direito de remover conteúdos que violem estes termos, sem aviso prévio.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Marketplace</h2>
          <p className="text-gray-600 leading-relaxed">
            O DetailHub atua como intermediário no marketplace. Vendedores são responsáveis pela veracidade das informações
            dos produtos. O DetailHub não se responsabiliza por transações realizadas fora da plataforma.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Limitação de responsabilidade</h2>
          <p className="text-gray-600 leading-relaxed">
            O DetailHub não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma.
            Nossa responsabilidade total está limitada ao valor pago pela assinatura nos últimos 12 meses.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Alterações nos termos</h2>
          <p className="text-gray-600 leading-relaxed">
            Podemos atualizar estes termos periodicamente. Notificaremos usuários sobre mudanças significativas por e-mail
            ou aviso na plataforma. O uso continuado após a notificação constitui aceitação dos novos termos.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Legislação aplicável</h2>
          <p className="text-gray-600 leading-relaxed">
            Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão resolvidas no foro da Comarca de
            São Paulo, SP, Brasil.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Contato</h2>
          <p className="text-gray-600 leading-relaxed">
            Dúvidas sobre estes termos? Entre em contato: <strong>legal@detailhub.com.br</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
