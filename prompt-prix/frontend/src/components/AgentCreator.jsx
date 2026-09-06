import { useState } from 'react';

const API_BASE = '/api';

/**
 * AgentCreator component for creating and configuring AI agents
 */
export default function AgentCreator({ onAgentCreated, existingAgents }) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [harness, setHarness] = useState('default');
  const [systemPrompt, setSystemPrompt] = useState('You are a strategic battle agent. Fight wisely!');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(256);
  const [decisionRate, setDecisionRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch available models on mount
  useState(async () => {
    try {
      const res = await fetch(`${API_BASE}/agents/models`);
      if (res.ok) {
        const data = await res.json();
        setAvailableModels(data);
        if (data.length > 0 && !model) {
          setModel(data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !model) {
      setError('Name and model are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          model,
          harness,
          systemPrompt,
          temperature,
          topP,
          maxTokens,
          decisionRate,
        }),
      });

      if (res.ok) {
        const agent = await res.json();
        setName('');
        setSystemPrompt('You are a strategic battle agent. Fight wisely!');
        setTemperature(0.7);
        setTopP(0.9);
        setMaxTokens(256);
        onAgentCreated?.(agent);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create agent');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const presetPrompts = [
    {
      name: 'Aggressive',
      prompt: 'You are an aggressive battle agent. Prioritize attacking enemies when they are low on health. Take calculated risks to secure eliminations.',
    },
    {
      name: 'Defensive',
      prompt: 'You are a defensive battle agent. Prioritize staying alive and maintaining high health. Only attack when you have a clear advantage.',
    },
    {
      name: 'Strategic',
      prompt: 'You are a strategic battle agent. Focus on positioning and energy management. Wait for the perfect moment to strike.',
    },
    {
      name: 'Berserker',
      prompt: 'You are a berserker agent. Attack constantly and never retreat. Overwhelm your opponents with relentless aggression.',
    },
  ];

  return (
    <div className="agent-creator">
      <h2>🤖 Create New Agent</h2>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Configuration */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">Agent Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Shadow Striker"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model *</label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading || availableModels.length === 0}
              required
            >
              {availableModels.length === 0 ? (
                <option value="">No models available (is Ollama running?)</option>
              ) : (
                availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({Math.round(m.size / 1e9)}B)
                  </option>
                ))
              )}
            </select>
            {availableModels.length === 0 && (
              <small className="hint">Make sure Ollama is running with models pulled</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="harness">Harness Type</label>
            <select
              id="harness"
              value={harness}
              onChange={(e) => setHarness(e.target.value)}
              disabled={loading}
            >
              <option value="default">Default - Balanced</option>
              <option value="scout">Scout - Fast, Low HP</option>
              <option value="tank">Tank - Slow, High HP</option>
              <option value="assassin">Assassin - High Damage, Fragile</option>
              <option value="support">Support - Energy Efficient</option>
            </select>
          </div>
        </div>

        {/* System Prompt */}
        <div className="form-section">
          <label htmlFor="systemPrompt">System Prompt</label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define your agent's personality and strategy..."
            rows={4}
            disabled={loading}
          />

          <div className="preset-prompts">
            <span className="label">Quick Presets:</span>
            <div className="preset-buttons">
              {presetPrompts.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="preset-btn"
                  onClick={() => setSystemPrompt(preset.prompt)}
                  disabled={loading}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="form-section">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Parameters
          </button>

          {showAdvanced && (
            <div className="advanced-params">
              <div className="form-group">
                <label htmlFor="temperature">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={loading}
                />
                <small className="hint">
                  Lower = more focused, Higher = more creative
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="topP">Top P: {topP.toFixed(2)}</label>
                <input
                  id="topP"
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxTokens">Max Tokens: {maxTokens}</label>
                <input
                  id="maxTokens"
                  type="range"
                  min="64"
                  max="1024"
                  step="32"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="decisionRate">
                  Decision Rate: {decisionRate}/sec
                </label>
                <input
                  id="decisionRate"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={decisionRate}
                  onChange={(e) => setDecisionRate(parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : '✨ Create Agent'}
        </button>
      </form>
    </div>
  );
}
