# M+ Global Pro Terminal

## Overview

This is a premium stock market analysis terminal built for "Dexter Chia," a remisier (stock broker) offering portfolio management services. The application provides real-time stock charting, AI-powered technical analysis, and company insights. It integrates with Yahoo Finance for market data and supports multiple AI providers (Replit AI, OpenAI, Anthropic) for generating stock analysis.

The app is a full-stack TypeScript project with a React frontend and Express backend, deployed on Replit. It features a luxury dark theme with gold accents (deep navy + gold color scheme) targeting the Malaysian stock market (KLSE/MYX) as well as US markets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router) — routes: Dashboard (/), Scanner (/scanner), Admin (/admin)
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Charting**: Dual charting approach — Recharts for custom candlestick charts and TradingView embedded widget for full-featured interactive charts
- **Styling**: Tailwind CSS with custom CSS variables for a dark luxury theme. Fonts: Cormorant Garamond (serif) and Montserrat (sans-serif) from Google Fonts
- **Build Tool**: Vite with path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)

### Backend (server/)
- **Framework**: Express.js on Node with TypeScript (tsx for dev, esbuild for production)
- **API Design**: REST API endpoints under `/api/` prefix. Key routes handle stock data fetching, AI analysis, conversations, and image generation
- **Stock Data**: Yahoo Finance via `yahoo-finance2` library with symbol resolution for KLSE/MYX and US exchanges
- **AI Integration**: Supports three providers:
  - Replit AI (default, uses built-in credits via `AI_INTEGRATIONS_OPENAI_API_KEY`)
  - OpenAI (user-provided API key, GPT-4o)
  - Anthropic (user-provided API key, Claude Sonnet via `@anthropic-ai/sdk`)
- **Dev/Prod Split**: In development, Vite dev server runs as middleware with HMR. In production, pre-built static files are served from `dist/public/`

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/chat.ts` (conversation/message models)
- **Tables**:
  - `users` — basic user table with id (UUID), username, password
  - `conversations` — chat conversations with title and timestamp
  - `messages` — chat messages linked to conversations with role, content, timestamp
- **Migration**: Drizzle Kit with `db:push` command for schema synchronization
- **In-Memory Fallback**: `server/storage.ts` has a `MemStorage` class for user operations (currently used instead of DB for users)

### Replit Integrations (server/replit_integrations/)
Pre-built integration modules provided by Replit:
- **chat/**: Conversation CRUD and streaming chat with OpenAI
- **audio/**: Voice recording, speech-to-text, text-to-speech with AudioWorklet for browser playback
- **image/**: Image generation using `gpt-image-1` model
- **batch/**: Rate-limited batch processing utility with retries for bulk AI operations

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

6. **Base path & domain**: In production, the app is served under `/ai-terminal` base path (dexterchia.com/ai-terminal). Requests to `*.replit.app` are redirected to `dexterchia.com`. Legacy paths (`/scanner`, `/admin`) redirect to `/ai-terminal/scanner`, `/ai-terminal/admin`. Wouter Router uses `base="/ai-terminal"` in production, empty in dev.

## External Dependencies

### APIs & Services
- **Yahoo Finance** (`yahoo-finance2`): Real-time and historical stock market data
- **OpenAI API**: Chat completions and image generation (via Replit AI proxy or direct)
- **Anthropic API** (`@anthropic-ai/sdk`): Alternative AI provider for stock analysis
- **TradingView**: Embedded chart widget loaded via CDN script
- **Google Fonts**: Cormorant Garamond and Montserrat font families

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema definition, query building, and migrations
- **connect-pg-simple**: Session storage (available but not actively used)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Default OpenAI/Replit AI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL (for Replit proxy)
- `ADMIN_PASSWORD`: Admin password for user management panel (required secret)

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