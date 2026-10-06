---
name: Nocturnal Spice
colors:
  surface: '#151311'
  surface-dim: '#151311'
  surface-bright: '#3b3936'
  surface-container-lowest: '#100e0c'
  surface-container-low: '#1d1b19'
  surface-container: '#211f1d'
  surface-container-high: '#2c2927'
  surface-container-highest: '#373432'
  on-surface: '#e7e1dd'
  on-surface-variant: '#e3beb8'
  inverse-surface: '#e7e1dd'
  inverse-on-surface: '#32302e'
  outline: '#aa8984'
  outline-variant: '#5a403c'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690001'
  primary-container: '#b42318'
  on-primary-container: '#ffcbc2'
  inverse-primary: '#b62419'
  secondary: '#ffb4a8'
  on-secondary: '#690000'
  secondary-container: '#950c06'
  on-secondary-container: '#ff9f90'
  tertiary: '#e6bdb8'
  on-tertiary: '#442a26'
  tertiary-container: '#755551'
  on-tertiary-container: '#f7ccc7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930303'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#910804'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#e6bdb8'
  on-tertiary-fixed: '#2c1513'
  on-tertiary-fixed-variant: '#5d3f3c'
  background: '#151311'
  on-background: '#e7e1dd'
  surface-variant: '#373432'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the nocturnal culinary culture of Karachi—unapologetically rich, aromatic, and steeped in midnight charcoal fires, cast-iron karahis, and spiced heritage. The aesthetic abandons generic fast-casual tropes, sterile tech minimalism, and decorative ethnic kitsch in favor of a cinematic, refined, nocturnal hospitality experience.

The visual mood evokes an intimate, dimly lit dining room illuminated by raw embers and warm ambient pendant lamps. It targets discerning diners who value culinary authenticity alongside contemporary design precision. Every element remains grounded, warm, and food-centric, relying on disciplined geometric sans typography (`Geist`), restrained surfaces, and a signature deep crimson accent inspired by freshly roasted whole Kashmiri chilies and reduced tomato masala.

## Colors

The palette is anchored in charcoal tones with warm umber undertones, deliberately rejecting cold, pure digital blacks (`#000000`) and cool blue-grays.

### Canvas & Surface Hierarchy
- **Canvas Base (`#181614`):** The foundational dark charcoal canvas. Sets the nocturnal, warm atmosphere across full-bleed backgrounds.
- **Section Alternate (`#211E1B`):** Secondary structural blocks and staggered band sections that divide long scrolling menus and editorial stories.
- **Surface Elevation (`#2A2622`):** Elevated cards, interactive sheets, popovers, and menu item containers.
- **Muted Accent Surface (`#3A211E`):** Low-contrast warm crimson-tinted background for active states, selected dietary badges, and featured specials.

### Accent & Feedback
- **Primary Accent (`#B42318`):** Deep Karachi Red, reserved for focal actions (Order Now, Reserve, Add to Cart) and critical price tags.
- **Accent Hover (`#C93627`):** Elevated flame-red for interaction feedback and focus rings.

### Typography & Linework
- **Primary Text (`#F7F3EC`):** Warm off-white, providing high contrast against dark surfaces without harsh glare.
- **Secondary / Metadata Text (`#B8B0A6`):** Muted stone-beige for ingredients, origin notes, spice meters, and operational details.
- **Structural Borders (`#3A342E`):** Warm hairline borders defining structure without visual noise.

## Typography

The type system is powered entirely by `Geist`, applied with editorial discipline. Rather than relying on ornate heritage display faces, modern culinary depth is achieved through tight negative letter tracking on headings and generous line heights on descriptions.

Headlines should be styled in semi-bold cuts with negative kerning to anchor the page with presence and weight. Food descriptions, culinary provenance notes, and spice profiles use regular body weights with open line spacing to maximize readability in nocturnal environments. Micro-labels, spice scales, cut tags, and menu categorization labels utilize uppercase treatment with subtle positive tracking (`0.04em`).

## Layout & Spacing

The layout model is built on an 8pt architectural rhythm, structured around an expansive 12-column grid on desktop and an optimized 4-column flow on mobile viewports.

- **Desktop (1024px+):** Max-width 1280px, 12 columns, 1.5rem (`gutter`), 3rem (`margin`). Dishes display in 2 or 3-column modular cards with high image prominence.
- **Tablet (768px - 1023px):** 8 columns, 1.25rem gutters, 2rem margins. Order summaries and menu categories collapse into top horizontal scrollbars or bottom sticky sheets.
- **Mobile (<768px):** 4 columns, 1rem (`gutter-mobile`), 1.25rem (`margin-mobile`). Single-column card stacking with persistent bottom action drawers for checkout and reservations.

Component internals use `space-sm` (0.5rem) for tight label-to-heading pairings, `space-md` (1rem) for form input padding and internal card sections, and `space-xl` (2.5rem) between major menu collections (e.g., Karahi Specialties, Tandoor & Charcoal, Breads & Rice).

## Elevation & Depth

Visual hierarchy uses warm, low-reflection tonal layering paired with ember-tinted shadow dispersion, avoiding harsh drop shadows or synthetic cold blues.

- **Layer 0 (Canvas):** `#181614` base tone, matte finish.
- **Layer 1 (Sub-section / Recessed):** `#211E1B` with 1px border of `#3A342E`.
- **Layer 2 (Cards / Food Containers):** `#2A2622` with a 1px border of `#3A342E`. Shadow: `0 4px 20px -2px rgba(12, 10, 8, 0.65)`.
- **Layer 3 (Modals / Cart Drawer / Menus):** `#2A2622` elevated surface with `0 12px 36px -4px rgba(10, 8, 6, 0.85)` and an interior subtle perimeter glow `inset 0 1px 0 0 rgba(247, 243, 236, 0.05)`.
- **Focus Rings:** Non-offset, razor-sharp 2px border using `#B42318` or `#C93627`.

## Shapes

The shape system adopts a refined, subtle curve profile (`roundedness: 1`). Elements favor architectural solidity over bulbous or juvenile rounded components.

- **Base Radius (0.25rem / 4px):** Form inputs, chips, badge tags, and secondary small controls.
- **Container Radius (`rounded-lg` / 0.5rem / 8px):** Menu cards, food photography frames, category containers, and cart summary modules.
- **Sheet Radius (`rounded-xl` / 0.75rem / 12px):** Top corners of mobile slide-up sheets, payment sheets, and hero reservation modals.
- **Never Pill-Shaped:** Buttons and chips retain disciplined 4px or 8px corners; round pills are strictly avoided.

## Components

### Buttons
- **Primary (Action):** Background `#B42318`, text `#F7F3EC`, font weight 500, radius 6px (`rounded-md`). Hover state `#C93627`. Active state `#981B12`.
- **Secondary (Subdued):** Background `#2A2622`, border 1px solid `#3A342E`, text `#F7F3EC`. Hover background `#3A211E`, border color `#B42318`.
- **Ghost:** Background transparent, text `#B8B0A6`. Hover text `#F7F3EC`, background `rgba(58, 52, 46, 0.4)`.

### Chips & Badges
- **Dietary / Spice Badge:** Muted background `#3A211E`, text `#F7F3EC`, border 1px solid `rgba(180, 35, 24, 0.4)`. Used for "Shinwari Style", "Coal-Smoked", "Mild", "Fiery".
- **Category Filter Chip:** Background `#211E1B`, text `#B8B0A6`, border 1px solid `#3A342E`, radius 4px. Selected state switches background to `#B42318` and text to `#F7F3EC`.

### Cards (Menu Item & Specialty)
- Surface background `#2A2622`, border 1px solid `#3A342E`, radius 8px (`rounded-lg`).
- Internal layout features a 1:1 or 16:9 photography header with subtle dark bottom gradient blending directly into the charcoal surface.
- Title in `headline-sm` (`#F7F3EC`), ingredient narrative in `body-sm` (`#B8B0A6`), and price in `label-md` accented with `#F7F3EC`.

### Input Fields
- Background `#211E1B`, border 1px solid `#3A342E`, text `#F7F3EC`, placeholder `#B8B0A6` (opacity 0.6), radius 4px.
- Focus state updates border color to `#B42318` without outline ring artifacts.

### Checkboxes & Radios
- Box/Circle frame with 1px border `#3A342E`, background `#181614`.
- Checked state fills with `#B42318` and renders a clean checkmark or inner indicator in `#F7F3EC`.

### Lists & Menu Item Rows
- Alternating horizontal separators use 1px solid `#3A342E`.
- Quantity increments provide subtle click feedback with `#3A211E` backing and sharp tabular number typography.