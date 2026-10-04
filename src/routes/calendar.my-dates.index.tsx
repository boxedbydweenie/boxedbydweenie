import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, Plus } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow } from "@/components/site/Brand";
import { AddPersonSheet } from "@/components/calendar/AddPersonSheet";
import { MyDatesGate } from "@/components/calendar/MyDatesGate";
import { PersonAvatar } from "@/components/calendar/PersonAvatar";
import { usePeople } from "@/hooks/use-calendar";
import { useUser } from "@/hooks/use-shop";
import { daysUntil, formatLong, nextDateFor } from "@/services/calendar";

export const Route = createFileRoute("/calendar/my-dates/")({
  validateSearch: z.object({
    add: z.boolean().optional().catch(undefined),
    name: z.string().optional().catch(undefined),
    day: z.coerce.number().int().min(1).max(31).optional().catch(undefined),
    month: z.coerce.number().int().min(1).max(12).optional().catch(undefined),
    label: z.string().optional().catch(undefined),
  }),
  head: () => ({
    meta: [
      { title: "My dates — Gift Calendar — Boxed by Dweenie" },
      { name: "description", content: "Save birthdays and anniversaries for the people who matter, with reminders and gift ideas in good time." },
      { property: "og:title", content: "My dates — Boxed by Dweenie Gift Calendar" },
      { property: "og:description", content: "Save the birthdays and anniversaries that matter. We'll remind you in time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyDates,
});

function MyDates() {
  const user = useUser();
  const people = usePeople();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [open, setOpen] = useState(false);
  useEffect(() => { if (user && search.add) setOpen(true); }, [user, search.add]);
  const onOpenChange = (o: boolean) => { setOpen(o); if (!o && search.add) navigate({ search: {}, replace: true }); };
  const sorted = [...people].map((p) => ({ p, next: nextDateFor(p) })).sort((a, b) => (a.next?.on ?? "9").localeCompare(b.next?.on ?? "9"));

  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/calendar" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> Gift Calendar</Link>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div className="min-w-0"><Eyebrow>Gift Calendar</Eyebrow><h1 className="mt-3 text-3xl md:text-4xl">My dates</h1></div>
        {user && people.length > 0 && <Button onClick={() => setOpen(true)}><Plus /> <span className="hidden sm:inline">Add a person</span></Button>}</div>
    </div></div>
    <div className="mx-auto max-w-5xl px-5 py-10">
      {!user ? <MyDatesGate /> : people.length === 0 ? <div className="flex flex-col items-center rounded-md border border-border bg-ivory px-6 py-14 text-center">
        <div className="pattern-bow size-24 opacity-30" />
        <p className="mt-5 max-w-sm text-muted-foreground">Save the birthdays and anniversaries that matter. We'll remind you in time.</p>
        <Button className="mt-6" onClick={() => setOpen(true)}><Plus /> Add your first person</Button>
      </div> : <ul className="divide-y divide-border border-y border-border">{sorted.map(({ p, next }) => <li key={p.id}>
        <Link to="/calendar/my-dates/$personId" params={{ personId: p.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-5 hover:bg-ivory">
          <PersonAvatar person={p} />
          <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.relationship}{next ? ` · ${next.date.label}, ${formatLong(next.on)}` : ""}</p></div>
          {next && <span className="text-right text-sm font-semibold">{daysUntil(next.on) === 0 ? "Today" : `${daysUntil(next.on)} days`}</span>}
        </Link>
      </li>)}</ul>}
    </div>
    <AddPersonSheet open={open} onOpenChange={onOpenChange} prefill={{ ...(search.name ? { name: search.name } : {}), ...(search.day ? { day: search.day } : {}), ...(search.month ? { month: search.month } : {}), ...(search.label ? { label: search.label } : {}) }} />
  </main></SiteShell>;
}
