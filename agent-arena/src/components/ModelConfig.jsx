import { useState } from 'react'
import './ModelConfig.css'

const HARNESS_OPTIONS = [
  { id: 'scout', name: 'Scout', description: 'Fast and agile, better map awareness', stats: { speed: 9, defense: 4, energy: 7 } },
  { id: 'tank', name: 'Tank', description: 'Heavy armor, slow but durable', stats: { speed: 3, defense: 10, energy: 5 } },
  { id: 'assault', name: 'Assault', description: 'Balanced combat specialist', stats: { speed: 6, defense: 6, energy: 6 } },
  { id: 'sniper', name: 'Sniper', description: 'Long-range precision, low mobility', stats: { speed: 5, defense: 3, energy: 8 } }
]

const MODEL_OPTIONS = [
  { id: 'llama3.2:1b', name: 'Llama 3.2 1B', size: '1B', speed: 'Very Fast' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 3B', size: '3B', speed: 'Fast' },
  { id: 'gemma2:2b', name: 'Gemma 2 2B', size: '2B', speed: 'Fast' },
  { id: 'phi3:mini', name: 'Phi-3 Mini', size: '3.8B', speed: 'Fast' },
  { id: 'mistral:7b', name: 'Mistral 7B', size: '7B', speed: 'Medium' },
  { id: 'qwen2.5:3b', name: 'Qwen 2.5 3B', size: '3B', speed: 'Fast' }
]

function ModelConfig({ config, onSave, onBack }) {
  const [localConfig, setLocalConfig] = useState(config)

  const updateConfig = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(localConfig)
  }

  return (
    <div className="config-screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      
      <h2>Configure Your Agent</h2>
      
      <form onSubmit={handleSubmit} className="config-form">
        <div className="config-section">
          <h3>🧠 Select Model</h3>
          <div className="model-grid">
            {MODEL_OPTIONS.map(model => (
              <label 
                key={model.id} 
                className={`model-card ${localConfig.modelName === model.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="modelName"
                  value={model.id}
                  checked={localConfig.modelName === model.id}
                  onChange={(e) => updateConfig('modelName', e.target.value)}
                />
                <div className="model-info">
                  <strong>{model.name}</strong>
                  <span className="model-size">{model.size}</span>
                  <span className="model-speed">{model.speed}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>⚙️ Choose Harness</h3>
          <div className="harness-grid">
            {HARNESS_OPTIONS.map(harness => (
              <label 
                key={harness.id} 
                className={`harness-card ${localConfig.harness === harness.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="harness"
                  value={harness.id}
                  checked={localConfig.harness === harness.id}
                  onChange={(e) => updateConfig('harness', e.target.value)}
                />
                <div className="harness-info">
                  <strong>{harness.name}</strong>
                  <p>{harness.description}</p>
                  <div className="stats-bar">
                    <div className="stat">
                      <span>SPD</span>
                      <div className="stat-fill" style={{ width: `${harness.stats.speed * 10}%` }}></div>
                    </div>
                    <div className="stat">
                      <span>DEF</span>
                      <div className="stat-fill" style={{ width: `${harness.stats.defense * 10}%` }}></div>
                    </div>
                    <div className="stat">
                      <span>NRG</span>
                      <div className="stat-fill" style={{ width: `${harness.stats.energy * 10}%` }}></div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>📝 System Prompt</h3>
          <textarea
            value={localConfig.systemPrompt}
            onChange={(e) => updateConfig('systemPrompt', e.target.value)}
            rows={6}
            placeholder="Enter your agent's system prompt..."
            className="prompt-input"
          />
          <p className="hint">Define your agent's personality, priorities, and strategic approach.</p>
        </div>

        <div className="config-section">
          <h3>🎛️ Parameters</h3>
          <div className="params-grid">
            <div className="param-control">
              <label>Temperature: {localConfig.temperature}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
              />
              <div className="param-labels">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="param-control">
              <label>Max Tokens: {localConfig.maxTokens}</label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={localConfig.maxTokens}
                onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
              />
              <div className="param-labels">
                <span>Concise</span>
                <span>Detailed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button type="button" className="btn-secondary" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn-primary">Start Battle</button>
        </div>
      </form>
    </div>
  )
}

export default ModelConfig
