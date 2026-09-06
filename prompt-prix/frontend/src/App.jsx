import { useState, useEffect } from 'react'
import AgentCreator from './components/AgentCreator'
import ArenaViewer from './components/ArenaViewer'

const API_BASE = '/api'

function App() {
  const [agents, setAgents] = useState([])
  const [games, setGames] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAgents, setSelectedAgents] = useState([])
  const [autoPlay, setAutoPlay] = useState(false)
  const [tickInterval, setTickInterval] = useState(2000) // 2 seconds per tick

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`)
      const data = await res.json()
      setAgents(data)
    } catch (err) {
      setError('Failed to fetch agents')
    }
  }

  // Fetch games
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_BASE}/games`)
      const data = await res.json()
      setGames(data)
    } catch (err) {
      setError('Failed to fetch games')
    }
  }

  useEffect(() => {
    fetchAgents()
    fetchGames()
  }, [])

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || !currentGame || currentGame.status !== 'running') {
      return
    }

    const interval = setInterval(async () => {
      await processTick()
    }, tickInterval)

    return () => clearInterval(interval)
  }, [autoPlay, currentGame?.status, tickInterval])

  // Handle agent created
  const handleAgentCreated = (newAgent) => {
    setAgents(prev => [...prev, newAgent])
  }

  // Create agent (removed - now using AgentCreator component)
  const createAgent = async (e) => {
    // This is now handled by AgentCreator component
    fetchAgents()
  }

  // Create game
  const createGame = async () => {
    if (selectedAgents.length < 2) {
      setError('Select at least 2 agents')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentIds: selectedAgents,
          maxTicks: 50,
        }),
      })

      if (res.ok) {
        const game = await res.json()
        setCurrentGame(game)
        fetchGames()
        setSelectedAgents([])
      }
    } catch (err) {
      setError('Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  // Start game
  const startGame = async () => {
    if (!currentGame) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/games/${currentGame.id}/start`, {
        method: 'POST',
      })

      if (res.ok) {
        const game = await res.json()
        setCurrentGame(game)
      }
    } catch (err) {
      setError('Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  // Process tick (auto or manual)
  const processTick = async () => {
    if (!currentGame || currentGame.status !== 'running') return

    setLoading(true)
    try {
      // No actions provided - backend will auto-generate from LLM
      const res = await fetch(`${API_BASE}/games/${currentGame.id}/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (res.ok) {
        const game = await res.json()
        setCurrentGame(game)
        
        // Stop auto-play if game ended
        if (game.status === 'finished') {
          setAutoPlay(false)
        }
      }
    } catch (err) {
      setError('Failed to process tick')
    } finally {
      setLoading(false)
    }
  }

  // Toggle agent selection
  const toggleAgentSelection = (agentId) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🏆 Prompt Prix</h1>
        <p>AI Model Battler Arena</p>
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)} style={{marginLeft: '10px'}}>×</button>
        </div>
      )}

      {/* Create Agent Section - Using AgentCreator component */}
      <AgentCreator onAgentCreated={handleAgentCreated} existingAgents={agents} />

      {/* Agents List */}
      <div className="card">
        <h2>📋 Your Agents ({agents.length})</h2>
        {agents.length === 0 ? (
          <p>No agents yet. Create one above!</p>
        ) : (
          <div className="agent-list">
            {agents.map(agent => (
              <div key={agent.id} className="agent-card">
                <h3>{agent.name}</h3>
                <div className="agent-info">Model: {agent.model}</div>
                <div className="agent-info">Harness: {agent.harness}</div>
                <div className="agent-info">
                  Stats: {agent.stats.wins}W - {agent.stats.losses}L
                </div>
                <div style={{marginTop: '10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id)}
                      onChange={() => toggleAgentSelection(agent.id)}
                      disabled={currentGame?.status === 'running'}
                    />
                    Select for battle
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {agents.length >= 2 && (
          <div className="actions">
            <button
              className="button"
              onClick={createGame}
              disabled={selectedAgents.length < 2 || loading || currentGame?.status === 'running'}
              style={{flex: 1, padding: '15px'}}
            >
              {selectedAgents.length < 2
                ? `Select ${2 - selectedAgents.length} more agent(s)`
                : '⚔️ Create Battle'}
            </button>
          </div>
        )}
      </div>

      {/* Current Game */}
      {currentGame && (
        <div className="card">
          <h2>⚔️ Battle Arena</h2>
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{currentGame.tick}</div>
              <div className="stat-label">Tick</div>
            </div>
            <div className="stat">
              <div className="stat-value">{currentGame.status}</div>
              <div className="stat-label">Status</div>
            </div>
            {currentGame.winner && (
              <div className="stat">
                <div className="stat-value">🏆</div>
                <div className="stat-label">Winner</div>
              </div>
            )}
          </div>

          {currentGame.status === 'waiting' && (
            <div className="game-controls">
              <button className="button" onClick={startGame} disabled={loading} style={{marginRight: '10px'}}>
                {loading ? 'Starting...' : '🚀 Start Battle'}
              </button>
              <label style={{display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px'}}>
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  disabled={currentGame.status !== 'running'}
                />
                Auto-play (2s per tick)
              </label>
            </div>
          )}

          {currentGame.status === 'running' && (
            <div className="game-controls">
              <button className="button" onClick={processTick} disabled={loading || autoPlay} style={{marginRight: '10px'}}>
                {loading ? 'Processing...' : '⚡ Next Tick'}
              </button>
              <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                Auto-play
              </label>
              <select
                value={tickInterval}
                onChange={(e) => setTickInterval(parseInt(e.target.value))}
                style={{marginLeft: '10px'}}
                disabled={autoPlay}
              >
                <option value={3000}>3s/tick</option>
                <option value={2000}>2s/tick</option>
                <option value={1000}>1s/tick</option>
                <option value={500}>0.5s/tick</option>
              </select>
            </div>
          )}

          {/* Arena Visualization - Using ArenaViewer component */}
          {currentGame.arena && (
            <ArenaViewer game={currentGame} />
          )}
        </div>
      )}

      {/* Past Games */}
      {games.length > 0 && (
        <div className="card">
          <h2>📜 Battle History</h2>
          {games.slice(0, 5).map(game => (
            <div key={game.id} style={{padding: '10px', borderBottom: '1px solid #eee'}}>
              <strong>Game {game.id.slice(0, 8)}...</strong>
              {' '}— Status: {game.status}
              {game.winner && <span> — Winner: {game.winner.slice(0, 13)}...</span>}
              {' '}— Ticks: {game.tick}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
