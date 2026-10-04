export function BowTie({ className = "h-24 w-36" }: { className?: string }) {
  return <svg viewBox="0 0 120 80" className={`bow-tie mx-auto text-gold ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M60 40 C40 15, 12 18, 14 36 C16 52, 42 50, 60 40Z" />
    <path d="M60 40 C80 15, 108 18, 106 36 C104 52, 78 50, 60 40Z" />
    <path d="M56 44 L40 74 M64 44 L80 74" />
    <circle cx="60" cy="40" r="6" />
  </svg>;
}
