import { Link } from "@tanstack/react-router";
import logo from "@/assets/bbd-logo.png.asset.json";

export function SiteHeader() {
  return (
    <header className="surface-dark sticky top-0 z-40 border-b border-line-dark">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" aria-label="Boxed by Dweenie home" className="flex min-h-11 items-center">
          <img src={logo.url} alt="Boxed by Dweenie" className="h-9 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/corporate" className="eyebrow text-on-dark hover:text-gold" activeProps={{ className: "text-gold" }}>
            Corporate
          </Link>
        </nav>
      </div>
    </header>
  );
}
