# Prisma Setup

## 1) Generate client

```bash
npm run db:generate
```

## 2) Create migration

```bash
npm run db:migrate -- --name init_campaign_models
```

If Prisma asks to reset local SQLite because of old tables, confirm reset in development.

## 3) Seed data (optional)

```bash
npm run db:seed
```

This seed creates:
- Example `Item` rows
- Default admin user (`username: admin`, password hash from `admin123`)

## 4) Open Prisma Studio

```bash
npm run db:studio
```
