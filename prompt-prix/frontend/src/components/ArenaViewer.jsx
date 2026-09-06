import { useState, useEffect } from 'react';

const API_BASE = '/api';

/**
 * ArenaViewer component for visualizing the battle arena
 */
export default function ArenaViewer({ game }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  if (!game || !game.arena) {
    return <div className="arena-viewer">No active game</div>;
  }

  const { arena, entities, tick, status, winner, events } = game;
  const size = arena.size;

  // Get cell content at position
  const getCellContent = (x, y) => {
    const obstacle = arena.obstacles.find(o => o.x === x && o.y === y);
    const entity = entities.find(e => e.x === x && e.y === y && e.alive);

    if (entity) {
      return { type: 'entity', entity };
    }
    if (obstacle) {
      return { type: 'obstacle', obstacle };
    }
    return { type: 'empty' };
  };

  // Calculate health percentage
  const getHealthPercent = (hp, maxHp) => {
    return Math.round((hp / maxHp) * 100);
  };

  // Get health color
  const getHealthColor = (percent) => {
    if (percent > 60) return '#4ade80';
    if (percent > 30) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="arena-viewer">
      <div className="arena-header">
        <h2>⚔️ Battle Arena</h2>
        <div className="arena-stats">
          <div className="stat-badge">
            <span className="label">Tick</span>
            <span className="value">{tick}</span>
          </div>
          <div className="stat-badge">
            <span className="label">Status</span>
            <span className={`value ${status}`}>{status}</span>
          </div>
          {winner && (
            <div className="stat-badge winner">
              <span className="label">Winner</span>
              <span className="value">🏆 {winner.slice(0, 13)}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Arena Grid */}
      <div 
        className="arena-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const content = getCellContent(x, y);

          return (
            <div
              key={i}
              className={`cell ${content.type}`}
              onClick={() => content.entity && setSelectedEntity(content.entity)}
              title={
                content.entity
                  ? `${content.entity.id.slice(0, 8)}... HP:${content.entity.hp}`
                  : content.obstacle
                  ? `${content.obstacle.type}`
                  : ''
              }
            >
              {content.type === 'entity' && (
                <div className="entity-marker">
                  🤖
                </div>
              )}
              {content.type === 'obstacle' && (
                <div className="obstacle-marker">
                  {content.obstacle.type === 'wall' ? '🧱' : '🔥'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Entity Details Panel */}
      <div className="entity-panel">
        <h3>Combatants</h3>
        {entities.map(entity => (
          <div
            key={entity.id}
            className={`entity-card ${selectedEntity?.id === entity.id ? 'selected' : ''} ${!entity.alive ? 'dead' : ''}`}
            onClick={() => setSelectedEntity(entity)}
          >
            <div className="entity-header">
              <span className="entity-name">{entity.id.slice(0, 12)}...</span>
              {!entity.alive && <span className="dead-tag">💀</span>}
            </div>
            
            {/* Health Bar */}
            <div className="health-bar-container">
              <div 
                className="health-bar"
                style={{
                  width: `${getHealthPercent(entity.hp, entity.maxHp)}%`,
                  backgroundColor: getHealthColor(getHealthPercent(entity.hp, entity.maxHp)),
                }}
              />
              <span className="health-text">
                {entity.hp}/{entity.maxHp} HP
              </span>
            </div>

            {/* Energy Bar */}
            <div className="energy-bar-container">
              <div 
                className="energy-bar"
                style={{
                  width: `${(entity.energy / entity.maxEnergy) * 100}%`,
                }}
              />
              <span className="energy-text">
                {entity.energy}/{entity.maxEnergy} Energy
              </span>
            </div>

            {/* Position */}
            <div className="entity-position">
              Pos: ({entity.x}, {entity.y})
            </div>
          </div>
        ))}
      </div>

      {/* Selected Entity Detail */}
      {selectedEntity && selectedEntity.alive && (
        <div className="entity-detail">
          <h4>Details: {selectedEntity.id.slice(0, 12)}...</h4>
          <div className="detail-row">
            <span>Position:</span>
            <span>({selectedEntity.x}, {selectedEntity.y})</span>
          </div>
          <div className="detail-row">
            <span>Health:</span>
            <span>{selectedEntity.hp}/{selectedEntity.maxHp}</span>
          </div>
          <div className="detail-row">
            <span>Energy:</span>
            <span>{selectedEntity.energy}/{selectedEntity.maxEnergy}</span>
          </div>
          <div className="detail-row">
            <span>Last Actions:</span>
            <span>{selectedEntity.actions?.length || 0} total</span>
          </div>
        </div>
      )}

      {/* Recent Events Log */}
      {events && events.length > 0 && (
        <div className="events-log">
          <h3>Battle Log</h3>
          <div className="events-list">
            {events.slice(-15).reverse().map((event, i) => (
              <div key={i} className={`event-item ${event.type}`}>
                <span className="event-tick">Tick {event.tick}</span>
                <span className="event-type">{event.type}</span>
                <span className="event-message">
                  {event.message || (
                    event.type === 'attack'
                      ? `${event.attacker?.slice(0, 8)}... → ${event.target?.slice(0, 8)}... (${event.damage} dmg)`
                      : event.type === 'elimination'
                      ? `${event.agent?.slice(0, 8)}... eliminated`
                      : JSON.stringify(event)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
