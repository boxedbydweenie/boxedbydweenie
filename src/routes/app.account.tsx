import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-shop";
import { signOut } from "@/services/account";

export const Route = createFileRoute("/app/account")({
  component: AppAccount,
});

const MORE = [
  { href: "/shop", label: "Shop gifts" },
  { href: "/secret-santa", label: "Secret Santa" },
  { href: "/account", label: "Orders and full account" },
] as const;

function AppAccount() {
  const user = useUser();
  const navigate = useNavigate();
  if (!user) {
    return (
      <section className="px-5 pt-10 text-center">
        <h1 className="font-display text-3xl">You're signed out</h1>
        <Link
          to="/app/signin"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-[#292828] px-6 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }
  return (
    <section className="px-5 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">Account</p>
      <h1 className="mt-1 font-display text-4xl">{user.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {MORE.map((m) => (
          <li key={m.href}>
            <a
              href={m.href}
              className="flex min-h-12 items-center justify-between px-4 text-sm font-semibold"
            >
              {m.label} <span aria-hidden="true">›</span>
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          void navigate({ to: "/app" });
        }}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-lg border border-[#292828] text-sm font-semibold"
      >
        Sign out
      </button>
    </section>
  );
}
