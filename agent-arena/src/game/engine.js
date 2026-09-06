/**
 * Battle Engine - Core game logic for arena battles
 */

export const ACTIONS = {
  ATTACK: 'attack',
  MOVE: 'move',
  DEFEND: 'defend',
  CHARGE: 'charge'
}

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none'
}

export const ACTION_COSTS = {
  [ACTIONS.ATTACK]: 10,
  [ACTIONS.MOVE]: 0,
  [ACTIONS.DEFEND]: 5,
  [ACTIONS.CHARGE]: 0
}

export const ACTION_EFFECTS = {
  [ACTIONS.ATTACK]: { damage: [5, 15] }, // Min-max damage range
  [ACTIONS.MOVE]: { distance: 1 },
  [ACTIONS.DEFEND]: { damageReduction: 0.5 },
  [ACTIONS.CHARGE]: { energyGain: 15 }
}

/**
 * Calculate damage based on attack and defense
 */
export function calculateDamage(baseDamage, defense) {
  const reduction = Math.floor(defense / 2)
  return Math.max(1, baseDamage - reduction)
}

/**
 * Apply movement to position
 */
export function applyMovement(position, direction, arenaSize) {
  const newPos = { ...position }
  
  switch (direction) {
    case DIRECTIONS.UP:
      newPos.y = Math.max(0, position.y - 1)
      break
    case DIRECTIONS.DOWN:
      newPos.y = Math.min(arenaSize - 1, position.y + 1)
      break
    case DIRECTIONS.LEFT:
      newPos.x = Math.max(0, position.x - 1)
      break
    case DIRECTIONS.RIGHT:
      newPos.x = Math.min(arenaSize - 1, position.x + 1)
      break
    default:
      break
  }
  
  return newPos
}

/**
 * Check if two positions are adjacent
 */
export function areAdjacent(pos1, pos2) {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(pos1, pos2) {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
}

/**
 * Validate an action based on agent state
 */
export function validateAction(action, agent) {
  const errors = []
  
  if (!action.action) {
    errors.push('No action specified')
    return { valid: false, errors }
  }
  
  if (!Object.values(ACTIONS).includes(action.action)) {
    errors.push(`Invalid action: ${action.action}`)
    return { valid: false, errors }
  }
  
  const cost = ACTION_COSTS[action.action]
  if (agent.energy < cost) {
    errors.push(`Not enough energy for ${action.action} (need ${cost}, have ${agent.energy})`)
    return { valid: false, errors }
  }
  
  if (action.action === ACTIONS.MOVE && action.direction) {
    if (!Object.values(DIRECTIONS).includes(action.direction)) {
      errors.push(`Invalid direction: ${action.direction}`)
      return { valid: false, errors }
    }
  }
  
  return { valid: true, errors: [] }
}

/**
 * Execute an action and return the result
 */
export function executeAction(action, agent, enemy, arenaSize) {
  const validation = validateAction(action, agent)
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      agent: { ...agent },
      enemy: { ...enemy },
      log: [`Invalid action: ${validation.errors.join(', ')}`]
    }
  }
  
  const logs = []
  const newAgent = { ...agent }
  const newEnemy = { ...enemy }
  
  // Pay action cost
  newAgent.energy -= ACTION_COSTS[action.action]
  
  switch (action.action) {
    case ACTIONS.ATTACK: {
      const [minDmg, maxDmg] = ACTION_EFFECTS[ACTIONS.ATTACK].damage
      const baseDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg
      const finalDamage = calculateDamage(baseDamage, enemy.stats.defense)
      newEnemy.hp = Math.max(0, enemy.hp - finalDamage)
      logs.push(`${agent.name} attacks for ${finalDamage} damage!`)
      break
    }
    
    case ACTIONS.MOVE: {
      if (action.direction && action.direction !== DIRECTIONS.NONE) {
        const oldPos = { ...newAgent.position }
        newAgent.position = applyMovement(newAgent.position, action.direction, arenaSize)
        logs.push(`${agent.name} moves ${action.direction} from (${oldPos.x},${oldPos.y}) to (${newAgent.position.x},${newAgent.position.y})`)
      } else {
        logs.push(`${agent.name} stays in place`)
      }
      break
    }
    
    case ACTIONS.DEFEND: {
      newAgent.isDefending = true
      logs.push(`${agent.name} takes a defensive stance`)
      break
    }
    
    case ACTIONS.CHARGE: {
      const energyGain = ACTION_EFFECTS[ACTIONS.CHARGE].energyGain
      newAgent.energy = Math.min(100, agent.energy + energyGain)
      logs.push(`${agent.name} charges and gains ${energyGain} energy`)
      break
    }
    
    default:
      logs.push(`${agent.name} hesitates...`)
  }
  
  // Clear defending flag at end of turn
  if (newAgent.isDefending && action.action !== ACTIONS.DEFEND) {
    newAgent.isDefending = false
  }
  
  return {
    success: true,
    agent: newAgent,
    enemy: newEnemy,
    log: logs
  }
}

/**
 * Create initial agent state
 */
export function createAgent(name, harness, position) {
  const harnessStats = {
    scout: { speed: 9, defense: 4, energy: 7, maxHp: 80 },
    tank: { speed: 3, defense: 10, energy: 5, maxHp: 150 },
    assault: { speed: 6, defense: 6, energy: 6, maxHp: 100 },
    sniper: { speed: 5, defense: 3, energy: 8, maxHp: 70 }
  }
  
  const stats = harnessStats[harness] || harnessStats.assault
  
  return {
    name,
    harness,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    energy: 100,
    position: { ...position },
    stats: { ...stats },
    isDefending: false
  }
}

/**
 * Get battle state for LLM prompt
 */
export function getBattleStateForLLM(tick, agent, enemy, arenaSize) {
  return {
    tick,
    self: {
      hp: agent.hp,
      maxHp: agent.maxHp,
      energy: agent.energy,
      position: agent.position,
      harness: agent.harness,
      stats: agent.stats
    },
    enemy: {
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      position: enemy.position,
      harness: enemy.harness
    },
    arena: {
      size: arenaSize
    }
  }
}

/**
 * Check win conditions
 */
export function checkWinCondition(agent, enemy, tick, maxTicks) {
  if (enemy.hp <= 0) {
    return { ended: true, winner: 'agent', reason: 'elimination' }
  }
  if (agent.hp <= 0) {
    return { ended: true, winner: 'enemy', reason: 'elimination' }
  }
  if (tick >= maxTicks) {
    const winner = agent.hp > enemy.hp ? 'agent' : agent.hp < enemy.hp ? 'enemy' : 'draw'
    return { ended: true, winner, reason: 'timeout' }
  }
  return { ended: false, winner: null, reason: null }
}
