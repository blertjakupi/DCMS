# AGENTS.md

## Project Overview
Dental Clinic Management System (DCMS). React frontend, Node.js backend.
Frontend lives in `/frontend/src`. Pages are in `/frontend/src/pages`, 
components in `/frontend/src/components`.

## Stack
- Frontend: React, Tailwind CSS (utility-first, no Bootstrap, no plain CSS files)
- Backend: Node.js/Express
- Routing: React Router
- Auth: JWT stored in localStorage (accessToken, refreshToken)

## Commands
- `cd frontend && npm start` — run dev server
- `cd frontend && npm run build` — production build

## Code Conventions
- Functional components only, no class components
- All styles via Tailwind utility classes only — no inline styles, no CSS files
- No hardcoded hex values in JSX — use Tailwind config tokens only
- Use `className` not `style` prop

## Design System
Brand: Professional medical internal tool. Clean, high information density.
Not a marketing site. Staff-facing.

### Tokens (configured in tailwind.config.js)
- Primary: `primary` (#26a69a)
- Primary dark: `primary-dark` (#1f8f84)  
- Brand dark: `brand-dark` (#0f4c5c)
- Background: white / `gray-50`
- Text: `gray-900` (primary), `gray-500` (muted)
- Border: `gray-200`

### Typography
- Font: Inter (loaded via Google Fonts in index.html)
- Headings: `font-semibold text-brand-dark`
- Labels: `text-sm font-medium text-gray-700`
- Muted text: `text-sm text-gray-500`

### Components
- Inputs: `w-full px-3 py-2 border border-gray-200 rounded-lg text-sm 
  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`
- Primary button: `bg-primary hover:bg-primary-dark text-white font-semibold 
  px-4 py-2 rounded-lg transition-colors`
- Cards: `bg-white border border-gray-200 rounded-xl p-6`
- No decorative shadows — use borders only
- No gradient backgrounds
- No rounded-full on non-avatar elements

## What to Avoid
- Generic "AI slop" patterns: purple/indigo gradients, oversized hero text, 
  three-column feature cards, glowing shadows
- `font-family: Arial` or `Inter` hardcoded in CSS
- Any plain `.css` files — Tailwind only
- Bootstrap or any component library