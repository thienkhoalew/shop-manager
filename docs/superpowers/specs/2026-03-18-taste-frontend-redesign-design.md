# Taste Frontend Redesign Design

## Summary

Redesign the existing `shop-manager` frontend without changing user flows, routes, or backend behavior. The new direction is a mobile-first boutique admin with an editorial, bright visual language, a soft pink accent, and restrained motion. The primary target device is iPhone, so mobile ergonomics, readable hierarchy, and one-hand use take priority over dense desktop-first layouts.

## Goals

- Preserve all current page flows and data interactions.
- Refresh the interface to feel more premium, feminine-leaning, and editorial without becoming ornamental.
- Improve mobile responsiveness across the dashboard, orders, and products pages.
- Reduce generic admin UI patterns such as equal card grids, heavy tables on small screens, and default typography choices.
- Keep implementation inside the existing Next.js and Tailwind setup without introducing new dependencies unless already present.

## Non-Goals

- No changes to database schema, API routes, or business logic.
- No new navigation destinations or feature expansions.
- No redesign of print-specific invoice layouts beyond visual consistency if touched indirectly.
- No new third-party animation or icon packages.

## Existing Context

The current app already renders real production-like data from the database and has three main surfaces:

- Dashboard at `/`
- Orders at `/orders`
- Products at `/products`

Layout is shared through `src/app/layout.tsx` and `src/components/Sidebar.tsx`. The current interface uses `Inter`, strong rose accents, white card-heavy surfaces, and a mobile bottom nav. Orders already contain separate desktop and mobile presentations, but the hierarchy and touch ergonomics can be improved. Products already use a responsive card grid. Dashboard is currently composed of simple stat cards and charts.

## Design Direction

### Visual Tone

The redesign should feel:

- Bright and clean
- Softly editorial rather than corporate
- Feminine-leaning through palette and spacing, not through decorative gimmicks
- Calm and tactile, with subtle interaction feedback

### Visual System

- Use `Geist` for the app font instead of `Inter`
- Keep a single accent family centered on muted rose and blush tones
- Use warm neutral backgrounds instead of stark white everywhere
- Prefer large radii, fine borders, and soft diffusion shadows over loud card elevation
- Avoid purple, neon glow, aggressive gradient text, and generic three-column equal marketing rows

### Motion

Motion stays light:

- Short opacity and translate transitions for content entry
- Active-state compression on buttons and controls
- No continuous animation loops
- No new animation libraries

## Information Architecture

The route structure stays unchanged. Improvements come from hierarchy, spacing, and component treatment.

### Global Layout

- The app shell remains split between desktop sidebar and mobile bottom navigation
- Main content should use `min-h-[100dvh]` rather than `h-screen`
- Content containers should be tuned for mobile first, then expand gracefully on larger screens
- Spacing should feel airy on mobile without wasting vertical space

### Mobile Navigation

- Keep the bottom nav because it fits the existing flow and iPhone usage
- Restyle it into a floating soft-surface bar with clearer active states
- Shorten labels where helpful so they fit without crowding
- Respect safe-area padding

### Desktop Navigation

- Keep the left sidebar structure
- Refine it into a lighter editorial rail with softer contrast and cleaner branding

## Page-Level Design

### Dashboard

Current issue:
- The dashboard reads as a standard admin board with equal stat cards and little rhythm.

Redesign:
- Introduce a stronger heading block with left-aligned editorial typography
- Replace the equal three-card stat row with an asymmetric grid on desktop and stacked sections on mobile
- Use one featured summary surface for revenue/profit and smaller supporting stat tiles
- Keep charts, but frame them in lighter containers with better spacing and labeling
- Ensure the mobile view reads top-to-bottom naturally without requiring users to parse a dense grid

### Orders

Current issue:
- Desktop table is functional but visually busy
- Mobile card view contains a lot of useful information, but the hierarchy and actions still feel crowded

Redesign:
- Keep the table on desktop, but reduce visual noise and improve spacing, badge styling, and action grouping
- Improve the filter block into a clearer control panel that stacks naturally on mobile
- For mobile, preserve the card/list model but increase contrast between key facts:
  - customer name
  - order status
  - COD total
  - deposit state
  - tracking code
- Make quick actions easier to tap and easier to scan
- Keep expanded detail behavior, but style the detail section as a tidy continuation rather than a separate dense slab

### Products

Current issue:
- Product cards are workable but still close to a default CRUD gallery

Redesign:
- Keep the product grid but make it more boutique and editorial
- Improve image framing, spacing, and text hierarchy
- Refine the search and add-product controls so they feel like part of a cohesive header
- Keep all create/edit/delete flows intact
- On mobile, maintain a two-column layout only if card readability stays strong; otherwise allow a more forgiving layout pattern where needed

## Responsive Rules

The redesign should follow these mobile-first constraints:

- Optimize first for narrow iPhone widths
- Use single-column stacking by default for major layout sections
- Let asymmetry appear from `md:` upward only
- Avoid horizontal scrolling
- Keep controls comfortably tappable
- Make headers, filters, and action bars wrap gracefully
- Preserve bottom space so the mobile nav never covers critical actions

## Technical Approach

### Files in Scope

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/Sidebar.tsx`
- `src/app/page.tsx`
- `src/app/orders/page.tsx`
- `src/app/products/page.tsx`
- Potentially existing shared UI primitives if minor styling support is needed

### Dependencies

Based on current `package.json`:

- Next.js is present
- Tailwind CSS v4 is present
- `lucide-react` is already installed
- No `framer-motion`, `@phosphor-icons/react`, or `@radix-ui/react-icons` packages are currently present in dependencies as named imports for this redesign path

Because the user explicitly asked not to add libraries that are not already in `package.json`, the redesign should use existing packages only.

### Styling Strategy

- Prefer global tokens and utility classes over introducing a new design system layer
- Adjust `globals.css` variables to support the brighter rose-neutral palette and better app-shell defaults
- Move typography to `Geist` via `next/font/google`
- Use Tailwind v4-compatible classes only

## States and Edge Cases

The redesign must keep existing behavior visible and understandable for:

- empty order/product lists
- search with no product matches
- failed data fetches where current pages already degrade gracefully
- dialogs and overlays on small screens
- long addresses, long product names, and tracking codes

## Testing and Verification Expectations

Implementation should verify:

- existing route behavior still works
- main pages render without layout breakage on small mobile widths
- desktop navigation and mobile navigation both remain usable
- no missing imports or Tailwind v4 syntax issues are introduced
- existing relevant tests continue to pass

## Rollout Approach

The work should be implemented in focused chunks:

1. Global shell and design tokens
2. Dashboard redesign
3. Orders responsive polish
4. Products responsive polish
5. Verification and cleanup

## Acceptance Criteria

- The app keeps all current routes and business flows unchanged
- The interface no longer uses `Inter`
- The visual system is bright, editorial, and rose-accented without purple or heavy neon effects
- The dashboard, orders, and products pages feel intentionally redesigned rather than lightly recolored
- Mobile presentation on iPhone-sized screens is clearly improved in readability and tap ergonomics
- No new dependencies are required for the redesign
