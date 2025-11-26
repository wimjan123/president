# Election Campaign Social Media Simulator

A web-based prototype simulating social media interactions during an election campaign. Players post as a presidential candidate while 30 AI-powered citizen personas respond with authentic reactions that shift public opinion.

## Quick Start

### Development
```bash
npm install
npm run dev
```
Then open http://localhost:5173

### Production (Docker)
```bash
docker compose up -d --build
```
Then visit https://president.polibase.nl

## OpenRouter Setup

1. Get an API key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. Click the Settings gear icon in the app
3. Enter your API key
4. Select a model (Claude Sonnet 4 recommended)
5. Click "Test" to verify the connection

### Supported Models
- `anthropic/claude-sonnet-4-20250514` - Best quality/cost balance
- `anthropic/claude-opus-4-20250514` - Highest quality
- `openai/gpt-4o` - Alternative option
- `meta-llama/llama-3.1-70b-instruct` - Budget option

## Project Structure

```
src/
  components/       # React components
    Compose/        # Post composition UI
    Feed/           # Timeline and posts
    Game/           # Main game view
    Settings/       # Configuration panel
    Setup/          # Player setup flow
    Sidebar/        # Dashboard panels
    shared/         # Reusable components
  data/
    personas.ts     # 30 hardcoded citizen personas
  hooks/
    useOpenRouter.ts    # API queue management
    useGameLoop.ts      # Tick-based game loop
  stores/
    gameStore.ts        # Main game state (Zustand)
    settingsStore.ts    # Persisted settings
    uiStore.ts          # UI state
  types/
    index.ts        # TypeScript interfaces
  utils/
    prompts.ts      # LLM prompt templates
    mockResponses.ts    # Mock mode responses
```

## Persona System

### Data Structure
```typescript
interface Persona {
  id: string
  name: string
  handle: string              // e.g., "@mike_from_ohio"
  age: '18-29' | '30-44' | '45-64' | '65+'
  occupation: string
  location: string
  politicalLeaning: number    // -100 (far left) to +100 (far right)
  priorityIssues: Issue[]     // Top 3 issues
  personalityTraits: string[]
  engagementLikelihood: number // 0.0 to 1.0
  opinionOfPlayer: number     // -100 to +100
  opinionOfRival: number      // -100 to +100

  // Voice characteristics for LLM
  vocabularyLevel: 'simple' | 'moderate' | 'sophisticated'
  formality: 'casual' | 'balanced' | 'formal'
  usesSlang: boolean
  usesEmoji: boolean
  catchphrases: string[]
  examplePosts: string[]      // Few-shot examples
}
```

### Distribution
- 5 far left (-80 to -100)
- 8 center-left (-20 to -79)
- 7 centrist (-19 to +19)
- 6 center-right (+20 to +79)
- 4 far right (+80 to +100)

### Adding/Modifying Personas
Edit `src/data/personas.ts`. Each persona needs:
1. Unique `id` and `handle`
2. Appropriate political leaning for their voice
3. 3-5 example posts that demonstrate their writing style
4. Catchphrases that will appear in their responses

## LLM Prompts

Templates are in `src/utils/prompts.ts`:

### Persona Response Prompt
The prompt includes:
- Character background (name, age, occupation, location)
- Political leaning description
- Priority issues
- Personality traits and speech patterns
- Current opinion of the candidate
- The post content to react to

Expected JSON response:
```json
{
  "reaction": "comment",
  "comment": "Their actual comment text",
  "sentimentShift": 5
}
```

### Tuning Tips
- Increase `examplePosts` count for more consistent voice
- Adjust `engagementLikelihood` to control how often personas respond
- Modify catchphrases to make voices more distinctive
- Use `vocabularyLevel` and `formality` to differentiate education levels

## State Management

Uses Zustand with persistence:

### gameStore
- `player`: Player candidate data
- `rival`: AI opponent data
- `personas`: Map of all 30 personas with opinions
- `posts`: Timeline of posts with reactions
- `loop`: Game tick state and scheduled events

### settingsStore (persisted)
- `apiKey`: OpenRouter API key
- `selectedModel`: Current LLM model
- `mockMode`: Whether to use fake responses
- `tickSpeed`: Game speed (ms per tick)

### uiStore
- `isPaused`: Game pause state
- `activeModal`: Current open modal
- `toasts`: Notification queue

## Styling

### CSS Variables
Defined in `src/index.css`:
```css
--bg-base: #0f1318;       /* Main background */
--bg-surface: #161b22;    /* Card backgrounds */
--text-primary: #e6edf3;  /* Main text */
--player-primary: #3b82f6; /* Player blue */
--rival-primary: #ef4444;  /* Rival red */
--gold: #f59e0b;          /* Alerts/warnings */
```

### Fonts
- **Bricolage Grotesque**: Headlines, buttons (700-800)
- **Source Serif 4**: Body text, comments (400-600)
- **JetBrains Mono**: Numbers, timestamps

### Custom Classes
```css
.card          /* Standard card with border */
.btn-primary   /* Blue action button */
.btn-secondary /* Subtle secondary button */
.chip          /* Tag/selection chip */
.input         /* Form input field */
```

## Docker Deployment

The app uses:
- Multi-stage Dockerfile (Node build -> nginx serve)
- Traefik reverse proxy with auto-SSL
- Network: `traefik_traefik-network`

### Traefik Labels
```yaml
- "traefik.http.routers.president-game.rule=Host(`president.polibase.nl`)"
- "traefik.http.routers.president-game.tls.certresolver=letsencrypt"
```

## Controls

- **Space**: Pause/Resume game
- **Settings gear**: Open configuration
- Game runs at 1 tick/second when unpaused
- News events: every 60-90 seconds
- Rival posts: every 90-120 seconds
