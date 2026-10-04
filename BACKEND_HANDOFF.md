# Boxed by Dweenie — Backend Handoff

The site is front end only. Data comes from typed mocks in `src/data`, business rules from `src/config`, shapes from `src/types`, and every read and write goes through async functions in `src/services`. Client state (cart, wishlist, user, orders, quotes, calendar people, Secret Santa) is persisted in `localStorage` via `src/lib/store.ts` (`createStore(key, initial)`). To connect a backend, replace the body of each service function; pages should not need to change.

---

## 1. Route map

| Route | Purpose |
|---|---|
| `/` | Homepage: hero, personal/corporate doors, Dispenser teaser, bestsellers, calendar, Look Book, Secret Santa, reviews. |
| `/about` | Brand story, vision, mission, services. |
| `/contact` | Contact form, contact cards, FAQ. |
| `/shop` | Product listing with URL filters (`occasion`, `recipient`, `type`, `budget`, `sameday`, `sort`, `q`). |
| `/shop/$slug` | Product detail: packaging, note, delivery date, add to bag. |
| `/gift-cards` | Build and buy a digital gift card. |
| `/search` | Full search results. |
| `/cart` | Bag review and promo code. |
| `/checkout` | Recipient, delivery and payment (mock). |
| `/order/$id` | Order confirmation and status tracker. |
| `/account` | Mock sign-in, details, saved recipients, orders, wishlist. |
| `/dispenser` | Gift Dispenser: three questions, animated dispense, three picks, express send. |
| `/corporate` | Corporate gifting page and consultation form. |
| `/corporate/quote` | Six-step instant quote builder with live estimate. Accepts `products`, `quantity`, `budget` search params. |
| `/corporate/quote/$ref` | Quote result and print/PDF layout. |
| `/lookbook` | Look Book library. |
| `/lookbook/$edition` | Look Book viewer with shoppable hotspots, PDF request, quote list. |
| `/calendar` | Gift Calendar: month/list/year views, filters. |
| `/calendar/$occasion` | Occasion detail and curated gifts. |
| `/calendar/my-dates` | Personal dates (mock sign-in gate). |
| `/calendar/my-dates/$personId` | Person detail, gift ideas, scheduled gifts. |
| `/secret-santa` | Secret Santa landing and join-by-code. |
| `/secret-santa/new` | Create an exchange (four steps). |
| `/secret-santa/join/$code` | Join an exchange and fill in "Help your Santa". |
| `/secret-santa/$id` | Participant home: match reveal, shop, messages, me. |
| `/secret-santa/$id/manage` | Organiser dashboard: invites, exclusions, draw, settings. |
| `/delivery-and-returns`, `/privacy`, `/terms` | Legal placeholders, "Content to be supplied". |
| `/delivery-returns`, `/look-book`, `/gift-calendar` | 301 redirects to the routes above. |
| any other path | Branded 404. |

---

## 2. Services (`src/services`)

"Store" means localStorage-backed client state that the backend should own.

### products.ts — reads `src/data/products.ts`, `src/config/shop.ts`
| Function | Inputs | Returns |
|---|---|---|
| `getProducts()` | — | `Promise<ShopProduct[]>` |
| `getProductBySlug(slug)` | `string` | `Promise<ShopProduct \| null>` |
| `getProductById(id)` | `string` | `ShopProduct \| null` (sync) |
| `getBestsellers(limit = 8)` | `number` | `Promise<ShopProduct[]>` |
| `filterProducts(list, filters)` | `ShopProduct[]`, `ShopFilters` | `ShopProduct[]` (move to server query) |
| `getRelated(product)` | `ShopProduct` | `{ pairs, occasion }: ShopProduct[]` |
| `searchCatalogue(term)` | `string` | `Promise<{ products, occasions, categories }>` |
| `labelFor.{occasion,recipient,type,budget}` | slug | `string` |

### cart.ts — store `bbd-cart`; reads `src/config/shop.ts`
| `getCart()` | — | `Promise<CartItem[]>` |
|---|---|---|
| `addToCart(item)` | `Omit<CartItem,"key">` | `Promise<void>` |
| `updateQuantity(key, qty)` | `string, number` | `Promise<void>` |
| `removeFromCart(key)` / `clearCart()` | `string` / — | `Promise<void>` |
| `cartSubtotal(items)` / `cartCount(items)` | `CartItem[]` | `number` |
| `applyPromo(code)` | `string` | `Promise<{ ok, percent, message }>` (reads `PROMO_CODES`) |

### account.ts — stores `userStore`, `wishlistStore`, `recipientsStore`
| `signIn(email)` | `string` | `Promise<void>` — mock, any email works |
|---|---|---|
| `signOut()` | — | `Promise<void>` |
| `updateDetails(user)` | `AccountUser` | `Promise<void>` |
| `toggleWishlist(productId)` | `string` | `Promise<void>` |
| `saveRecipient(r)` / `removeRecipient(id)` | `Omit<Recipient,"id">` / `string` | `Promise<void>` |

### orders.ts — store `ordersStore`
| `getOrders()` | — | `Promise<Order[]>` |
|---|---|---|
| `getOrder(id)` | `string` | `Promise<Order \| null>` |
| `createOrder(input)` | `Omit<Order,"id"\|"createdAt"\|"status">` | `Promise<Order>` |

### home.ts — reads `src/data/home.ts`, `src/config/shop.ts`
| `getHomeData()` | — | `Promise<HomeData>` |
|---|---|---|

### dispenser.ts — reads `src/config/dispenser.ts`, `src/config/shop.ts`, `src/data/products.ts`
| `getPicks(answers, round = 0)` | `DispenserAnswers, number` | `Promise<ShopProduct[]>` (3 picks) |
|---|---|---|
| `randomAnswers()` | — | `DispenserAnswers` |

### corporate.ts
| `submitConsultation(req)` | `ConsultationRequest` | `Promise<ConsultationResult>` (mock reference) |
|---|---|---|

### quotes.ts — reads `src/config/quoteRules.ts`; stores quotes and draft locally
| `calculateEstimate(r)` | `QuoteRequest` | `Promise<Estimate>` |
|---|---|---|
| `submitQuote(request)` | `QuoteRequest` | `Promise<Quote>` |
| `getQuote(ref)` | `string` | `Promise<Quote \| null>` |
| `emailQuote(ref, email)` | `string, string` | `Promise<void>` — mock |
| `saveDraft(step, request)` / `getDraft()` / `clearDraft()` | `number, QuoteRequest` | draft |
| `addWorkingDays(from, days)`, `standardReadyDate(...)`, `isRush(...)` | dates | helpers |

### lookbook.ts — reads `src/data/lookbook.ts`; store `quoteListStore`
| `getEditions()` | — | `Promise<LookbookSummary[]>` |
|---|---|---|
| `getEdition(slug)` | `string` | `Promise<LookbookEdition \| null>` |
| `buildSpreads(count)` | `number` | `number[][]` |
| `addToQuoteList(id)` / `removeFromQuoteList(id)` | `string` | `Promise<void>` |
| `requestPdf(req)` | `PdfRequest \| { edition }` | `Promise<{ url? }>` — mock |

### calendar.ts — reads `src/data/occasions.ts`, `src/data/products.ts`; stores `peopleStore`, `scheduledStore`
| `getOccasionsForYear(year)` | `number` | `Promise<OccasionInstance[]>` |
|---|---|---|
| `getUpcomingOccasions(n)` / `upcomingOccasionsSync(from, n)` / `getNextUp()` | | `OccasionInstance[]` / `OccasionInstance` |
| `getOccasion(slug)` | `string` | `Promise<Occasion \| null>` |
| `curatedProducts(o, count)` | `Occasion, number` | `ShopProduct[]` |
| `downloadIcs(title, date, description)` | strings | triggers `.ics` download (client) |
| `getPeople()` / `getPerson(id)` | | `Promise<Person[]>` / `Promise<Person \| null>` |
| `addPerson(input)` / `updatePerson(p)` / `removePerson(id)` | `NewPerson` / `Person` / `string` | `Promise<Person \| void>` |
| `nextOccurrence`, `nextDateFor`, `initials`, `giftIdeas(p, count)` | | helpers |
| `scheduleGift(g)` / `giftsFor(personId)` | `Omit<ScheduledGift,"id"\|"status">` | `Promise<ScheduledGift>` / list |
| `isoDate`, `todayIso`, `daysUntil`, `addDays`, `formatLong` | | date helpers |

### secretSanta.ts — reads `src/config/secretSanta.ts`, `src/data/secretSanta.ts`, `src/data/products.ts`; store `santaStore`
| Function | Inputs | Returns |
|---|---|---|
| `resetDemo()`, `setRole(role)` | demo only | `Promise<void>` |
| `exchangeById`, `participantsOf`, `joinedCount` | state, id | selectors |
| `checkCode(code)` | `string` | `Promise<CodeCheck>` (`ok`/`not-found`/`closed`/`full`/`expired`) |
| `createExchange(input)` | `NewExchange` | `Promise<Exchange>` |
| `invitePeople(id, people)` / `parsePeopleList(text)` | `{name, contact}[]` / `string` | `Promise<void>` / parsed list |
| `removeParticipant(id)` | `string` | `Promise<void>` |
| `addExclusion(id, a, b)` / `removeExclusion(id, i)` | | `Promise<void>` |
| `updateExchangeSettings(id, patch)` | dates, showMatches, allowReveal, status | `Promise<void>` |
| `postAnnouncement(id, body)` | | `Promise<void>` |
| `drawNames(id)` | `string` | `Promise<{ ok, error? }>` — **must move server-side** |
| `myMatch(state, id, pid)` / `organiserMatches(state, id)` / `revealMySanta(...)` | | match views (server must enforce privacy) |
| `joinExchange(id, {name, contact})` | | `Promise<Participant>` |
| `saveHelpYourSanta(pid, prefs)` / `toggleWishlistItem(pid, productId)` / `updateDelivery(pid, address)` | | `Promise<void>` |
| `giftsWithinBudget(budget)` / `orderSantaGift(id, giverId, productId)` / `orderBy` / `orderFor` | | products / `Promise<SantaGiftOrder>` |
| `sendQuestion(id, from, to, body)` / `sendThanks(id, from, body)` | | `Promise<void>` |
| `completeExchange(id)` | | `Promise<void>` |
| `exportParticipantsCsv(state, id)` | | CSV string |
| `dateWarnings(dates)`, `STAGES`, `currentStage(e)` | | helpers |

---

## 3. Types (`src/types`)

- **shop.ts** — `CategorySlug`, `PriceBand`, `SortKey`, `PackagingChoice`, `ShopProduct`, `ShopFilters`, `GiftCardDetails`, `CartItem`, `Recipient`, `OrderStatus` (0 placed, 1 packed, 2 out for delivery, 3 delivered), `Order`, `AccountUser`.
- **home.ts** — `Product`, `Occasion`, `CalendarMoment`, `Review`, `HomeData`.
- **corporate.ts** — `CorporatePurpose`, `CorporatePackage`, `KeyDate`, `ConsultationRequest`, `ConsultationResult`.
- **quote.ts** — `QuotePurpose`, `BrandingKey`, `DeliveryMode`, `QuoteRequest`, `Range`, `EstimateLine`, `Estimate`, `Quote`.
- **lookbook.ts** — `Hotspot`, `LookbookPage`, `LookbookEdition`, `LookbookSummary`, `PdfRequest`.
- **calendar.ts** — `OccasionCategory`, `OccasionRule`, `ShopLink`, `Occasion`, `OccasionInstance`, `Relationship`, `PersonalDateType`, `ReminderChannel`, `PersonalDate`, `Reminder`, `PersonNotes`, `Person`, `ScheduledGift`.
- **secretSanta.ts** — `ExchangeType`, `Payer`, `DeliveryMode`, `ExchangeStatus`, `ParticipantStatus`, `ExchangeDates`, `Exchange`, `WishlistItem`, `Participant`, `Match`, `Message`, `SantaGiftOrder`.

Read each file for the exact field list; they're the payload contracts.

---

## 4. Forms

| Form (route) | Fields | Validation | Submits |
|---|---|---|---|
| Newsletter (footer) | `email` | required, email format | email → newsletter list (mock toast) |
| Contact (`/contact`) | `name`, `email`, `phone`, `enquiry` (select), `message` | name, email, message required; email format | `{ name, email, phone, enquiry, message }` (mock) |
| Corporate consultation (`/corporate`) | `name`, `company`, `role`, `email`, `phone`, `quantity`, `requiredBy`, `message` | name, company, email, phone required; email format | `ConsultationRequest` → `submitConsultation` |
| Quote builder (`/corporate/quote`) | purpose, quantity (≥ `MIN_QUANTITY`), budget (`BUDGET_MIN`–`BUDGET_MAX`), products (≤ `MAX_SELECTIONS`) or curate, branding keys, logo file, delivery mode, locations, required-by date, recipient CSV; contact step: name, company, email, phone | per-step required; email format; date ≥ today | `QuoteRequest` → `submitQuote`; email → `emailQuote` |
| Product (`/shop/$slug`) | packaging, gift note (≤ `GIFT_NOTE_LIMIT`), handwritten, delivery date, quantity | note length; date ≥ earliest delivery | `CartItem` → `addToCart` |
| Gift card (`/gift-cards`) | `design`, amount / `custom` (`GIFT_CARD_MIN`–`GIFT_CARD_MAX`), `to`, `contact`, `message`, `when` | name and contact required; amount range | `CartItem` with `GiftCardDetails` |
| Promo (bag) | `promo` | non-empty | code → `applyPromo` |
| Checkout (`/checkout`) | `sendTo`, recipient name/phone, `address`, `state`, `area`, `date`, `notes`, surprise, customer name/email/phone, `payment` | required recipient and customer fields; email/phone format; date ≥ earliest | `Omit<Order,…>` → `createOrder` |
| Account (`/account`) | sign-in `email`; details `name`, `email`, `phone`; recipient `name`, `phone`, `address`, `state`, `area` | required; email format | `signIn`, `updateDetails`, `saveRecipient` |
| Dispenser express send | recipient name/phone, `d-state`, `address`, `d-date`, `d-note`, `pay` | required; date | `createOrder` |
| Look Book PDF (`/lookbook/$edition`) | `name`, `company`, `email` | required; email format | `PdfRequest` → `requestPdf` |
| My dates gate | `gate-email` | email format | `signIn` |
| Add person (calendar) | name, relationship, photo file, dates (type, day, month), reminders (channels, lead days), notes | name and at least one date required | `NewPerson` → `addPerson` |
| Schedule gift | product, `delivery-date`, note | date before occasion | `scheduleGift` |
| Secret Santa create (`/secret-santa/new`) | name, type, organisation, logo file, budget, payer, delivery mode, dates (join-by, draw, order-by, exchange), organiser name/contact | required; date order and `MIN_DATE_GAP_DAYS` warnings | `NewExchange` → `createExchange` |
| Santa join code | `join-code` | 6 chars | `checkCode` |
| Santa join (`/secret-santa/join/$code`) | `name`, `contact`, wishlist (≤ `MAX_WISHLIST`), `likes`, `dislikes`, `sizes`, no-alcohol, `address` | name and contact required | `joinExchange` + `saveHelpYourSanta` |
| Santa invite | single name/contact, `paste` list, CSV file | contact format; ≤ `MAX_PARTICIPANTS` | `invitePeople` |
| Santa messages / announcements / thanks | body | non-empty | `sendQuestion`, `postAnnouncement`, `sendThanks` |

---

## 5. UI only — needs a backend

- **Sign-in**: mock, any email accepted (`account.signIn`). Needs real auth and sessions.
- **Payments**: card, transfer and USSD choices in checkout, Dispenser express send and Santa gift order are cosmetic. Needs a payment gateway and webhooks.
- **Order creation and tracking**: orders live in localStorage; status is static. Needs order API, fulfilment statuses, notifications.
- **Delivery fees**: flat table in `src/config/delivery.ts`; same-day cutoff in `src/config/shop.ts`. Needs logistics pricing and areas.
- **Gift cards**: no code issued, no scheduled send, no redemption.
- **Quote calculation and PDF**: estimate runs client-side from `quoteRules.ts`; the PDF is browser print. Needs server pricing and PDF generation.
- **Quote emails and CRM handoff**: `emailQuote` and `submitConsultation` are mocks; no sales notification or CRM record.
- **Look Book downloads**: `requestPdf` returns no file; no lead capture.
- **Calendar reminders**: reminder channels are saved but never sent. `.ics` files are generated in the browser (can stay client-side, or serve from API).
- **Scheduled gifts**: stored locally; no order is placed on the date.
- **Secret Santa**: invites (email/WhatsApp), nudges, the draw (must be server-side for fairness and privacy), match privacy, anonymous messages, notifications, reveal and gift orders are all local.
- **File uploads**: quote logo, Santa logo, person photo and recipient/participant CSVs are read in the browser only. Needs storage and CSV processing.
- **Newsletter and contact forms**: no delivery.
- **Search**: client-side filter; move to server search when the catalogue grows.

---

## 6. Config placeholders the business must confirm

- **`src/config/shop.ts`** — `PRICE_BANDS`, `PACKAGING` prices, `GIFT_NOTE_LIMIT`, `BULK_THRESHOLD`, `SAME_DAY_CUTOFF_HOUR` (12), `GIFT_CARD_AMOUNTS`, `GIFT_CARD_MIN` (₦5,000), `GIFT_CARD_MAX` (₦1,000,000), `PROMO_CODES` (`MOMENTS10` = 10%), `ORDER_STEPS` wording.
- **`src/config/delivery.ts`** — `DELIVERY_FEES` per state (Lagos ₦5,000 … Other states ₦15,000) and the list of states.
- **`src/config/quoteRules.ts`** — all values marked placeholder: `MIN_QUANTITY`, budget range and step, `UNIT_PRICE_RANGES`, `CURATE_RANGE`, `BRANDING` costs, `DELIVERY_MODES`, `QUOTE_LOCATIONS` and `DELIVERY_FEES`, `VOLUME_TIERS`, `STANDARD_LEAD_DAYS`, `EXPRESS_SURCHARGE_PERCENT`, `VAT_PERCENT`, `QUOTE_VALIDITY_DAYS`.
- **`src/config/corporate.ts`** — `CORPORATE_PACKAGES` prices per recipient, `YEAR_END_DEADLINES`, `CONSULTATION_QUANTITIES`, `WHATSAPP_URL` (now the main business number; confirm the corporate line).
- **`src/config/dispenser.ts`** — recipient, occasion and budget options; `DISPENSE_DURATION_MS`.
- **`src/config/secretSanta.ts`** — `SANTA_BUDGETS`, `MIN_TO_DRAW`, `MAX_WISHLIST`, `MAX_PARTICIPANTS`, `MIN_DATE_GAP_DAYS`, `SANTA_NOTE`; demo IDs are for the demo exchange only.
- **`src/config/seo.ts`** — `OG_IMAGE_URL` (empty; needs a 1200×630 share image).
- **Mock data to replace**: `src/data/products.ts` (names, prices, contents), `src/data/home.ts` (reviews marked "REPLACE WITH REAL REVIEW", client logos), `src/data/occasions.ts` (moveable dates, order-by dates), `src/data/lookbook.ts`, `src/data/secretSanta.ts` (demo exchange). Also: consultant details on the quote result, contact opening hours, and legal page copy.
