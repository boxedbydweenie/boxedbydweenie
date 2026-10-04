import { initials } from "@/services/calendar";
import type { Person } from "@/types/calendar";
import { cn } from "@/lib/utils";

export function PersonAvatar({ person, className }: { person: Pick<Person, "name" | "photo">; className?: string }) {
  return person.photo
    ? <img src={person.photo} alt="" className={cn("size-12 shrink-0 rounded-full object-cover", className)} />
    : <span aria-hidden className={cn("flex size-12 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-nero", className)}>{initials(person.name)}</span>;
}
