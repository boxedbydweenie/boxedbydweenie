import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gift-calendar")({
  beforeLoad: () => { throw redirect({ to: "/calendar", statusCode: 301 }); },
});
