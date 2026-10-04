import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/delivery-and-returns")({
  head: () => legalHead("Delivery and Returns", "Delivery areas, timings, fees and returns for Boxed by Dweenie orders."),
  component: () => <LegalPage title="Delivery and returns" sections={["Delivery areas", "Delivery times and same-day orders", "Delivery fees", "Damaged or incorrect items", "Returns and refunds"]} />,
});
