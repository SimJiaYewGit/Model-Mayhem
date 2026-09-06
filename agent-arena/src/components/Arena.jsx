import { useState, useEffect, useRef } from 'react'
import './Arena.css'
import { ollamaService } from '../ai/ollama'
import { 
  createAgent, 
  executeAction, 
  getBattleStateForLLM, 
  checkWinCondition,
  areAdjacent,
  calculateDistance,
  DIRECTIONS,
  ACTIONS
} from '../game/engine'
import { capitalize } from '../utils/helpers'

const ARENA_SIZE = 12
const TICK_RATE = 1500 // 1.5 seconds per tick (allow time for LLM)
const MAX_TICKS = 50

const HARNESS_STATS = {
  scout: { speed: 9, defense: 4, energy: 7, maxHp: 80 },
  tank: { speed: 3, defense: 10, energy: 5, maxHp: 150 },
  assault: { speed: 6, defense: 6, energy: 6, maxHp: 100 },
  sniper: { speed: 5, defense: 3, energy: 8, maxHp: 70 }
}

function Arena({ playerConfig, onBattleEnd }) {
  const [gameState, setGameState] = useState('initializing')
  const [tick, setTick] = useState(0)
  const [battleLog, setBattleLog] = useState([])
  const [playerAgent, setPlayerAgent] = useState(null)
  const [enemyAgent, setEnemyAgent] = useState(null)
  const [ollamaStatus, setOllamaStatus] = useState('checking')
  const [lastAction, setLastAction] = useState({ player: null, enemy: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const logRef = useRef(null)

  const addLog = (message) => {
    setBattleLog(prev => [...prev, `[Tick ${tick}] ${message}`])
  }

  // Initialize battle
  useEffect(() => {
    const init = async () => {
      const connectionResult = await ollamaService.checkConnection()
      if (connectionResult.success) {
        setOllamaStatus('connected')
        addLog('✅ Connected to Ollama')
      } else {
        setOllamaStatus('disconnected')
        addLog('⚠️ Ollama not available - using simulation mode')
      }

      const enemyHarnesses = ['scout', 'tank', 'assault', 'sniper']
      const enemyHarness = enemyHarnesses[Math.floor(Math.random() * enemyHarnesses.length)]

      const player = createAgent('Your Agent', playerConfig.harness, { x: 2, y: Math.floor(ARENA_SIZE / 2) })
      const enemy = createAgent(`Enemy ${capitalize(enemyHarness)}`, enemyHarness, { x: ARENA_SIZE - 3, y: Math.floor(ARENA_SIZE / 2) })

      setPlayerAgent(player)
      setEnemyAgent(enemy)
      addLog(`⚔️ Battle initialized! Your ${playerConfig.harness} vs Enemy ${enemyHarness}`)
      setGameState('battling')
    }

    init()
  }, [playerConfig])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [battleLog])

  // Battle loop
  useEffect(() => {
    if (gameState !== 'battling' || !playerAgent || !enemyAgent || isProcessing) return

    const interval = setInterval(() => {
      if (!isProcessing) {
        processTick()
      }
    }, TICK_RATE)

    return () => clearInterval(interval)
  }, [gameState, playerAgent, enemyAgent, tick, isProcessing])

  const processTick = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    const newTick = tick + 1
    setTick(newTick)

    if (newTick >= MAX_TICKS) {
      endBattle('timeout')
      setIsProcessing(false)
      return
    }

    try {
      // Get actions from both agents
      const useLLM = ollamaStatus === 'connected' && playerConfig.useLLM !== false
      
      let playerAction, enemyAction
      
      if (useLLM) {
        // Get LLM-based action for player
        const playerState = getBattleStateForLLM(newTick, playerAgent, enemyAgent, ARENA_SIZE)
        const playerResult = await ollamaService.getAgentDecision(
          playerConfig.modelName,
          playerConfig.systemPrompt,
          playerState,
          { temperature: playerConfig.temperature, maxTokens: playerConfig.maxTokens }
        )
        playerAction = playerResult.action || { action: ACTIONS.ATTACK, direction: DIRECTIONS.NONE, reason: 'LLM default' }
        addLog(`🧠 Your agent decides: ${playerAction.action}${playerAction.direction !== 'none' ? ` ${playerAction.direction}` : ''} - "${playerAction.reason}"`)
      } else {
        // Fallback to simulation
        playerAction = simulateAgentAction(playerAgent, enemyAgent, 'player')
      }
      
      // Enemy always uses simulation for now
      enemyAction = simulateAgentAction(enemyAgent, playerAgent, 'enemy')

      // Execute player action
      const playerResult = executeAction(playerAction, playerAgent, enemyAgent, ARENA_SIZE)
      if (playerResult.success) {
        setPlayerAgent(playerResult.agent)
        setEnemyAgent(playerResult.enemy)
        playerResult.log.forEach(log => addLog(log))
      }

      // Check if battle ended after player action
      const winCheck = checkWinCondition(playerResult.agent, playerResult.enemy, newTick, MAX_TICKS)
      if (winCheck.ended) {
        endBattle(winCheck.winner, winCheck.reason)
        setIsProcessing(false)
        return
      }

      // Execute enemy action
      const enemyResult = executeAction(enemyAction, playerResult.enemy, playerResult.agent, ARENA_SIZE)
      if (enemyResult.success) {
        setEnemyAgent(enemyResult.enemy)
        setPlayerAgent(enemyResult.agent)
        enemyResult.log.forEach(log => addLog(log))
      }

      // Final win check
      const finalWinCheck = checkWinCondition(enemyResult.agent, enemyResult.enemy, newTick, MAX_TICKS)
      if (finalWinCheck.ended) {
        endBattle(finalWinCheck.winner === 'agent' ? 'defeat' : 'victory', finalWinCheck.reason)
      }

    } catch (error) {
      console.error('Battle error:', error)
      addLog(`❌ Error: ${error.message}`)
    }

    setIsProcessing(false)
  }

  const simulateAgentAction = (agent, enemy, type) => {
    const distance = calculateDistance(agent.position, enemy.position)
    const canAttack = distance <= 2
    
    // Simple AI logic
    if (canAttack && agent.energy >= 10) {
      return { action: ACTIONS.ATTACK, direction: DIRECTIONS.NONE, reason: `${type} attacks` }
    } else if (agent.energy < 10) {
      return { action: ACTIONS.CHARGE, direction: DIRECTIONS.NONE, reason: `${type} charges energy` }
    } else {
      // Move towards enemy
      const dx = enemy.position.x - agent.position.x
      const dy = enemy.position.y - agent.position.y
      const direction = Math.abs(dx) > Math.abs(dy) 
        ? (dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT)
        : (dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP)
      return { action: ACTIONS.MOVE, direction, reason: `${type} moves ${direction}` }
    }
  }

  const endBattle = (result, reason = 'elimination') => {
    setGameState('ended')
    
    let message
    if (result === 'victory') {
      message = '🎉 VICTORY! Your agent triumphs!'
    } else if (result === 'defeat') {
      message = '💀 DEFEAT! Your agent falls in battle.'
    } else {
      message = '⏱️ TIME UP! Battle ends.'
    }
    
    addLog(message)
    addLog(`Reason: ${reason}`)
    
    setTimeout(() => {
      onBattleEnd({
        result,
        reason,
        tick,
        playerHp: playerAgent?.hp,
        enemyHp: enemyAgent?.hp,
        playerAgent: playerAgent?.harness,
        enemyAgent: enemyAgent?.harness
      })
    }, 2000)
  }

  if (!playerAgent || !enemyAgent) {
    return (
      <div className="arena-loading">
        <div className="loading-spinner">⚙️</div>
        <p>Initializing arena...</p>
        {ollamaStatus === 'checking' && <p className="status">Checking Ollama connection...</p>}
        {ollamaStatus === 'disconnected' && <p className="status warning">⚠️ Running in simulation mode</p>}
      </div>
    )
  }

  return (
    <div className="arena-container">
      <div className="arena-header">
        <h3>⚔️ Battle in Progress</h3>
        <div className="battle-info">
          <div className={`ollama-status ${ollamaStatus}`}>
            {ollamaStatus === 'connected' ? '🟢 LLM Active' : '🟡 Simulation'}
          </div>
          <div className="tick-counter">Tick: {tick}/{MAX_TICKS}</div>
        </div>
      </div>

      <div className="arena-board">
        {/* Player side */}
        <div className="agent-panel player">
          <div className="agent-avatar">
            <div className={`harness-icon ${playerAgent.harness}`}>🤖</div>
          </div>
          <div className="agent-name">{playerAgent.name}</div>
          <div className="agent-harness">{playerAgent.harness.toUpperCase()}</div>
          
          <div className="stat-bar hp-bar">
            <div className="stat-label">HP</div>
            <div 
              className="stat-fill" 
              style={{ 
                width: `${(playerAgent.hp / playerAgent.maxHp) * 100}%`,
                backgroundColor: playerAgent.hp > playerAgent.maxHp * 0.6 ? '#4ade80' : playerAgent.hp > playerAgent.maxHp * 0.3 ? '#fbbf24' : '#f87171'
              }}
            ></div>
            <div className="stat-value">{playerAgent.hp}/{playerAgent.maxHp}</div>
          </div>
          
          <div className="stat-bar energy-bar">
            <div className="stat-label">NRG</div>
            <div 
              className="stat-fill" 
              style={{ 
                width: `${playerAgent.energy}%`,
                backgroundColor: playerAgent.energy > 60 ? '#60a5fa' : playerAgent.energy > 30 ? '#3b82f6' : '#1d4ed8'
              }}
            ></div>
            <div className="stat-value">{playerAgent.energy}</div>
          </div>

          {lastAction.player && (
            <div className="last-action">
              Last: {lastAction.player.action} {lastAction.player.direction !== 'none' ? lastAction.player.direction : ''}
            </div>
          )}
        </div>

        {/* Arena visualization */}
        <div className="arena-visual">
          <div className="grid">
            {Array.from({ length: ARENA_SIZE }).map((_, row) =>
              Array.from({ length: ARENA_SIZE }).map((_, col) => {
                const isPlayer = playerAgent.position.x === col && playerAgent.position.y === row
                const isEnemy = enemyAgent.position.x === col && enemyAgent.position.y === row
                const distance = calculateDistance(playerAgent.position, enemyAgent.position)
                const isInRange = distance <= 2
                
                return (
                  <div 
                    key={`${row}-${col}`} 
                    className={`cell ${isPlayer ? 'player-pos' : ''} ${isEnemy ? 'enemy-pos' : ''} ${isInRange && (isPlayer || isEnemy) ? 'in-range' : ''}`}
                  >
                    {isPlayer && <span className="agent-token player-token">🔵</span>}
                    {isEnemy && <span className="agent-token enemy-token">🔴</span>}
                  </div>
                )
              })
            )}
          </div>
          <div className="distance-indicator">
            Distance: {calculateDistance(playerAgent.position, enemyAgent.position)}
          </div>
        </div>

        {/* Enemy side */}
        <div className="agent-panel enemy">
          <div className="agent-avatar">
            <div className={`harness-icon ${enemyAgent.harness}`}>👾</div>
          </div>
          <div className="agent-name">{enemyAgent.name}</div>
          <div className="agent-harness">{enemyAgent.harness.toUpperCase()}</div>
          
          <div className="stat-bar hp-bar">
            <div className="stat-label">HP</div>
            <div 
              className="stat-fill" 
              style={{ 
                width: `${(enemyAgent.hp / enemyAgent.maxHp) * 100}%`,
                backgroundColor: enemyAgent.hp > enemyAgent.maxHp * 0.6 ? '#4ade80' : enemyAgent.hp > enemyAgent.maxHp * 0.3 ? '#fbbf24' : '#f87171'
              }}
            ></div>
            <div className="stat-value">{enemyAgent.hp}/{enemyAgent.maxHp}</div>
          </div>
          
          <div className="stat-bar energy-bar">
            <div className="stat-label">NRG</div>
            <div 
              className="stat-fill" 
              style={{ 
                width: `${enemyAgent.energy}%`,
                backgroundColor: enemyAgent.energy > 60 ? '#60a5fa' : enemyAgent.energy > 30 ? '#3b82f6' : '#1d4ed8'
              }}
            ></div>
            <div className="stat-value">{enemyAgent.energy}</div>
          </div>

          {lastAction.enemy && (
            <div className="last-action">
              Last: {lastAction.enemy.action} {lastAction.enemy.direction !== 'none' ? lastAction.enemy.direction : ''}
            </div>
          )}
        </div>
      </div>

      <div className="battle-log" ref={logRef}>
        <h4>📜 Battle Log</h4>
        <div className="log-entries">
          {battleLog.map((entry, index) => (
            <div key={index} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      {gameState === 'ended' && (
        <div className="battle-overlay">
          <div className="battle-result">
            <h2>{playerAgent.hp > enemyAgent.hp ? '🎉 Victory!' : '💀 Defeat'}</h2>
            <p>Battle concluded after {tick} ticks</p>
            <div className="final-stats">
              <p>Your HP: {playerAgent.hp} | Enemy HP: {enemyAgent.hp}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Arena
