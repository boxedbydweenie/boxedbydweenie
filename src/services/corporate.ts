import type { ConsultationRequest, ConsultationResult } from "@/types/corporate";

// Mock. Swap for the real API later.
export async function submitConsultation(req: ConsultationRequest): Promise<ConsultationResult> {
  await new Promise((r) => setTimeout(r, 700));
  void req;
  const n = Math.floor(100000 + Math.random() * 900000);
  return { reference: `BBD-CORP-${n}` };
}
