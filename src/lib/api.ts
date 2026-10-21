/**
 * Calls the shop API (Supabase Edge Function "shop").
 * The URL and publishable key are public by design; secrets (Paystack secret key,
 * service role) live only in Supabase. Override with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
 */
const env = import.meta.env as Record<string, string | undefined>;
export const SUPABASE_URL = env["VITE_SUPABASE_URL"] ?? "https://zstplraslhhkfyiapjdm.supabase.co";
export const SUPABASE_KEY = env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "sb_publishable_zMMLyNJ9KvHvhH1irrH-2A_nmyHBC5x";

export class ApiError extends Error {}

export async function callShop<T>(action: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/shop`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, ...body }),
    });
  } catch {
    throw new ApiError("We could not reach our checkout. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong. Please try again.");
  return data;
}
