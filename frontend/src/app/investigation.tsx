import { createContext, useContext, useState } from "react";
import type { ChatVisualization } from "@corpwatch/backend/contracts";

export interface Investigation { question: string; answer: string; visualizations: ChatVisualization[]; mode: string; at: string }

const InvestigationContext = createContext<{ investigation: Investigation | null; setInvestigation: (value: Investigation) => void }>({ investigation: null, setInvestigation: () => undefined });

export function InvestigationProvider({ children }: { children: React.ReactNode }) {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  return <InvestigationContext.Provider value={{ investigation, setInvestigation }}>{children}</InvestigationContext.Provider>;
}

export const useInvestigation = () => useContext(InvestigationContext);
