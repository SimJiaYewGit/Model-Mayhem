import { Router } from 'express';
import { gameManager } from '../game/game.js';
import { agentManager } from '../agents/agent.js';
import { generateActionsForGame } from '../services/agentAction.js';

const router = Router();

/**
 * GET /api/games
 * Get all games
 */
router.get('/', (req, res) => {
  const games = gameManager.getAllGames();
  res.json(games.map(g => g.getState()));
});

/**
 * GET /api/games/:id
 * Get a specific game
 */
router.get('/:id', (req, res) => {
  const game = gameManager.getGame(req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game.getState());
});

/**
 * POST /api/games
 * Create a new game
 */
router.post('/', (req, res) => {
  try {
    const { agentIds, maxTicks } = req.body;
    
    if (!agentIds || agentIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 agents are required' });
    }
    
    // Validate agents exist
    for (const agentId of agentIds) {
      if (!agentManager.getAgent(agentId)) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
      }
    }
    
    const game = gameManager.createGame({
      agents: agentIds,
      maxTicks,
    });
    
    res.status(201).json(game.getState());
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

/**
 * POST /api/games/:id/start
 * Start a game
 */
router.post('/:id/start', (req, res) => {
  try {
    const game = gameManager.getGame(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    game.start();
    res.json(game.getState());
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/games/:id/tick
 * Process a game tick with actions from agents
 */
router.post('/:id/tick', async (req, res) => {
  try {
    const game = gameManager.getGame(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if actions are provided manually, otherwise generate from LLM
    let { actions } = req.body;
    
    if (!actions || !Array.isArray(actions)) {
      // Auto-generate actions from LLM agents
      const agents = agentManager.getAllAgents();
      const gameAgents = agents.filter(a => game.agents.includes(a.id));
      
      if (gameAgents.length === 0) {
        return res.status(400).json({ error: 'No agents found for this game' });
      }
      
      // Generate actions using LLM
      const llmActions = await generateActionsForGame(game, gameAgents);
      
      // Format for game processing
      actions = llmActions.map(({ agentId, action }) => ({ agentId, action }));
      
      // Log LLM responses for debugging
      console.log(`Tick ${game.tick + 1}: Generated ${actions.length} LLM actions`);
      llmActions.forEach(({ agentId, rawResponse, metadata }) => {
        if (rawResponse) {
          console.log(`  Agent ${agentId.slice(0, 8)}: ${rawResponse.substring(0, 100)}...`);
        }
      });
    }
    
    game.processTick(actions);
    res.json(game.getState());
  } catch (error) {
    console.error('Error processing tick:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/games/:id
 * Delete a game
 */
router.delete('/:id', (req, res) => {
  const deleted = gameManager.deleteGame(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.status(204).send();
});

export default router;
