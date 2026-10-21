import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

const SECTIONS = [
  {
    "title": "About these terms",
    "body": [
      "These terms apply to purchases and use of boxedbydweenie.com. By placing an order or creating an account you agree to them. Boxed by Dweenie is operated by The Plug Shop Limited."
    ]
  },
  {
    "title": "Orders and payment",
    "body": [
      "Prices are in Nigerian naira and include the contents and packaging shown. Delivery fees are shown at checkout before you pay. An order is confirmed once payment succeeds. We may cancel and refund an order if an item is unavailable or a price was shown in error.",
      "Card payments are processed securely by Paystack."
    ]
  },
  {
    "title": "Personalised and corporate orders",
    "body": [
      "Gifts with personalised notes, logos or custom branding are made for you and cannot be returned unless faulty. Corporate quotes are estimates until confirmed in writing by your consultant, and are valid for the period stated on the quote. Corporate orders must be confirmed by 20 November for guaranteed pre-Christmas delivery."
    ]
  },
  {
    "title": "Gift cards",
    "body": [
      "Gift cards are issued after payment is confirmed and are redeemed by entering the code at checkout. They cannot be exchanged for cash or used to buy other gift cards. Anyone with the code can spend it, so keep it safe. Part-used cards keep their remaining balance."
    ]
  },
  {
    "title": "Secret Santa",
    "body": [
      "Secret Santa is a service for organising gift exchanges. Organisers are responsible for the accuracy of the people and dates they enter. We cannot guarantee delivery by the exchange date for orders placed after the stated order-by date."
    ]
  },
  {
    "title": "Your account",
    "body": [
      "Keep your password private. You are responsible for activity on your account. Tell us promptly if you think it has been used without your permission."
    ]
  },
  {
    "title": "Liability",
    "body": [
      "We take great care with every box. To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing in these terms limits rights you have under Nigerian consumer law."
    ]
  },
  {
    "title": "Governing law",
    "body": [
      "These terms are governed by the laws of the Federal Republic of Nigeria."
    ]
  }
];

export const Route = createFileRoute("/terms")({
  head: () => legalHead("Terms and conditions", "The terms that apply when you shop with Boxed by Dweenie."),
  component: () => <LegalPage title="Terms and conditions" sections={SECTIONS} />,
});
