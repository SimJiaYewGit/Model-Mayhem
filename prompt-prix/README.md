# Prompt Prix - AI Model Battler

A competitive arena game where players train and tune small local AI models, then pit them against each other in procedurally generated battles.

## Project Structure

```
prompt-prix/
├── frontend/          # React + Vite + Canvas/SVG for 2D arena
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # App pages
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Helper functions
│   │   └── assets/      # Images, styles, etc.
│   └── public/
│
├── backend/           # Node.js + Express API server
│   ├── src/
│   │   ├── agents/    # LLM agent management
│   │   ├── game/      # Game logic & simulation
│   │   ├── models/    # Data models
│   │   ├── routes/    # API endpoints
│   │   └── services/  # External services (Ollama, etc.)
│   └── data/          # Game data, configs
│
├── docs/              # Documentation
└── tests/             # Unit & integration tests
```

## Phase 1 MVP Scope

**Goal:** 2D tick-based AI arena battler with local LLM agents

### Core Features
1. Choose a small local model (via Ollama)
2. Configure prompt and parameters
3. Pick a harness/class
4. Fight in a procedural arena (1v1)
5. Watch replay and inspect decisions
6. Iterate and improve

### Tech Stack
- **Frontend:** React + Vite + Canvas/SVG for 2D arena
- **Backend:** Node.js + Express
- **Model Runtime:** Ollama (local)
- **Game Loop:** Tick-based (1 second per tick)

## Next Steps

Phase 1: Setup basic project structure and dependencies ✓
Phase 2: Build backend API for model connection
Phase 3: Create simple 2D arena visualization
Phase 4: Implement game loop and agent actions
Phase 5: Add configuration UI and replay system
