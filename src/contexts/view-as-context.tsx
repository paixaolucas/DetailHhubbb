"use client";

import { createContext, useContext } from "react";

export interface ViewAsContextValue {
  viewAs: string | null;
  viewAsUser: { id: string; name: string; role: string } | null;
  /** Role efetivo para renderizar conteúdo (considera viewAs) */
  effectiveRole: string;
  /** Nome efetivo para saudação (usa viewAsUser.name se disponível) */
  effectiveName: string;
}

export const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: null,
  viewAsUser: null,
  effectiveRole: "",
  effectiveName: "",
});

export function useViewAs() {
  return useContext(ViewAsContext);
}
