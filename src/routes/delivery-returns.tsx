import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/delivery-returns")({
  beforeLoad: () => { throw redirect({ to: "/delivery-and-returns", statusCode: 301 }); },
});
