import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/look-book")({
  beforeLoad: () => { throw redirect({ to: "/lookbook", statusCode: 301 }); },
});
