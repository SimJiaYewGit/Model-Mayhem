const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Mock Ollama API for MVP testing (replace with real Ollama calls later)
async function queryLocalModel(model, prompt, maxTokens = 150) {
  // In production, this calls actual Ollama API at http://localhost:11434
  // For MVP demo, we return mock responses
  
  console.log(`[Model Query] Model: ${model}, Prompt: ${prompt.substring(0, 100)}...`);
  
  // Mock response based on game state
  const mockResponses = {
    'attack': { action: 'attack', target: 'enemy_1', reason: 'Enemy is in range and has lower HP.' },
    'defend': { action: 'shield', target: 'self', reason: 'Low health, need to defend.' },
    'move': { action: 'move', direction: 'forward', reason: 'Positioning for better attack angle.' }
  };
  
  // Simple keyword matching for demo
  if (prompt.includes('attack') || prompt.includes('range')) {
    return mockResponses['attack'];
  } else if (prompt.includes('health') || prompt.includes('defend')) {
    return mockResponses['defend'];
  }
  return mockResponses['move'];
}

// Game state storage (in-memory for MVP)
const games = new Map();

// Create a new game session
app.post('/api/game/create', (req, res) => {
  const gameId = `game_${Date.now()}`;
  const game = {
    id: gameId,
    status: 'waiting',
    players: [],
    tick: 0,
    arena: generateArena(),
    logs: []
  };
  games.set(gameId, game);
  res.json({ gameId, message: 'Game created' });
});

// Join a game with a model configuration
app.post('/api/game/:gameId/join', (req, res) => {
  const { gameId } = req.params;
  const { playerName, modelConfig } = req.body;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.players.length >= 2) {
    return res.status(400).json({ error: 'Game is full' });
  }
  
  const player = {
    id: `player_${game.players.length + 1}`,
    name: playerName,
    modelConfig,
    bot: {
      hp: 100,
      maxHp: 100,
      position: { x: modelConfig.id === 'player1' ? 2 : 8, y: 5 },
      energy: 50,
      action: null
    }
  };
  
  game.players.push(player);
  game.logs.push(`${playerName} joined with model ${modelConfig.modelName}`);
  
  if (game.players.length === 2) {
    game.status = 'ready';
    game.logs.push('Game ready to start!');
  }
  
  res.json({ player, game });
});

// Start the game
app.post('/api/game/:gameId/start', (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.players.length < 2) {
    return res.status(400).json({ error: 'Need 2 players to start' });
  }
  
  game.status = 'running';
  game.tick = 0;
  game.logs.push('Game started!');
  
  res.json({ game });
});

// Execute one game tick
app.post('/api/game/:gameId/tick', async (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game || game.status !== 'running') {
    return res.status(400).json({ error: 'Game not running' });
  }
  
  game.tick++;
  const tickNumber = game.tick;
  
  // Get current game state for each player
  const gameState = {
    tick: tickNumber,
    arena: game.arena,
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      bot: { ...p.bot }
    }))
  };
  
  // Query each player's model for their next action
  for (const player of game.players) {
    const observation = buildObservation(player, gameState);
    const prompt = buildPrompt(player, observation);
    
    try {
      const action = await queryLocalModel(
        player.modelConfig.modelName,
        prompt,
        player.modelConfig.maxTokens
      );
      
      player.bot.action = action;
      game.logs.push(`[${player.name}] decided to ${action.action}`);
    } catch (error) {
      game.logs.push(`[${player.name}] failed to decide: ${error.message}`);
      player.bot.action = { action: 'wait', reason: 'Error in decision' };
    }
  }
  
  // Resolve actions (simplified for MVP)
  resolveActions(game);
  
  // Check win condition
  checkWinCondition(game);
  
  res.json({ 
    tick: tickNumber,
    gameState: {
      arena: game.arena,
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        bot: { ...p.bot }
      }))
    },
    logs: game.logs.slice(-10)
  });
});

// Get game state
app.get('/api/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json({ game });
});

// Helper functions
function generateArena() {
  return {
    width: 10,
    height: 10,
    obstacles: [
      { x: 4, y: 3, type: 'wall' },
      { x: 6, y: 7, type: 'wall' },
      { x: 5, y: 5, type: 'hazard' }
    ],
    powerups: [
      { x: 2, y: 8, type: 'health' },
      { x: 8, y: 2, type: 'energy' }
    ]
  };
}

function buildObservation(player, gameState) {
  const enemy = gameState.players.find(p => p.id !== player.id);
  return {
    tick: gameState.tick,
    self: {
      hp: player.bot.hp,
      position: player.bot.position,
      energy: player.bot.energy
    },
    enemy: enemy ? {
      hp: enemy.bot.hp,
      position: enemy.bot.position,
      distance: Math.abs(player.bot.position.x - enemy.bot.position.x) + 
                Math.abs(player.bot.position.y - enemy.bot.position.y)
    } : null,
    arena: gameState.arena
  };
}

function buildPrompt(player, observation) {
  const { self, enemy, tick } = observation;
  
  return `You are a battle AI in an arena. Current tick: ${tick}.
Your status: HP=${self.hp}, Position=(${self.position.x},${self.position.y}), Energy=${self.energy}
Enemy status: HP=${enemy.hp}, Position=(${enemy.position.x},${enemy.position.y}), Distance=${enemy.distance}

Available actions: attack, move, shield, wait
Choose the best action based on your current state.

Respond in JSON format:
{
  "action": "<action>",
  "target": "<target or self>",
  "reason": "<brief explanation>"
}

System prompt from player: ${player.modelConfig.systemPrompt || 'Be aggressive but strategic.'}
`;
}

function resolveActions(game) {
  const [p1, p2] = game.players;
  
  if (!p1 || !p2) return;
  
  const p1Action = p1.bot.action || { action: 'wait' };
  const p2Action = p2.bot.action || { action: 'wait' };
  
  // Simple combat resolution
  if (p1Action.action === 'attack' && p1Action.target === 'enemy_1') {
    const damage = Math.floor(Math.random() * 15) + 5;
    p2.bot.hp = Math.max(0, p2.bot.hp - damage);
    game.logs.push(`${p1.name}'s bot attacks for ${damage} damage!`);
  }
  
  if (p2Action.action === 'attack' && p2Action.target === 'enemy_1') {
    const damage = Math.floor(Math.random() * 15) + 5;
    p1.bot.hp = Math.max(0, p1.bot.hp - damage);
    game.logs.push(`${p2.name}'s bot attacks for ${damage} damage!`);
  }
  
  if (p1Action.action === 'shield') {
    game.logs.push(`${p1.name}'s bot raises shield.`);
  }
  
  if (p2Action.action === 'shield') {
    game.logs.push(`${p2.name}'s bot raises shield.`);
  }
}

function checkWinCondition(game) {
  const [p1, p2] = game.players;
  
  if (p1.bot.hp <= 0) {
    game.status = 'finished';
    game.winner = p2;
    game.logs.push(`${p2.name} wins!`);
  } else if (p2.bot.hp <= 0) {
    game.status = 'finished';
    game.winner = p1;
    game.logs.push(`${p1.name} wins!`);
  }
}

app.listen(PORT, () => {
  console.log(`Agent Arena server running on http://localhost:${PORT}`);
  console.log('Ready for local LLM integration via Ollama');
});
