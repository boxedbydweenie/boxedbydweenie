import { AuthForm } from "@/components/account/AuthForm";

/** Sign-in gate for My dates: a real account keeps your dates safe on every device. */
export function MyDatesGate() {
  return <div className="mx-auto max-w-lg text-center">
    <h2 className="text-2xl">My dates</h2>
    <p className="mb-6 mt-3 text-muted-foreground">Save the birthdays and anniversaries that matter. They follow you to every device.</p>
    <AuthForm cta="Sign in to save dates" />
  </div>;
}
