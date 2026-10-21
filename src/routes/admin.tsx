import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Team area — Boxed by Dweenie" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminGate><Outlet /></AdminGate>,
});
