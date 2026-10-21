import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

const SECTIONS = [
  {
    "title": "Who we are",
    "body": [
      "Boxed by Dweenie (\"we\", \"us\") is a gifting brand operated by The Plug Shop Limited in Nigeria. We act as the data controller for the personal information described here, in line with the Nigeria Data Protection Act 2023."
    ]
  },
  {
    "title": "Information we collect",
    "body": [
      "Details you give us: your name, email, phone number, delivery addresses, the names and addresses of people you send gifts to, gift messages, corporate enquiry details, and your sign-in details if you create an account.",
      "Details collected automatically: basic technical information such as device type and pages visited, and information stored in your browser so your bag and saved items work.",
      "Payments are handled by Paystack. We never see or store your full card number."
    ]
  },
  {
    "title": "How we use your information",
    "body": [
      "To process and deliver orders, send order updates, handle quotes and enquiries, run your account, Gift Calendar and Secret Santa exchanges, prevent fraud, and improve the site. If you join our newsletter we send you news and offers, and you can unsubscribe at any time."
    ]
  },
  {
    "title": "Sharing with delivery partners and service providers",
    "body": [
      "We share only what is needed with delivery partners (recipient name, phone and address), our payment provider, and technology providers that host the site and send email for us. We do not sell your personal information."
    ]
  },
  {
    "title": "Secret Santa and Gift Calendar",
    "body": [
      "Secret Santa matches are visible only to the person who draws them, and the organiser only if they chose that before the draw. Dates and people you save in the Gift Calendar are private to your account."
    ]
  },
  {
    "title": "Cookies and storage",
    "body": [
      "We use essential browser storage for your bag, sign-in and saved preferences. We do not use advertising cookies at this time."
    ]
  },
  {
    "title": "How long we keep it",
    "body": [
      "We keep order records for as long as needed for accounting and legal reasons, and other information until you ask us to delete it or close your account."
    ]
  },
  {
    "title": "Your rights",
    "body": [
      "You may ask to see, correct, export or delete your personal information, object to certain uses, or withdraw consent for marketing. Contact us and we will respond within a reasonable time. You may also complain to the Nigeria Data Protection Commission."
    ]
  },
  {
    "title": "Contact us",
    "body": [
      "Email hello@boxedbydweenie.com or message us on WhatsApp."
    ]
  }
];

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("Privacy policy", "How Boxed by Dweenie collects, uses and protects your personal information."),
  component: () => <LegalPage title="Privacy policy" sections={SECTIONS} />,
});
