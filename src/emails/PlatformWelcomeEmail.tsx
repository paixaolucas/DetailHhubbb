import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface PlatformWelcomeEmailProps {
  firstName: string;
  planName: string;
  amount: string;
  dashboardUrl?: string;
}

export function PlatformWelcomeEmail({
  firstName,
  planName,
  amount,
  dashboardUrl = "https://detailhub.com/dashboard",
}: PlatformWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Detailer&apos;HUB</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Bem-vindo à plataforma!
            </Heading>
            <Text style={paragraph}>Olá, {firstName}!</Text>
            <Text style={paragraph}>
              Seu pagamento foi confirmado. Você agora tem acesso a{" "}
              <strong style={{ color: "#FFFFFF" }}>todas as comunidades</strong>{" "}
              do Detailer&apos;HUB com uma única assinatura.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailRow}>
                <span style={detailLabel}>Plano</span>
                <span style={detailValue}>{planName}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Valor</span>
                <span style={detailValue}>{amount}</span>
              </Text>
            </Section>

            <Section style={onboardingBox}>
              <Text style={onboardingTitle}>🚀 Sua jornada de 7 dias — Quick Win</Text>
              <Text style={onboardingSubtitle}>
                Esses 5 passos vão te mostrar quanto você pode ganhar a mais no próximo serviço:
              </Text>
              <Text style={step}>1. Assista a Aula 1.1 — Preparação de Superfície</Text>
              <Text style={step}>2. Abra a Planilha de Precificação</Text>
              <Text style={step}>3. Calcule o custo real de 1 serviço que já faz</Text>
              <Text style={step}>4. Assista a Aula 5.1 — Por que você cobra menos do que deveria</Text>
              <Text style={step}>5. Defina o novo preço para esse serviço</Text>
              <Text style={onboardingNote}>
                Leva menos de 1 hora. A maioria dos membros descobre que cobra pelo menos 30% abaixo do mercado.
              </Text>
            </Section>

            <Button href={dashboardUrl} style={button}>
              Começar agora →
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} Detailer&apos;HUB. Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#1A1A1A", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "20px 0", maxWidth: "560px" };
const header = {
  backgroundColor: "#006079",
  padding: "20px 30px",
  borderRadius: "12px 12px 0 0",
};
const logo = { color: "#EEE6E4", fontSize: "24px", margin: 0 };
const content = {
  backgroundColor: "#1F2937",
  padding: "30px",
  borderRadius: "0 0 12px 12px",
};
const heading = { color: "#FFFFFF", fontSize: "20px", marginTop: 0 };
const paragraph = { color: "#9CA3AF", fontSize: "15px", lineHeight: "24px" };
const detailsBox = {
  backgroundColor: "#111827",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};
const detailRow = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  margin: "4px 0",
  fontSize: "14px",
};
const detailLabel = { color: "#6B7280" };
const detailValue = { color: "#FFFFFF", fontWeight: "bold" as const };
const button = {
  backgroundColor: "#009CD9",
  color: "#FFFFFF",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  marginTop: "16px",
};
const onboardingBox = {
  backgroundColor: "#0A2A35",
  border: "1px solid #006079",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};
const onboardingTitle = { color: "#009CD9", fontSize: "14px", fontWeight: "bold" as const, margin: "0 0 4px 0" };
const onboardingSubtitle = { color: "#9CA3AF", fontSize: "13px", margin: "0 0 12px 0" };
const step = { color: "#EEE6E4", fontSize: "13px", margin: "4px 0", paddingLeft: "4px" };
const onboardingNote = { color: "#6B7280", fontSize: "12px", fontStyle: "italic" as const, margin: "10px 0 0 0" };
const hr = { borderColor: "#374151", margin: "20px 0" };
const footer = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };

export default PlatformWelcomeEmail;
