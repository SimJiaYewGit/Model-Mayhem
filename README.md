# Agent Arena - AI Model Battler MVP

A competitive arena game where players train and tune small local AI models, then pit them against each other in procedurally generated battles.

## 🎮 Core Concept

**Build your bot. Tune its mind. Watch it battle.**

Players don't control the action directly — they engineer the intelligence. Configure your model's prompts, parameters, and strategy, then watch it compete autonomously in tick-based arena battles.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- (Optional) Ollama installed for real LLM integration: https://ollama.ai

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm run server

# In another terminal, serve the client
npm run client
```

Or manually:
```bash
# Terminal 1 - Server
node server/index.js

# Terminal 2 - Client (using any static file server)
npx serve client/public
```

### Using with Real Local Models

To connect actual LLMs via Ollama:

1. Install Ollama from https://ollama.ai
2. Pull a small model: `ollama pull llama3.2:1b`
3. Update `server/index.js` to call the real Ollama API instead of mock responses

The MVP includes mock responses for testing without requiring local models.

## 🎯 MVP Features

### Core Gameplay Loop
1. **Choose Your Model** - Select from small local LLMs (llama3.2:1b, gemma:2b, etc.)
2. **Configure the Brain** - Set system prompts, temperature, token limits
3. **Join the Arena** - Two players join a 1v1 battle
4. **Tick-Based Combat** - Models make decisions each tick based on game state
5. **Watch & Learn** - Observe battles, analyze decisions, iterate on strategy

### Game Mechanics
- **10x10 Grid Arena** with obstacles and powerups
- **Turn-Based Real-Time** - Each tick, both models decide simultaneously
- **Actions**: Attack, Shield, Move, Wait
- **Health System** - First to 0 HP loses
- **Procedural Elements** - Randomized damage, positioning

### Configuration Options
- **Model Selection** - Different models have different strengths
- **System Prompts** - Define your AI's personality and strategy
- **Temperature** - Control randomness vs consistency
- **Token Limits** - Constrain decision-making budget

## 🏗️ Architecture

### Hybrid Approach
- **Server**: Node.js/Express backend handles game logic and model queries
- **Client**: Pure HTML/CSS/JS frontend for accessibility
- **Model Integration**: Designed for Ollama API (mock implemented for MVP)

### API Endpoints

```
POST /api/game/create          - Create new game session
POST /api/game/:id/join        - Join with model config
POST /api/game/:id/start       - Start the battle
POST /api/game/:id/tick        - Execute one game tick
GET  /api/game/:id             - Get current game state
```

### Decision Format

Models receive structured observations:
```json
{
  "tick": 5,
  "self": { "hp": 80, "position": {"x": 4, "y": 5}, "energy": 30 },
  "enemy": { "hp": 65, "position": {"x": 7, "y": 5}, "distance": 3 },
  "arena": { ... }
}
```

And return actions:
```json
{
  "action": "attack",
  "target": "enemy_1",
  "reason": "Enemy is in range and has lower HP"
}
```

## 🎨 Future Enhancements

### Near-Term Roadmap
- [ ] Real Ollama integration (currently mocked)
- [ ] More harness types (tank, scout, assassin builds)
- [ ] Additional game modes (battle royale, team fights)
- [ ] Model statistics tracking (win rates, common strategies)
- [ ] Replay system with decision visualization
- [ ] Tournament mode with brackets

### Advanced Features
- Fine-tuning support for custom models
- Memory systems (short-term match memory, long-term learning)
- League system with compute constraints
- Custom arena editor
- Spectator mode with live commentary
- API for automated bot testing

## 🏆 Competitive Philosophy

**Bigger models shouldn't automatically win.**

The game balances around constraints:
- Small models = faster reactions, more actions per second
- Large models = better reasoning, higher compute cost
- Temperature settings = consistency vs creativity trade-offs
- Token budgets = strategic depth vs speed

This creates interesting metas where well-tuned tiny models can outperform poorly configured large ones.

## 📊 Tech Stack

- **Backend**: Node.js, Express, CORS
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Visualization**: CSS Grid for arena rendering
- **Model Runtime**: Designed for Ollama (mock included)
- **Game State**: In-memory storage (MVP)

## 🤝 Contributing

This is an MVP to validate the core concept. Contributions welcome for:
- Better model integration patterns
- Game balance improvements
- UI/UX enhancements
- New game modes
- Anti-cheat mechanisms for ranked play

## 📝 License

MIT - Build your own AI battler!

---

**Next Phase**: Test the MVP, gather feedback, then add real Ollama integration and expand game mechanics.
