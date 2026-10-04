# Boxed by Dweenie foundation, shared shell and homepage

## Goal
Build the branded front-end foundation and complete homepage from the supplied brief, then move the existing corporate experience onto the same shared shell and reusable components without changing its content, section order, or layout.

## What will be built

### 1. Shared design system
- Extend the existing Tailwind v4 theme with the approved Nero, gold, ivory, white, neutral, typography, radius, shadow, spacing, focus, motion, and foil tokens.
- Create reusable branded controls and patterns: buttons and text links, eyebrow and section headings, gold rules, product cards, form controls, selectors, radio cards, checkbox, stepper, slider, date input, chips, badges, tabs, accordion, modal, mobile bottom sheet, side drawer, toast, tooltip, breadcrumbs, pagination, skeletons, empty state, and bow loader.
- Keep every control keyboard accessible, touch-friendly, and visually consistent across light and dark surfaces.

### 2. Shared site shell
- Replace the current minimal header and footer with the full announcement bar, shrinking desktop header, Shop mega menu, mobile full-screen menu, icon actions, shared footer, newsletter form, social/contact links, and floating WhatsApp action.
- Use the supplied logo asset unchanged.
- Put the shell around all content routes so pages do not carry their own duplicate header or footer.

### 3. Homepage
Build the supplied sections in order as focused components:
- Animated dark hero with a signature gift-box placeholder tile.
- Personal/corporate split doors.
- Gift Dispenser selectors that pass choices to `/dispenser`.
- Occasion scroller and eight typed mock bestseller products.
- Corporate feature band and client-logo placeholders.
- Three upcoming Gift Calendar dates with live day counts.
- Look Book, Secret Santa, four-step process, review carousel, and closing band.

Homepage content will live in typed mock data/config files and be read through asynchronous service functions, preserving the API-ready project structure.

### 4. About, contact and supporting routes
- Build `/about` with the supplied story, vision, mission, and seven service cards.
- Build `/contact` with the specified form, contact cards, opening-hours placeholder, and six FAQ items. Submission will use a mock async service and show a branded success state.
- Build a branded 404 page.
- Add shell-wrapped “Coming soon” pages for unbuilt destinations linked by the header/footer, including Shop, Gift Dispenser, Look Book, Gift Calendar, Secret Santa, account, cart, search, company/legal, and delivery pages.

### 5. Corporate refactor
- Preserve the existing `/corporate` sections, copy, placeholders, order, and layout.
- Remove its page-local header/footer and one-off button, heading, and form styling in favour of the new shared shell and shared components.
- Apply the same shell treatment to `/corporate/quote`, while preserving its existing behaviour and selections.
- Keep the existing floating corporate quote prompt and consultation mock flow.

## Technical details
- Keep the implementation front-end only; no cloud, authentication, payments, or external services.
- Add route-specific metadata for every content route, including Open Graph and Twitter fields.
- Use typed modules under `src/types`, mock content under `src/data`, business constants under `src/config`, and async access under `src/services`.
- Record the shared-shell and data-boundary decisions in the project architecture notes.
- Verify build diagnostics and test the primary navigation, menus, forms, query-string hand-off, dismissible announcement, carousels, and responsive layouts at mobile and desktop widths.

## Known placeholders retained by design
- Product and editorial imagery will use the brief’s fixed-ratio branded placeholder tiles.
- Homepage reviews will remain explicitly marked “REPLACE WITH REAL REVIEW”.
- Corporate placeholder figures, testimonials, client logos, package prices, and unavailable downloads will remain unchanged.
- Contact opening hours will be visibly marked as awaiting confirmation rather than invented.
