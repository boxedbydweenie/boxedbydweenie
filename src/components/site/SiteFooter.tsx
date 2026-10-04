import logo from "@/assets/bbd-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="surface-dark border-t border-line-dark">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <img src={logo.url} alt="Boxed by Dweenie" className="h-10 w-auto" loading="lazy" />
          <p className="mt-3 font-heading text-sm tracking-[0.2em] text-gold">MOMENTS, BOXED.</p>
        </div>
        <p className="text-sm text-on-dark-muted">
          Boxed by Dweenie is a product of The Plug Shop Limited. Lagos, Nigeria.
        </p>
      </div>
    </footer>
  );
}
