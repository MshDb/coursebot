# CourseBot - Platform Core

This directory contains the central CourseBot application built with Next.js 15, Prisma, tRPC, and Inngest.

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Local** | `http://localhost:3000` | Local development and unit testing |
| **Testing** | [coursebot-gamma.vercel.app](https://coursebot-gamma.vercel.app/dashboard) | Active Vercel deployment for feature testing and validation |

## Core Documentation

Refer to the primary documentation in the `docs/` directory at the repository root for:
- [Architecture Overview](../docs/OVERVIEW.md)
- [Technical Decisions](../docs/TECH_DECISIONS.md)
- [Module Specifications](../docs/modules/)
- [User Flows](../docs/user-flows/)

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup environment variables**:
   Copy `.env.local.example` to `.env.local` and fill in the required values.

3. **Database setup**:
   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

Testing and E2E validation should be performed against the **Testing environment** before final merging.
