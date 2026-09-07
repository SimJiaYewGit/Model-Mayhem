/**
 * Ollama Service - Handles communication with local Ollama instance
 */

const DEFAULT_OLLAMA_HOST = 'http://localhost:11434'

class OllamaService {
  constructor(host = DEFAULT_OLLAMA_HOST) {
    this.host = host
    this.availableModels = []
  }

  /**
   * Check if Ollama is available and fetch available models
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.host}/api/tags`)
      if (!response.ok) {
        throw new Error(`Ollama responded with status ${response.status}`)
      }
      const data = await response.json()
      this.availableModels = data.models || []
      return { success: true, models: this.availableModels }
    } catch (error) {
      console.error('Failed to connect to Ollama:', error)
      return { 
        success: false, 
        error: error.message,
        models: []
      }
    }
  }

  /**
   * Generate a completion from a model
   */
  async generateCompletion(model, prompt, systemPrompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 150,
      stream = false
    } = options

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          system: systemPrompt,
          options: {
            temperature,
            num_predict: maxTokens
          },
          stream
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama generation failed with status ${response.status}`)
      }

      if (stream) {
        return this.handleStreamResponse(response)
      } else {
        const data = await response.json()
        return {
          success: true,
          text: data.response,
          done: data.done,
          totalDuration: data.total_duration,
          loadDuration: data.load_duration
        }
      }
    } catch (error) {
      console.error('Generation error:', error)
      return {
        success: false,
        error: error.message,
        text: ''
      }
    }
  }

  /**
   * Handle streaming response
   */
  async handleStreamResponse(response) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.response) {
            fullText += data.response
          }
        } catch (e) {
          console.warn('Failed to parse stream chunk:', e)
        }
      }
    }

    return {
      success: true,
      text: fullText
    }
  }

  /**
   * Get agent decision from LLM
   */
  async getAgentDecision(model, systemPrompt, gameState, options = {}) {
    const prompt = this.buildDecisionPrompt(gameState)
    
    const result = await this.generateCompletion(model, prompt, systemPrompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 150
    })

    if (!result.success) {
      return result
    }

    // Parse the action from the response
    const parsedAction = this.parseAction(result.text)
    
    return {
      ...result,
      action: parsedAction
    }
  }

  /**
   * Build the prompt for agent decision making (enhanced with items and hazards)
   */
  buildDecisionPrompt(gameState) {
    const { tick, self, enemy, arena } = gameState

    let prompt = `You are in a turn-based arena battle. Analyze the situation and choose your next action.

BATTLE STATE:
- Tick: ${tick}
- Your HP: ${self.hp}/${self.maxHp}
- Your Energy: ${self.energy}/100
- Your Position: (${self.position.x}, ${self.position.y})
- Enemy HP: ${enemy.hp}/${enemy.maxHp}
- Enemy Position: (${enemy.position.x}, ${enemy.position.y})
- Arena Size: ${arena.size}x${arena.size}
`

    // Add inventory info if available
    if (self.inventory && self.inventory.length > 0) {
      prompt += `\nYOUR INVENTORY:\n`
      self.inventory.forEach((item, idx) => {
        prompt += `- ${idx + 1}. ${item.name} (${item.effect}): ID=${item.id}\n`
      })
    }

    // Add buff info
    if (self.buffs) {
      const buffs = []
      if (self.buffs.damageBoost > 0) buffs.push(`Damage Boost (${self.buffs.damageBoost} turns)`)
      if (self.buffs.speedBoost > 0) buffs.push(`Speed Boost (${self.buffs.speedBoost} turns)`)
      if (self.buffs.shield > 0) buffs.push('Shield Active')
      
      if (buffs.length > 0) {
        prompt += `\nACTIVE BUFFS: ${buffs.join(', ')}\n`
      }
    }

    // Add nearby items
    if (arena.nearbyItems && arena.nearbyItems.length > 0) {
      prompt += `\nNEARBY ITEMS:\n`
      arena.nearbyItems.forEach(item => {
        prompt += `- ${item.type} at (${item.position.x}, ${item.position.y}) - Effect: ${item.effect}\n`
      })
    }

    // Add nearby hazards
    if (arena.nearbyHazards && arena.nearbyHazards.length > 0) {
      prompt += `\nNEARBY HAZARDS:\n`
      arena.nearbyHazards.forEach(hazard => {
        prompt += `- ${hazard.type} at (${hazard.position.x}, ${hazard.position.y}) - ${hazard.description}\n`
      })
    }

    // Add obstacles
    if (arena.obstacles && arena.obstacles.length > 0) {
      prompt += `\nOBSTACLES: ${arena.obstacles.map(o => `(${o.x}, ${o.y})`).join(', ')}\n`
    }

    prompt += `
AVAILABLE ACTIONS:
1. "attack" - Deal damage to enemy (costs 10 energy)
2. "move" - Move one cell in a direction (up/down/left/right). With speed boost, move 2 cells.
3. "defend" - Reduce incoming damage this turn (costs 5 energy)
4. "charge" - Gain 15 energy (no movement)
${self.inventory && self.inventory.length > 0 ? '5. "use_item" - Use an item from inventory (costs 5 energy). Include itemId in response.' : ''}

Respond with ONLY a valid JSON object in this exact format:
{
  "action": "attack|move|defend|charge|use_item",
  "direction": "up|down|left|right|none",
  "itemId": "item_id_here", // Only if using an item
  "reason": "brief explanation of your choice"
}

Do not include any other text. Only respond with the JSON.`

    return prompt
  }

  /**
   * Parse action from LLM response
   */
  parseAction(text) {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0])
        return this.validateAction(action)
      }
      
      // Fallback: try parsing entire text as JSON
      const action = JSON.parse(text)
      return this.validateAction(action)
    } catch (e) {
      console.warn('Failed to parse action JSON:', e)
      return this.getDefaultAction()
    }
  }

  /**
   * Validate and normalize action
   */
  validateAction(action) {
    const validActions = ['attack', 'move', 'defend', 'charge', 'use_item']
    const validDirections = ['up', 'down', 'left', 'right', 'none']

    const validatedAction = {
      action: validActions.includes(action.action) ? action.action : 'attack',
      direction: validDirections.includes(action.direction) ? action.direction : 'none',
      itemId: action.itemId || null,
      reason: action.reason || 'No reason provided'
    }

    return validatedAction
  }

  /**
   * Get default action when parsing fails
   */
  getDefaultAction() {
    return {
      action: 'attack',
      direction: 'none',
      reason: 'Default action (parse failed)'
    }
  }

  /**
   * List available models
   */
  getAvailableModels() {
    return this.availableModels.map(m => ({
      id: m.name,
      size: m.details?.size || 'Unknown',
      family: m.details?.family || 'Unknown'
    }))
  }
}

// Export singleton instance
export const ollamaService = new OllamaService()
export default OllamaService
