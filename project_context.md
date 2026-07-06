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
- **Database & Auth:** Supabase (PostgreSQL client + SSR context)
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
The project is hosted on a DigitalOcean VPS at IP `68.183.232.215`.

- **Web Server:** Nginx proxies requests to the Next.js port.
  - Configuration Path: `/etc/nginx/sites-available/creatorfeed`
  - Maps `feed.creedom.ai` traffic to loopback `http://[::1]:3000`.
  - Maps API backend traffic (`/api/backend/`) to `http://[::1]:4000`.
  - Configures SSL certificates via Let's Encrypt.
- **Process Manager:** PM2 is used to run and keep the Next.js production server alive.
  - Working directory (`exec cwd`): `/var/www/creatorfeed`
  - PM2 App Name: `creatorfeed` (Process ID: `0`)
  - Entry Command: `npm start` (which runs `next start` on port 3000)

---

## 4. Deployment Procedure
Whenever changes are pushed to the remote repository, follow these steps to deploy them to the production server:

### Step 1: Connect to VPS
Access the server via SSH:
```bash
ssh root@68.183.232.215
```

### Step 2: Navigate to Project Directory
```bash
cd /var/www/creatorfeed
```

### Step 3: Fetch the Latest Codebase
```bash
git pull origin main
```

### Step 4: Build the Optimized Next.js Bundle
```bash
npm run build
```
*(Optionally run `npm install` first if dependencies in `package.json` were updated).*

### Step 5: Restart the Application via PM2
```bash
pm2 restart creatorfeed
```

To monitor logs or check system performance:
```bash
pm2 logs creatorfeed
pm2 status
```
