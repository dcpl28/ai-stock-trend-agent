# M+ Global Pro Terminal

## Overview

This is a premium stock market analysis terminal built for "Dexter Chia," a remisier (stock broker) offering portfolio management services. The application provides real-time stock charting, AI-powered technical analysis, and company insights. It integrates with Yahoo Finance for market data and supports multiple AI providers (Replit AI, OpenAI, Anthropic) for generating stock analysis.

The app is a full-stack TypeScript project with a React frontend and Express backend, deployed on Replit. It features a luxury dark theme with gold accents (deep navy + gold color scheme) targeting the Malaysian stock market (KLSE/MYX) as well as US markets. Supports three languages: English, Mandarin Chinese, and Malay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router) — routes: Dashboard (/), Scanner (/scanner), Admin (/admin), Premium (/premium)
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Charting**: Dual charting approach — Recharts for custom candlestick charts and TradingView embedded widget for full-featured interactive charts
- **Styling**: Tailwind CSS with custom CSS variables for a dark luxury theme. Fonts: Cormorant Garamond (serif) and Montserrat (sans-serif) from Google Fonts
- **Build Tool**: Vite with path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)
- **i18n**: Custom i18n system in `client/src/lib/i18n.tsx` supporting EN, ZH (Chinese), MS (Malay)

### Backend (server/)
- **Framework**: Express.js on Node with TypeScript (tsx for dev, esbuild for production)
- **API Design**: REST API endpoints under `/api/` prefix. Key routes handle stock data fetching, AI analysis, favourites, conversations, and image generation
- **Stock Data**: Yahoo Finance via `yahoo-finance2` library with symbol resolution for KLSE/MYX and US exchanges
- **AI Integration**: Supports three providers:
  - Replit AI (default, uses built-in credits via `AI_INTEGRATIONS_OPENAI_API_KEY`)
  - OpenAI (user-provided API key, GPT-4o)
  - Anthropic (user-provided API key, Claude Sonnet via `@anthropic-ai/sdk`)
- **Dev/Prod Split**: In development, Vite dev server runs as middleware with HMR. In production, pre-built static files are served from `dist/public/`
- **Email**: `server/email.ts` — HTML email template builder for daily stock analysis emails (dark theme with gold accents)
- **Scheduler**: `server/scheduler.ts` — Daily scheduled job at 10:00 UTC (6pm GMT+8) to run AI analysis on users' favourite stocks and send email digests. Protected against duplicate execution with in-memory lock + DB date check + retry logic

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/chat.ts` (conversation/message models)
- **Tables**:
  - `users` — user table with id (UUID), email, password (bcrypt hashed), disabled flag, lastIp, lastLoginAt, requestCount
  - `conversations` — chat conversations with title and timestamp
  - `messages` — chat messages linked to conversations with role, content, timestamp
  - `analysis_logs` — tracks AI analysis requests per user (email, symbol, IP, timestamp)
  - `app_settings` — key-value settings store (rate limits, plan pricing, etc.)
  - `blocked_ips` — auto-blocked IPs from failed login attempts
  - `ip_rules` — admin-defined IP whitelist/blacklist ranges
  - `user_favourites` — user's favourite stocks (userId, symbol, displayName) with unique constraint on userId+symbol
  - `email_logs` — tracks sent/failed email digests (userEmail, subject, stocksIncluded, status, error)
- **Migration**: Drizzle Kit with `db:push` command for schema synchronization

### Favourite Stocks & Premium Feature
- Admin can add up to 10 favourite stocks via the Dashboard (star button next to stock symbol)
- Regular users see a "Coming Soon" premium teaser page at /premium
- Two subscription tiers planned: Essential (5 stocks, configurable price) and Professional (10 stocks, configurable price)
- Plan pricing stored in `app_settings` table as `plan_5_price` and `plan_10_price`
- Admin can configure pricing from the Admin panel
- Daily AI analysis emails sent at 6pm GMT+8 for users with favourites

### API Routes (key endpoints)
- `GET /api/favourites` — list user's favourite stocks (auth required)
- `POST /api/favourites` — add favourite stock (auth required, admin-only for now)
- `DELETE /api/favourites/:id` — remove favourite stock (auth required)
- `POST /api/admin/trigger-email` — manually trigger daily email analysis (admin only)
- `GET /api/admin/email-logs` — view email send history (admin only)
- `GET /api/admin/plan-pricing` — get plan pricing config (admin only)
- `PUT /api/admin/plan-pricing` — update plan pricing (admin only)

### Replit Integrations (server/replit_integrations/)
Pre-built integration modules provided by Replit:
- **chat/**: Conversation CRUD and streaming chat with OpenAI
- **audio/**: Voice recording, speech-to-text, text-to-speech with AudioWorklet for browser playback
- **image/**: Image generation using `gpt-image-1` model
- **batch/**: Rate-limited batch processing utility with retries for bulk AI operations
- **Gmail**: Connector for sending daily analysis emails (requires OAuth setup via Replit integrations)

### Build Process
- Client: Vite builds to `dist/public/`
- Server: esbuild bundles to `dist/index.cjs` with selective external dependencies
- Script: `script/build.ts` orchestrates both builds
- Commands: `npm run dev` (development), `npm run build` + `npm start` (production)

### Key Design Decisions

1. **Dual chart system**: TradingView widget provides professional charting out-of-the-box, while custom Recharts implementation gives control over styling and AI integration overlays.

2. **Multi-provider AI**: Users can switch between Replit credits (free), OpenAI, or Anthropic via a settings panel, with API keys stored client-side. The server creates new client instances per request when custom keys are provided.

3. **Yahoo Finance symbol resolution**: Custom logic maps exchange prefixes (KLSE:, MYX:, NASDAQ:, NYSE:) to Yahoo Finance ticker format, with search fallback for Malaysian stocks.

4. **Authentication system**: Session-based auth with 15-minute auto-expiry. Admin logs in with ADMIN_PASSWORD secret to manage allowed users via /admin config page. Users log in with email/password (bcryptjs hashed). The /api/analysis endpoint is protected behind auth. Stock data and charts are viewable by all, but AI analysis requires login.

5. **Password security**: User passwords are hashed with bcryptjs (10 salt rounds) before storage. Admin password is read from ADMIN_PASSWORD environment secret (required).

6. **Subdomain & domain**: In production, the app is served at `ai.dexterchia.com` (subdomain). Requests to `*.replit.app` are redirected to `ai.dexterchia.com`. The main `dexterchia.com` domain remains on the user's original hosting. No base path needed since the subdomain is dedicated to the terminal.

7. **Scanner**: Stock screener at /scanner supports 3 scan types (All-Time High, All-Time Low, Breakout) with mandatory market cap range filter and optional criteria filters including breakout conditions (5-candle, 10-day, 3-day highs), technical indicators (EMA5, EMA20, SMA200, EMA20/SMA200 crossover), and RSI (oversold <30, overbought >70). Scans US (~300 stocks) and MY/KLSE (~300 stocks) markets with batch processing and 5-minute cache. Market cap defaults: US min 1B USD, MY min 100M MYR, no max. ATH/ATL threshold: 10% from 52-week high/low.

8. **Favourite stocks**: Admin gets 10-stock limit. Regular users blocked (403) until subscription feature launches. Favourites stored in `user_favourites` table with unique userId+symbol constraint.

8. **Daily email scheduler**: Runs at 10:00 UTC (6pm GMT+8 Malaysia time). Processes all users with favourites, fetches stock data from Yahoo Finance, runs AI analysis, builds HTML email, sends via Gmail integration. Manual trigger available via admin panel. Protected against duplicate runs via in-memory lock flag (acquired before any async DB call), in-memory date cache, DB-persisted `scheduler_last_run_date` with 3-retry save logic.

9. **Admin watchlist management**: Admin can view and delete any user's favourite stocks from the Admin panel (Email tab → User Watchlists section). Endpoints: `GET /api/admin/user-favourites/:userId`, `DELETE /api/admin/user-favourites/:id`.

## External Dependencies

### APIs & Services
- **Yahoo Finance** (`yahoo-finance2`): Real-time and historical stock market data
- **OpenAI API**: Chat completions and image generation (via Replit AI proxy or direct)
- **Anthropic API** (`@anthropic-ai/sdk`): Alternative AI provider for stock analysis
- **TradingView**: Embedded chart widget loaded via CDN script
- **Google Fonts**: Cormorant Garamond and Montserrat font families
- **Gmail**: Email sending via Replit Gmail connector (OAuth integration, pending setup)

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema definition, query building, and migrations
- **connect-pg-simple**: Session storage (available but not actively used)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Default OpenAI/Replit AI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL (for Replit proxy)
- `ADMIN_PASSWORD`: Admin password for user management panel (required secret)
- `OPENAI_MODEL`: OpenAI/Replit AI model name (default: `gpt-5.2`)
- `ANTHROPIC_MODEL`: Anthropic model name (default: `claude-sonnet-4-20250514`)

### Key NPM Packages
- `express` + `http`: Server framework
- `drizzle-orm` + `drizzle-kit` + `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Client-side data fetching and caching
- `recharts`: Custom chart rendering
- `wouter`: Client-side routing
- `zod`: Runtime type validation
- `vaul`: Drawer component
- `cmdk`: Command palette component
- `embla-carousel-react`: Carousel component
- `date-fns`: Date formatting utilities
- `bcryptjs`: Password hashing
