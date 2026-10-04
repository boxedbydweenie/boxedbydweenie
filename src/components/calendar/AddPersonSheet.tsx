import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, FormField } from "@/components/site/Brand";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addPerson, type NewPerson } from "@/services/calendar";
import type { PersonalDateType, Relationship, ReminderChannel } from "@/types/calendar";
import { cn } from "@/lib/utils";

const RELATIONSHIPS: Relationship[] = ["Partner", "Parent", "Sibling", "Child", "Friend", "Colleague", "Client", "Other"];
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleDateString("en-GB", { month: "long" }));
type DraftDate = { type: PersonalDateType; label: string; day: string; month: string; year: string };
const blankDate = (type: PersonalDateType = "birthday"): DraftDate => ({ type, label: type === "birthday" ? "Birthday" : type === "anniversary" ? "Anniversary" : "", day: "", month: "", year: "" });

export interface PersonPrefill { name?: string; day?: number; month?: number; label?: string }

export function AddPersonSheet({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (o: boolean) => void; prefill?: PersonPrefill }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [dates, setDates] = useState<DraftDate[]>([blankDate()]);
  const [notes, setNotes] = useState({ likes: "", dislikes: "", sizes: "", noAlcohol: false, budget: "50000" });
  const [days, setDays] = useState<number[]>([7]);
  const [channels, setChannels] = useState<ReminderChannel[]>(["whatsapp"]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0); setError(""); setName(prefill?.name ?? ""); setRelationship(""); setPhoto(undefined);
    setDates([prefill?.day && prefill.month ? { type: "custom", label: prefill.label ?? "Special date", day: String(prefill.day), month: String(prefill.month), year: "" } : blankDate()]);
    setNotes({ likes: "", dislikes: "", sizes: "", noAlcohol: false, budget: "50000" }); setDays([7]); setChannels(["whatsapp"]);
  }, [open, prefill?.name, prefill?.day, prefill?.month, prefill?.label]);

  const next = () => {
    if (step === 0 && (!name.trim() || !relationship)) return setError("Add a name and choose a relationship.");
    if (step === 1 && dates.some((d) => !d.day || !d.month || !d.label.trim())) return setError("Each date needs a name, day and month.");
    setError(""); setStep(step + 1);
  };
  const save = async () => {
    const input: NewPerson = {
      name: name.trim(), relationship: relationship as Relationship, ...(photo ? { photo } : {}),
      dates: dates.map((d) => ({ type: d.type, label: d.label.trim(), day: Number(d.day), month: Number(d.month), ...(d.year ? { year: Number(d.year) } : {}) })),
      notes: { ...notes, budget: Number(notes.budget) || 0 },
      reminder: { daysBefore: days, channels },
    };
    await addPerson(input);
    toast(`${input.name} has been added to your Gift Calendar.`);
    onOpenChange(false);
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const setDate = (i: number, p: Partial<DraftDate>) => setDates(dates.map((d, j) => (j === i ? { ...d, ...p } : d)));

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="flex w-full flex-col overflow-y-auto bg-paper sm:max-w-md">
      <SheetTitle>Add a person</SheetTitle>
      <SheetDescription>Step {step + 1} of 3 · {["Who they are", "Dates to remember", "Notes and reminders"][step]}</SheetDescription>
      <div className="mt-2 flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-border")} />)}</div>

      <div className="mt-6 flex-1 space-y-5">
        {step === 0 && <>
          <FormField label="Name" name="person-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          <div><Label>Relationship</Label><Select value={relationship} onValueChange={(v) => setRelationship(v as Relationship)}><SelectTrigger className="mt-2 min-h-11"><SelectValue placeholder="Choose one" /></SelectTrigger><SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="person-photo">Photo (optional)</Label><input id="person-photo" type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(f); }} />{photo && <img src={photo} alt="" className="mt-3 size-16 rounded-full object-cover" />}</div>
        </>}

        {step === 1 && <>
          {dates.map((d, i) => <fieldset key={i} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between"><div className="flex gap-1">{(["birthday", "anniversary", "custom"] as const).map((t) => <Button key={t} type="button" size="sm" variant={d.type === t ? "default" : "outline"} onClick={() => setDate(i, { ...blankDate(t), day: d.day, month: d.month, year: d.year })} className="capitalize">{t}</Button>)}</div>
              {dates.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove date" onClick={() => setDates(dates.filter((_, j) => j !== i))}><Trash2 /></Button>}</div>
            {d.type === "custom" && <FormField className="mt-3" label="What is the date?" name={`label-${i}`} value={d.label} onChange={(e) => setDate(i, { label: e.target.value })} />}
            <div className="mt-3 grid grid-cols-[1fr_2fr_1.2fr] gap-2">
              <FormField label="Day" name={`day-${i}`} type="number" min={1} max={31} value={d.day} onChange={(e) => setDate(i, { day: e.target.value })} />
              <div><Label>Month</Label><Select value={d.month} onValueChange={(v) => setDate(i, { month: v })}><SelectTrigger className="mt-2 min-h-11"><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{MONTHS.map((m, j) => <SelectItem key={m} value={String(j + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
              <FormField label="Year" helper="Optional" name={`year-${i}`} type="number" value={d.year} onChange={(e) => setDate(i, { year: e.target.value })} />
            </div>
          </fieldset>)}
          <Button type="button" variant="outline" onClick={() => setDates([...dates, blankDate("anniversary")])}><Plus /> Add another date</Button>
        </>}

        {step === 2 && <>
          <div><Label htmlFor="likes">Likes</Label><Textarea id="likes" rows={2} className="mt-2" placeholder="Candles, dark chocolate, jazz" value={notes.likes} onChange={(e) => setNotes({ ...notes, likes: e.target.value })} /></div>
          <div><Label htmlFor="dislikes">Dislikes</Label><Textarea id="dislikes" rows={2} className="mt-2" value={notes.dislikes} onChange={(e) => setNotes({ ...notes, dislikes: e.target.value })} /></div>
          <FormField label="Sizes" name="sizes" placeholder="Dress 12, shoe 39" value={notes.sizes} onChange={(e) => setNotes({ ...notes, sizes: e.target.value })} />
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm"><span>No alcohol</span><Switch checked={notes.noAlcohol} onCheckedChange={(v) => setNotes({ ...notes, noAlcohol: v })} /></label>
          <FormField label="Usual budget (₦)" name="budget" type="number" min={0} step={5000} value={notes.budget} onChange={(e) => setNotes({ ...notes, budget: e.target.value })} />
          <fieldset><legend className="text-sm font-semibold">Remind me</legend><div className="mt-2 flex flex-wrap gap-4">{[14, 7, 3].map((n) => <label key={n} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={days.includes(n)} onCheckedChange={() => setDays(toggle(days, n))} />{n} days before</label>)}</div></fieldset>
          <fieldset><legend className="text-sm font-semibold">By</legend><div className="mt-2 flex flex-wrap gap-4">{([["email", "Email"], ["whatsapp", "WhatsApp"], ["sms", "SMS"]] as const).map(([v, l]) => <label key={v} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={channels.includes(v)} onCheckedChange={() => setChannels(toggle(channels, v))} />{l}</label>)}</div></fieldset>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="mt-6 flex justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => (step ? setStep(step - 1) : onOpenChange(false))}>{step ? "Back" : "Cancel"}</Button>
        {step < 2 ? <Button type="button" onClick={next}>Continue</Button> : <Button type="button" onClick={save}>Save person</Button>}
      </div>
    </SheetContent>
  </Sheet>;
}
