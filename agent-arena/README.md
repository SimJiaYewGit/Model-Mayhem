# Agent Arena 🤖

**AI Model Battler** - A competitive game where players configure and battle local LLM agents.

## Concept

Build your AI agent, tune its mind, and drop it into chaotic arenas against other players' local AI models. Every match tests your model choice, prompts, training, and strategy under strict compute limits.

> **An esport for tiny AI agents. Players don't control the action — they engineer the intelligence.**

## Features (MVP)

- **Model Selection**: Choose from various small local LLMs (Llama, Gemma, Phi, Mistral, Qwen)
- **Harness System**: Pick your agent's body/class with different stats
  - Scout: Fast and agile
  - Tank: Heavy armor, durable
  - Assault: Balanced combat specialist
  - Sniper: Long-range precision
- **Configuration**: Set system prompts, temperature, max tokens
- **Arena Battles**: Watch your agent compete in tick-based combat
- **Battle Log**: Track every action and decision

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Custom CSS with modern gradients
- **Future**: Ollama integration for local LLM inference

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Ollama installed for local model inference

### Installation

```bash
cd agent-arena
npm install
npm run dev
```

The app will open at `http://localhost:3000`

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
agent-arena/
├── src/
│   ├── components/
│   │   ├── Arena.jsx          # Battle arena visualization
│   │   ├── Arena.css
│   │   ├── ModelConfig.jsx    # Agent configuration screen
│   │   └── ModelConfig.css
│   ├── App.jsx                # Main app component
│   ├── App.css
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Roadmap

### Phase 1: Core MVP ✅
- [x] Basic UI structure
- [x] Model selection interface
- [x] Harness configuration
- [x] Prompt/parameter tuning
- [x] Tick-based arena battle
- [x] Battle visualization
- [x] Win/loss conditions
- [x] Ollama integration service
- [x] Battle engine with action system
- [x] LLM decision parsing
- [x] Simulation fallback mode

### Phase 2: Enhanced LLM Integration
- [ ] Streaming LLM responses for faster feedback
- [ ] Better action prompt templates
- [ ] Multi-turn conversation memory
- [ ] Configurable model endpoints (not just Ollama)
- [ ] Model performance metrics (latency, tokens/sec)

### Phase 3: Enhanced Gameplay
- [ ] Multiple arena types (hazards, obstacles)
- [ ] Power-ups and items
- [ ] Team battles (2v2, 3v3)
- [ ] Tournament mode with brackets
- [ ] Replay system with playback
- [ ] Action history visualization

### Phase 4: Social & Competitive
- [ ] Player profiles and stats tracking
- [ ] Leaderboards by model/harness combo
- [ ] Model config sharing/export
- [ ] Custom challenges and scenarios
- [ ] Spectator mode
- [ ] League system with rankings

## Game Mechanics

### Battle Flow
1. Each tick (1 second), agents receive battlefield state
2. LLM processes state and returns action JSON
3. Game validates and executes actions
4. Repeat until victory condition met

### Victory Conditions
- Eliminate opponent (HP reaches 0)
- Survive until time limit with more HP
- Complete objective-based challenges (future)

### Stats System
Each harness has unique stats:
- **Speed**: Movement and action frequency
- **Defense**: Damage reduction
- **Energy**: Resource for special actions
- **Max HP**: Total health pool

## License

MIT

---

**Built for the future of AI-powered gaming** 🎮
