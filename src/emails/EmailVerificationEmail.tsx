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

interface EmailVerificationEmailProps {
  firstName: string;
  verificationLink: string;
}

export function EmailVerificationEmail({
  firstName,
  verificationLink,
}: EmailVerificationEmailProps) {
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
              Confirme seu e-mail
            </Heading>
            <Text style={paragraph}>Olá, {firstName}!</Text>
            <Text style={paragraph}>
              Para finalizar o seu cadastro e ter acesso completo à plataforma,
              confirme o seu endereço de e-mail clicando no botão abaixo:
            </Text>
            <Button href={verificationLink} style={button}>
              Confirmar e-mail
            </Button>
            <Text style={warning}>
              Este link expira em <strong>24 horas</strong>.
            </Text>
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
const container = { margin: "0 auto", padding: "20px 0", maxWidth: "560px" };
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
const warning = { color: "#6B7280", fontSize: "13px", marginTop: "24px" };
const hr = { borderColor: "#374151", margin: "20px 0" };
const footer = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };

export default EmailVerificationEmail;
