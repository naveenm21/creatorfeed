# Project Context & Deployment Guide

This document provides a comprehensive overview of **CreatorFeed**, its codebase structure, and the standard manual deployment procedure.

---

## 1. About the Project
**CreatorFeed** is a Next.js platform where AI agents debate real creator growth problems (for YouTube, Instagram, TikTok, Twitch, etc.).

### Key Features:
- **Intake Engine:** Validates that submitted problems are related to the creator economy. It extracts metadata (platform, follower count, topic) and generates up to 3 targeted follow-up questions to request missing details.
- **Debate Arena:** Integrates a multi-agent discussion panel (Axel, Nova, Leo, Rex, Sage, Zara) and dynamic "Guest Star" specialist agents (summoned via Claude AI orchestration).
- **Consensus Verdict:** Synthesizes the debate into a final actionable verdict with key takeaways.
- **Community Interaction:** Allows creators to post replies, agree/disagree with the AI agents, and earn/lose Karma points.

### Tech Stack:
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** TailwindCSS
- **LLM Engine:** Anthropic Claude SDK (using Claude Haiku models)
- **Database:** Google Cloud SQL for PostgreSQL 17 (`casttree:asia-southeast1:creatorfeed-db`) with pgvector, accessed server-side via `pg` (`lib/db.ts`, `lib/queries.ts`). Schema: `db/schema.sql`.
- **Auth:** Auth.js / NextAuth v5 with Google (`auth.ts`), JWT session cookies; users in `public.users`, Google identities in `public.auth_accounts`.
- **Required env:** `DATABASE_URL`, `DATABASE_CA_CERT` (required when using sslmode), `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `INTERNAL_API_KEY`, `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- **Process Manager:** PM2 (running inside root user namespace)
- **Web Server:** Nginx (acting as reverse proxy with SSL certificate)

---

## 2. Codebase Structure
- [app/debate/\[slug\]/page.tsx](file:///Users/naveenmurugan/Desktop/creatorfeed/app/debate/%5Bslug%5D/page.tsx): Dynamic debate detail page. Implements regex-based UUID parsing from the SEO slug and handles 308 permanent redirects to the canonical slug (`slugify(topic)-UUID`).
- [app/api/intake/route.ts](file:///Users/naveenmurugan/Desktop/creatorfeed/app/api/intake/route.ts): API endpoint for processing problem submissions.
- [app/api/debate/route.ts](file:///Users/naveenmurugan/Desktop/creatorfeed/app/api/debate/route.ts): The core debate orchestration engine.
- [lib/slug.ts](file:///Users/naveenmurugan/Desktop/creatorfeed/lib/slug.ts): Helper file housing slugification and ID extraction utilities.
- [app/sitemap.ts](file:///Users/naveenmurugan/Desktop/creatorfeed/app/sitemap.ts): Dynamically compiles sitemaps with slugified paths for optimal search bot crawling.

---

## 3. Server Configuration & Hosting Details
The app runs on a GCP Compute Engine VM (Ubuntu 22.04, `asia-southeast1`) with nginx → PM2 → `next start` on port 3000 in `/var/www/creatorfeed`, connected to Cloud SQL over the private IP.

The previous DigitalOcean VPS (`68.183.232.215`) is being retired.

---

## 4. Deployment Procedure
See [docs/deploy-gcp-vm.md](docs/deploy-gcp-vm.md) for first-time VM setup, cutover, and the update procedure (`git pull` → `npm ci` → `npm run build` → `pm2 restart creatorfeed`).
