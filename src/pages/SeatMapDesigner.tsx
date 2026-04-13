import React, { useState, useRef, useCallback, useEffect } from 'react';
import './SeatMapDesigner.css';
import { toast } from 'react-hot-toast';
import {
  Building2, Film, Music,
  Disc, Save, Paintbrush, Copy, Plus, Layers, Trash2,
  MousePointer2, Move, Armchair, Square, ArrowRight, ArrowDown,
  RotateCcw, ZoomIn, ZoomOut, Grid3X3, Box, CircleDot
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface Seat {
  id: string;
  row: string;
  num: string;
  type: string;
  status: 'available' | 'sold' | 'blocked' | 'selected';
  shape?: 'round' | 'square' | 'chair';
  x: number;
  y: number;
  category?: string;
  price?: number;
}

interface Section {
  id: string;
  name: string;
  seats: Seat[];
  labelY?: number; // Y position for section label on canvas
}

interface Category {
  id: string;
  name: string;
  price: number;
  color: string;
}

type ToolType = 'select' | 'eraser' | 'marquee' | 'paint' | 'move';

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
const SeatMapDesigner: React.FC = () => {
  // ── Core State ──
  const [globalShape, setGlobalShape] = useState<'round' | 'square' | 'chair'>('round');
  const [sections, setSections] = useState<Section[]>([{
    id: 's1', name: 'Main Floor',
    seats: Array.from({ length: 80 }, (_, i) => ({
      id: `seat-${i}`, row: String.fromCharCode(65 + Math.floor(i / 10)),
      num: (i % 10 + 1).toString(), type: 'Standard', status: 'available' as const,
      shape: 'round' as const, x: (i % 10) * 48 + 180, y: Math.floor(i / 10) * 56 + 220,
    })),
    labelY: 195,
  }]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState('s1');
  const [categories, setCategories] = useState<Category[]>([
    { id: 'gen', name: 'General', price: 500, color: '#22c55e' },
    { id: 'vip', name: 'VIP', price: 2500, color: '#8b5cf6' },
    { id: 'plt', name: 'Platinum', price: 5000, color: '#f59e0b' },
  ]);

  // ── Tool State ──
  const [tool, setTool] = useState<ToolType>('select');
  const [activeCategory, setActiveCategory] = useState('General');

  // ── Viewport ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // ── UI State ──
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [showStage, setShowStage] = useState(true);
  const [stageY, setStageY] = useState(80);
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [curvedMode, setCurvedMode] = useState(false);
  const [arcAngle, setArcAngle] = useState(15);
  const [reverseNum, setReverseNum] = useState(false);
  const [reverseRows, setReverseRows] = useState(false);
  const [isDraggingSectionId, setIsDraggingSectionId] = useState<string | null>(null);
  const [taperMode, setTaperMode] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Auto-close popover on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  // ── Computed ──
  const totalSeats = sections.reduce((a, s) => a + s.seats.length, 0);

  /* ═══════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════ */

  const saveLayout = useCallback(() => {
    toast.success('Layout saved!');
  }, []);

  const addSection = useCallback(() => {
    const n = `s-${Date.now()}`;
    setSections(p => [...p, { id: n, name: `Section ${p.length + 1}`, seats: [] }]);
    setCurrentSectionId(n);
  }, []);

  const clearAll = useCallback(() => {
    if (confirmAction === 'clear') {
      setSections([{ id: 's1', name: 'Main Floor', seats: [] }]);
      setCurrentSectionId('s1'); setSelectedSeats([]); setConfirmAction(null);
      toast.success('Venue reset');
    } else { setConfirmAction('clear'); setTimeout(() => setConfirmAction(null), 3000); }
  }, [confirmAction]);

  const deleteSection = useCallback((id: string) => {
    const k = `del-${id}`;
    if (confirmAction === k) {
      setSections(p => { const n = p.filter(s => s.id !== id); return n.length ? n : [{ id: 's1', name: 'Main Floor', seats: [] }]; });
      if (currentSectionId === id) setCurrentSectionId(sections.filter(s => s.id !== id)[0]?.id || 's1');
      setConfirmAction(null); toast.success('Removed');
    } else { setConfirmAction(k); setTimeout(() => setConfirmAction(null), 3000); }
  }, [confirmAction, currentSectionId, sections]);

  const renameSection = useCallback((id: string, name: string) => {
    setSections(p => p.map(s => s.id === id ? { ...s, name: name.trim() || 'Untitled' } : s));
  }, []);

  const applyArchetype = useCallback((type: 'cinema' | 'stadium' | 'hall') => {
    const newSeats: Seat[] = [];
    const base = Date.now();
    const c = { cinema: { r: 8, c: 12, sx: 44, sy: 52, ox: 140, oy: 180 }, stadium: { r: 12, c: 20, sx: 34, sy: 42, ox: 80, oy: 160 }, hall: { r: 6, c: 15, sx: 48, sy: 64, ox: 100, oy: 220 } }[type];
    for (let r = 0; r < c.r; r++)
      for (let col = 0; col < c.c; col++)
        newSeats.push({ id: `${type[0]}-${base}-${r}-${col}`, row: String.fromCharCode(65 + r), num: (col + 1).toString(), type: 'Standard', status: 'available', shape: globalShape, x: col * c.sx + c.ox, y: r * c.sy + c.oy });
    const n = `s-${base}`;
    setSections(p => [...p, { id: n, name: type.charAt(0).toUpperCase() + type.slice(1), seats: newSeats, labelY: c.oy - 25 }]);
    setCurrentSectionId(n); setShowAddMenu(false);
    toast.success(`${type} template added`);
  }, [globalShape]);

  // Box Seats preset
  const addBoxSeats = useCallback((side: 'left' | 'right') => {
    const base = Date.now();
    const boxSeats: Seat[] = [];
    const xBase = side === 'left' ? 30 : 750;
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++)
        boxSeats.push({ id: `box-${base}-${r}-${c}`, row: `B${r + 1}`, num: (c + 1).toString(), type: 'Box', status: 'available', shape: 'square', x: xBase + c * 40, y: 200 + r * 50 });
    const n = `s-${base}`;
    setSections(p => [...p, { id: n, name: `Box ${side === 'left' ? 'L' : 'R'}`, seats: boxSeats }]);
    setCurrentSectionId(n); setShowAddMenu(false);
    toast.success(`Box seats (${side}) added`);
  }, []);

  // Bulk Generator (straight + curved)
  const generateBulk = useCallback(() => {
    const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
    const r1 = g('va-r1').toUpperCase() || 'A';
    const r2 = g('va-r2').toUpperCase() || 'K';
    const s1Val = parseInt(g('va-s1')) || 1;
    const s2Val = parseInt(g('va-s2')) || 30;
    const aisles = g('va-aisle').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
    const gap = parseInt(g('va-gap')) || 60;
    const rowGapsInput = g('va-rowgap').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
    const rowGapPx = parseInt(g('va-rowgappx')) || 60;

    const newSeats: Seat[] = [];
    const base = Date.now();
    const totalRows = r2.charCodeAt(0) - r1.charCodeAt(0) + 1;
    const startWidth = s2Val - s1Val + 1;
    const endWidthInput = parseInt(g('va-endwidth')) || startWidth;
    const finalEndWidth = taperMode ? endWidthInput : startWidth;

    for (let r = 0; r < totalRows; r++) {
      const rowChar = reverseRows 
        ? String.fromCharCode(r2.charCodeAt(0) - r)
        : String.fromCharCode(r1.charCodeAt(0) + r);
      
      // Interpolate column count for tapering
      const currentRowWidth = taperMode 
        ? Math.round(startWidth + (finalEndWidth - startWidth) * (r / (totalRows - 1 || 1)))
        : startWidth;
      
      for (let c = 0; c < currentRowWidth; c++) {
        const seatNum = reverseNum ? (s1Val + currentRowWidth - 1 - c) : (s1Val + c);
        const xOff = aisles.filter(a => c >= a).length * gap;
        const centerShift = (startWidth - currentRowWidth) * 22; // Center tapered rows

        let x: number, y: number;
        if (curvedMode) {
          const centerX = (currentRowWidth * 44) / 2 + 180 + centerShift;
          const angle = ((c - currentRowWidth / 2) / currentRowWidth) * arcAngle;
          const rad = (angle * Math.PI) / 180;
          const radius = 800 - r * 52;
          x = centerX + Math.sin(rad) * radius + xOff;
          y = 280 + r * 52 - Math.cos(rad) * radius + radius;
        } else {
          const rowGapOffset = rowGapsInput.filter((rg: number) => r >= rg).length * rowGapPx;
          x = c * 44 + 180 + xOff + centerShift;
          y = r * 52 + 280 + rowGapOffset;
        }

        newSeats.push({ id: `b-${base}-${r}-${c}`, row: rowChar, num: seatNum.toString(), type: 'Standard', status: 'available', shape: globalShape, x, y });
      }
    }
    setSections(p => p.map(s => s.id === currentSectionId ? { ...s, seats: [...s.seats, ...newSeats] } : s));
    setShowAddMenu(false);
    toast.success(`Generated ${newSeats.length} seats${curvedMode ? ' (curved)' : ''}`);
  }, [currentSectionId, globalShape, curvedMode, arcAngle, reverseNum, reverseRows, taperMode]);

  const cloneSelection = useCallback(() => {
    if (!selectedSeats.length) return;
    const all = sections.flatMap(s => s.seats);
    const sel = all.filter(s => selectedSeats.includes(s.id));
    const w = Math.max(...sel.map(s => s.x)) - Math.min(...sel.map(s => s.x)) + 56;
    const clones: Seat[] = sel.map(s => ({ ...s, id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: s.x + w }));
    setSections(p => p.map(s => s.id === currentSectionId ? { ...s, seats: [...s.seats, ...clones] } : s));
    setSelectedSeats(clones.map(c => c.id));
    toast.success('Duplicated');
  }, [selectedSeats, sections, currentSectionId]);

  const nudge = useCallback((dx: number, dy: number) => {
    setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => selectedSeats.includes(st.id) ? { ...st, x: st.x + dx, y: st.y + dy } : st) })));
  }, [selectedSeats]);

  const mirror = useCallback((axis: 'h' | 'v') => {
    if (!selectedSeats.length) return;
    const all = sections.flatMap(s => s.seats);
    const sel = all.filter(s => selectedSeats.includes(s.id));
    const [mnX, mxX] = [Math.min(...sel.map(s => s.x)), Math.max(...sel.map(s => s.x))];
    const [mnY, mxY] = [Math.min(...sel.map(s => s.y)), Math.max(...sel.map(s => s.y))];
    setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => {
      if (!selectedSeats.includes(st.id)) return st;
      return { ...st, x: axis === 'h' ? mnX + (mxX - st.x) : st.x, y: axis === 'v' ? mnY + (mxY - st.y) : st.y };
    }) })));
  }, [selectedSeats, sections]);

  const delCat = useCallback((id: string) => {
    const k = `dc-${id}`;
    if (confirmAction === k) { setCategories(p => p.filter(c => c.id !== id)); setConfirmAction(null); toast.success('Tier removed'); }
    else { setConfirmAction(k); setTimeout(() => setConfirmAction(null), 3000); }
  }, [confirmAction]);

  /* ═══════════════════════════════════════════════
     MOUSE HANDLERS
     ═══════════════════════════════════════════════ */

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    const el = e.target as HTMLElement;
    if (el.tagName !== 'svg') return;
    if (tool === 'marquee') {
      const r = workspaceRef.current?.getBoundingClientRect();
      if (!r) return;
      setSelectionBox({ x1: (e.clientX - r.left - pan.x) / zoom, y1: (e.clientY - r.top - pan.y) / zoom, x2: (e.clientX - r.left - pan.x) / zoom, y2: (e.clientY - r.top - pan.y) / zoom });
    } else {
      setIsPanning(true); setLastPan({ x: e.clientX, y: e.clientY });
      if (!e.shiftKey) setSelectedSeats([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSectionId) {
      const dx = (e.clientX - lastPan.x) / zoom;
      const dy = (e.clientY - lastPan.y) / zoom;
      setSections(p => p.map(s => s.id === isDraggingSectionId ? { ...s, seats: s.seats.map(st => ({ ...st, x: st.x + dx, y: st.y + dy })) } : s));
      setLastPan({ x: e.clientX, y: e.clientY });
      return;
    }
    if (isDraggingStage) {
      const r = workspaceRef.current?.getBoundingClientRect();
      if (r) setStageY(((e.clientY - r.top - pan.y) / zoom));
      return;
    }
    if (isPanning) {
      setPan(p => ({ x: p.x + e.clientX - lastPan.x, y: p.y + e.clientY - lastPan.y }));
      setLastPan({ x: e.clientX, y: e.clientY });
    } else if (isMouseDown && tool === 'move' && selectedSeats.length > 0) {
      const dx = (e.clientX - lastPan.x) / zoom, dy = (e.clientY - lastPan.y) / zoom;
      setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => selectedSeats.includes(st.id) ? { ...st, x: st.x + dx, y: st.y + dy } : st) })));
      setLastPan({ x: e.clientX, y: e.clientY });
    } else if (selectionBox) {
      const r = workspaceRef.current?.getBoundingClientRect();
      if (!r) return;
      setSelectionBox(p => p ? { ...p, x2: (e.clientX - r.left - pan.x) / zoom, y2: (e.clientY - r.top - pan.y) / zoom } : null);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false); setIsDraggingStage(false); setIsDraggingSectionId(null);
    if (selectionBox) {
      const [mnX, mxX] = [Math.min(selectionBox.x1, selectionBox.x2), Math.max(selectionBox.x1, selectionBox.x2)];
      const [mnY, mxY] = [Math.min(selectionBox.y1, selectionBox.y2), Math.max(selectionBox.y1, selectionBox.y2)];
      const hits: string[] = [];
      sections.forEach(s => s.seats.forEach(st => { if (st.x >= mnX && st.x <= mxX && st.y >= mnY && st.y <= mxY) hits.push(st.id); }));
      setSelectedSeats(p => [...new Set([...p, ...hits])]);
      setSelectionBox(null);
    }
    setIsPanning(false);
  };

  const handleSeatClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'eraser') { setSections(p => p.map(s => ({ ...s, seats: s.seats.filter(st => st.id !== id) }))); return; }
    if (tool === 'paint') { const cat = categories.find(c => c.name === activeCategory); setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => st.id === id ? { ...st, category: cat?.name, price: cat?.price } : st) }))); return; }
    if (e.shiftKey) setSelectedSeats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    else setSelectedSeats([id]);
  };

  /* ═══════════════════════════════════════════════
     SEAT RENDERER
     ═══════════════════════════════════════════════ */

  const renderSeat = useCallback((seat: Seat) => {
    const sel = selectedSeats.includes(seat.id);
    const catObj = categories.find(c => c.name === seat.category);
    const base = seat.status === 'sold' ? '#555' : (catObj?.color || '#22c55e');
    const fill = sel ? '#f84464' : base;
    const sh = seat.shape || globalShape;
    if (sh === 'chair') return (<g><rect x="-12" y="-12" width="24" height="24" rx="5" fill={`${fill}18`} stroke={fill} strokeWidth={sel ? 2.5 : 1.2} /><path d="M-8,3 L8,3 M-10,-4 L-10,6 M10,-4 L10,6" stroke={fill} strokeWidth="1.5" opacity="0.5" /><rect x="-7" y="-10" width="14" height="9" rx="2" fill={`${fill}30`} stroke={fill} strokeWidth="0.8" /></g>);
    if (sh === 'square') return <rect x="-10" y="-10" width="20" height="20" rx="4" fill={sel ? fill : `${fill}18`} stroke={fill} strokeWidth={sel ? 2.5 : 1.2} />;
    return <circle r="9" fill={sel ? fill : `${fill}18`} stroke={fill} strokeWidth={sel ? 2.5 : 1.2} />;
  }, [selectedSeats, categories, globalShape]);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="va-container">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="va-sidebar" style={{ width: 270, borderRight: '1px solid var(--va-border)' }}>
        <div className="va-sidebar-header">
          <h2>Venue Architect</h2>
          <p>Professional Design Suite</p>
        </div>

        <div style={{ padding: '0 1.25rem' }}>
          <div className="va-stats">
            <div className="va-stat"><div className="va-stat-value">{totalSeats}</div><div className="va-stat-label">Seats</div></div>
            <div className="va-stat"><div className="va-stat-value">{sections.length}</div><div className="va-stat-label">Sections</div></div>
            <div className="va-stat"><div className="va-stat-value">{categories.length}</div><div className="va-stat-label">Tiers</div></div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="va-label" style={{ marginBottom: 0 }}>Layers & Sections</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={clearAll} className="va-mini-btn" style={{ background: confirmAction === 'clear' ? 'var(--va-danger)' : 'rgba(244,63,94,0.1)', color: confirmAction === 'clear' ? '#fff' : 'var(--va-danger)' }}>
                {confirmAction === 'clear' ? 'CONFIRM?' : 'RESET'}
              </button>
              <button onClick={addSection} className="va-mini-btn" style={{ background: 'var(--va-primary)', color: '#fff' }}>+ ADD</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sections.map(sec => (
              <div key={sec.id} onClick={() => setCurrentSectionId(sec.id)} className={`va-layer ${currentSectionId === sec.id ? 'active' : ''}`}>
                <Layers size={13} style={{ color: currentSectionId === sec.id ? 'var(--va-primary)' : 'var(--va-text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input className="va-rename-input" defaultValue={sec.name}
                    onBlur={e => renameSection(sec.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    onClick={e => e.stopPropagation()}
                    placeholder="Section name..."
                    style={{ color: currentSectionId === sec.id ? '#fff' : 'var(--va-text-dim)' }} />
                  <div className="va-layer-count">{sec.seats.length} seats</div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {sections.length > 1 && (
                    <button onClick={() => deleteSection(sec.id)} className="va-mini-btn"
                      style={{ background: confirmAction === `del-${sec.id}` ? 'var(--va-danger)' : 'rgba(244,63,94,0.06)', color: confirmAction === `del-${sec.id}` ? '#fff' : 'var(--va-danger)', padding: '3px 6px' }}>
                      {confirmAction === `del-${sec.id}` ? '?' : <Trash2 size={11} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stage Toggle */}
          <div style={{ marginTop: 16 }}>
            <span className="va-label">Canvas Options</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--va-text-dim)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showStage} onChange={e => setShowStage(e.target.checked)} style={{ accentColor: 'var(--va-primary)' }} />
              Show Stage Indicator
            </label>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--va-border)' }}>
          <button onClick={saveLayout} className="va-cta"><Save size={15} /> Push To Live</button>
        </div>
      </div>

      {/* ─── MAIN CANVAS ─── */}
      <div className="va-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        ref={workspaceRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

        {/* Toolbar */}
        <div className="va-toolbar">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAddMenu(!showAddMenu)}
              className={`va-tool-btn ${showAddMenu ? 'active' : ''}`}
              style={showAddMenu ? {} : { background: 'var(--va-primary)', color: '#fff', boxShadow: '0 4px 12px var(--va-primary-glow)' }}>
              <Plus size={17} />
            </button>

            {showAddMenu && (
              <div className="va-popover">
                <span className="va-label">Quick Templates</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 14 }}>
                  <button onClick={() => applyArchetype('stadium')} className="va-preset-btn"><Building2 size={16} />Stadium</button>
                  <button onClick={() => applyArchetype('cinema')} className="va-preset-btn"><Film size={16} />Cinema</button>
                  <button onClick={() => applyArchetype('hall')} className="va-preset-btn"><Music size={16} />Hall</button>
                </div>

                <span className="va-label">Box Seats</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 14 }}>
                  <button onClick={() => addBoxSeats('left')} className="va-preset-btn"><Box size={16} />Box Left</button>
                  <button onClick={() => addBoxSeats('right')} className="va-preset-btn"><Box size={16} />Box Right</button>
                </div>

                <span className="va-label">Custom Bulk Generator</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 6 }}>
                  <input id="va-r1" defaultValue="A" placeholder="Row Start" className="va-input" />
                  <input id="va-r2" defaultValue="K" placeholder="Row End" className="va-input" />
                  <input id="va-s1" defaultValue="1" placeholder="Seat Start" className="va-input" />
                  <input id="va-s2" defaultValue="30" placeholder="Seat End" className="va-input" />
                  <input id="va-aisle" defaultValue="15" placeholder="Gaps at column (15,25)" className="va-input" />
                  <input id="va-gap" defaultValue="60" placeholder="Col Gap px" className="va-input" />
                  <input id="va-rowgap" defaultValue="" placeholder="Gaps at row (7,15)" className="va-input" />
                  <input id="va-rowgappx" defaultValue="60" placeholder="Row Gap px" className="va-input" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--va-text-dim)', cursor: 'pointer', flex: 1 }}>
                    <input type="checkbox" checked={taperMode} onChange={e => setTaperMode(e.target.checked)} style={{ accentColor: 'var(--va-primary)' }} />
                    💎 Taper / Diamond Shape
                  </label>
                  {taperMode && (
                    <input id="va-endwidth" type="number" defaultValue="20" placeholder="Last Row Seats" className="va-input" style={{ width: 80 }} />
                  )}
                </div>

                {/* Curved Row Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--va-text-dim)', cursor: 'pointer', flex: 1 }}>
                    <input type="checkbox" checked={curvedMode} onChange={e => setCurvedMode(e.target.checked)} style={{ accentColor: '#8b5cf6' }} />
                    <CircleDot size={12} /> Curved / Arc Rows
                  </label>
                  {curvedMode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 9, color: 'var(--va-text-muted)' }}>Arc:</span>
                      <input type="range" min="5" max="45" value={arcAngle} onChange={e => setArcAngle(parseInt(e.target.value))}
                        style={{ width: 60, accentColor: '#8b5cf6' }} />
                      <span style={{ fontSize: 9, color: 'var(--va-primary)', fontWeight: 800 }}>{arcAngle}°</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--va-text-dim)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reverseNum} onChange={e => setReverseNum(e.target.checked)} style={{ accentColor: 'var(--va-gold)' }} />
                    🔀 Reverse Numbers (30→1)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--va-text-dim)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reverseRows} onChange={e => setReverseRows(e.target.checked)} style={{ accentColor: 'var(--va-gold)' }} />
                    ↕️ Reverse Rows (K→A)
                  </label>
                </div>

                <button onClick={generateBulk} className="va-cta" style={{ borderRadius: 10, fontSize: 11 }}>Generate Into Layer</button>
              </div>
            )}
          </div>

          <div className="va-divider" />
          {([
            { id: 'select' as ToolType, icon: <MousePointer2 size={16} />, t: 'Select', c: 'active' },
            { id: 'move' as ToolType, icon: <Move size={16} />, t: 'Move', c: 'active' },
            { id: 'marquee' as ToolType, icon: <Grid3X3 size={16} />, t: 'Marquee', c: 'active' },
            { id: 'paint' as ToolType, icon: <Paintbrush size={16} />, t: 'Paint', c: 'active-paint' },
            { id: 'eraser' as ToolType, icon: <Trash2 size={16} />, t: 'Eraser', c: 'active-danger' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} className={`va-tool-btn ${tool === t.id ? t.c : ''}`} title={t.t}>{t.icon}</button>
          ))}
          <div className="va-divider" />
          {(['round', 'square', 'chair'] as const).map(s => (
            <button key={s} onClick={() => setGlobalShape(s)} className={`va-tool-btn ${globalShape === s ? 'active' : ''}`} title={s}>
              {s === 'round' ? <Disc size={14} /> : s === 'square' ? <Square size={14} /> : <Armchair size={14} />}
            </button>
          ))}
        </div>

        {/* Context Bar */}
        {selectedSeats.length > 0 && (
          <div className="va-context-bar">
            <span style={{ padding: '0 8px 0 2px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{selectedSeats.length} sel</span>
            <button onClick={cloneSelection} className="va-context-btn"><Copy size={13} /> Clone</button>
            <div style={{ display: 'flex', gap: 2 }}>
              {[['↑', 0, -4], ['↓', 0, 4], ['←', -4, 0], ['→', 4, 0]].map(([label, dx, dy]) => (
                <button key={label as string} onClick={() => nudge(dx as number, dy as number)} className="va-context-btn" style={{ padding: '3px 5px' }}>{label}</button>
              ))}
            </div>
            <button onClick={() => mirror('h')} className="va-context-btn"><ArrowRight size={13} /> H</button>
            <button onClick={() => mirror('v')} className="va-context-btn"><ArrowDown size={13} /> V</button>
            <button onClick={() => setSelectedSeats([])} className="va-context-btn" style={{ background: 'rgba(244,63,94,0.3)' }}>✕</button>
          </div>
        )}

        {/* SVG */}
        <svg style={{ width: '100%', height: '100%' }}>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

            {/* Stage Indicator */}
            {showStage && (
              <g onMouseDown={e => { e.stopPropagation(); setIsDraggingStage(true); }} style={{ cursor: 'ns-resize' }}>
                <rect x="100" y={stageY - 16} width="600" height="32" rx="8" fill="rgba(99, 102, 241, 0.06)" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" strokeDasharray="4 2" />
                <text x="400" y={stageY + 4} textAnchor="middle" fill="rgba(99, 102, 241, 0.4)" style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, pointerEvents: 'none' }}>STAGE</text>
              </g>
            )}

            {/* Sections + Labels + Seats */}
            {sections.map(sec => {
              // Compute label position
              const minY = sec.seats.length ? Math.min(...sec.seats.map(s => s.y)) - 30 : (sec.labelY || 200);
              const minX = sec.seats.length ? Math.min(...sec.seats.map(s => s.x)) : 180;
              const maxX = sec.seats.length ? Math.max(...sec.seats.map(s => s.x)) : 600;
              const centerX = (minX + maxX) / 2;

              return (
                <g key={sec.id} opacity={currentSectionId === sec.id ? 1 : 0.3}>
                  {/* Section Label (Draggable) */}
                  {sec.seats.length > 0 && (
                    <g onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSectionId(sec.id); setLastPan({ x: e.clientX, y: e.clientY }); }} style={{ cursor: 'move' }}>
                      <rect x={centerX - 60} y={minY - 15} width="120" height="20" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
                      <text x={centerX} y={minY} textAnchor="middle" fill={currentSectionId === sec.id ? 'var(--va-primary)' : 'rgba(255,255,255,0.35)'}
                        style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' as const, pointerEvents: 'none' }}>
                        {sec.name}
                      </text>
                    </g>
                  )}
                  {/* Seats & Row Labels */}
                  {Array.from(new Set(sec.seats.map(s => s.row))).map(row => {
                    const rowSeats = sec.seats.filter(s => s.row === row);
                    const minXRow = Math.min(...rowSeats.map(s => s.x));
                    const maxXRow = Math.max(...rowSeats.map(s => s.x));
                    const rowY = rowSeats[0].y;
                    return (
                      <g key={row}>
                        <text x={minXRow - 25} y={rowY + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" style={{ fontSize: '10px', fontWeight: 800 }}>{row}</text>
                        <text x={maxXRow + 25} y={rowY + 4} textAnchor="start" fill="rgba(255,255,255,0.2)" style={{ fontSize: '10px', fontWeight: 800 }}>{row}</text>
                      </g>
                    );
                  })}
                  {sec.seats.map(seat => (
                    <g key={seat.id} transform={`translate(${seat.x}, ${seat.y})`}
                      onClick={e => handleSeatClick(seat.id, e)}
                      onMouseEnter={() => {
                        if (isMouseDown && tool === 'paint') { const cat = categories.find(c => c.name === activeCategory); setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => st.id === seat.id ? { ...st, category: cat?.name, price: cat?.price } : st) }))); }
                        else if (isMouseDown && tool === 'eraser') { setSections(p => p.map(s => ({ ...s, seats: s.seats.filter(st => st.id !== seat.id) }))); }
                      }}
                      style={{ cursor: tool === 'paint' ? 'crosshair' : tool === 'eraser' ? 'not-allowed' : 'pointer' }}>
                      {renderSeat(seat)}
                      <text y="22" textAnchor="middle" fill="rgba(255,255,255,0.15)" style={{ fontSize: '7px', fontWeight: 800, pointerEvents: 'none' }}>{seat.row}{seat.num}</text>
                    </g>
                  ))}
                </g>
              );
            })}

            {selectionBox && (
              <rect x={Math.min(selectionBox.x1, selectionBox.x2)} y={Math.min(selectionBox.y1, selectionBox.y2)}
                width={Math.abs(selectionBox.x2 - selectionBox.x1)} height={Math.abs(selectionBox.y2 - selectionBox.y1)}
                fill="rgba(99,102,241,0.08)" stroke="var(--va-primary)" strokeWidth="1.5" strokeDasharray="6 3" rx="4" />
            )}
          </g>
        </svg>

        {/* Zoom */}
        <div className="va-zoom">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}><ZoomOut size={14} /></button>
          <span className="va-zoom-label">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.15))}><ZoomIn size={14} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset"><RotateCcw size={12} /></button>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR ─── */}
      <div className="va-sidebar" style={{ width: 290, borderLeft: '1px solid var(--va-border)', padding: '1.25rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: 14, borderBottom: '1px solid var(--va-border)', paddingBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Inspector</h3>
          <p style={{ color: 'var(--va-text-muted)', fontSize: 10, margin: '2px 0 0' }}>
            {selectedSeats.length > 0 ? `${selectedSeats.length} units selected` : 'Hall Properties'}
          </p>
        </div>

        {selectedSeats.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            <div>
              <span className="va-label">Labeling</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input type="text" placeholder="Row" className="va-input"
                  onChange={e => setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => selectedSeats.includes(st.id) ? { ...st, row: e.target.value.toUpperCase() } : st) })))} />
                <input type="text" placeholder="Num" className="va-input"
                  onChange={e => setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => selectedSeats.includes(st.id) ? { ...st, num: e.target.value } : st) })))} />
              </div>
            </div>
            <div>
              <span className="va-label">Assign Category</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {categories.map(c => (
                  <button key={c.id} className="va-pill" onClick={() => {
                    setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => selectedSeats.includes(st.id) ? { ...st, category: c.name, price: c.price } : st) })));
                    setActiveCategory(c.name);
                  }} style={{ background: activeCategory === c.name ? c.color : 'rgba(255,255,255,0.04)', borderColor: activeCategory === c.name ? c.color : 'rgba(255,255,255,0.08)', color: activeCategory === c.name ? '#000' : '#fff' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setSections(p => p.map(s => ({ ...s, seats: s.seats.filter(st => !selectedSeats.includes(st.id)) }))); setSelectedSeats([]); toast.success('Deleted'); }}
              style={{ marginTop: 'auto', width: '100%', padding: 11, borderRadius: 100, background: 'rgba(244,63,94,0.08)', border: 'none', color: 'var(--va-danger)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Trash2 size={14} /> Delete Selection
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {/* Pricing Tiers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="va-label" style={{ marginBottom: 0 }}>Pricing Tiers</span>
                <button onClick={() => {
                  const cols = ['#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#ef4444'];
                  setCategories(p => [...p, { id: `c-${Date.now()}`, name: `Tier ${p.length + 1}`, price: 1000, color: cols[p.length % cols.length] }]);
                }} className="va-mini-btn" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--va-primary)' }}>+ New</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {categories.map(cat => (
                  <div key={cat.id} className="va-tier-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                      <div>
                        <input type="text" defaultValue={cat.name} className="va-input-inline" style={{ fontSize: 11, width: 75 }}
                          onBlur={e => { const n = e.target.value.trim() || 'Tier'; setCategories(p => p.map(c => c.id === cat.id ? { ...c, name: n } : c)); setSections(p => p.map(s => ({ ...s, seats: s.seats.map(st => st.category === cat.name ? { ...st, category: n } : st) }))); }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 9, color: 'var(--va-text-muted)' }}>₹</span>
                          <input type="number" defaultValue={cat.price} className="va-input-inline" style={{ fontSize: 10, width: 44, color: 'var(--va-primary)' }}
                            onBlur={e => setCategories(p => p.map(c => c.id === cat.id ? { ...c, price: parseInt(e.target.value) || 0 } : c))} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button onClick={() => { setActiveCategory(cat.name); setTool('paint'); toast.success(`Painting: ${cat.name}`); }} className="va-mini-btn"
                        style={{ background: activeCategory === cat.name && tool === 'paint' ? cat.color : 'rgba(255,255,255,0.04)', color: activeCategory === cat.name && tool === 'paint' ? '#000' : 'var(--va-text-dim)' }}>
                        {activeCategory === cat.name && tool === 'paint' ? '●' : 'Paint'}
                      </button>
                      {categories.length > 1 && (
                        <button onClick={() => delCat(cat.id)} className="va-mini-btn"
                          style={{ background: confirmAction === `dc-${cat.id}` ? 'var(--va-danger)' : 'rgba(244,63,94,0.06)', color: confirmAction === `dc-${cat.id}` ? '#fff' : 'var(--va-danger)', padding: '3px 5px' }}>
                          {confirmAction === `dc-${cat.id}` ? '?' : <Trash2 size={10} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Legend */}
            <div>
              <span className="va-label">Color Legend</span>
              <div className="va-legend">
                {categories.map(c => (
                  <div key={c.id} className="va-legend-item">
                    <div className="va-legend-dot" style={{ background: c.color }} />
                    <span>{c.name} — ₹{c.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: 16, textAlign: 'center', opacity: 0.12 }}>
              <Armchair size={36} />
              <p style={{ fontSize: 9, marginTop: 4 }}>Select seats to inspect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatMapDesigner;
