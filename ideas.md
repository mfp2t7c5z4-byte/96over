# Golf Tracker — Design Ideas

## Three Stylistic Approaches

### 1. Fairway Ledger — Probability: 0.07
Inspired by classic sports scorecards and leather-bound field journals. Warm cream backgrounds, serif type, and ink-stamp accents. Feels like a caddie's yardage book brought to life digitally.

### 2. Precision Green — Probability: 0.04
Clean, clinical, data-forward design inspired by sports analytics dashboards. Monochromatic slate palette with a single electric-green accent. Dense information hierarchy, tight grid, minimal ornamentation.

### 3. Clubhouse Modern — Probability: 0.06
Upscale golf club aesthetic meets contemporary mobile app. Deep forest green primary with warm ivory and gold accents. Card-based layout, generous whitespace, and tactile button design optimized for one-handed use on the course.

---

## Chosen Approach: Clubhouse Modern

### Design Movement
Upscale sports utility — where a premium golf club's visual identity meets the ergonomics of a field tool. Think Augusta National's restraint combined with the usability of a Garmin watch face.

### Core Principles
1. **Touch-First Ergonomics** — All interactive elements (shot counters, navigation) are oversized and thumb-reachable. No precision tapping required.
2. **Data Clarity at a Glance** — Scores, handicap, and hole stats must be readable in sunlight with one eye on the fairway.
3. **Restrained Luxury** — Deep greens and warm ivory communicate quality without being flashy. Gold accents used sparingly for key data points.
4. **Structural Confidence** — Asymmetric card layouts and bold type hierarchy; never a wall of equal-weight text.

### Color Philosophy
Forest green (#1a4731) as the primary — grounded, prestigious, and unmistakably golf. Warm ivory (#f5f0e8) for backgrounds — softer than white, easier on eyes outdoors. Amber gold (#c9973a) as the accent — used only for scores, handicap index, and primary CTAs. Slate (#374151) for secondary text.

### Layout Paradigm
Bottom navigation bar for thumb-reach on mobile. Full-bleed card sections with generous padding. Hole counter screen uses a single-column layout with the stroke counter dominating the center — large, impossible to miss. Dashboard uses a stacked card flow, not a grid.

### Signature Elements
1. **Score Pill** — Rounded pill badges showing score vs par (eagle/birdie/par/bogey) in distinct colors
2. **Hole Counter Ring** — A circular progress arc around the current hole number showing progress through the round
3. **Differential Spark** — A small sparkline chart showing the trend of recent score differentials on the handicap screen

### Interaction Philosophy
Every tap gives immediate tactile feedback via scale transform. Counter buttons use a satisfying press animation. Transitions between holes feel like turning a page — a brief slide.

### Animation
- Button press: `scale(0.94)` on active, 120ms ease-out snap back
- Page transitions: 200ms slide-left/right between holes
- Score entry: number counts up/down with a brief bounce
- Modal open: scale from 0.96 + fade, 220ms ease-out

### Typography System
- **Display/Headings:** "Playfair Display" — serif, authoritative, used for course names, hole numbers, and handicap index
- **Body/UI:** "Inter" — clean, highly legible at small sizes, used for all data labels and body text
- **Numerics:** "Playfair Display" bold — large score numbers feel like a scoreboard

### Brand Essence
Your personal caddie in your pocket — for the golfer who takes their game seriously but plays for the love of it. Precise. Personal. Pocket-sized.

**Personality:** Precise · Grounded · Confident

### Brand Voice
Headlines are direct and confident. CTAs are action-verb-first. No fluff.
- "Start Your Round" (not "Begin Playing Golf")
- "Your Handicap Index: 14.2" (not "Handicap calculation results")

### Wordmark & Logo
A stylized golf flag on a circular green hill — bold, single-color, works at 16px favicon size. Paired with "Golf Tracker" in Playfair Display semibold.

### Signature Brand Color
Forest Green `#1a4731` — the color of the 18th green at dusk.

## Style Decisions
- Score colors: Eagle = deep blue, Birdie = green, Par = neutral gray, Bogey = amber, Double+ = red
- Bottom nav uses forest green background with ivory icons
- Large counter buttons are minimum 80px tall for thumb use
