"use client";

import { createContext, useContext } from "react";

export interface ViewAsContextValue {
  viewAs: string | null;
  viewAsUser: { id: string; name: string; role: string; hasPlatform: boolean } | null;
  /** Role efetivo para renderizar conteúdo (considera viewAs) */
  effectiveRole: string;
  /** Nome efetivo para saudação (usa viewAsUser.name se disponível) */
  effectiveName: string;
  /** hasPlatform efetivo — usa dados reais do usuário simulado, não do admin */
  effectiveHasPlatform: boolean;
}

export const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: null,
  viewAsUser: null,
  effectiveRole: "",
  effectiveName: "",
  effectiveHasPlatform: false,
});

export function useViewAs() {
  return useContext(ViewAsContext);
}
