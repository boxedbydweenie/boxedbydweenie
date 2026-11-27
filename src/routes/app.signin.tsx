import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/account/AuthForm";
import { useUser } from "@/hooks/use-shop";

export const Route = createFileRoute("/app/signin")({
  component: AppSignIn,
});

/** Sign in or create a BBD account without leaving the app. One account works across the app, shop and Secret Santa. */
function AppSignIn() {
  const user = useUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) void navigate({ to: "/app", replace: true });
  }, [user, navigate]);

  return (
    <section className="px-5 pt-8">
      <Link to="/app" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </Link>
      <h1 className="mt-4 font-display text-4xl">
        Your <span className="text-[#8E6A10]">gift calendar.</span>
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        One Boxed by Dweenie account works here, in the shop and for Secret Santa.
      </p>
      <div className="mt-6">
        <AuthForm cta="Continue" />
      </div>
    </section>
  );
}
