import React, { useState } from 'react';
import './SeatSelection.css';

interface Seat {
  id: string;
  row: string;
  num: string;
  type: 'Standard' | 'VIP' | 'Premium' | 'Couple' | 'ADA';
  status: 'available' | 'sold' | 'locked' | 'restricted';
  x: number;
  y: number;
}

interface Block {
  id: string;
  name: string;
  points: string; 
  capacity: number;
  sold: number;
}

interface SeatSelectionProps {
  venueName: string;
  blocks: Block[];
  seats: Seat[];
  onSelect?: (seat: Seat) => void;
  onConfirm?: (selectedIds: string[]) => void;
  maxSelectable?: number;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({ 
  venueName,
  blocks,
  seats, 
  onSelect, 
  onConfirm, 
  maxSelectable = 10 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  // Computed Detail Level based on Zoom
  const detailLevel = zoom > 1.8 ? 'SEAT' : zoom > 1.2 ? 'SECTION' : 'OVERVIEW';

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== 'available') return;
    
    if (selectedIds.includes(seat.id)) {
      setSelectedIds(prev => prev.filter(id => id !== seat.id));
    } else {
      if (selectedIds.length < maxSelectable) {
        setSelectedIds(prev => [...prev, seat.id]);
        onSelect?.(seat);
      }
    }
  };

  const handleBlockClick = (blockId: string) => {
    setActiveBlock(blockId);
    setZoom(2.2); // Zoom into the block
  };

  return (
    <div className="seat-selection-widget premium-theme">
      <div className="selection-header">
        <div className="title-area">
          <h3>{venueName}</h3>
          <div className="bread-crumbs">
            <span>Stadium</span> {activeBlock && ` > ${blocks.find(b => b.id === activeBlock)?.name}`}
          </div>
        </div>
        <div className="stats-pill">
          {selectedIds.length} / {maxSelectable} Selected
        </div>
        <div className="zoom-controls">
          <button onClick={() => setZoom(z => z + 0.2)}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}>-</button>
          <button onClick={() => { setZoom(1); setActiveBlock(null); }}>↺</button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <div className="lod-indicator">View: {detailLevel}</div>
        <svg 
          viewBox="0 0 1000 600" 
          className="seating-canvas"
        >
          <g style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            
            {/* STAGE/FIELD OVERLAY */}
            <rect x="250" y="20" width="500" height="60" rx="8" fill="rgba(99, 102, 241, 0.1)" stroke="var(--primary)" strokeDasharray="5,5" />
            <text x="500" y="55" textAnchor="middle" fill="var(--primary)" style={{ fontSize: '16px', fontWeight: 800 }}>MAIN STAGE / FIELD</text>

            {/* OVERVIEW LAYER: Blocks */}
            {detailLevel !== 'SEAT' && blocks.map(block => (
              <g key={block.id} className={`block-group ${activeBlock === block.id ? 'active' : ''}`} onClick={() => handleBlockClick(block.id)}>
                <polygon points={block.points} className="block-shape" />
                <text x="500" y="300" textAnchor="middle" className="block-label">{block.name}</text>
              </g>
            ))}

            {/* SEAT LAYER: High Fidelity Units */}
            {detailLevel === 'SEAT' && seats.map(seat => (
              <g 
                key={seat.id} 
                className={`seat-node ${seat.status} ${selectedIds.includes(seat.id) ? 'selected' : ''}`}
                onClick={() => toggleSeat(seat)}
              >
                {(seat.type as string) === 'Couple' ? (
                   <rect x={seat.x - 15} y={seat.y - 12} width="30" height="24" rx="12" className="couple-seat-shape" />
                ) : (
                  <circle cx={seat.x} cy={seat.y} r="12" className="seat-circle" />
                )}
                
                {zoom > 2.5 && (
                  <text x={seat.x} y={seat.y + 4} textAnchor="middle" className="seat-label-detailed">{seat.num}</text>
                )}
                <title>{`${seat.row}${seat.num} (${seat.type})`}</title>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="selection-legend">
        <div className="legend-item"><div className="dot available"></div> Available</div>
        <div className="legend-item"><div className="dot sold"></div> Sold</div>
        <div className="legend-item"><div className="dot vip"></div> VIP</div>
        <div className="legend-item"><div className="couple-icon"></div> Couple</div>
      </div>

      <div className="selection-footer">
        <button 
          className="btn-confirm" 
          disabled={selectedIds.length === 0}
          onClick={() => onConfirm?.(selectedIds)}
        >
          Assign Selected Seats ({selectedIds.length})
        </button>
      </div>
    </div>
  );
};

export default SeatSelection;
