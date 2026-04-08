# Prisma Setup

This project uses **MySQL** as the Prisma datasource.

Uploaded item images are stored directly in the `Item` table:
- `imageData` (`LONGBLOB`)
- `imageMimeType`

## 1) Generate client

```bash
npm run db:generate
```

## 2) Create migration

```bash
npm run db:migrate -- --name init_campaign_models
```

If your schema changed and Prisma asks to reset the local development database, confirm reset only in development.

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
