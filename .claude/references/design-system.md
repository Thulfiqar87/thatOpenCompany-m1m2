# AI Con Hub — Design System

## Brand Identity
- **Aesthetic**: Industrial-modern, Arabic-first, field-ready
- **Personality**: Precise, structured, trustworthy — built for engineers on site
- **Never**: Purple gradients, generic SaaS look, Inter/Roboto fonts

## Color Tokens
```css
:root {
  /* Brand */
  --color-primary:     #1B4F72;  /* Deep construction blue */
  --color-primary-light: #2E86C1;
  --color-accent:      #E67E22;  /* Iraqi amber */
  --color-accent-dark: #CA6F1E;

  /* Surfaces */
  --color-bg:          #F4F6F7;
  --color-surface:     #FFFFFF;
  --color-surface-2:   #EAF0F6;
  --color-dark:        #1C2833;

  /* Status */
  --color-success:     #1E8449;
  --color-warning:     #D4AC0D;
  --color-danger:      #C0392B;
  --color-info:        #2471A3;

  /* Text */
  --text-primary:      #1C2833;
  --text-secondary:    #566573;
  --text-muted:        #ABB2B9;
}
```

## Typography
```css
/* Arabic primary, Latin secondary */
--font-arabic: 'Cairo', 'Noto Kufi Arabic', sans-serif;
--font-latin:  'IBM Plex Sans', sans-serif;
--font-mono:   'IBM Plex Mono', monospace;

/* Scale */
--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--text-3xl:  1.875rem;
```

## Spacing & Layout
```css
--space-1: 4px;   --space-2: 8px;
--space-3: 12px;  --space-4: 16px;
--space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px;
--space-12: 48px; --space-16: 64px;

--radius-sm: 4px;
--radius:    6px;
--radius-lg: 10px;
--radius-xl: 16px;

--shadow-sm: 0 1px 4px rgba(0,0,0,0.08);
--shadow:    0 2px 12px rgba(0,0,0,0.1);
--shadow-lg: 0 8px 32px rgba(0,0,0,0.15);
```

## RTL Rules (Critical)
- Root element: `<html dir="rtl" lang="ar">`
- Use `margin-inline-start` / `margin-inline-end` (never left/right)
- Use `padding-inline-start` / `padding-inline-end`
- Icons that imply direction (arrows, chevrons) must flip in RTL
- Test EVERY component in both `dir="rtl"` and `dir="ltr"`
- Number formatting: keep Latin numerals for financial data (clearer for mixed teams)

## Component Patterns

### Status Badge
```tsx
// pill shape, color-coded
<span className={`badge badge--${status}`}>{label}</span>
// statuses: active | pending | delayed | completed | cancelled
```

### Dashboard Card
```tsx
// white surface, top accent border, subtle shadow
<div className="card">
  <div className="card__accent" /> {/* 3px top border in --color-primary */}
  <div className="card__body">...</div>
</div>
```

### Data Table
- Sticky header
- Zebra striping on rows
- Sortable columns with indicator arrow
- Row hover highlight
- Pagination: 25 / 50 / 100 rows

### Sidebar Navigation
- Width: 240px (collapsed: 64px)
- Icons + Arabic labels
- Active state: left border accent (right border in LTR)

## Do / Don't
| Do | Don't |
|----|-------|
| Cairo font for Arabic | Roboto, Inter, Arial |
| Amber accent for CTAs | Purple or teal gradients |
| Structured grid layouts | Centered hero layouts |
| Status colors consistently | Random color usage |
| Mobile-first (used on site) | Desktop-only assumptions |