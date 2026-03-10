// =============================================================================
// STANDARD API MESSAGES (PT-BR)
// =============================================================================

export const MESSAGES = {
  NOT_FOUND: "Recurso não encontrado",
  FORBIDDEN: "Acesso negado",
  UNAUTHORIZED: "Autenticação necessária",
  CONFLICT: "Conflito: registro já existe",
  BAD_REQUEST: "Dados inválidos",
  INTERNAL: "Erro interno do servidor",
  CREATED: "Criado com sucesso",
  UPDATED: "Atualizado com sucesso",
  DELETED: "Removido com sucesso",

  // Auth
  INVALID_CREDENTIALS: "Credenciais inválidas",
  EMAIL_ALREADY_REGISTERED: "Email já cadastrado",
  TOKEN_EXPIRED: "Token expirado",
  TOKEN_INVALID: "Token inválido",
  RATE_LIMITED: "Muitas requisições. Tente novamente em alguns instantes.",

  // Community
  COMMUNITY_NOT_FOUND: "Comunidade não encontrada",
  SLUG_TAKEN: "Este URL já está em uso",
  MEMBERSHIP_REQUIRED: "Você precisa ser membro desta comunidade",

  // Plans
  PLAN_NOT_FOUND: "Plano não encontrado",

  // Users
  USER_NOT_FOUND: "Usuário não encontrado",
  SELF_MODIFICATION_FORBIDDEN: "Não é possível alterar o próprio perfil desta forma",
} as const;
