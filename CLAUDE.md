# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint check
npm run preview  # Preview production build locally

# Docker deployment (uses Traefik reverse proxy on traefik_traefik-network)
docker compose up -d --build
```

## Architecture Overview

Election campaign simulator where players post as a presidential candidate. 30 AI personas respond via OpenRouter LLM API. Uses React 18, Zustand for state, Tailwind CSS, Framer Motion.

### Core Data Flow

```
Player posts -> selectRespondingPersonas() -> buildBatchedPersonaResponsePrompt()
    -> queueRequest() -> OpenRouter API (1 call for all personas)
    -> parseBatchedPersonaResponse() -> wave-based display timing
```

### Key Architectural Decisions

**Batched Persona Responses**: All 5-10 persona responses are generated in a single API call (not individual calls). The prompt includes all personas, and the LLM returns a JSON array. This reduces API costs significantly.

**Response Parsing Strategy** (`src/utils/responseParser.ts`):
- Handles both direct JSON array `[...]` and wrapped `{"responses": [...]}` formats
- Falls back to position-based matching if personaId doesn't match expected
- Tries multiple field name variations (`personaId`, `persona_id`, `id`)

**Wave-Based Display Timing**: Responses are generated together but displayed staggered (0-5s, 5-20s, 20-45s waves) based on each persona's `responseWave` property.

**Queue Management** (`src/hooks/useOpenRouter.ts`):
- Max 3 concurrent API calls
- Uses refs (`executeCallRef`) to avoid stale closures with API key updates
- Auto-retry once on failure

### State Stores (Zustand)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `gameStore` | No | Player, rival, personas, posts, game loop tick |
| `settingsStore` | Yes | API key, model selection, mock mode |
| `uiStore` | No | Pause state, modals, toasts |

### LLM Request Types

- `persona_response` - Batched persona reactions to posts
- `news_generation` - Random news events affecting campaign
- `rival_post` - AI opponent's posts

### Mock Mode

When `mockMode` is enabled in settings, `getMockResponse()` returns simulated responses. For batched requests, it detects `PERSONAS:` in the prompt and extracts persona IDs using regex pattern `[PERSONA \d+: id]`.

## Persona System

30 personas in `src/data/personas.ts` with political distribution:
- 5 far left, 8 center-left, 7 centrist, 6 center-right, 4 far right

Each persona has voice characteristics (`vocabularyLevel`, `formality`, `usesSlang`, `usesEmoji`, `examplePosts`) used by the LLM prompt to generate distinct responses.

## Styling

CSS custom properties in `src/index.css`. Key colors:
- `--player-primary: #3b82f6` (blue)
- `--rival-primary: #ef4444` (red)
- `--bg-base: #0f1318`, `--bg-surface: #161b22`

Fonts: Bricolage Grotesque (headlines), Source Serif 4 (body), JetBrains Mono (numbers)

## Docker/Traefik

Uses external `traefik_traefik-network`. Routes to `president.polibase.nl` with Let's Encrypt SSL.
