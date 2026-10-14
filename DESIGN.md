# Karachi Bites — Stitch Design System

> Purpose: give the existing Karachi Bites website a restrained, polished restaurant-brand refresh. This file is the source of truth for Google Stitch screen generation. Aim for **quiet premium**, not luxury-hotel drama or a generic food-delivery template.

## 1. Visual Theme & Atmosphere

Karachi Bites should feel like a contemporary neighbourhood restaurant with a carefully considered identity: warm, appetising, welcoming, and confident. Use generous but practical whitespace, clear food photography, familiar ordering patterns, and small editorial touches. The interface should feel premium because it is well proportioned and consistent—not because it has decorative effects.

- **Density:** 4/10 on the customer website; 6/10 on the operations dashboard.
- **Layout variance:** 4/10. Use a well-balanced split hero and calm grids, not experimental compositions.
- **Motion:** 2/10. Subtle transitions only; avoid perpetual animation.
- **Overall character:** warm cream surfaces, crisp white cards, ink-dark text, one deep-red action colour, natural food photography, fine borders, and restrained corner radii.
- Prefer left-aligned copy and a clear visual hierarchy. Every element must have a useful purpose.
- The logo at `/logo.svg` is the brand mark. Keep its aspect ratio and use it before the “Karachi Bites” wordmark in the header.

## 2. Colour Palette & Roles

Use this single palette consistently across the homepage, menu, cart, checkout, order tracking, login, and admin screens. The customer experience should use the light theme as its default.

- **Warm Cream — `#FAF7F2`:** primary page background; creates warmth without looking yellow.
- **Pure White — `#FFFFFF`:** menu cards, forms, cart panels, and elevated surfaces.
- **Ink — `#18181B`:** headings, primary body text, and important labels.
- **Muted Zinc — `#71717A`:** helper text, secondary descriptions, and metadata. Keep contrast readable.
- **Whisper Border — `#E4E4E7`:** card boundaries, dividers, and input borders.
- **Karachi Red — `#B42318`:** the only brand accent; reserve it for the primary action, selected category, active navigation state, and important status details.
- **Soft Red Tint — `#FBEAE8`:** optional subtle background behind red status labels; never use it as a second accent.
- Use no pure black, neon, gradients, coloured glow, or random warm/cool greys. Avoid large solid-red sections.

### Contrast and status

- Primary buttons: Karachi Red background with white text.
- Secondary buttons: white or transparent background, ink text, thin Whisper Border.
- Focus state: clearly visible 2px outline using Karachi Red, with a small offset.
- Order statuses must combine text with colour; never communicate status by colour alone.
- Keep muted text readable on cream and white. Do not reduce important text opacity to achieve a subdued look.

## 3. Typography Rules

Use fonts already present in the project to avoid unnecessary font requests.

- **Display / editorial headings:** Newsreader, weight 500. Use sparingly for the homepage hero and major customer-facing section headings. Keep line lengths short and the scale controlled.
- **Body / interface:** Geist, weights 400, 500, and 600. Use for paragraphs, navigation, product names, forms, buttons, prices, cart, checkout, tracking, and every admin screen.
- **Prices and operational numbers:** Geist with tabular numerals; use weight 600 for price emphasis.
- **Suggested scale:** hero 42–56px desktop / 32–38px mobile; section heading 28–36px; product name 17–20px; body 15–16px; metadata 12–13px only where appropriate.
- Body copy uses relaxed line height (about 1.55–1.7) and a maximum line width around 60–65 characters.
- Use sentence case. Avoid excessive all-caps labels, ultra-wide letter spacing, oversized headings, italic-heavy copy, and decorative type on operational screens.
- Do not add more font families or extra font weights without a clear reason.

## 4. Customer Website — Screen Direction

### Header

- White or warm-cream header, approximately 72px tall on desktop.
- Place the logo icon first, then “Karachi Bites” and a quiet optional subtitle only if it is verified business information.
- Desktop navigation: Menu, Track Order, Cart. Use a single solid-red **Order Now** primary action if it fits without crowding.
- At tablet/mobile widths, collapse the navigation into an accessible menu button. Keep the cart or order action easy to find. No overlapped controls, clipped labels, or tiny tap targets.
- Use a subtle bottom border, not a heavy shadow. Header can remain sticky only if it does not cover content.

### Homepage hero

- Use a balanced split layout: copy on the left and one strong, appetising food photograph on the right. It should feel like a real local restaurant—not a tech startup landing page.
- Suggested headline: **“Good food. Karachi roots.”** Supporting line: **“Find your favourites and order from the Karachi Bites menu.”** These lines avoid inventing a location, history, delivery promise, or business claim.
- One clearly dominant **Order Now** button; a low-emphasis text link to browse the menu is optional.
- Keep the headline to 2–3 lines, with Newsreader used only here and in major customer section headings.
- Never layer text over an image. Keep the photograph in its own defined region with a gentle 12–16px radius.
- On mobile, stack the copy first and image second; do not crop out the main dish.

### Menu discovery and product cards

- Present category chips in a horizontally scrollable row only when needed; the page itself must never overflow horizontally.
- Menu product grid: 3 columns on wide desktop, 2 on tablet, 1 on narrow mobile. These columns are for actual menu products, not generic feature cards.
- Product cards use white surfaces, fine borders, modest 12–16px corners, and minimal or no shadow.
- Keep food imagery at a consistent 4:3 aspect ratio with an intentional crop. Use locally stored or approved, stable image URLs; do not generate broken links or use random placeholder photography.
- Each card contains the real dish image, real name, concise description when available, actual API-provided price, availability state, and an accessible **Add to Cart** control.
- Keep card actions aligned consistently. Prices should be easy to scan and not compete with the dish name.
- Use a tidy image and typography rhythm rather than badges on every product. Show a badge only for meaningful data such as a real availability state.
- Do not hard-code menu names, prices, popularity labels, dietary claims, or availability when the API is the source of truth.

### Cart, checkout, confirmation, and tracking

- Keep the same header, palette, type scale, controls, and spacing.
- Cart: clear item rows, quantity controls, removal action, subtotal, delivery fee only when returned/configured by the application, and a strong checkout action.
- Checkout: one well-ordered form with visible labels above inputs, sensible grouping, branch selection from the supported values, order summary, and inline validation.
- Confirmation: clear success hierarchy and the real order ID/status returned by the API. Do not display a fake confirmation.
- Tracking: display the current real status and the allowed sequence—Received → Preparing → Out for Delivery → Delivered—without fabricating ETAs or live driver locations.
- Preserve error, loading, empty-cart, unavailable-item, and network-failure states. Use dimension-matched skeletons for loading; use plain inline messages for errors.

### Footer

- Visually quiet and divided into brand/contact content and useful links only.
- Keep the Admin / Staff Login entry at the bottom of the page rather than competing with customer-ordering actions.
- Display address, contact details, opening hours, certification, delivery promises, or heritage claims only if they are verified in the project's source of truth.

## 5. Admin & Staff Portal

The admin portal is an operational tool, not a marketing page. Use Geist only—no editorial serif headings.

- Light theme using Warm Cream canvas, white panels, Ink text, muted metadata, Whisper Border, and the same Karachi Red accent.
- Header: logo, “Karachi Bites — Staff & Orders,” a link back to the customer site, and sign-out only after authentication.
- Login: compact centred panel with heading, brief explanation, username/email and password fields as required by the real authentication flow, a full-width primary action, visible focus states, and readable inline errors. Do not add decorative illustrations that distract from signing in.
- Dashboard hierarchy: page title and refresh action; branch/date filters; a compact row of operational counts; then the order list.
- Keep filter labels above their controls. Use consistent heights and spacing. Avoid overlapping actions and overly dense control rows.
- Order tables may scroll inside their own bounded container on small screens, but prefer compact order cards on phones. Never cause page-level horizontal scrolling.
- Use clear, text-labelled status chips and a single obvious next action per order. Only show controls permitted by the authenticated role and existing backend.
- Do not invent analytics, totals, customer details, statuses, access controls, or actions unsupported by the API.

## 6. Component Styling

- **Primary button:** Karachi Red fill, white Geist 500/600 text, 10–12px corner radius, minimum 44px height, comfortable horizontal padding. On hover, darken slightly; on press, move by at most 1px.
- **Secondary button:** white/transparent fill, Ink text, Whisper Border. Do not give all buttons red fills.
- **Inputs:** white background, clear 1px border, 10px radius, label above input, minimum 44px height, obvious focus ring, error text immediately below.
- **Cards:** 12–16px radius and a fine border. Use a shadow only when it communicates elevation; no thick shadows.
- **Pills/chips:** restrained radius and padding; selected state may use Karachi Red and white text. Ensure selected/unselected states are distinguishable without colour alone.
- **Dividers:** 1px Whisper Border. Prefer spacing and dividers over additional nested cards.
- **Icons:** use one consistent, simple outline icon family. Avoid emoji icons.
- **Images:** use meaningful alt text and explicit width/height or aspect-ratio placeholders to reduce layout shift.
- **Feedback:** messages appear near the relevant action. Do not rely on transient, hard-to-read toast notifications alone for critical failures.

## 7. Layout & Responsive Rules

- Content max-width: approximately 1200–1280px, centred.
- Use a consistent 8px spacing rhythm. Common gaps are 8, 16, 24, 32, and 48px; use 64–80px between major desktop sections only when the content merits it.
- Maintain clear separation among header, hero, menu, checkout form, and footer. Avoid overlapping positioned elements and excessive nested containers.
- Desktop: let the food image and copy balance one another. Tablet: reduce gutters and switch multi-column layouts early enough to prevent cramped cards. Mobile: stack content, simplify navigation, and keep all primary actions in reach.
- Breakpoint guidance: mobile below 768px; tablet 768–1023px; desktop 1024px and above.
- Body text should not fall below 14px; primary touch targets must be at least 44×44px.
- No page-level horizontal scroll at 320px, 360px, 390px, or 430px widths.
- Respect safe-area insets for fixed mobile cart bars and bottom actions. Make sure fixed elements do not cover form fields, footer content, or keyboard focus.
- Use CSS Grid for product layouts. Avoid percentage-width hacks and fixed heights that clip text. Use `min-height` rather than rigid section heights.

## 8. Motion & Performance

- Use restrained transitions of roughly 150–220ms for hover, focus, add-to-cart feedback, drawers, and menu opening. Animate opacity and transform only.
- No perpetual pulse/float/shimmer on ordinary content, no parallax, no autoplay video, and no motion that delays ordering.
- Respect `prefers-reduced-motion: reduce`.
- Prioritise the hero food image, give it explicit dimensions, and lazy-load below-the-fold images. Use efficient WebP/AVIF images where supported and sensible responsive sizes.
- Avoid depending on a runtime CSS CDN for the basic layout. Prefer local, production-ready CSS for critical page structure and only load needed scripts.
- Avoid loading icons/fonts multiple times across screens. Preserve browser caching.
- Every screen should render a usable layout if decorative effects or external font loading fail.

## 9. Stitch Generation Workflow

Generate screens in this order so the same system is reused consistently:

1. **Homepage:** desktop 1440px and mobile 390px; refined split hero, real-food imagery, menu discovery, a compact restaurant introduction, and quiet footer.
2. **Menu:** desktop 1440px, tablet 820px, mobile 390px; categories, product cards, price and add-to-cart states.
3. **Cart and checkout:** desktop and mobile; clear totals, branch selection, validation, and empty/error states.
4. **Order confirmation and tracking:** use real application status fields; avoid invented delivery estimates.
5. **Staff login and order dashboard:** a separate operational UI, Geist only, responsive filters and order list.

Use the existing design exports as reference for the current page structure, but refine their visual presentation rather than copying the dark theme. Reuse the same component tokens on every screen.

### Copy/paste prompt for Stitch

> Use this DESIGN.md as the strict source of truth. Create a quiet-premium, approachable restaurant website for Karachi Bites: warm cream background (#FAF7F2), white surfaces, ink text (#18181B), muted secondary text (#71717A), fine borders (#E4E4E7), and one deep-red accent (#B42318). Use Newsreader sparingly for major customer-facing headings and Geist for all body text, menus, prices, controls, forms, and dashboards. Start with a responsive homepage and menu for desktop (1440px) and mobile (390px). Make the homepage hero a balanced split layout with one appetising, realistic food photograph and the short headline “Good food. Karachi roots.”; keep text and image separate, include one dominant Order Now action, and give menu items clear photos, names, real prices, and Add to Cart actions. Use modest corner radii, light borders, practical whitespace, restrained hover transitions, and excellent contrast. Avoid dark luxury styling, visual clutter, oversized typography, neon, gradients, heavy shadows, decorative animation, overlapping elements, and generic three-card feature sections. Keep all controls touch-friendly and all mobile layouts free of page-level horizontal scroll. Generate design screens, not a replacement application; preserve the existing HTML/CSS/JavaScript and API-backed order flow during implementation.

## 10. Non-Negotiable Project Constraints

The current project uses vanilla HTML/CSS/JavaScript with Node.js/Express and an API-backed order flow. Stitch is for visual design and screen exploration—not permission to rewrite the stack.

- Do not migrate to React, Next.js, another framework, or a new component library for visual reasons alone.
- Do not change API endpoints, payload contracts, database schema, order totals, branch validation, allowed status transitions, authentication, or authorization as part of a UI pass.
- Keep the existing order flow wired to the actual API. The `/stitch/` HTML exports are currently visual previews; do not assume their sample cart, checkout, confirmation, or tracking screens are functional.
- Existing routes include the homepage `/`, API-backed order app `/app.html`, staff/admin area `/admin`, and design previews under `/stitch/`. Verify actual routing before implementing links.
- Treat the API as the source of truth for menu data, prices, availability, order IDs, delivery fees, branch support, and order status.
- Do not claim a page, button, OTP, email, checkout, persistence path, or responsive state is tested unless it has actually been tested.
- Generate and approve Stitch visuals first. Implement in a separate branch, test desktop and mobile, run the project tests, then verify the deployed production pages before considering the refresh complete.
