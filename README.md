# 🎓 Course-Flow

An enterprise-grade online learning platform where users can register, browse courses, enroll, watch videos, and manage their profile. Built with a focus on scalability, clean architecture, and seamless user experience.

## ✨ Key Features

- 🔐 **Role-Based Access:** Separate flows for Students and Admins.
- 🎥 **Media Management:** High-performance video streaming via Cloudinary.
- 💳 **Secure Payment:** Fully integrated with Omise Payment Gateway.
- 🏗️ **Feature-Based Design:** Scalable architecture for long-term maintainability.
- 🎨 **Premium UI:** Minimalist and responsive design using Tailwind CSS + shadcn/ui.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (Pages Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & Storage | Supabase |
| Media | Cloudinary |
| Payment | Omise |
| Database | PostgreSQL |
| Deployment | Vercel |

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root. Required variables depend on your setup (Supabase, Cloudinary, Omise, etc.).

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key

# Omise
NEXT_PUBLIC_OMISE_PUBLIC_KEY=your_omise_public_key
OMISE_SECRET_KEY=your_omise_secret_key
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── features/          # Feature modules (auth, course, assignments, payment, etc.)
├── shared/            # Reusable components, UI primitives, layouts
├── infrastructure/    # External services (Supabase, Cloudinary, Omise, DB)
├── pages/             # Next.js routes (pages + API)
└── lib/               # Utilities (e.g. cn for Tailwind)
```

The project uses a **feature-based architecture** with a layered pattern:

```
Component → Hook → Service → Infrastructure
```

## Documentation

Detailed documentation is available in the `docs/` folder:

- [Project Overview & Architecture](docs/README.md)
- [Auth Flow](docs/features/auth-flow.md)
- [Assignments Flow](docs/features/assignments-flow.md)
- [Course Flow](docs/features/course-flow.md)
- [Payment Flow](docs/features/payment-flow.md)
- [API Flow](docs/api-flow.md)

## Deployment

The project is configured for deployment on [Vercel](https://vercel.com). See [Next.js deployment docs](https://nextjs.org/docs/pages/building-your-application/deploying) for details.
