# BusiWage — Your Digital Work Diary

A completely **offline** app for small contractors to manage workers, sites,
daily work records, and payments — all in one place.  
No internet. No login. No passwords. Just open and use.

---

## What you need (one-time setup)

1. **Node.js** — download free from https://nodejs.org (choose the "LTS"
   version). This also gives you the `npm` command.
2. That's it. No accounts, no cloud, no Firebase.

---

## Setup steps

### Step 1 — Install the app's pieces

Open a terminal (Command Prompt on Windows, Terminal on Mac/Linux), go
inside the `BusiWage` folder, and run:

```
npm install
```

This takes about a minute the first time.

### Step 2 — Run the app

```
npm run dev
```

It prints a web address like `http://localhost:5173`. Open that in any
browser — your app is running. Works completely offline after this first
load.

### Step 3 — Build for production (optional, for sharing)

```
npm run build
```

This creates a `dist/` folder. You can host it anywhere (Netlify, Vercel,
GitHub Pages — all have free tiers) or just open `dist/index.html` directly
on the same computer.

---

## How the app works

| Tab | What it does |
|-----|-------------|
| 🏠 Dashboard | Today's summary: workers, sites, pending payments, reminders |
| 👷 Workers | Add workers, see each person's full history & pending salary |
| 🏗️ Sites | Add sites, track cost & history per project |
| 📝 Work Log | 5-step wizard: pick date → site → workers → times → save |
| 📅 Calendar | Diary view — tap any date to see what happened |
| 💰 Payments | Who still needs money? Mark paid in one tap |

---

## Where data is stored

Everything is saved in your **browser's localStorage** — on the same device,
offline, automatically. Nothing leaves the device.

> **Important:** If you clear your browser data / site data, the records
> will be deleted. For a backup, use Chrome DevTools → Application →
> Local Storage, or plan a future export feature.

---

## Changing colors

Open `src/styles/global.css` and edit the values at the very top under
`:root { ... }`. The two main brand colors are:
- `--color-primary` (orange) — buttons, active states
- `--color-navy` (dark blue) — headers, avatars, structure

---

## File map (for developers)

```
src/
  utils/         id.js, storage.js, date.js, wage.js  — pure helpers
  context/       DataContext.jsx — one place that holds ALL app data
  styles/        global.css — every color, font, button, card style
  components/    Small reusable pieces (Button, Card, Navbar, etc.)
  pages/         One folder per screen
  routes/        AppRoutes.jsx — which URL shows which page
```
