import { randomUUID } from 'crypto';

/**
 * Game state representing a single match
 */
export class Game {
  constructor(config) {
    this.id = config.id || `game_${randomUUID()}`;
    this.agents = config.agents || []; // Array of agent IDs
    this.status = 'waiting'; // waiting, running, finished
    this.tick = 0;
    this.maxTicks = config.maxTicks || 100;
    this.arena = config.arena || this.generateArena();
    this.entities = new Map(); // agent_id -> entity state
    this.events = []; // Game events log
    this.winner = null;
    this.startedAt = null;
    this.finishedAt = null;
  }

  /**
   * Generate a random arena
   */
  generateArena() {
    const size = 20;
    const obstacles = [];
    
    // Add some random obstacles
    const numObstacles = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < numObstacles; i++) {
      obstacles.push({
        x: Math.floor(Math.random() * size),
        y: Math.floor(Math.random() * size),
        type: Math.random() > 0.5 ? 'wall' : 'hazard',
      });
    }
    
    return {
      size,
      obstacles,
      spawnPoints: [
        { x: 2, y: 2 },
        { x: size - 3, y: size - 3 },
      ],
    };
  }

  /**
   * Initialize entities for all agents
   */
  initializeEntities() {
    this.agents.forEach((agentId, index) => {
      const spawnPoint = this.arena.spawnPoints[index % this.arena.spawnPoints.length];
      this.entities.set(agentId, {
        id: agentId,
        x: spawnPoint.x,
        y: spawnPoint.y,
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 50,
        alive: true,
        actions: [],
      });
    });
  }

  /**
   * Start the game
   */
  start() {
    if (this.agents.length < 2) {
      throw new Error('Need at least 2 agents to start');
    }
    
    this.status = 'running';
    this.startedAt = new Date();
    this.initializeEntities();
    
    this.logEvent({
      tick: 0,
      type: 'game_start',
      message: 'Game started',
    });
  }

  /**
   * Process one game tick
   */
  processTick(actions) {
    if (this.status !== 'running') {
      throw new Error('Game is not running');
    }
    
    this.tick++;
    
    // Process each agent's action
    actions.forEach(({ agentId, action }) => {
      const entity = this.entities.get(agentId);
      if (!entity || !entity.alive) return;
      
      entity.actions.push(action);
      
      // Simple action processing (MVP)
      switch (action.action) {
        case 'move':
          this.processMove(entity, action);
          break;
        case 'attack':
          this.processAttack(entity, action);
          break;
        case 'wait':
          entity.energy = Math.min(entity.maxEnergy, entity.energy + 5);
          break;
      }
    });
    
    // Check for elimination
    this.checkEliminations();
    
    // Check for winner
    this.checkWinner();
    
    // Log tick
    this.logEvent({
      tick: this.tick,
      type: 'tick',
      actions,
    });
    
    // Check max ticks
    if (this.tick >= this.maxTicks || this.winner) {
      this.end();
    }
  }

  /**
   * Process move action
   */
  processMove(entity, action) {
    const direction = action.direction || 'none';
    let newX = entity.x;
    let newY = entity.y;
    
    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    
    // Boundary check
    newX = Math.max(0, Math.min(this.arena.size - 1, newX));
    newY = Math.max(0, Math.min(this.arena.size - 1, newY));
    
    // Obstacle check (simplified)
    const hitObstacle = this.arena.obstacles.some(
      obs => obs.x === newX && obs.y === newY && obs.type === 'wall'
    );
    
    if (!hitObstacle) {
      entity.x = newX;
      entity.y = newY;
      entity.energy = Math.max(0, entity.energy - 2);
    }
  }

  /**
   * Process attack action
   */
  processAttack(attacker, action) {
    if (attacker.energy < 10) return;
    
    attacker.energy -= 10;
    
    const targetId = action.target;
    const target = this.entities.get(targetId);
    
    if (!target || !target.alive) return;
    
    // Check range (simplified)
    const distance = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    if (distance <= 3) {
      const damage = Math.floor(Math.random() * 10) + 5;
      target.hp = Math.max(0, target.hp - damage);
      
      this.logEvent({
        tick: this.tick,
        type: 'attack',
        attacker: attacker.id,
        target: targetId,
        damage,
      });
    }
  }

  /**
   * Check for eliminated entities
   */
  checkEliminations() {
    this.entities.forEach((entity) => {
      if (entity.hp <= 0 && entity.alive) {
        entity.alive = false;
        this.logEvent({
          tick: this.tick,
          type: 'elimination',
          agent: entity.id,
        });
      }
    });
  }

  /**
   * Check for winner
   */
  checkWinner() {
    const aliveAgents = Array.from(this.entities.values()).filter(e => e.alive);
    
    if (aliveAgents.length <= 1) {
      this.winner = aliveAgents.length === 1 ? aliveAgents[0].id : null;
    }
  }

  /**
   * End the game
   */
  end() {
    this.status = 'finished';
    this.finishedAt = new Date();
    
    this.logEvent({
      tick: this.tick,
      type: 'game_end',
      winner: this.winner,
      message: this.winner ? `Agent ${this.winner} wins!` : 'Draw',
    });
  }

  /**
   * Log an event
   */
  logEvent(event) {
    this.events.push(event);
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      id: this.id,
      status: this.status,
      tick: this.tick,
      maxTicks: this.maxTicks,
      arena: this.arena,
      entities: Array.from(this.entities.values()),
      events: this.events.slice(-20), // Last 20 events
      winner: this.winner,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }
}

/**
 * Game manager to handle multiple games
 */
export class GameManager {
  constructor() {
    this.games = new Map();
  }

  /**
   * Create a new game
   */
  createGame(config) {
    const game = new Game(config);
    this.games.set(game.id, game);
    return game;
  }

  /**
   * Get a game by ID
   */
  getGame(id) {
    return this.games.get(id);
  }

  /**
   * Get all games
   */
  getAllGames() {
    return Array.from(this.games.values());
  }

  /**
   * Delete a game
   */
  deleteGame(id) {
    return this.games.delete(id);
  }
}

// Export singleton instance
export const gameManager = new GameManager();
