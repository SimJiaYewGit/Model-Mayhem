import { useState, useEffect } from 'react'
import './Workshop.css'
import Arena from '../components/Arena'
import ModelConfig from '../components/ModelConfig'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { FileText, GitCompare, Save, Upload, Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

function Workshop() {
  const [workshopMode, setWorkshopMode] = useState('setup') // setup, battle, analysis
  const [battleHistory, setBattleHistory] = useState([])
  const [decisionTraces, setDecisionTraces] = useState([])
  const [baselineConfig, setBaselineConfig] = useState(null)
  const [candidateConfig, setCandidateConfig] = useState(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [activeAgent, setActiveAgent] = useState('candidate') // 'baseline' or 'candidate'
  const [agentVersions, setAgentVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  
  // Comparison metrics
  const [metrics, setMetrics] = useState({
    baseline: { winRate: 0, avgDamage: 0, avgTurns: 0, invalidActions: 0 },
    candidate: { winRate: 0, avgDamage: 0, avgTurns: 0, invalidActions: 0 }
  })

  const handleBattleEnd = (results, traces) => {
    const newHistory = [...battleHistory, {
      ...results,
      timestamp: new Date().toISOString(),
      agentType: activeAgent,
      config: activeAgent === 'baseline' ? baselineConfig : candidateConfig
    }]
    setBattleHistory(newHistory)
    
    if (traces && traces.length > 0) {
      setDecisionTraces(prev => [...prev, ...traces])
    }
    
    // Update metrics
    updateMetrics(newHistory)
  }

  const updateMetrics = (history) => {
    const baselineBattles = history.filter(h => h.agentType === 'baseline')
    const candidateBattles = history.filter(h => h.agentType === 'candidate')
    
    const calculateMetrics = (battles) => {
      if (battles.length === 0) return { winRate: 0, avgDamage: 0, avgTurns: 0, invalidActions: 0 }
      
      const wins = battles.filter(b => b.result === 'victory').length
      const totalDamage = battles.reduce((sum, b) => sum + (b.playerHp || 0), 0)
      const avgTurns = battles.reduce((sum, b) => sum + (b.tick || 0), 0) / battles.length
      const invalidActions = battles.reduce((sum, b) => sum + (b.invalidActions || 0), 0)
      
      return {
        winRate: (wins / battles.length) * 100,
        avgDamage: totalDamage / battles.length,
        avgTurns: avgTurns,
        invalidActions: invalidActions
      }
    }
    
    setMetrics({
      baseline: calculateMetrics(baselineBattles),
      candidate: calculateMetrics(candidateBattles)
    })
  }

  const saveVersion = () => {
    const version = {
      id: `v${agentVersions.length + 1}`,
      timestamp: new Date().toISOString(),
      config: activeAgent === 'baseline' ? baselineConfig : candidateConfig,
      agentType: activeAgent,
      metrics: metrics[activeAgent],
      notes: ''
    }
    setAgentVersions(prev => [...prev, version])
  }

  const exportData = () => {
    const data = {
      versions: agentVersions,
      history: battleHistory,
      traces: decisionTraces,
      metrics: metrics
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-workshop-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.versions) setAgentVersions(data.versions)
          if (data.history) setBattleHistory(data.history)
          if (data.traces) setDecisionTraces(data.traces)
          if (data.metrics) setMetrics(data.metrics)
        } catch (error) {
          console.error('Failed to import data:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  if (workshopMode === 'setup') {
    return (
      <div className="workshop-setup">
        <div className="workshop-header">
          <h2>🧪 Agent Workshop</h2>
          <p>Test, compare, and iterate on your agent configurations</p>
          <div className="workshop-actions">
            <button className="btn-icon" onClick={saveVersion} title="Save Version">
              <Save size={18} />
            </button>
            <button className="btn-icon" onClick={exportData} title="Export Data">
              <Download size={18} />
            </button>
            <label className="btn-icon" title="Import Data">
              <Upload size={18} />
              <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="mode-selector">
          <button 
            className={`mode-btn ${!comparisonMode ? 'active' : ''}`}
            onClick={() => setComparisonMode(false)}
          >
            <FileText size={20} />
            Single Agent Testing
          </button>
          <button 
            className={`mode-btn ${comparisonMode ? 'active' : ''}`}
            onClick={() => setComparisonMode(true)}
          >
            <GitCompare size={20} />
            A/B Comparison
          </button>
        </div>

        {!comparisonMode ? (
          <div className="single-agent-setup">
            <h3>Configure Test Agent</h3>
            <ModelConfig 
              config={candidateConfig || {}}
              onSave={(config) => {
                setCandidateConfig(config)
                setWorkshopMode('battle')
              }}
              onBack={() => setWorkshopMode('menu')}
              showAdvanced={true}
            />
          </div>
        ) : (
          <div className="ab-comparison-setup">
            <div className="config-column">
              <h3>📊 Baseline Agent</h3>
              <ModelConfig 
                config={baselineConfig || {}}
                onSave={(config) => setBaselineConfig(config)}
                onBack={() => setWorkshopMode('menu')}
                showAdvanced={true}
                agentLabel="Baseline"
              />
            </div>
            <div className="config-column">
              <h3>🚀 Candidate Agent</h3>
              <ModelConfig 
                config={candidateConfig || {}}
                onSave={(config) => setCandidateConfig(config)}
                onBack={() => setWorkshopMode('menu')}
                showAdvanced={true}
                agentLabel="Candidate"
              />
            </div>
            <button 
              className="btn-primary start-battle-btn"
              onClick={() => {
                if (baselineConfig && candidateConfig) {
                  setActiveAgent('baseline')
                  setWorkshopMode('battle')
                }
              }}
              disabled={!baselineConfig || !candidateConfig}
            >
              Start A/B Testing
            </button>
          </div>
        )}

        {agentVersions.length > 0 && (
          <div className="version-history">
            <h3>📜 Version History</h3>
            <div className="version-list">
              {agentVersions.map((version, idx) => (
                <div key={idx} className="version-item">
                  <div className="version-info">
                    <span className="version-id">{version.id}</span>
                    <span className="version-date">{new Date(version.timestamp).toLocaleString()}</span>
                    <span className="version-type">{version.agentType}</span>
                  </div>
                  <div className="version-metrics">
                    Win Rate: {version.metrics.winRate.toFixed(1)}% | 
                    Avg Turns: {version.metrics.avgTurns.toFixed(1)}
                  </div>
                  <button 
                    className="btn-small"
                    onClick={() => {
                      setSelectedVersion(version)
                      if (version.agentType === 'baseline') {
                        setBaselineConfig(version.config)
                      } else {
                        setCandidateConfig(version.config)
                      }
                    }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (workshopMode === 'battle') {
    return (
      <div className="workshop-battle">
        <div className="battle-header">
          <h3>
            {comparisonMode 
              ? `Testing ${activeAgent === 'baseline' ? 'Baseline' : 'Candidate'} Agent`
              : 'Test Battle'}
          </h3>
          <div className="battle-controls">
            {comparisonMode && (
              <button 
                className="btn-small"
                onClick={() => setActiveAgent(activeAgent === 'baseline' ? 'candidate' : 'baseline')}
              >
                Switch to {activeAgent === 'baseline' ? 'Candidate' : 'Baseline'}
              </button>
            )}
            <button 
              className="btn-small btn-secondary"
              onClick={() => setWorkshopMode('analysis')}
            >
              View Analysis
            </button>
          </div>
        </div>
        
        <Arena 
          playerConfig={activeAgent === 'baseline' ? baselineConfig : candidateConfig}
          onBattleEnd={(results) => handleBattleEnd(results, results.traces || [])}
          enableTracing={true}
        />
      </div>
    )
  }

  if (workshopMode === 'analysis') {
    const chartData = [
      { name: 'Win Rate', baseline: metrics.baseline.winRate, candidate: metrics.candidate.winRate },
      { name: 'Avg Damage', baseline: metrics.baseline.avgDamage, candidate: metrics.candidate.avgDamage },
      { name: 'Avg Turns', baseline: metrics.baseline.avgTurns, candidate: metrics.candidate.avgTurns },
      { name: 'Invalid Actions', baseline: metrics.baseline.invalidActions, candidate: metrics.candidate.invalidActions }
    ]

    return (
      <div className="workshop-analysis">
        <div className="analysis-header">
          <h2>📊 Battle Analysis</h2>
          <div className="analysis-controls">
            <button className="btn-small" onClick={() => setWorkshopMode('battle')}>
              Back to Testing
            </button>
            <button className="btn-small" onClick={() => setWorkshopMode('setup')}>
              New Configuration
            </button>
          </div>
        </div>

        <div className="metrics-summary">
          <div className="metric-card">
            <h4>Baseline Performance</h4>
            <div className="metric-value">{metrics.baseline.winRate.toFixed(1)}%</div>
            <div className="metric-label">Win Rate</div>
            <div className="metric-detail">
              {baselineConfig ? `${battleHistory.filter(h => h.agentType === 'baseline').length} battles` : 'No data'}
            </div>
          </div>
          
          <div className="metric-card">
            <h4>Candidate Performance</h4>
            <div className="metric-value">{metrics.candidate.winRate.toFixed(1)}%</div>
            <div className="metric-label">Win Rate</div>
            <div className="metric-detail">
              {candidateConfig ? `${battleHistory.filter(h => h.agentType === 'candidate').length} battles` : 'No data'}
            </div>
          </div>

          {comparisonMode && baselineConfig && candidateConfig && (
            <div className={`metric-card delta ${metrics.candidate.winRate - metrics.baseline.winRate > 0 ? 'positive' : 'negative'}`}>
              <h4>Improvement</h4>
              <div className="metric-value">
                {(metrics.candidate.winRate - metrics.baseline.winRate).toFixed(1)}%
              </div>
              <div className="metric-label">Delta</div>
              <div className="metric-detail">
                {metrics.candidate.winRate > metrics.baseline.winRate ? (
                  <CheckCircle size={16} className="icon-positive" />
                ) : (
                  <AlertCircle size={16} className="icon-negative" />
                )}
              </div>
            </div>
          )}
        </div>

        {comparisonMode && (
          <div className="comparison-chart">
            <h3>Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#8884d8" name="Baseline" />
                <Bar dataKey="candidate" fill="#82ca9d" name="Candidate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="battle-history">
          <h3>Battle History</h3>
          <div className="history-list">
            {battleHistory.slice(-10).reverse().map((battle, idx) => (
              <div key={idx} className="history-item">
                <span className={`result-badge ${battle.result}`}>
                  {battle.result === 'victory' ? '✓' : '✗'}
                </span>
                <span className="agent-type">{battle.agentType}</span>
                <span className="battle-time">{new Date(battle.timestamp).toLocaleTimeString()}</span>
                <span className="battle-ticks">{battle.tick} ticks</span>
              </div>
            ))}
          </div>
        </div>

        {decisionTraces.length > 0 && (
          <div className="decision-traces">
            <h3>Recent Decision Traces</h3>
            <div className="traces-list">
              {decisionTraces.slice(-5).reverse().map((trace, idx) => (
                <div key={idx} className="trace-item">
                  <div className="trace-header">
                    <span className="trace-tick">Tick {trace.tick}</span>
                    <span className="trace-action">{trace.action}</span>
                  </div>
                  <div className="trace-content">
                    <div className="trace-prompt">{trace.prompt?.substring(0, 100)}...</div>
                    <div className="trace-response">{trace.response?.substring(0, 100)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default Workshop
