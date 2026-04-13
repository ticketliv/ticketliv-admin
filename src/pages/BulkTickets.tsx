import { useState, useMemo } from 'react';
import { 
  Loader2, 
  Ticket as TicketIcon, 
  Zap, 
  QrCode, 
  Download,
  CornerDownRight,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';
import { useApp } from '../context/AppContext';



const BulkTickets = () => {
  const { events } = useApp();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketCount, setTicketCount] = useState(50);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [previewTicket, setPreviewTicket] = useState<any>(null);

  const availableEvents = events;

  const selectedEvent = useMemo(() => 
    availableEvents.find(e => e.id === selectedEventId), 
  [selectedEventId, availableEvents]);

  const handleBulkGenerate = async () => {
    if (!selectedEventId) {
      toast.error('Select an Event Ledger');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedTickets([]);
    
    const newTickets: any[] = [];
    const totalToGenerate = Math.min(ticketCount, 5000);
    
    for (let i = 0; i < totalToGenerate; i++) {
      const t = {
        id: `TL-BL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        index: i + 1,
        tier: 'General Admission',
        holder: 'N/A (Bulk)',
        price: selectedEvent && 'price' in selectedEvent ? `₹${(selectedEvent as any).price}` : '₹2,500'
      };
      
      newTickets.push(t);
      
      // Dynamic visualization logic: show each ticket for small batches, throttle for mass generation
      const shouldUpdateUI = totalToGenerate <= 50 || i % 25 === 0 || i === totalToGenerate - 1;
      
      if (shouldUpdateUI) {
        setPreviewTicket(t);
        setGeneratedTickets([...newTickets]);
        const delay = totalToGenerate > 200 ? 5 : 40; // Slightly longer delay for clarity on small batches
        await new Promise(r => setTimeout(r, delay));
      }
    }

    setGeneratedTickets(newTickets);
    setIsGenerating(false);
    toast.success(`${newTickets.length} tickets ready for export`);
  };

  const drawTicketOnCanvas = (ctx: CanvasRenderingContext2D, t: any) => {
    if (!selectedEvent) return;
    
    // Background & Border
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 600, 200);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 600, 200);
    
    // Left Branding Strip
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 12, 200);
    
    // Meta Header
    ctx.fillStyle = '#000'; ctx.globalAlpha = 1;
    ctx.font = '900 10px Inter, Helvetica'; ctx.fillText('TICKETLIV PRIME', 35, 35);
    ctx.globalAlpha = 0.4;
    ctx.font = '700 10px Inter, Helvetica'; ctx.fillText(t.id, 380, 35);
    ctx.globalAlpha = 1;
    
    // Title
    ctx.font = '900 32px Inter, Helvetica'; ctx.fillText(selectedEvent.title.toUpperCase(), 35, 85);
    
    // Date & Location
    ctx.globalAlpha = 0.5;
    const loc = (selectedEvent as any).location || 'VIRTUAL';
    ctx.font = '700 14px Inter, Helvetica'; ctx.fillText(`${selectedEvent.date.toUpperCase()} | ${loc.toUpperCase()}`, 35, 115);
    ctx.globalAlpha = 1;

    // Category / Value Blocks
    ctx.globalAlpha = 0.4; ctx.font = '800 9px Inter, Helvetica'; 
    ctx.fillText('CATEGORY', 35, 160); ctx.fillText('VALUE', 180, 160);
    ctx.globalAlpha = 1; ctx.font = '900 18px Inter, Helvetica'; 
    ctx.fillText('GENERAL GA', 35, 182); ctx.fillText(t.price, 180, 182);

    // Ticket Stub 
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.moveTo(460, 0); ctx.lineTo(460, 200); ctx.stroke(); ctx.setLineDash([]);
    
    // Stub background
    ctx.fillStyle = '#fcfcfc'; ctx.fillRect(461, 1, 138, 198);
    
    // QR Mockup
    ctx.fillStyle = '#000'; ctx.fillRect(495, 60, 70, 70);
    ctx.fillStyle = '#fff'; ctx.fillRect(499, 64, 62, 62);
    ctx.fillStyle = '#000'; ctx.fillRect(505, 70, 50, 50); // Central QR core
    
    // Stub Label
    ctx.globalAlpha = 0.2; ctx.font = '900 9px Inter, Helvetica';
    ctx.fillText(`PASS_#${t.index}`, 505, 155);
    ctx.globalAlpha = 1;
  };

  const handleDownload = async () => {
    if (!selectedEvent || generatedTickets.length === 0) return;
    
    setIsExporting(true);
    const toastId = toast.loading(`Compiling Manifest...`);
    
    try {
      const fileName = `${selectedEvent.title.replace(/\s+/g, '_')}_BATCH`;

      if (exportFormat === 'pdf') {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
        
        // Front Cover
        doc.setFillColor(20, 20, 20); doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(255); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('TICKET GENERATION MANIFEST', 20, 30);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`EVENT: ${selectedEvent.title.toUpperCase()}`, 20, 50);
        doc.text(`TOTAL COUNT: ${generatedTickets.length}`, 20, 56);
        
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = 600 * 2; canvas.height = 200 * 2; ctx.scale(2, 2);

        const tpp = 4;
        for (let i = 0; i < generatedTickets.length; i++) {
          const t = generatedTickets[i];
          if (i % tpp === 0) doc.addPage();
          
          // Clear and Redraw Canvas for high fidelity
          ctx.clearRect(0,0,600,200);
          drawTicketOnCanvas(ctx, t);
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const yOffset = (i % tpp) * 70 + 10;
          doc.addImage(imgData, 'JPEG', 10, yOffset, 190, 63);
        }
        doc.save(`${fileName}.pdf`);
      } else {
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = 600 * 2; canvas.height = 200 * 2; ctx.scale(2, 2);

        const total = generatedTickets.length;
        // Batch download sequence
        for (let i = 0; i < total; i++) {
          const t = generatedTickets[i];
          toast.loading(`Processing Export ${i + 1}/${total}...`, { id: toastId });
          
          ctx.clearRect(0, 0, 600, 200);
          drawTicketOnCanvas(ctx, t);
          
          const link = document.createElement('a');
          link.download = `${fileName}_T${t.index}_${t.id}.${exportFormat}`;
          link.href = exportFormat === 'jpg' ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL();
          link.click();
          
          // Throttling to prevent chrome from blocking more than 10 sequential downloads
          if (total > 1) {
            await new Promise(r => setTimeout(r, total > 50 ? 50 : 250));
          }
        }
      }
      toast.success('Batch Export Complete', { id: toastId });
    } catch (err) { toast.error('Export failed'); } finally { setIsExporting(false); }
  };

  return (
    <div className="antigravity-bulk-generator">
      <Toaster position="top-right" />
      
      <div className="ambiance-layer">
        <div className="glow-orb p1" />
        <div className="glow-orb p2" />
        <div className="mesh-gradient" />
      </div>

      <div className="master-layout">
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>Bulk Ticket Generation</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Automated high-fidelity pass synthesis and batch compilation system.</p>
        </div>

        <div className="content-grid">
           <div className="glass-card controls-card">
              <div className="control-groups">
                 <div className="input-group">
                    <label>TARGET_EVENT_LEDGER</label>
                    <div className="select-wrapper">
                       <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                          <option value="">Select Event Database...</option>
                          {availableEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                       </select>
                       <CornerDownRight size={16} className="decor-icon" />
                    </div>
                 </div>

                 <div className="input-group">
                    <div className="label-row">
                       <label>GENERATION_QUANTITY</label>
                       <span className="val-badge">{ticketCount}</span>
                    </div>
                    <input 
                       type="range" min="1" max="1000" value={ticketCount} 
                       onChange={(e) => setTicketCount(parseInt(e.target.value))} 
                       className="premium-slider"
                    />
                    <div className="preset-grid">
                       {[50, 100, 500, 1000].map(v => (
                          <button key={v} onClick={() => setTicketCount(v)} className={ticketCount === v ? 'active' : ''}>{v}</button>
                       ))}
                    </div>
                 </div>

                 <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label>MANIFEST_PIPELINE</label>
                    <div className="format-picker">
                       {['png', 'jpg', 'pdf'].map(f => (
                          <button key={f} onClick={() => setExportFormat(f as any)} className={exportFormat === f ? 'active' : ''}>
                             {f.toUpperCase()}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="action-stack">
                 <button disabled={isGenerating || !selectedEventId} onClick={handleBulkGenerate} className="btn-master generate">
                    {isGenerating ? <Loader2 className="spin" /> : <Zap size={20} fill="currentColor" />}
                    {isGenerating ? 'SYNTHESIZING...' : 'START GENERATION'}
                 </button>
                 <button disabled={isExporting || generatedTickets.length === 0} onClick={handleDownload} className="btn-master download">
                    {isExporting ? <Loader2 className="spin" /> : <Download size={20} />}
                    DOWNLOAD
                 </button>
              </div>
           </div>

           <div className="glass-card preview-card">
              {selectedEvent ? (
                 <div className="render-container" style={{ padding: '1rem 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {isGenerating && (
                       <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', letterSpacing: '1px' }}>SYNTHESIZING_BATCH...</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{generatedTickets.length} / {ticketCount}</span>
                       </div>
                    )}
                    
                    <div className="ticket-scroll-slate" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                       {(generatedTickets.length > 0 ? generatedTickets : (previewTicket ? [previewTicket] : [])).slice(0, 50).map((t) => (
                          <div key={t.id} className="physical-ticket-mockup" style={{ marginBottom: '2.5rem', transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                             <div className="ticket-body">
                                <div className="design-strip" />
                                <div className="ticket-info">
                                   <div className="header-meta">
                                      <span className="brand">TICKETLIV PRIME</span>
                                      <span className="id">{t.id}</span>
                                   </div>
                                   <h2 className="title" style={{ fontSize: '1.4rem' }}>{selectedEvent.title}</h2>
                                   <p className="description" style={{ fontSize: '0.65rem' }}>{selectedEvent.date.toUpperCase()} | {(selectedEvent as any).location?.toUpperCase() || (selectedEvent as any).venue_address?.toUpperCase() || 'VIRTUAL'}</p>
                                   
                                   <div className="tier-blocks">
                                      <div className="t-block"><span className="tl">CATEGORY</span><span className="tv">GA</span></div>
                                      <div className="t-block"><span className="tl">VALUE</span><span className="tv">{t.price}</span></div>
                                   </div>
                                </div>
                                <div className="ticket-stub">
                                   <div className="cut-line" />
                                   <div className="qr-wireframe"><QrCode size={30} /></div>
                                   <span className="stub-label" style={{ fontSize: '0.4rem' }}>PASS_#{t.index}</span>
                                </div>
                             </div>
                             <div className="monochrome-footer">HIGH_FIDELITY // ID: {t.id}</div>
                          </div>
                       ))}
                       {generatedTickets.length > 50 && (
                          <div style={{ textAlign: 'center', opacity: 0.3, padding: '2rem', fontSize: '0.7rem' }}>
                             + {generatedTickets.length - 50} more tickets in batch
                          </div>
                       )}
                    </div>

                    <div className="security-guarantee" style={{ marginTop: 'auto', paddingTop: '1.5rem', opacity: 0.2, textAlign: 'center' }}>
                       <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Hardware-accelerated rendering enabled.</span>
                    </div>
                 </div>
              ) : (
                 <div className="render-empty">
                    <TicketIcon size={80} strokeWidth={0.5} opacity={0.1} />
                    <p>AWAITING_LEDGER_SELECTION</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      <style>{`
        .antigravity-bulk-generator {
          background: #08080a;
          min-height: 100vh;
          color: #fff;
          padding: 40px;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }
        .ambiance-layer { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .glow-orb { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); opacity: 0.15; }
        .glow-orb.p1 { background: #6366f1; top: -100px; right: -100px; }
        .glow-orb.p2 { background: #4f46e5; bottom: -200px; left: -100px; }
        .mesh-gradient { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 80%); }
        .master-layout { position: relative; z-index: 10; max-width: 1400px; margin: 0 auto; }
        .content-grid { display: grid; grid-template-columns: 460px 1fr; gap: 3rem; align-items: stretch; }
        .glass-card { 
          background: rgba(255, 255, 255, 0.02); 
          backdrop-filter: blur(20px); 
          border: 1px solid rgba(255, 255, 255, 0.06); 
          border-radius: 36px; padding: 2rem; height: 100%;
        }
        .control-groups { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group label { display: block; font-size: 0.7rem; font-weight: 900; letter-spacing: 1.5px; opacity: 0.6; margin-bottom: 4px; color: #818cf8; }
        .select-wrapper { position: relative; }
        select { 
          width: 100%; padding: 12px; border-radius: 12px; background: #000; border: 1px solid rgba(255,255,255,0.1); 
          color: #fff; font-size: 0.9rem; outline: none; appearance: none; cursor: pointer; transition: 0.3s;
        }
        select:focus { border-color: #6366f1; }
        .decor-icon { position: absolute; right: 15px; top: 12px; opacity: 0.2; pointer-events: none; }
        .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .val-badge { background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 4px 12px; border-radius: 100px; font-weight: 900; font-size: 0.8rem; }
        .premium-slider { -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; outline: none; }
        .premium-slider::-webkit-slider-thumb { 
          -webkit-appearance: none; width: 22px; height: 22px; background: #6366f1; border-radius: 50%; border: 4px solid #fff; cursor: pointer; 
        }
        .preset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px; }
        .preset-grid button { padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); font-size: 0.7rem; font-weight: 900; cursor: pointer; }
        .preset-grid button.active { background: rgba(99, 102, 241, 0.2); border-color: #6366f1; color: #fff; }
        .format-picker { display: flex; gap: 8px; }
        .format-picker button { flex: 1; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid transparent; color: rgba(255,255,255,0.3); font-size: 0.7rem; font-weight: 900; cursor: pointer; }
        .format-picker button.active { background: #fff; color: #000; }
        .action-stack { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
        .btn-master { 
          width: 100%; padding: 1rem; border-radius: 16px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; border: none; 
        }
        .btn-master.generate { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
        .btn-master.download { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
        .btn-master:disabled { opacity: 0.3; cursor: not-allowed; }
        .ticket-body { width: 100%; height: 200px; background: #fff; border-radius: 12px; display: flex; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8); }
        .design-strip { width: 12px; background: #000; }
        .ticket-info { flex: 1; padding: 25px; color: #000; display: flex; flex-direction: column; justify-content: space-between; }
        .header-meta { display: flex; justify-content: space-between; align-items: center; }
        .brand { font-size: 0.6rem; font-weight: 950; letter-spacing: 2px; }
        .id { font-size: 0.6rem; opacity: 0.5; font-weight: 700; }
        .title { font-size: 1.8rem; font-weight: 950; line-height: 1; margin: 10px 0 5px; letter-spacing: -1px; }
        .description { font-size: 0.75rem; opacity: 0.4; font-weight: 700; }
        .tier-blocks { display: flex; gap: 40px; }
        .tl { display: block; font-size: 0.55rem; font-weight: 800; opacity: 0.4; letter-spacing: 1px; }
        .tv { font-size: 0.95rem; font-weight: 900; }
        .ticket-stub { width: 140px; background: #fcfcfc; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .cut-line { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; border-left: 2px dashed rgba(0,0,0,0.1); }
        .qr-wireframe { background: #fff; padding: 12px; border-radius: 10px; color: #000; }
        .stub-label { font-size: 0.55rem; font-weight: 950; color: #bbb; letter-spacing: 1px; }
        .monochrome-footer { margin-top: 15px; font-family: monospace; font-size: 0.6rem; opacity: 0.2; text-align: center; }
        .security-guarantee { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 3.5rem; opacity: 0.2; font-size: 0.75rem; font-weight: 700; }
        .render-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.2; min-height: 300px; }
        .render-empty p { font-size: 0.8rem; font-weight: 900; letter-spacing: 4px; margin-top: 20px; color: #fff; }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BulkTickets;
