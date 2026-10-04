import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("Privacy Policy", "How Boxed by Dweenie collects, uses and protects your personal information."),
  component: () => <LegalPage title="Privacy policy" sections={["Information we collect", "How we use your information", "Sharing with delivery partners", "Cookies", "Your rights", "Contact us"]} />,
});
