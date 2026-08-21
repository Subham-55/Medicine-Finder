# 🏥 Medicine Finder

> Find medicines available in nearby pharmacies. Compare prices, check availability, and navigate to the nearest medical store.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)

---

## 🚀 Features (26+)

### Customer
- 🔍 Medicine Search by name, generic name, category
- 📍 Location Selection (India & worldwide)
- 💊 Medicine Substitutes (find cheaper alternatives)
- 🧪 Drug Interaction Checker
- 📋 Prescription Scanner (AI-powered)
- 💉 Dosage Calculator
- 🩺 Symptom Checker (AI-powered)
- 🤖 AI Health Assistant (chat)
- 📖 Medicine Encyclopedia
- ⏰ Medicine Reminders
- ❤️ Health Tips & Articles
- ⭐ Pharmacy Reviews & Ratings
- 💬 Community Forum with AI replies
- 👨‍⚕️ Find Doctor by specialty/city
- 💖 Medicine Wishlist
- 👨‍👩‍👧‍👦 Family Profiles
- 📂 Category Browse
- 🗺️ Map View
- 🔔 Notifications
- 📍 Saved Locations
- 🔄 Refill Tracker

### Store Owner
- 🏪 Store Dashboard
- 📊 Store Analytics
- 💡 AI Store Insights
- 🎫 Promotions & Offers

### Admin
- 👑 Admin Panel (manage stores & users)

---

## 🏗️ Project Structure

```
Medicine-Finder/
├── frontend/          ← Client-side React code
│   ├── src/
│   │   ├── app/        ← page.tsx, layout.tsx, globals.css
│   │   ├── components/
│   │   │   ├── screens/   ← 38 screen components
│   │   │   ├── ui/        ← 49 shadcn/ui components
│   │   │   └── layout/    ← 4 layout components
│   │   ├── hooks/      ← Custom React hooks
│   │   └── lib/
│   │       ├── store.ts   ← Zustand state (persisted)
│   │       ├── i18n/      ← 12 languages
│   │       ├── data/      ← Location/pharmacy data
│   │       └── utils.ts
│   └── public/
├── backend/           ← Server-side API & Database
│   ├── src/app/api/  ← 36 API route files
│   ├── prisma/       ← 16 database models
│   ├── src/lib/db.ts ← Prisma client
│   └── seed-data.ts  ← Database seeder
└── README.md
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|----------|
| Next.js 16 | React framework (App Router) |
| TypeScript 5 | Type-safe development |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components (50+) |
| Prisma ORM | Database (SQLite) |
| Zustand | State management |
| Framer Motion | Animations |
| z-ai-web-dev-sdk | AI capabilities |
| Lucide React | Icons |
| Recharts | Charts |
| next-themes | Dark/Light mode |

---

## 🌍 i18n (12 Languages)

English, Hindi, Bengali, Tamil, Telugu, Arabic (RTL), French, German, Spanish, Japanese, Korean, Chinese

---

## 🎨 10 Color Themes

Default, Emerald, Rose, Amber, Violet, Ocean, Crimson, Sage, Sunset, Mint, Peach, Slate — each with light & dark mode

---

## 📦 Setup

```bash
# 1. Clone & put both folders in one project:
#    my-project/
#    ├── frontend/  (rename to src/ or merge)
#    └── backend/   (merge into frontend/)
#
# OR keep them as reference code for your GitHub repo.

# 2. Install dependencies
npm install   # or: bun install

# 3. Setup database
npx prisma db push

# 4. Start
npm run dev
```

### Environment Variables (.env)
```
DATABASE_URL="file:./db/custom.db"
```

---

## 📡 API Endpoints (36)

### Auth: `/api/auth`, `/api/otp`
### AI: `/api/ai-assistant`, `/api/medicine-info`, `/api/medicine-substitutes`, `/api/drug-interaction`, `/api/dosage-calculator`, `/api/symptom-checker`, `/api/scan-prescription`
### Search: `/api/search`, `/api/categories`, `/api/doctors`, `/api/map/pharmacies`
### Location: `/api/location`, `/api/pincode`, `/api/geocode`
### User: `/api/profile`, `/api/notifications`, `/api/reminders`, `/api/wishlist`, `/api/family-members`, `/api/reviews`, `/api/forum`
### Store: `/api/store/profile`, `/api/store/medicines`, `/api/store/analytics`, `/api/store/insights`, `/api/store/promotions`
### Admin: `/api/admin/stores`, `/api/admin/medicines`

---

## 🗄️ Database (16 Models)

User, Store, MedicineInventory, SavedLocation, RecentSearch, Pincode, Notification, MedicineReminder, PharmacyReview, ForumPost, ForumReply, Doctor, Promotion, WishlistItem, FamilyMember, HealthArticle

---

## 👤 Demo Accounts

| Mobile | Role |
|--------|------|
| Any 10-digit | Customer |
| `9999999999` | Admin |
| `8888888888` | Store Owner |

---

## 📄 License
MIT License
