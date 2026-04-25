# Design Tokens Reference (Blog8byte)

This document serves as the Single Source of Truth reference for the UX/UI Designer (Figma) and Developers. It is based on the `design-tokens.json` (DTIF standard).

## Earth Tone Editorial Palette (Global Tokens)

| Token Name | HEX Value | Description |
| :--- | :--- | :--- |
| `stone-50` | `#fafaf9` | Very light grey, near white |
| `stone-100` | `#f5f0eb` | Off-white, slightly warm |
| `stone-200` | `#e7e5e4` | Light border/input color |
| `stone-500` | `#78716c` | Muted text |
| `stone-700` | `#44403c` | Secondary text |
| `stone-800` | `#292524` | Dark grey (dark mode backgrounds) |
| `stone-900` | `#1c1917` | Charcoal, primary text |
| `stone-950` | `#0c0a09` | Deepest grey/black |
| `sage-500` | `#849c8a` | Sage green accent |
| `terracotta-500` | `#c87965` | Terracotta red accent |
| `sand-500` | `#d4a574` | Warm sand/mustard accent |
| `cream-500` | `#fdfbf7` | Warm cream background |
| `red-500` | `#ef4444` | Danger/Destructive |

---

## Semantic Tokens (Contextual Usage)

When designing in Figma or developing in code, **always use Semantic Tokens** rather than Global Tokens directly. This ensures dark mode compatibility and easier theming.

| Semantic Token | Light Mode Value (Global) | Dark Mode Value (Global) | Description |
| :--- | :--- | :--- | :--- |
| `background` | `cream-500` (`#fdfbf7`) | `stone-950` (`#0c0a09`) | Main page background |
| `foreground` | `stone-900` (`#1c1917`) | `stone-50` (`#fafaf9`) | Main body text |
| `primary` | `stone-900` (`#1c1917`) | `stone-50` (`#fafaf9`) | Primary emphasis (buttons, active states) |
| `primaryForeground` | `cream-500` (`#fdfbf7`) | `stone-950` (`#0c0a09`) | Text on primary elements |
| `secondary` | `stone-100` (`#f5f0eb`) | `stone-800` (`#292524`) | Secondary containers/cards |
| `secondaryForeground`| `stone-700` (`#44403c`) | `stone-50` (`#fafaf9`) | Text on secondary elements |
| `muted` | `stone-100` (`#f5f0eb`) | `stone-800` (`#292524`) | Muted backgrounds (code blocks, subtle sections) |
| `mutedForeground` | `stone-500` (`#78716c`) | `stone-400` (`#a8a29e`) | Muted/placeholder text |
| `accent` | `sage-500` (`#849c8a`) | `sage-500` (`#849c8a`) | Accent elements, highlights |
| `accentForeground` | `stone-900` (`#1c1917`) | `stone-50` (`#fafaf9`) | Text on accent elements |
| `destructive` | `red-600` (`#dc2626`) | `red-500` (`#ef4444`) | Error states, delete actions |
| `border` | `stone-200` (`#e7e5e4`) | `stone-800` (`#292524`) | Default border color |
| `input` | `stone-200` (`#e7e5e4`) | `stone-800` (`#292524`) | Input field borders/backgrounds |
| `ring` | `sage-500` (`#849c8a`) | `sage-500` (`#849c8a`) | Focus ring color |

---

## Component Tokens (Interactive States)

Component tokens manage the specific states of UI elements to ensure standardized interaction (hover, focus, disabled).

| Component Token | Target Element | Light Mode | Dark Mode | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `button.primary.bg` | Primary Button | `primary` | `primary` | Default state |
| `button.primary.hover`| Primary Button | `primary` (with opacity) | `primary` (with opacity) | Hover state |
| `button.secondary.bg` | Secondary Button | `secondary` | `secondary` | Default state |
| `button.secondary.hover`| Secondary Button | `stone-200` | `stone-700` | Hover state |

> **Note to Developers:** In Tailwind CSS v4, these Semantic Tokens are available as `bg-background`, `text-foreground`, `border-border`, etc. Component tokens can be mapped to CSS variables like `--button-bg-primary`.
