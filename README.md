# Bite

A recipe management app to collect and organize all your recipes in one place.

## Tech Stack

- **Frontend/Backend:** Next.js 15 (App Router)
- **Auth:** Clerk
- **Database:** Neon Postgres (serverless)
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Features (Week 1 MVP)

- ✅ User authentication (email + Google)
- ✅ Create recipes with ingredients and instructions
- ✅ View recipe collection
- ✅ Detailed recipe view

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repo

```bash
git clone https://github.com/yourusername/thebiterecipes.git
cd thebiterecipes
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create .env.local:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
DATABASE_URL=your_neon_connection_string
GEMINI_API_KEY=your_key
```

4. Push database schema

```bash
npm run db:push
```

5. Run development server

```bash
npm run dev
```

Open http://localhost:3000

### Roadmap:

- Recipe image uploads (Cloudinary)
- AI-powered recipe parsing from links/photos
- Meal planning calendar
- Grocery list generation
- Recipe tagging and search
- Nutrition tracking (macros)

### License

MIT
