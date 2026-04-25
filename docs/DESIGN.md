# Blog8byte Design System

**Vibe:** Editorial, Neo-Brutalist, Minimalist, Content-First.
**Inspiration:** Pirate Wires, but with a unique modern developer twist.

This document serves as the Single Source of Truth (SSOT) for any AI agent or developer building UI for the `Blog8byte` project.

---

## 1. Core Principles
- **No Clutter:** Remove unnecessary boxes, heavy drop shadows, or complex gradients.
- **Organic Editorial:** Combine the stark, structural layout of Pirate Wires with a warm, modern Earth Tone palette. It should feel like reading a high-end, modern physical magazine.
- **Micro-Interactions:** Keep animations minimal but impactful (e.g., fading metadata on hover).

## 2. Typography
- **Primary Font:** `Geist Sans` or `Inter` (Sans-serif).
- **Titles (H1/H2):** Bold (`font-bold` or `font-extrabold`), tight tracking (`tracking-tight`).
- **Body / Excerpts:** Standard weight (`font-normal`), relaxed line height (`leading-relaxed`) for maximum readability.
- **Metadata:** Small (`text-sm`), muted colors.

## 3. Color Palette (Earth Tones + Editorial)
We use organic, natural colors to differentiate from Pirate Wires' stark palette while keeping the clean structure.
- **Background:** `bg-[#FDFBF7]` (Warm Cream / Off-white, reduces eye strain like real paper).
- **Primary Text:** `text-[#27272A]` (Deep Charcoal, softer and more organic than pure black).
- **Secondary/Muted Text:** `text-[#A1A1AA]` (Warm Gray for author, views, comments, dates).
- **Dividers/Borders:** `border-[#E4E4E7]` (Soft, subtle lines).
- **Accents (For tags, highlights, or links):**
  - *Sage Green:* `#849C8A`
  - *Terracotta:* `#C87965`
  - *Sand/Ochre:* `#D2A271`

## 4. Key Component Specifications

### 4.1 The Blog Feed Item (Card/Row)
Instead of a traditional "card" with a border and shadow, articles are presented as horizontal rows separated by thin lines.

**Layout Structure (Top to Bottom):**
1. **Metadata Row:** 
   - Author Name
   - 👁️ View Count
   - 💬 Comment Count
   - *Styling:* `text-sm text-zinc-500 flex gap-4 items-center`
2. **Title:**
   - *Styling:* `text-2xl font-bold mt-2 text-black`
3. **Excerpt:**
   - 1-2 sentences summarizing the article.
   - *Styling:* `text-zinc-700 mt-2 line-clamp-2`

### 4.2 Interactive Hover State (The "Hidden Date")
- **Behavior:** The exact publish date is considered secondary information. It is hidden by default to keep the feed extremely clean.
- **Trigger:** When the user hovers over the specific blog row (`group`).
- **Effect:** The date smoothly fades into view.
- **Tailwind Implementation:** 
  - Parent container: `group`
  - Date container: `opacity-0 transition-opacity duration-300 group-hover:opacity-100`

---

*Note for AI Agents: Whenever generating or modifying UI components in `src/app`, STRICTLY adhere to the guidelines above. Do NOT introduce new colors or heavy styling without explicit user permission.*
