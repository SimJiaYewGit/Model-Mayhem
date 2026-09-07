import { useState, useEffect } from 'react'
import Arena from './components/Arena'
import ModelConfig from './components/ModelConfig'
import Workshop from './components/Workshop'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // menu, config, battle, results, workshop
  const [playerConfig, setPlayerConfig] = useState({
    modelName: 'llama3.2:1b',
    systemPrompt: 'You are a tactical combat agent. Analyze the battlefield and make strategic decisions.',
    temperature: 0.7,
    maxTokens: 150,
    harness: 'scout'
  })

  return (
    <div className="App">
      <header className="app-header">
        <h1>🤖 Agent Arena</h1>
        <p className="subtitle">AI Model Battler</p>
      </header>

      <main className="app-main">
        {gameState === 'menu' && (
          <div className="menu-screen">
            <h2>Welcome to Agent Arena</h2>
            <p>Build your AI agent, configure its mind, and battle against other models.</p>
            
            <div className="menu-options">
              <button 
                className="btn-primary"
                onClick={() => setGameState('config')}
              >
                Start Battle
              </button>
              
              <button 
                className="btn-secondary"
                onClick={() => setGameState('workshop')}
              >
                🧪 Agent Workshop
              </button>
              
              <div className="feature-list">
                <div className="feature">
                  <h3>🧠 Choose Your Model</h3>
                  <p>Select from local LLMs - size matters less than smart configuration</p>
                </div>
                <div className="feature">
                  <h3>⚙️ Configure Strategy</h3>
                  <p>Set prompts, parameters, and behavioral constraints</p>
                </div>
                <div className="feature">
                  <h3>⚔️ Watch & Learn</h3>
                  <p>Observe battles and iterate on your agent's design</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'config' && (
          <ModelConfig 
            config={playerConfig}
            onSave={(config) => {
              setPlayerConfig(config)
              setGameState('battle')
            }}
            onBack={() => setGameState('menu')}
          />
        )}

        {gameState === 'battle' && (
          <Arena 
            playerConfig={playerConfig}
            onBattleEnd={(results) => {
              setGameState('results')
            }}
          />
        )}

        {gameState === 'results' && (
          <div className="results-screen">
            <h2>Battle Complete!</h2>
            <div className="results-summary">
              <p>Review your agent's performance and refine your strategy.</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setGameState('config')}
            >
              Configure Again
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setGameState('menu')}
            >
              Main Menu
            </button>
          </div>
        )}

        {gameState === 'workshop' && (
          <Workshop
            onBack={() => setGameState('menu')}
          />
        )}
      </main>
    </div>
  )
}

export default App
