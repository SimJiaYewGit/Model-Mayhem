import { randomUUID } from 'crypto';

/**
 * Agent class representing an AI model competitor
 */
export class Agent {
  constructor(config) {
    this.id = config.id || `agent_${randomUUID()}`;
    this.name = config.name || 'Unnamed Agent';
    this.model = config.model; // Model name (e.g., 'llama3.2:1b')
    this.harness = config.harness || 'default';
    this.systemPrompt = config.systemPrompt || '';
    this.parameters = {
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 0.9,
      maxTokens: config.maxTokens ?? 256,
      decisionRate: config.decisionRate ?? 1, // decisions per second
    };
    this.memory = config.memory || [];
    this.stats = {
      wins: 0,
      losses: 0,
      totalMatches: 0,
    };
    this.createdAt = new Date();
  }

  /**
   * Add a memory entry
   */
  addMemory(entry) {
    this.memory.push({
      timestamp: Date.now(),
      ...entry,
    });
    
    // Limit memory size
    const MAX_MEMORY = 50;
    if (this.memory.length > MAX_MEMORY) {
      this.memory = this.memory.slice(-MAX_MEMORY);
    }
  }

  /**
   * Clear memory
   */
  clearMemory() {
    this.memory = [];
  }

  /**
   * Get recent memories for context
   */
  getRecentMemories(count = 10) {
    return this.memory.slice(-count);
  }

  /**
   * Update stats after a match
   */
  recordMatchResult(won) {
    this.stats.totalMatches++;
    if (won) {
      this.stats.wins++;
    } else {
      this.stats.losses++;
    }
  }

  /**
   * Serialize agent to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      model: this.model,
      harness: this.harness,
      systemPrompt: this.systemPrompt,
      parameters: this.parameters,
      stats: this.stats,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Agent manager to handle multiple agents
 */
export class AgentManager {
  constructor() {
    this.agents = new Map();
  }

  /**
   * Create a new agent
   */
  createAgent(config) {
    const agent = new Agent(config);
    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Get an agent by ID
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Delete an agent
   */
  deleteAgent(id) {
    return this.agents.delete(id);
  }

  /**
   * Update an agent's configuration
   */
  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }

    if (updates.name !== undefined) agent.name = updates.name;
    if (updates.harness !== undefined) agent.harness = updates.harness;
    if (updates.systemPrompt !== undefined) agent.systemPrompt = updates.systemPrompt;
    if (updates.parameters !== undefined) {
      agent.parameters = { ...agent.parameters, ...updates.parameters };
    }

    return agent;
  }
}

// Export singleton instance
export const agentManager = new AgentManager();
