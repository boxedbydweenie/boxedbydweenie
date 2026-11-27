import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/vouchers")({
  component: AppVouchers,
});

function AppVouchers() {
  return (
    <section className="px-4 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">Gift vouchers</p>
      <h1 className="mt-1 font-display text-4xl">Let them choose <span className="text-[#8E6A10]">their wow.</span></h1>
      <div className="relative mt-6 h-52 overflow-hidden rounded-3xl bg-[#292828] p-6 text-white">
        <p className="font-display text-5xl">₦50,000</p>
        <p className="mt-2 font-script text-2xl text-[#E7B93B]">for someone special</p>
        <p className="absolute bottom-5 left-6 text-[11px] tracking-[0.2em] text-white/70">VALID 12 MONTHS</p>
      </div>
      <Link to="/gift-cards" className="mt-6 flex h-13 items-center justify-center rounded-lg bg-[#E7B93B] font-semibold text-[#292828]">
        Buy a voucher
      </Link>
      <p className="mt-3 text-center text-xs text-muted-foreground">Spend it on anything at boxedbydweenie.com</p>
    </section>
  );
}
