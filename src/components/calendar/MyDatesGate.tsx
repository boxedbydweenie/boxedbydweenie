import { useState } from "react";
import { Button, FormField } from "@/components/site/Brand";
import { signIn } from "@/services/account";

/** Mock sign-in gate: any email works. */
export function MyDatesGate() {
  const [email, setEmail] = useState("");
  return <div className="mx-auto max-w-lg rounded-md border border-border bg-ivory p-8 text-center">
    <div className="pattern-bow mx-auto size-20 opacity-25" />
    <h2 className="mt-5 text-xl">My dates</h2>
    <p className="mt-3 text-muted-foreground">Save the birthdays and anniversaries that matter. We'll remind you in time.</p>
    <form className="mt-6 grid gap-3 text-left" onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) signIn(email); }}>
      <FormField label="Email" name="gate-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <Button type="submit">Sign in to save dates</Button>
    </form>
  </div>;
}
