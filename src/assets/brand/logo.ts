// Brand logo files live in /public/brand (from the October 2026 brand guide).
// `logo.url` is the reversed version for dark backgrounds, which is where the site places it.
const logo = { url: "/brand/logo-on-dark.svg" };
export const logos = {
  onDark: "/brand/logo-on-dark.svg",
  onLight: "/brand/logo-primary.svg",
  onGold: "/brand/logo-on-gold.svg",
  monoBlack: "/brand/logo-mono-black.svg",
  monoWhite: "/brand/logo-mono-white.svg",
} as const;
export default logo;
