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
  Row,
  Column,
} from "@react-email/components";

interface PaymentConfirmationEmailProps {
  firstName: string;
  communityName: string;
  planName: string;
  amount: string;
  dashboardUrl?: string;
}

export function PaymentConfirmationEmail({
  firstName,
  communityName,
  planName,
  amount,
  dashboardUrl = "https://detailhub.com/dashboard",
}: PaymentConfirmationEmailProps) {
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
              Pagamento confirmado!
            </Heading>
            <Text style={paragraph}>Olá, {firstName}!</Text>
            <Text style={paragraph}>
              Seu pagamento foi processado com sucesso. Você agora tem acesso à
              comunidade <strong style={{ color: "#FFFFFF" }}>{communityName}</strong>.
            </Text>

            <Section style={detailsBox}>
              <Row>
                <Column style={detailLabel}>Plano</Column>
                <Column style={detailValue}>{planName}</Column>
              </Row>
              <Row>
                <Column style={detailLabel}>Valor</Column>
                <Column style={detailValue}>{amount}</Column>
              </Row>
            </Section>

            <Button href={dashboardUrl} style={button}>
              Acessar comunidade
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
const detailsBox = {
  backgroundColor: "#111827",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};
const detailLabel = { color: "#6B7280", fontSize: "14px", padding: "4px 0" };
const detailValue = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: "bold",
  textAlign: "right" as const,
};
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

export default PaymentConfirmationEmail;
