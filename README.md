# Caption Craft AI (Content-Caption Generator)

AI-powered social media caption and hashtag generator. Turn a simple idea into ready-to-post, platform-optimized captions in seconds — with tone control, emoji toggling, and daily usage tiers.

## Problem It Solves

Creating engaging social media captions is time-consuming. Content creators, small business owners, social media managers, influencers, marketers, and freelancers often:

- Spend too much time deciding what to write.
- Struggle to make captions engaging and platform-appropriate.
- Have difficulty coming up with relevant hashtags.
- Need different versions of the same content for different platforms.

Caption Craft AI solves this by generating multiple ready-to-use caption variations — tailored to the selected platform's tone, length, and hashtag conventions — from a single idea.

## Core Features

- **Caption Generator** — turns an idea, topic, or product description into engaging captions.
- **Hashtag Generator** — generates relevant, platform-appropriate hashtags alongside each caption.
- **Platform Selector** — supports Instagram, TikTok, X, Facebook, and LinkedIn, each with its own tone and character-limit rules.
- **Emoji Toggle** — turn emojis on or off in generated captions.
- **Caption Variations** — generates 3–5 distinct options per request.
- **Copy Button** — instantly copy any caption or hashtag set.
- **Regenerate** — get a fresh batch of variations without re-entering the idea.
- **User Accounts** — email/password login; logged-in users get their caption history saved automatically.
- **Tiered Daily Limits** — Free (10/day), Pro (50/day), Premium (unlimited); enforced server-side before any AI call is made.
- **Admin Page** — hidden, password-protected route for reviewing users, approving plan upgrades, and posting announcements.

## Platform Rules

| Platform  | Hard character limit | Ideal engagement range | Hashtag count |
|-----------|----------------------|--------------------------|----------------|
| Instagram | 2,200 | 125–150 chars | 5–10 |
| TikTok    | 2,200 | 30–100 chars | 3–5 |
| X         | 280 | 70–280 chars | 1–2 |
| Facebook  | No hard limit (kept under ~300 chars) | 40–80 chars | 1–3 |
| LinkedIn  | 3,000 | 150–300 chars | 3–5 |

Every generated caption is validated server-side against its platform's hard limit before being returned to the user.

## Tech Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Express (Node.js/TypeScript), served alongside Vite in development
- **AI:** Google Gemini API (called server-side only — the API key is never exposed to the client)
- **Auth:** Token-based session auth via backend routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- **Built with:** Google AI Studio (Build mode)

## Plan Tiers

| Plan | Daily Generations | Notes |
|------|--------------------|-------|
| Free | 10 | Default for new sign-ups |
| Pro | 50 | Requires an account; upgrade pending admin approval |
| Premium | Unlimited | Requires an account; upgrade pending admin approval |

Upgrades are handled via manual bank transfer, confirmed by an admin through the internal admin page — there is no automated payment gateway in the current version.

## Brand Colors

| Name | Hex |
|------|-----|
| Electric Purple | `#7C3AED` |
| Royal Blue | `#2563EB` |
| Deep Navy | `#172554` |
| Bright Yellow | `#FACC15` |
| White | `#FFFFFF` |
| Soft Lavender | `#EDE9FE` |

## Project Structure

```
├── server/           # Backend logic (db, Gemini integration)
├── server.ts          # Express app entry point & API routes
├── src/
│   ├── components/    # UI components
│   ├── constants/      # Platform rules, plan limits, etc.
│   ├── context/        # React context providers
│   ├── App.tsx         # Main app component
│   └── types.ts        # Shared TypeScript types
├── index.html
├── package.json
└── .env.example        # Copy to .env and add GEMINI_API_KEY
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in, returns session token |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/user/usage` | Get today's usage count and plan limit |
| POST | `/api/user/plan` | Update a user's plan tier (admin-approved) |
| POST | `/api/generate` | Generate captions + hashtags (auth required, quota-checked) |
| GET | `/api/history` | Get the current user's saved caption history |
| POST | `/api/history/favorite/:id` | Toggle favorite status on a saved caption |

## Environment Variables

```
GEMINI_API_KEY=your_key_here
```

Never commit `.env` — only `.env.example` (with placeholder values) should be in version control.

## Getting Started

```bash
# Install dependencies
bun install   # or npm install

# Copy env file and add your Gemini API key
cp .env.example .env

# Run the dev server
bun run dev   # or npm run dev
```

The app runs at `http://localhost:3000`.

## Status

MVP in active development, built via Google AI Studio's Build mode.
