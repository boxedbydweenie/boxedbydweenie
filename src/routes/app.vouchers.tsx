import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GiftCardBuilder } from "@/components/shop/GiftCardBuilder";

export const Route = createFileRoute("/app/vouchers")({
  component: AppVouchers,
});

/** Vouchers are bought through the main BBD checkout, so balances and orders stay in one place. */
function AppVouchers() {
  const navigate = useNavigate();
  return (
    <section className="pt-8">
      <div className="px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">
          Gift vouchers
        </p>
        <h1 className="mt-1 font-display text-4xl">
          Let them choose <span className="text-[#8E6A10]">their wow.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sent by email or SMS, valid for 12 months on anything at Boxed by Dweenie.
        </p>
      </div>
      <GiftCardBuilder onAdded={() => void navigate({ to: "/checkout" })} />
    </section>
  );
}
