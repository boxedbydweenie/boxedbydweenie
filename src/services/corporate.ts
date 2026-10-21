import { callLeads } from "@/lib/api";
import type { ConsultationRequest, ConsultationResult } from "@/types/corporate";

/** Saves a corporate consultation request and emails the team. */
export async function submitConsultation(req: ConsultationRequest): Promise<ConsultationResult> {
  return callLeads<ConsultationResult>({ kind: "consultation", ...req });
}
