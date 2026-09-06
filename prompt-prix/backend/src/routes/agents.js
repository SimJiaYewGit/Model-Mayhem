import { Router } from 'express';
import { agentManager } from '../agents/agent.js';
import { getAvailableModels } from '../services/ollama.js';

const router = Router();

/**
 * GET /api/agents
 * Get all agents
 */
router.get('/', (req, res) => {
  const agents = agentManager.getAllAgents();
  res.json(agents.map(a => a.toJSON()));
});

/**
 * GET /api/agents/:id
 * Get a specific agent
 */
router.get('/:id', (req, res) => {
  const agent = agentManager.getAgent(req.params.id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(agent.toJSON());
});

/**
 * POST /api/agents
 * Create a new agent
 */
router.post('/', (req, res) => {
  try {
    const { name, model, harness, systemPrompt, temperature, topP, maxTokens, decisionRate } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    const agent = agentManager.createAgent({
      name,
      model,
      harness,
      systemPrompt,
      temperature,
      topP,
      maxTokens,
      decisionRate,
    });
    
    res.status(201).json(agent.toJSON());
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * PUT /api/agents/:id
 * Update an agent
 */
router.put('/:id', (req, res) => {
  try {
    const { name, harness, systemPrompt, parameters } = req.body;
    
    const agent = agentManager.updateAgent(req.params.id, {
      name,
      harness,
      systemPrompt,
      parameters,
    });
    
    res.json(agent.toJSON());
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
router.delete('/:id', (req, res) => {
  const deleted = agentManager.deleteAgent(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.status(204).send();
});

/**
 * GET /api/agents/models
 * Get available models from Ollama
 */
router.get('/models', async (req, res) => {
  try {
    const models = await getAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export default router;
