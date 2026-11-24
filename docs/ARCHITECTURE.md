# VORTA AI — Architecture, Database Migrations & Feature Status Matrix

## 1. Folder Structure
- `server.ts` — Express + Vite middleware server & server-side `@google/genai` Model Gateway (`/api/gateway/chat`, `/api/gateway/playground`, `/api/openapi.json`, `/api/health`).
- `prisma/schema.prisma` — Complete 28-model PostgreSQL schema with indexes, constraints, and cascading/audit relations.
- `src/types/vorta.ts` — Shared TypeScript domain contracts.
- `src/lib/vortaLogic.ts` & `src/lib/vortaLogic.test.ts` — Pure business logic (atomic credit ledger, billing cycles, intent routing, API key masking, cost estimation) verified with `node:test`.
- `src/data/seedData.ts` — Dynamic Model Registry, pricing tiers, sample agents, automations, blog, and SEO solutions.
- `src/components/` — Modular UI components split between Public Marketing (`LandingPage.tsx`, `AuthModal.tsx`, `PublicPages.tsx`, `VortaLogo.tsx`, `NeuralOrb.tsx`) and Authenticated Workspace (`WorkspaceShell.tsx`, `ChatView.tsx`, `StudioView.tsx`, `AgentsView.tsx`, `AutomationsView.tsx`, `CodeView.tsx`, `ApiPortalView.tsx`, `WalletBillingView.tsx`, `AdminView.tsx`, `BusinessFilesViews.tsx`).

## 2. Feature Matrix (Functional vs Demo vs Coming Soon)
| Capability | Status | Notes |
| --- | --- | --- |
| Persian RTL/LTR + Dark/Light Design System | **Functional** | Vazirmatn + Tailwind v4 `@custom-variant dark` |
| Landing Page, Hero Prompt Preservation & Auth Redirect | **Functional** | Preserves pre-login prompt & routes into Workspace |
| Vorta Chat + `gemini-4-hydrogen` SSE Streaming | **Functional** | Real server-side `@google/genai` via `/api/gateway/chat` |
| Model Registry & Live Admin Price/Status Edits | **Functional** | Changes propagate immediately to Chat & Landing |
| Atomic Credit Ledger & Cost Metering | **Functional** | Idempotent debit/refund + gift vs. purchased buckets |
| Vorta API Playground (`gemini-4-hydrogen`) & OpenAPI | **Functional** | Real `/api/gateway/playground` + `/api/openapi.json` |
| Vorta API Keys (One-time reveal + revoke) | **Functional** | Client/session key management with masked prefix |
| Vorta Studio (Image / Video / Audio UI & Asset Library) | **Demo** | Transparently labeled Demo; local assets + job queue simulation |
| Vorta Agents Browser Sandbox & Automations Scheduler | **Demo** | Full step tracking & Human-in-the-Loop approval; sandbox browser simulated |
| Vorta Code 3-Pane IDE & Diff Viewer | **Demo** | Clearly marked Demo until isolated container runner is attached |
| Zarinpal / Toman Payment Checkout | **Demo (Sandbox)** | Clearly labeled Sandbox test checkout |
| External Providers (OpenAI, Claude, DeepSeek) | **Demo** | Ready in Gateway; requires server API keys in `.env` |
| Alibaba Qwen & Visual Workflow Node Builder | **Coming Soon** | Visible in Roadmap & Registry |

## 3. Running Locally & Production PostgreSQL Setup
1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
2. Install dependencies: `npm install`
3. Run tests: `npx --yes tsx --test src/lib/vortaLogic.test.ts`
4. Start full-stack dev server: `npm run dev` (listens on port `3000`).
5. For Phase 2 PostgreSQL migration: configure `DATABASE_URL` and run `npx prisma migrate dev --name init`.
