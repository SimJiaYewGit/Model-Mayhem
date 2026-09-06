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

**Goal:** 2D tick-based AI arena battler with local LLM agents ✓ COMPLETED

### Core Features (Implemented)
1. ✅ Choose a small local model (via Ollama)
2. ✅ Configure prompt and parameters (temperature, top_p, max tokens, etc.)
3. ✅ Pick a harness/class (Default, Scout, Tank, Assassin, Support)
4. ✅ Fight in a procedural arena (1v1)
5. ✅ Watch replay and inspect decisions
6. ✅ Iterate and improve

### Tech Stack
- **Frontend:** React + Vite + Canvas/SVG for 2D arena
- **Backend:** Node.js + Express
- **Model Runtime:** Ollama (local)
- **Game Loop:** Tick-based (1 second per tick, configurable)

### Completed Components

#### Backend (`/backend/src/`)
- `index.js` - Express API server with CORS
- `services/ollama.js` - Ollama API integration (models, chat completion)
- `services/agentAction.js` - **NEW** LLM action generation with JSON parsing
- `agents/agent.js` - Agent class and manager
- `game/game.js` - Game state, tick processing, arena generation
- `routes/agents.js` - REST API for agent CRUD + model listing
- `routes/game.js` - **UPDATED** Auto-generate actions from LLM if not provided

#### Frontend (`/frontend/src/`)
- `App.jsx` - **UPDATED** Main app with auto-play, agent creator integration
- `components/AgentCreator.jsx` - **NEW** Full agent configuration UI with presets
- `components/ArenaViewer.jsx` - **NEW** Interactive arena visualization
- `index.css` - **UPDATED** Complete styling for all components

### Key Features

**Agent Creator:**
- Model selection from Ollama
- Harness type selection (5 types)
- System prompt editor with quick presets (Aggressive, Defensive, Strategic, Berserker)
- Advanced parameters (temperature, top_p, max tokens, decision rate)
- Real-time validation and error handling

**Arena Viewer:**
- Grid-based arena visualization
- Interactive entity selection
- Health and energy bars with color coding
- Battle log with event filtering
- Winner announcement

**Game Controls:**
- Manual tick-by-tick play
- Auto-play mode with configurable speed (0.5s - 3s per tick)
- Start/stop controls
- Real-time status updates

**LLM Integration:**
- Automatic action generation from agent's LLM
- JSON response parsing with fallback
- Markdown code block handling
- Error recovery with safe defaults
- Response logging for debugging

## Next Steps / Future Enhancements

### Phase 2: Enhanced Gameplay
- [ ] More harness types with unique abilities
- [ ] Power-ups and items in arena
- [ ] Team battles (2v2, 3v3)
- [ ] Different arena types and sizes
- [ ] Seasonal tournaments

### Phase 3: Advanced AI Features
- [ ] Memory persistence between matches
- [ ] Training/fine-tuning interface
- [ ] Replay analysis tools
- [ ] Strategy templates library
- [ ] Opponent profiling

### Phase 4: Multiplayer & Social
- [ ] Online leaderboards
- [ ] Share agent configurations
- [ ] Community challenges
- [ ] Spectator mode
- [ ] Tournament bracket system

### Phase 5: Polish & Performance
- [ ] Animated transitions
- [ ] Sound effects
- [ ] Mobile responsive design
- [ ] Performance optimization for large models
- [ ] Offline mode support
