import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => legalHead("Terms and Conditions", "The terms that apply when you shop, request a quote or run a Secret Santa with Boxed by Dweenie."),
  component: () => <LegalPage title="Terms and conditions" sections={["About these terms", "Orders and payment", "Personalised and corporate orders", "Gift cards", "Secret Santa", "Liability", "Governing law"]} />,
});
