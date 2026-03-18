export const metadata = { title: "Política de Privacidade — Detailer'HUB" };

export default function PrivacidadePage() {
  return (
    <div className="text-gray-900">
      {/* Hero */}
      <div className="bg-[#F0EEFF] border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Última atualização: março de 2025
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <section className="prose prose-gray max-w-none">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introdução</h2>
          <p className="text-gray-600 leading-relaxed">
            O Detailer'HUB (&quot;Plataforma&quot;, &quot;nós&quot;, &quot;nosso&quot;) valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como
            coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados
            (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Dados que coletamos</h2>
          <p className="text-gray-600 leading-relaxed">Coletamos os seguintes tipos de dados:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, senha (criptografada)</li>
            <li><strong>Dados de pagamento:</strong> processados pelo Stripe — não armazenamos dados de cartão</li>
            <li><strong>Dados de uso:</strong> páginas visitadas, conteúdos acessados, interações</li>
            <li><strong>Dados de comunicação:</strong> mensagens enviadas dentro da plataforma</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Como usamos seus dados</h2>
          <p className="text-gray-600 leading-relaxed">Utilizamos seus dados para:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Fornecer e melhorar os serviços da plataforma</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Enviar comunicações relevantes (com seu consentimento)</li>
            <li>Garantir a segurança e prevenir fraudes</li>
            <li>Cumprir obrigações legais</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Compartilhamento de dados</h2>
          <p className="text-gray-600 leading-relaxed">
            Não vendemos seus dados pessoais. Podemos compartilhá-los com parceiros essenciais para a operação da plataforma
            (processador de pagamentos, serviço de e-mail, hospedagem em nuvem), sempre com cláusulas contratuais de proteção de dados.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Seus direitos (LGPD)</h2>
          <p className="text-gray-600 leading-relaxed">Você tem direito a:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou incorretos</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar consentimentos dados anteriormente</li>
            <li>Portabilidade dos dados</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Para exercer qualquer direito, entre em contato pelo e-mail: <strong>privacidade@detailhub.com.br</strong>
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento
            de terceiros para publicidade.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Retenção de dados</h2>
          <p className="text-gray-600 leading-relaxed">
            Mantemos seus dados pelo tempo necessário para prestar os serviços ou cumprir obrigações legais. Após o encerramento
            da conta, os dados são excluídos em até 90 dias, exceto quando exigida retenção por lei.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Contato</h2>
          <p className="text-gray-600 leading-relaxed">
            Dúvidas sobre esta política? Fale com nosso Encarregado de Proteção de Dados (DPO):{" "}
            <strong>privacidade@detailhub.com.br</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
