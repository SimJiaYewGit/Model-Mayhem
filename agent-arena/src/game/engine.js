/**
 * Battle Engine - Core game logic for arena battles
 */

export const ACTIONS = {
  ATTACK: 'attack',
  MOVE: 'move',
  DEFEND: 'defend',
  CHARGE: 'charge',
  USE_ITEM: 'use_item'
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
  [ACTIONS.CHARGE]: 0,
  [ACTIONS.USE_ITEM]: 5
}

export const ACTION_EFFECTS = {
  [ACTIONS.ATTACK]: { damage: [5, 15] }, // Min-max damage range
  [ACTIONS.MOVE]: { distance: 1 },
  [ACTIONS.DEFEND]: { damageReduction: 0.5 },
  [ACTIONS.CHARGE]: { energyGain: 15 }
}

// Item definitions
export const ITEMS = {
  HEALTH_PACK: {
    id: 'health_pack',
    name: 'Health Pack',
    description: 'Restores 25 HP',
    effect: 'heal',
    value: 25,
    color: '#22c55e'
  },
  DAMAGE_BOOST: {
    id: 'damage_boost',
    name: 'Power Up',
    description: '+50% damage for 3 turns',
    effect: 'damage_boost',
    value: 0.5,
    duration: 3,
    color: '#ef4444'
  },
  SPEED_BOOST: {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: 'Move 2 tiles for 2 turns',
    effect: 'speed_boost',
    value: 2,
    duration: 2,
    color: '#3b82f6'
  },
  SHIELD: {
    id: 'shield',
    name: 'Shield',
    description: 'Block next attack completely',
    effect: 'shield',
    value: 1,
    color: '#a855f7'
  },
  EMP: {
    id: 'emp',
    name: 'EMP Burst',
    description: 'Drains 20 enemy energy',
    effect: 'EMP',
    value: 20,
    color: '#eab308'
  }
}

// Hazard definitions
export const HAZARDS = {
  LAVA: {
    type: 'lava',
    damage: 10,
    description: 'Deals 10 damage per turn',
    color: '#dc2626'
  },
  ICE: {
    type: 'ice',
    effect: 'slow',
    description: 'Reduces movement range',
    color: '#0ea5e9'
  },
  MINE: {
    type: 'mine',
    damage: 20,
    description: 'Explodes on contact for 20 damage',
    color: '#f97316'
  }
}

// Arena configurations
export const ARENAS = {
  CLASSIC: {
    id: 'classic',
    name: 'Classic Arena',
    width: 12,
    height: 12,
    obstacles: [],
    hazards: [],
    itemSpawns: [
      { x: 2, y: 2 },
      { x: 9, y: 9 },
      { x: 2, y: 9 },
      { x: 9, y: 2 },
      { x: 6, y: 6 }
    ],
    description: 'A balanced arena with equal item distribution'
  },
  VOLCANIC: {
    id: 'volcanic',
    name: 'Volcanic Wasteland',
    width: 12,
    height: 12,
    obstacles: [
      { x: 5, y: 5 }, { x: 6, y: 5 },
      { x: 5, y: 6 }, { x: 6, y: 6 }
    ],
    hazards: [
      { position: { x: 3, y: 3 }, ...HAZARDS.LAVA },
      { position: { x: 8, y: 8 }, ...HAZARDS.LAVA },
      { position: { x: 3, y: 8 }, ...HAZARDS.LAVA },
      { position: { x: 8, y: 3 }, ...HAZARDS.LAVA }
    ],
    itemSpawns: [
      { x: 1, y: 1 },
      { x: 10, y: 10 },
      { x: 1, y: 10 },
      { x: 10, y: 1 }
    ],
    description: 'Dangerous lava pools deal damage each turn'
  },
  FROZEN: {
    id: 'frozen',
    name: 'Frozen Tundra',
    width: 12,
    height: 12,
    obstacles: [
      { x: 0, y: 5 }, { x: 0, y: 6 },
      { x: 11, y: 5 }, { x: 11, y: 6 }
    ],
    hazards: [
      { position: { x: 5, y: 3 }, ...HAZARDS.ICE },
      { position: { x: 6, y: 3 }, ...HAZARDS.ICE },
      { position: { x: 5, y: 8 }, ...HAZARDS.ICE },
      { position: { x: 6, y: 8 }, ...HAZARDS.ICE }
    ],
    itemSpawns: [
      { x: 2, y: 5 },
      { x: 9, y: 5 },
      { x: 5, y: 1 },
      { x: 5, y: 10 }
    ],
    description: 'Ice patches slow down movement'
  },
  MINEFIELD: {
    id: 'minefield',
    name: 'The Minefield',
    width: 12,
    height: 12,
    obstacles: [],
    hazards: [
      { position: { x: 3, y: 5 }, ...HAZARDS.MINE },
      { position: { x: 8, y: 5 }, ...HAZARDS.MINE },
      { position: { x: 5, y: 3 }, ...HAZARDS.MINE },
      { position: { x: 5, y: 8 }, ...HAZARDS.MINE },
      { position: { x: 6, y: 6 }, ...HAZARDS.MINE }
    ],
    itemSpawns: [
      { x: 1, y: 5 },
      { x: 10, y: 5 },
      { x: 5, y: 1 },
      { x: 5, y: 10 }
    ],
    description: 'Hidden mines explode on contact'
  }
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
export function executeAction(action, agent, enemy, arenaSize, items = [], hazards = []) {
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
      let [minDmg, maxDmg] = ACTION_EFFECTS[ACTIONS.ATTACK].damage
      
      // Apply damage boost if active
      if (newAgent.damageBoostActive) {
        minDmg = Math.floor(minDmg * (1 + newAgent.damageBoostMultiplier))
        maxDmg = Math.floor(maxDmg * (1 + newAgent.damageBoostMultiplier))
      }
      
      const baseDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg
      let finalDamage = calculateDamage(baseDamage, enemy.stats.defense)
      
      // Check if enemy has shield
      if (newEnemy.shieldActive) {
        finalDamage = 0
        newEnemy.shieldActive = false
        logs.push(`${enemy.name}'s shield blocks all damage!`)
      } else {
        newEnemy.hp = Math.max(0, enemy.hp - finalDamage)
        logs.push(`${agent.name} attacks for ${finalDamage} damage!`)
      }
      break
    }
    
    case ACTIONS.MOVE: {
      if (action.direction && action.direction !== DIRECTIONS.NONE) {
        const oldPos = { ...newAgent.position }
        
        // Check for speed boost
        const moveDistance = newAgent.speedBoostActive ? 2 : 1
        
        let moved = false
        for (let i = 0; i < moveDistance; i++) {
          const testPos = applyMovement(newAgent.position, action.direction, arenaSize)
          
          // Check for obstacles
          const isObstacle = hazards.some(h => 
            h.position.x === testPos.x && h.position.y === testPos.y && h.type === 'obstacle'
          )
          
          if (!isObstacle) {
            newAgent.position = testPos
            moved = true
          } else {
            logs.push(`${agent.name} is blocked by an obstacle`)
            break
          }
        }
        
        if (moved) {
          logs.push(`${agent.name} moves ${action.direction} from (${oldPos.x},${oldPos.y}) to (${newAgent.position.x},${newAgent.position.y})`)
        }
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
    
    case ACTIONS.USE_ITEM: {
      if (!action.itemId) {
        logs.push(`${agent.name} tries to use an item but none is selected`)
        break
      }
      
      const itemIndex = newAgent.inventory?.findIndex(i => i.id === action.itemId)
      if (itemIndex === undefined || itemIndex === -1) {
        logs.push(`${agent.name} doesn't have that item`)
        break
      }
      
      const item = newAgent.inventory[itemIndex]
      newAgent.inventory.splice(itemIndex, 1)
      
      switch (item.effect) {
        case 'heal':
          const healAmount = item.value
          newAgent.hp = Math.min(newAgent.maxHp, newAgent.hp + healAmount)
          logs.push(`${agent.name} uses ${item.name} and heals ${healAmount} HP`)
          break
          
        case 'damage_boost':
          newAgent.damageBoostActive = true
          newAgent.damageBoostMultiplier = item.value
          newAgent.damageBoostDuration = item.duration
          logs.push(`${agent.name} uses ${item.name} - damage boosted for ${item.duration} turns!`)
          break
          
        case 'speed_boost':
          newAgent.speedBoostActive = true
          newAgent.speedBoostDuration = item.duration
          logs.push(`${agent.name} uses ${item.name} - speed boosted for ${item.duration} turns!`)
          break
          
        case 'shield':
          newAgent.shieldActive = true
          logs.push(`${agent.name} uses ${item.name} - shield activated!`)
          break
          
        case 'EMP':
          newEnemy.energy = Math.max(0, newEnemy.energy - item.value)
          logs.push(`${agent.name} uses ${item.name} and drains ${item.value} energy from ${enemy.name}!`)
          break
          
        default:
          logs.push(`${agent.name} uses ${item.name} with unknown effect`)
      }
      break
    }
    
    default:
      logs.push(`${agent.name} hesitates...`)
  }
  
  // Clear defending flag at end of turn
  if (newAgent.isDefending && action.action !== ACTIONS.DEFEND) {
    newAgent.isDefending = false
  }
  
  // Decrement buff durations
  if (newAgent.damageBoostActive) {
    newAgent.damageBoostDuration--
    if (newAgent.damageBoostDuration <= 0) {
      newAgent.damageBoostActive = false
      newAgent.damageBoostMultiplier = 0
      logs.push(`${agent.name}'s damage boost wears off`)
    }
  }
  
  if (newAgent.speedBoostActive) {
    newAgent.speedBoostDuration--
    if (newAgent.speedBoostDuration <= 0) {
      newAgent.speedBoostActive = false
      logs.push(`${agent.name}'s speed boost wears off`)
    }
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
    isDefending: false,
    inventory: [],
    damageBoostActive: false,
    damageBoostMultiplier: 0,
    damageBoostDuration: 0,
    speedBoostActive: false,
    speedBoostDuration: 0,
    shieldActive: false
  }
}

/**
 * Check if position has an item
 */
export function getItemAtPosition(position, itemSpawns) {
  return itemSpawns.find(
    spawn => !spawn.isTaken && 
    spawn.position.x === position.x && 
    spawn.position.y === position.y
  )
}

/**
 * Pick up item at position
 */
export function pickupItem(agent, itemSpawn) {
  if (!itemSpawn || itemSpawn.isTaken) return { pickedUp: null, agent }
  
  const newItem = { ...itemSpawn.type, instanceId: `${itemSpawn.id}_${Date.now()}` }
  const newAgent = { 
    ...agent, 
    inventory: [...(agent.inventory || []), newItem] 
  }
  
  return { pickedUp: newItem, agent: newAgent }
}

/**
 * Apply hazard effects to agent
 */
export function applyHazardEffects(agent, hazards) {
  let newAgent = { ...agent }
  const logs = []
  
  // Check for lava damage
  const lavaHazard = hazards.find(h => 
    h.type === 'lava' &&
    h.position.x === agent.position.x && 
    h.position.y === agent.position.y
  )
  
  if (lavaHazard) {
    const damage = lavaHazard.damage || 10
    newAgent.hp = Math.max(0, newAgent.hp - damage)
    logs.push(`${agent.name} takes ${damage} damage from lava!`)
  }
  
  // Check for mine explosion (only triggers once)
  const mineHazard = hazards.find(h => 
    h.type === 'mine' && !h.triggered &&
    h.position.x === agent.position.x && 
    h.position.y === agent.position.y
  )
  
  if (mineHazard) {
    const damage = mineHazard.damage || 20
    newAgent.hp = Math.max(0, newAgent.hp - damage)
    mineHazard.triggered = true
    logs.push(`${agent.name} triggered a mine for ${damage} damage!`)
  }
  
  // Check for ice slow effect
  const iceHazard = hazards.find(h => 
    h.type === 'ice' &&
    h.position.x === agent.position.x && 
    h.position.y === agent.position.y
  )
  
  if (iceHazard) {
    newAgent.isSlowed = true
    logs.push(`${agent.name} is slowed by ice`)
  } else {
    newAgent.isSlowed = false
  }
  
  return { agent: newAgent, logs }
}

/**
 * Get battle state for LLM prompt (enhanced with items and hazards)
 */
export function getBattleStateForLLM(tick, agent, enemy, arena) {
  const nearbyItems = arena.itemSpawns
    .filter(spawn => !spawn.isTaken)
    .filter(spawn => {
      const dist = Math.abs(spawn.position.x - agent.position.x) + 
                   Math.abs(spawn.position.y - agent.position.y)
      return dist <= 3 // Only show nearby items
    })
    .map(spawn => ({
      position: spawn.position,
      type: spawn.type.name,
      effect: spawn.type.effect
    }))
  
  const nearbyHazards = arena.hazards
    .filter(hazard => {
      const dist = Math.abs(hazard.position.x - agent.position.x) + 
                   Math.abs(hazard.position.y - agent.position.y)
      return dist <= 2
    })
    .map(hazard => ({
      position: hazard.position,
      type: hazard.type,
      description: hazard.description
    }))
  
  return {
    tick,
    self: {
      hp: agent.hp,
      maxHp: agent.maxHp,
      energy: agent.energy,
      position: agent.position,
      harness: agent.harness,
      stats: agent.stats,
      inventory: agent.inventory?.map(i => ({ id: i.id, name: i.name, effect: i.effect })) || [],
      buffs: {
        damageBoost: agent.damageBoostActive ? agent.damageBoostDuration : 0,
        speedBoost: agent.speedBoostActive ? agent.speedBoostDuration : 0,
        shield: agent.shieldActive ? 1 : 0
      }
    },
    enemy: {
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      energy: enemy.energy,
      position: enemy.position,
      harness: enemy.harness,
      estimatedDefense: enemy.stats.defense
    },
    arena: {
      size: arena.width,
      obstacles: arena.obstacles,
      nearbyItems,
      nearbyHazards
    },
    available_actions: [
      ACTIONS.ATTACK,
      ACTIONS.MOVE,
      ACTIONS.DEFEND,
      ACTIONS.CHARGE,
      ...(agent.inventory?.length > 0 ? [ACTIONS.USE_ITEM] : [])
    ]
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
