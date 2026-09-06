import { generateChatCompletion } from './ollama.js';

/**
 * Generate an action decision from an LLM agent
 */
export async function generateAgentAction(agent, gameState, entityState) {
  const { arena, tick, entities } = gameState;
  
  // Build the observation prompt
  const observation = {
    tick,
    arena: {
      size: arena.size,
      obstacles: arena.obstacles.map(o => ({ x: o.x, y: o.y, type: o.type })),
    },
    self: {
      id: entityState.id,
      hp: entityState.hp,
      maxHp: entityState.maxHp,
      energy: entityState.energy,
      maxEnergy: entityState.maxEnergy,
      position: { x: entityState.x, y: entityState.y },
      alive: entityState.alive,
    },
    visible_enemies: entities
      .filter(e => e.id !== entityState.id && e.alive)
      .map(e => ({
        id: e.id,
        hp: e.hp,
        position: { x: e.x, y: e.y },
        distance: Math.abs(e.x - entityState.x) + Math.abs(e.y - entityState.y),
      })),
    available_actions: ['move', 'attack', 'wait'],
  };

  // Build the system prompt
  const systemPrompt = agent.systemPrompt || `You are a battle agent competing in an arena.
Your goal is to eliminate opponents and be the last one standing.
Make strategic decisions based on your health, energy, and enemy positions.
Respond ONLY with a valid JSON object.`;

  // Build the user prompt with observation
  const userPrompt = `Current game state:
${JSON.stringify(observation, null, 2)}

Based on this situation, decide your next action.
Choose from: move, attack, or wait.

For "move", specify direction: up, down, left, or right.
For "attack", specify target enemy id.
For "wait", no additional parameters needed.

Respond with JSON in this exact format:
{
  "action": "move|attack|wait",
  "direction": "up|down|left|right" (only for move),
  "target": "enemy_id" (only for attack),
  "reason": "brief explanation of your strategy"
}

Think strategically about:
- Your current health and energy levels
- Enemy positions and their health
- Arena obstacles
- Positioning advantages`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const result = await generateChatCompletion(agent.model, messages, {
      temperature: agent.parameters.temperature,
      top_p: agent.parameters.topP,
      max_tokens: agent.parameters.maxTokens,
    });

    // Parse the LLM response
    const action = parseActionResponse(result.content, entityState);
    
    return {
      agentId: agent.id,
      action,
      rawResponse: result.content,
      metadata: {
        totalDuration: result.totalDuration,
        evalCount: result.evalCount,
      },
    };
  } catch (error) {
    console.error(`Agent ${agent.id} action generation failed:`, error.message);
    
    // Fallback to safe default action
    return {
      agentId: agent.id,
      action: {
        action: 'wait',
        reason: `Error: ${error.message}. Falling back to wait.`,
      },
      rawResponse: null,
      metadata: { error: error.message },
    };
  }
}

/**
 * Parse LLM response into a valid action object
 */
function parseActionResponse(content, entityState) {
  try {
    // Try to extract JSON from the response
    let jsonStr = content.trim();
    
    // Handle markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate and normalize the action
    const action = {
      action: parsed.action || 'wait',
      reason: parsed.reason || '',
    };
    
    if (action.action === 'move') {
      const validDirections = ['up', 'down', 'left', 'right'];
      action.direction = validDirections.includes(parsed.direction)
        ? parsed.direction
        : 'none';
    }
    
    if (action.action === 'attack') {
      action.target = parsed.target || null;
    }
    
    return action;
  } catch (parseError) {
    console.warn('Failed to parse LLM response, using fallback:', parseError.message);
    
    // Intelligent fallback based on state
    if (entityState.energy < 10) {
      return {
        action: 'wait',
        reason: 'Low energy, waiting to recover',
      };
    }
    
    // Default to wait for safety
    return {
      action: 'wait',
      reason: `Parse error: ${parseError.message}. Using fallback.`,
    };
  }
}

/**
 * Generate actions for all active agents in a game
 */
export async function generateActionsForGame(game, agents) {
  const activeEntities = Array.from(game.entities.values()).filter(e => e.alive);
  const actions = [];
  
  // Generate actions in parallel for better performance
  const promises = activeEntities.map(async (entity) => {
    const agent = agents.find(a => a.id === entity.id);
    if (!agent) return null;
    
    const gameState = game.getState();
    return await generateAgentAction(agent, gameState, entity);
  });
  
  const results = await Promise.all(promises);
  
  results.forEach(result => {
    if (result) {
      actions.push(result);
    }
  });
  
  return actions;
}
