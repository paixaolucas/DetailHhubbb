// =============================================================================
// ASAAS API TYPES
// =============================================================================

export type AsaasEnvironment = "sandbox" | "production";

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  externalReference?: string;
}

export interface AsaasCreateCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string; // CPF (11 dígitos) ou CNPJ (14 dígitos), sem formatação
  externalReference?: string; // userId
  notificationDisabled?: boolean;
}

export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
export type AsaasCycle =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "YEARLY";

export interface AsaasCreateSubscriptionInput {
  customer: string; // Asaas customer ID
  billingType: AsaasBillingType;
  cycle: AsaasCycle;
  value: number; // em BRL (não centavos)
  nextDueDate: string; // "YYYY-MM-DD"
  description?: string;
  externalReference?: string; // JSON: userId + platformPlanId + referredByInfluencerId
  discount?: { value: number; type: "PERCENTAGE" | "FIXED" };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  remoteIp?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  cycle: AsaasCycle;
  value: number;
  nextDueDate: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  externalReference?: string;
  description?: string;
  paymentLink?: string;
  invoiceUrl?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  billingType: AsaasBillingType;
  value: number;
  netValue: number;
  status:
    | "PENDING"
    | "RECEIVED"
    | "CONFIRMED"
    | "OVERDUE"
    | "REFUNDED"
    | "RECEIVED_IN_CASH"
    | "REFUND_REQUESTED"
    | "REFUND_IN_PROGRESS"
    | "CHARGEBACK_REQUESTED"
    | "CHARGEBACK_DISPUTE"
    | "AWAITING_CHARGEBACK_REVERSAL"
    | "DUNNING_REQUESTED"
    | "DUNNING_RECEIVED"
    | "AWAITING_RISK_ANALYSIS";
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // imagem QR code em base64
  payload: string; // string PIX copia-e-cola
  expirationDate: string;
}

// Webhook payload
export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}

export type AsaasWebhookEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "PAYMENT_DUNNING_REQUESTED"
  | "PAYMENT_DUNNING_RECEIVED"
  | "PAYMENT_BANK_SLIP_VIEWED"
  | "PAYMENT_CHECKOUT_VIEWED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_INACTIVATED"
  | "SUBSCRIPTION_RENEWED";
