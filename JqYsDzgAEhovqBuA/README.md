# Golf Tracker

A personal, fully functional golf web application built with React + Tailwind CSS. Tracks rounds, manages course data, and calculates your official **World Handicap System (WHS) Handicap Index** — all stored locally on your device with no server required.

---

## Features

### 1. Course Management
- Add, edit, and delete golf courses
- Support for both 18-hole and 9-hole courses
- Multiple tee boxes per course (White, Blue, Red, etc.)
- Hole-by-hole data: par, yardage, and handicap rank (stroke index)
- Course Rating and Slope Rating per tee box

### 2. Round Tracker & Live Scorecard
- Start a round by selecting course, tee box, and round type (18-hole, front 9, back 9, or standalone 9)
- **Shot Counter** — large +/− buttons for instant stroke entry
- **Putts Counter** — track putts per hole
- **Penalty Drops Counter** — track penalty strokes per hole
- Live running total and score vs par
- Score labels: Eagle, Birdie, Par, Bogey, Double, Triple+
- Full scorecard view with hole-by-hole breakdown
- Resume in-progress rounds

### 3. WHS Handicap Calculator
- **18-hole rounds:** Score Differential = (Adjusted Gross Score − Course Rating) × (113 / Slope Rating)
- **9-hole rounds:** 9-hole differential calculated, then paired with expected 9-hole differential (Handicap Index ÷ 2) to form an 18-hole equivalent
- Equitable Stroke Control (ESC) applied per hole (net double bogey cap)
- Handicap Index = average of best N of last 20 differentials × 0.96
- Minimum 3 rounds required; capped at 54.0
- Differential trend chart showing your last 20 rounds
- "Used" badges on the differentials that count toward your current index

### 4. Settings & Backup
- Set your player name and home club
- **Export** all data as a JSON file for backup
- **Import** from a previous backup (replaces current data)
- Clear all data option (with double confirmation)

---

## Running Locally

### Prerequisites
- Node.js 18+ and pnpm (or npm/yarn)

### Install & Start

```bash
# Clone or download the project
cd golf-tracker

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Data Storage

All data is stored in your browser's `localStorage` under these keys:

| Key | Contents |
|-----|----------|
| `gt_courses` | Course and tee box data |
| `gt_rounds` | All round history |
| `gt_handicap_history` | Historical handicap records |
| `gt_settings` | Player name and home club |
| `gt_active_round` | Currently in-progress round |

**Important:** localStorage is per-browser and per-device. Use the **Export** feature in Settings to back up your data before switching browsers or devices.

---

## WHS Handicap Rules Reference

| Rule | Detail |
|------|--------|
| Score Differential | `(AGS − Course Rating) × (113 / Slope Rating)` |
| 9-hole pairing | `actual 9-hole diff + (Handicap Index ÷ 2)` |
| Handicap Index | `avg of best N of last 20 × 0.96` |
| ESC cap | Net double bogey per hole |
| Minimum rounds | 3 (1 diff used); full 8-diff calc at 20 rounds |
| Maximum index | 54.0 |

---

## Tech Stack

- **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Recharts** for differential trend chart
- **Wouter** for client-side routing
- **nanoid** for unique IDs
- **localStorage** for all persistence (no server, no database)

---

## Mobile Use Tips

- Add to your iPhone home screen via Safari → Share → "Add to Home Screen" for a native app-like experience
- The app works fully offline once loaded
- All buttons are sized for one-handed thumb use on the course
- The active round screen is optimized for quick tap entry between shots
