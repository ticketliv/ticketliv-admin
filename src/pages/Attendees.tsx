import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Calendar as CalendarIcon, Ticket, Tag, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import './Attendees.css';

const Attendees = () => {
  const { categories, events, attendees } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEventId, setSelectedEventId] = useState<string>('All');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive active events based on the category filter to dynamically update the next filter
  const filteredEventsForDropdown = useMemo(() => {
    if (selectedCategory === 'All') return events;
    const activeCat = categories.find(c => c.name === selectedCategory);
    if (!activeCat) return [];
    return events.filter(e => e.categoryIds?.includes(activeCat.id));
  }, [events, categories, selectedCategory]);

  // Handle Event selection reset if Category changes and the current event isn't in that category
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val);
    setSelectedEventId('All');
  };

  // Filter the attendees mapping based on Search, Category, and Event ID
  const displayAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      // 1. Text Search (Full Name, Email, or Mobile)
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || 
        attendee.fullName.toLowerCase().includes(q) ||
        attendee.email.toLowerCase().includes(q) ||
        attendee.mobileNumber.toLowerCase().includes(q);
      
      if (!matchesSearch) return false;

      // 2. Category Filter
      if (selectedCategory !== 'All' && attendee.category !== selectedCategory) {
        return false;
      }

      // 3. Specific Event Filter
      if (selectedEventId !== 'All' && attendee.eventId !== selectedEventId) {
        return false;
      }

      return true;
    });
  }, [attendees, searchQuery, selectedCategory, selectedEventId]);

  // Export Formatting Helpers
  const getExportData = () => {
    return displayAttendees.map(att => {
      const eventData = events.find(e => e.id === att.eventId);
      return {
        'Booking ID': att.id,
        'Attendee Name': att.fullName,
        'Email': att.email,
        'Mobile': att.mobileNumber,
        'Event Name': eventData?.title || 'Unknown Event',
        'Category': att.category,
        'Ticket Type': att.ticketType,
        'Ticket Count': att.ticketCount,
        'Booking Date': att.bookingDate,
        'Status': att.status
      };
    });
  };

  const getDynamicFilename = (extension: string) => {
    let baseName = 'All_Events';
    
    if (selectedEventId !== 'All') {
      const activeEvent = events.find(e => e.id === selectedEventId);
      if (activeEvent) {
        // Replace spaces/special chars with underscores
        baseName = activeEvent.title.replace(/[^a-zA-Z0-9]/g, '_');
      }
    }
    
    // YYYYMMDD_HHMM
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    return `${baseName}_Attendees_${timestamp}.${extension}`;
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(18);
    doc.text('TicketLiv Attendees Report', 14, 22);
    
    // Sub-header (Filters)
    doc.setFontSize(11);
    doc.setTextColor(100);
    const filterText = `Filters Applied -> Category: ${selectedCategory} | Event: ${selectedEventId === 'All' ? 'All' : events.find(e => e.id === selectedEventId)?.title || selectedEventId} | Total: ${displayAttendees.length}`;
    doc.text(filterText, 14, 30);

    const data = getExportData();
    const columns = Object.keys(data[0] || {}).map(key => ({ header: key, dataKey: key }));

    autoTable(doc, {
      startY: 36,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.dataKey as keyof typeof row])),
      theme: 'striped',
      headStyles: { 
        fillColor: [79, 70, 229], // Indigo-600
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Booking ID
        2: { cellWidth: 40 }, // Email
        8: { cellWidth: 25 }  // Booking Date
      },
      didDrawPage: () => {
        // Footer with Timestamp
        const str = `Generated on ${new Date().toLocaleString()}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        // data.settings.margin.left works in older versions, using 14 as fixed fallback
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, 14, pageHeight - 10);
      }
    });

    const filename = getDynamicFilename('pdf');
    doc.save(filename);
    setIsExportMenuOpen(false);
  };

  const exportToExcel = (asCSV = false) => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns to fit content length
    const colWidths = Object.keys(data[0] || {}).map(key => {
      const maxDataLength = Math.max(...data.map(row => {
        const val = row[key as keyof typeof row];
        return val ? val.toString().length : 0;
      }));
      // Width is max of content length or header length + padding
      return { wch: Math.max(maxDataLength, key.length) + 2 };
    });
    
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
    
    const extension = asCSV ? 'csv' : 'xlsx';
    const filename = getDynamicFilename(extension);
    
    XLSX.writeFile(workbook, filename, { bookType: extension });
    setIsExportMenuOpen(false);
  };

  return (
    <div className="attendees-container">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
             <Tag size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Booking User Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>View and search detailed attendee information for all ticket bookings.</p>
          </div>
        </div>
        
        <div className="header-actions">
           <div className="export-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
             <button 
               className="export-btn" 
               onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
               style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
             >
               <Download size={15} /> Export List
             </button>
             
             {isExportMenuOpen && (
               <div className="export-menu glass-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px', zIndex: 100 }}>
                 <button onClick={exportToPDF} className="export-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                   <FileText size={16} className="text-pink-400" /> Export as PDF
                 </button>
                 <button onClick={() => exportToExcel(false)} className="export-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                   <FileSpreadsheet size={16} className="text-emerald-400" /> Export as Excel
                 </button>
                 <button onClick={() => exportToExcel(true)} className="export-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                   <File size={16} className="text-cyan-400" /> Export as CSV
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="glass-panel filter-toolbar">
        {/* Search */}
        <div className="filter-group flex-1">
          <label className="filter-label">Global Search</label>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex-row">
          <div className="filter-group min-w-200">
            <label className="filter-label">Filter by Category</label>
            <div className="select-wrapper">
              <Filter size={16} className="select-icon" />
              <select value={selectedCategory} onChange={handleCategoryChange}>
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group min-w-250">
            <label className="filter-label">Filter by Event</label>
            <div className="select-wrapper">
              <CalendarIcon size={16} className="select-icon" />
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={selectedCategory !== 'All' && filteredEventsForDropdown.length === 0}
              >
                <option value="All">
                  {selectedCategory !== 'All' && filteredEventsForDropdown.length === 0 ? 'No events in category' : 'All Events'}
                </option>
                {filteredEventsForDropdown.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User Details</th>
              <th>Event Info</th>
              <th>Ticket Info</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayAttendees.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-content">
                    <Search size={32} className="text-muted" />
                    <p>No attendees found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayAttendees.map(attendee => {
                const eventData = events.find(e => e.id === attendee.eventId);
                
                return (
                  <tr key={attendee.id}>
                    <td className="font-mono text-muted">{attendee.id}</td>
                    
                    <td>
                      <div className="user-details-cell">
                        <span className="user-name">{attendee.fullName}</span>
                        <span className="user-contact"><Mail size={12}/> {attendee.email}</span>
                        <span className="user-contact"><Phone size={12}/> {attendee.mobileNumber}</span>
                      </div>
                    </td>

                    <td>
                      <div className="event-details-cell">
                        <span className="event-title">{eventData?.title || 'Unknown Event'}</span>
                        <span className="event-category"><Tag size={12}/> {attendee.category}</span>
                      </div>
                    </td>

                    <td>
                      <span className="ticket-badge"><Ticket size={12}/> {attendee.ticketType} <span style={{ opacity: 0.7, paddingLeft: '4px' }}>x {attendee.ticketCount}</span></span>
                    </td>

                    <td className="text-muted text-sm">{attendee.bookingDate}</td>

                    <td>
                      <span className={`status-pill ${attendee.status.toLowerCase()}`}>
                        {attendee.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendees;
