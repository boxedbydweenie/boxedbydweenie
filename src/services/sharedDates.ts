import { toast } from "sonner";
import { customerClient } from "@/lib/supabase";
import { defaultLeadStore } from "@/components/app/kit";
import { peopleStore } from "@/services/calendar";
import type { Person, PersonalDate, PersonalDateType, Relationship } from "@/types/calendar";

/**
 * "Add your dates" link. A signed-in customer shares a personal link; anyone who opens it can add
 * their own birthday and anniversaries, which then land in the customer's Gift Calendar.
 */

export const SHARE_BASE = "https://boxedbydweenie.com/app/add";

/** The signed-in customer's personal link code (created on first use). */
export async function myInviteCode(): Promise<string> {
  const { data, error } = await customerClient().rpc("my_date_invite_code");
  if (error || typeof data !== "string")
    throw new Error("We couldn't make your link. Please try again.");
  return data;
}

/** First name of whoever shared the link, or null if the link isn't valid. */
export async function inviteName(code: string): Promise<string | null> {
  const { data, error } = await customerClient().rpc("date_invite_name", { p_code: code });
  if (error) throw new Error("We couldn't open this link. Check your connection and try again.");
  return typeof data === "string" && data ? data : null;
}

export interface SharedDateInput {
  type: PersonalDateType;
  label: string;
  day: number;
  month: number;
  year?: number;
}

/** Someone adds their dates through a link. */
export async function submitSharedDates(input: {
  code: string;
  name: string;
  relationship: string;
  dates: SharedDateInput[];
  likes: string;
}) {
  const { error } = await customerClient().rpc("submit_shared_dates", {
    p_code: input.code,
    p_name: input.name,
    p_relationship: input.relationship,
    p_dates: input.dates,
    p_likes: input.likes,
  });
  if (error) throw new Error(error.message || "We couldn't save your dates. Please try again.");
}

/** How the sender describes themselves ("I'm your…"), mapped to the calendar's relationships. */
export const SENDER_RELS: [string, Relationship][] = [
  ["Family", "Sibling"],
  ["Friend", "Friend"],
  ["Colleague", "Colleague"],
  ["Client", "Client"],
  ["Partner", "Partner"],
  ["Other", "Other"],
];

interface Row {
  id: string;
  from_name: string;
  relationship: string | null;
  dates: SharedDateInput[];
  likes: string | null;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const same = (a: Pick<PersonalDate, "type" | "day" | "month">, b: SharedDateInput) =>
  a.type === b.type && a.day === b.day && a.month === b.month;

/**
 * Bring in dates people added through the link since last time. Matching names are merged into the
 * person already saved; new names become new people. Each reply is marked imported so it only arrives once.
 */
export async function importSharedDates(): Promise<number> {
  const sb = customerClient();
  const { data, error } = await sb
    .from("shared_dates")
    .select("id,from_name,relationship,dates,likes")
    .is("imported_at", null)
    .order("created_at")
    .limit(100);
  if (error || !data?.length) return 0;
  const lead = defaultLeadStore.get();
  const people = [...peopleStore.get()];
  const names: string[] = [];
  for (const r of data as Row[]) {
    const name = r.from_name.trim();
    const dates = (Array.isArray(r.dates) ? r.dates : []).filter((d) => d && d.day && d.month);
    if (!name || !dates.length) continue;
    const existing = people.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      const add = dates.filter((d) => !existing.dates.some((x) => same(x, d)));
      const updated: Person = {
        ...existing,
        dates: [
          ...existing.dates,
          ...add.map((d) => ({ ...d, id: uid("dt"), personId: existing.id, daysBefore: [lead] })),
        ],
        notes: {
          ...existing.notes,
          likes: existing.notes.likes || r.likes || "",
        },
        reminder: {
          ...existing.reminder,
          daysBefore: [...new Set([...existing.reminder.daysBefore, lead])],
        },
      };
      people[people.indexOf(existing)] = updated;
    } else {
      const id = uid("per");
      people.push({
        id,
        name,
        relationship: SENDER_RELS.find(([l]) => l === r.relationship)?.[1] ?? "Friend",
        dates: dates.map((d) => ({ ...d, id: uid("dt"), personId: id, daysBefore: [lead] })),
        notes: { likes: r.likes ?? "", dislikes: "", sizes: "", noAlcohol: false, budget: 0 },
        reminder: { daysBefore: [lead], channels: ["email"] },
        createdAt: new Date().toISOString(),
      });
    }
    names.push(name.split(/\s+/)[0]!);
  }
  peopleStore.set(people);
  await sb
    .from("shared_dates")
    .update({ imported_at: new Date().toISOString() })
    .in(
      "id",
      data.map((r) => r.id),
    );
  if (names.length) {
    const who =
      names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names[0]}, ${names[1]} and ${names.length - 2} more`;
    toast.success(`${who} added their dates to your calendar.`);
  }
  return names.length;
}
