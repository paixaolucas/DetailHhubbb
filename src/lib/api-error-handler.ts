// =============================================================================
// CENTRALIZED API ERROR HANDLER
// Maps Prisma and AppError exceptions to HTTP responses
// =============================================================================

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AppError } from "@/types";

export function handleApiError(error: unknown): NextResponse {
  // Known Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025": // Record not found
        return NextResponse.json(
          { success: false, error: "Recurso não encontrado" },
          { status: 404 }
        );
      case "P2002": // Unique constraint violation
        return NextResponse.json(
          { success: false, error: "Conflito: registro já existe" },
          { status: 409 }
        );
      case "P2003": // Foreign key constraint
        return NextResponse.json(
          { success: false, error: "Referência inválida" },
          { status: 400 }
        );
    }
  }

  // App-level errors
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  console.error("[API Error]", error);
  return NextResponse.json(
    { success: false, error: "Erro interno do servidor" },
    { status: 500 }
  );
}
