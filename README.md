# Sacola Fitness - GC Conceito

Promotional web application for the **Sacola Fitness** campaign, built with:

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Framer Motion
- Prisma ORM (SQLite)

## Campaign Flow

1. The customer registers before spinning.
2. The system validates participation and allows up to **3 spins per CPF**.
3. A 3-frame premium showcase animation reveals the selected pieces.
4. The final offer displays:
   - 3 selected items
   - original total
   - fixed final price (`R$ 150,00`)
   - savings amount and discount percentage
5. The **Buy now** CTA opens WhatsApp with a prefilled personalized message.

## Admin Flow

- Password-based admin authentication (signed `httpOnly` cookie session).
- Item management: create, activate/deactivate, list, and delete.
- Customer panel:
  - search by name or CPF
  - inspect the latest spun looks
  - mark sale as **Sold**
- When marked as sold, the selected items are immediately set to inactive and leave the active catalog.

## Requirements

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run database migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

4. Start development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev`: start development mode
- `npm run build`: create production build
- `npm run start`: run production server
- `npm run lint`: run ESLint
- `npm run db:generate`: generate Prisma Client
- `npm run db:migrate`: create/apply Prisma migrations
- `npm run db:seed`: seed initial data
- `npm run db:studio`: open Prisma Studio

## Environment Variables

- `DATABASE_URL`: SQLite database connection
- `ADMIN_PASSWORD`: admin login password
- `ADMIN_SESSION_SECRET`: signing secret for admin session token
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: store WhatsApp number used by CTA links

## Routes

Public:

- `/`: landing page
- `/participar`: registration form
- `/giro`: promotional spin experience
- `/resultado`: offer result and purchase CTA

Admin:

- `/admin/login`: admin login
- `/admin/dashboard`: campaign metrics
- `/admin/clientes`: customer panel
- `/admin/pecas`: item listing and status management
- `/admin/pecas/new`: create new item

## Project Structure

```text
src/
  app/
    (public)/
    admin/
    api/
  components/
    admin/
    public/
    shared/
    ui/
  hooks/
  lib/
  types/
prisma/
  schema.prisma
  migrations/
```

## Production Notes

- Item upload currently stores files in `public/uploads` (local disk persistence).
- For serverless/scale deployments, use external object storage (S3, Cloudinary, Supabase Storage, etc.).
- Replace `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` with strong secrets before production.
