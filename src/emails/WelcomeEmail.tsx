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

interface WelcomeEmailProps {
  firstName: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({
  firstName,
  dashboardUrl = "https://detailhub.com/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>DetailHub</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Bem-vindo, {firstName}!
            </Heading>
            <Text style={paragraph}>
              Sua conta foi criada com sucesso. Agora você faz parte da maior
              plataforma de comunidades automotivas do Brasil.
            </Text>
            <Text style={paragraph}>
              Explore comunidades, acesse conteúdos exclusivos e conecte-se com
              entusiastas do mundo automotivo.
            </Text>
            <Button href={dashboardUrl} style={button}>
              Acessar Dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} DetailHub. Todos os direitos
            reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#111827", fontFamily: "sans-serif" };
const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "560px",
};
const header = {
  backgroundColor: "#1F2937",
  padding: "20px 30px",
  borderRadius: "12px 12px 0 0",
};
const logo = { color: "#3B82F6", fontSize: "24px", margin: 0 };
const content = {
  backgroundColor: "#1F2937",
  padding: "30px",
  borderRadius: "0 0 12px 12px",
};
const heading = { color: "#FFFFFF", fontSize: "20px", marginTop: 0 };
const paragraph = { color: "#9CA3AF", fontSize: "15px", lineHeight: "24px" };
const button = {
  backgroundColor: "#3B82F6",
  color: "#FFFFFF",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  marginTop: "16px",
};
const hr = { borderColor: "#374151", margin: "20px 0" };
const footer = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };

export default WelcomeEmail;
