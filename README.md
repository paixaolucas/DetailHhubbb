# Comunidade Hub

Production-grade multi-tenant ecosystem platform for digital communities centered around influencers.

## Architecture Overview

```
comunidade-hub/
├── prisma/
│   ├── schema.prisma          # Full 15-model database schema
│   └── seed.ts                # Realistic test data
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/          # login, register, refresh, logout
│   │   │   ├── communities/   # CRUD + member management
│   │   │   ├── stripe/        # checkout, billing portal
│   │   │   ├── webhooks/      # Stripe webhook handler
│   │   │   ├── ai/            # AI chat endpoint
│   │   │   └── analytics/     # Platform & community analytics
│   │   ├── community/[slug]/  # Public community pages
│   │   ├── dashboard/         # Protected dashboard
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── ai/            # AI assistant chat
│   │   │   ├── communities/   # Community management
│   │   │   ├── marketplace/   # Marketplace
│   │   │   └── tools/         # SaaS tools directory
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jwt.ts         # JWT create/verify (jose)
│   │   │   ├── password.ts    # bcrypt hashing
│   │   │   └── rbac.ts        # Role-based access control
│   │   ├── stripe/
│   │   │   └── stripe.ts      # Stripe singleton
│   │   ├── db.ts              # Prisma singleton
│   │   └── validations/       # Zod schemas
│   ├── middleware/
│   │   └── auth.middleware.ts # withAuth, withRole, withPermission
│   ├── middleware.ts           # Next.js edge middleware
│   ├── services/
│   │   ├── auth/              # Auth business logic
│   │   ├── community/         # Community + membership management
│   │   ├── content/           # Modules, lessons, progress
│   │   ├── payment/           # Stripe + webhook handling
│   │   ├── commission/        # Commission calculation & payout
│   │   ├── analytics/         # MRR, churn, time series
│   │   ├── ai/                # OpenAI chat integration
│   │   └── marketplace/       # Marketplace listings
│   ├── types/
│   │   └── index.ts           # All shared TypeScript types
│   └── utils/
│       └── api.ts             # API helpers + fetch utility
└── .env.example
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (test mode)
- OpenAI API key (for AI assistant)

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd comunidade-hub
npm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/comunidade_hub"
JWT_SECRET="your-minimum-32-char-secret-here"
JWT_REFRESH_SECRET="your-minimum-32-char-refresh-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
OPENAI_API_KEY="sk-..."
```

### 3. Database setup

```bash
# Create and migrate database
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed with test data
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Stripe webhook (local testing)

Install Stripe CLI and forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

## Test Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | admin@comunidadehub.com | Admin@123456! |
| Influencer 1 | joao@comunidade.com | Influencer@123! |
| Influencer 2 | ana@comunidade.com | Influencer@123! |
| Member 1 | membro1@email.com | Membro@123! |
| Member 2 | membro2@email.com | Membro@123! |

## Key Features

### Authentication
- JWT access tokens (15 min) + rotating refresh tokens (7 days)
- HTTP-only cookie + Authorization header dual support
- Token rotation on refresh (prevents replay attacks)
- IP-logged sessions for security audit

### Multi-tenancy
- Each community is fully isolated (members, content, payments)
- Custom branding per community (colors, logo, domain-ready)
- Influencer admins can ONLY manage their own communities (RBAC enforced at service layer)

### Stripe Integration
- Subscription checkout via Stripe Checkout
- Webhook-driven membership lifecycle (create → update → cancel)
- Billing portal for self-service cancellation
- Connect-ready for influencer payouts

### Commission Engine
- Supports: PERCENTAGE, FLAT_FEE, TIERED models
- Transaction-safe: uses `db.$transaction()`
- Auto-confirmation after N days
- Stripe Transfer for influencer payout

### AI Assistant
- GPT-4 Turbo via OpenAI
- Community-context-aware system prompt
- Full usage logging (tokens, cost, latency)
- Session-based conversation history

### Analytics
- MRR, active members, churn rate, revenue growth
- 30-day revenue time series
- Per-influencer revenue breakdown
- Community-level analytics

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout (revoke token) |

### Communities
| Method | Path | Auth |
|--------|------|------|
| GET | /api/communities | Public |
| POST | /api/communities | INFLUENCER_ADMIN+ |
| GET | /api/communities/mine | INFLUENCER_ADMIN |

### Stripe
| Method | Path | Auth |
|--------|------|------|
| POST | /api/stripe/checkout | Any authenticated |
| POST | /api/webhooks/stripe | Stripe signature |

### Analytics
| Method | Path | Auth |
|--------|------|------|
| GET | /api/analytics/platform | SUPER_ADMIN |
| GET | /api/analytics/community/[id] | Community owner |

### AI
| Method | Path | Auth |
|--------|------|------|
| POST | /api/ai/chat | Any authenticated |

## Production Checklist

- [ ] Change all JWT secrets to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL connection pooling (PgBouncer)
- [ ] Set up Stripe webhook endpoint in dashboard
- [ ] Configure S3 bucket for file uploads
- [ ] Set up Resend/SendGrid for transactional email
- [ ] Configure custom domain per community (DNS proxy)
- [ ] Enable Prisma Accelerate for edge performance
- [ ] Add Redis for rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for static assets

## Scaling Notes

- **Database**: Indexes on all frequently queried fields. Separate read replica recommended at 10k+ members.
- **Analytics**: Consider moving to ClickHouse or TimescaleDB at high event volume.
- **AI**: Add request queuing with BullMQ to handle concurrency spikes.
- **Storage**: S3 multipart upload pre-signed URLs for files >5MB.
- **Auth**: Redis-backed token blacklist for instant revocation at scale.
