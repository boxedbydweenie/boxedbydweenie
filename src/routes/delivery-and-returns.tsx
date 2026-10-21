import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

const SECTIONS = [
  {
    "title": "Delivery areas",
    "body": [
      "We deliver across Nigeria. Lagos and Abuja have the fastest options, and other states are delivered nationwide by our logistics partners."
    ]
  },
  {
    "title": "Delivery times and same-day orders",
    "body": [
      "Same-day delivery is available in Lagos on eligible gifts ordered before the cut-off shown at checkout. Next-day delivery is available in Lagos and Abuja. Other states usually take a few working days. Choose your delivery date at checkout and we will do our best to deliver on it."
    ]
  },
  {
    "title": "Delivery fees",
    "body": [
      "Fees depend on the delivery state and are shown at checkout before you pay. Corporate orders to several addresses are priced in your quote."
    ]
  },
  {
    "title": "Receiving your gift",
    "body": [
      "Someone should be available to receive the box. If the recipient cannot be reached we will try again, and may contact you. Re-delivery may carry an extra fee."
    ]
  },
  {
    "title": "Damaged or incorrect items",
    "body": [
      "If a gift arrives damaged or is not what you ordered, tell us within 24 hours with a photo and your order number. We will replace or refund it."
    ]
  },
  {
    "title": "Returns and refunds",
    "body": [
      "Because gifts are packed and often personalised, we cannot accept returns for change of mind. Faulty or incorrect items are replaced or refunded as above. Refunds go back to the original payment method and usually take 5 to 10 working days."
    ]
  }
];

export const Route = createFileRoute("/delivery-and-returns")({
  head: () => legalHead("Delivery and returns", "Where and when we deliver, delivery fees, and how returns and refunds work."),
  component: () => <LegalPage title="Delivery and returns" sections={SECTIONS} />,
});
