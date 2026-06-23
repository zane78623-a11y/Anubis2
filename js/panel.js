/* ========================================
   ANUBIS ROMANIA - PANEL SECTIONS
   Sistem complet de tickete cu comentarii
   ======================================== */

console.log('✅ panel.js încărcat!');

const TICKET_TYPES = {
    ban: { icon: '🔨', label: 'Cerere Ban', desc: 'Raportează un jucător pentru încălcarea regulilor' },
    unban: { icon: '🔓', label: 'Cerere Unban', desc: 'Solicită deblocarea contului tău' },
    bug: { icon: '🐛', label: 'Raport Bug', desc: 'Raportează o eroare sau problemă tehnică' },
    report: { icon: '📢', label: 'Reclamație Jucător', desc: 'Reclamă comportamentul unui jucător' },
    suggest: { icon: '💡', label: 'Sugestie', desc: 'Propune o îmbunătățire pentru server' },
    support: { icon: '🆘', label: 'Suport General', desc: 'Ajutor pentru probleme diverse' },
    appeal: { icon: '⚖️', label: 'Contestare', desc: 'Contestă o decizie a staff-ului' },
    other: { icon: '📌', label: 'Altele', desc: 'Alt tip de ticket' }
};

let tickets = [];
let currentFilter = 'all';
let currentTicketId = null;

// ===== LOAD TICKETS =====
function loadTickets() {
    console.log('🔄 Încărcare tickete...');
    const stored = localStorage.getItem('anubis_tickets');
    if (stored) {
        try {
            tickets = JSON.parse(stored);
        } catch {
            tickets = [];
        }
    } else {
        tickets = [];
        localStorage.setItem('anubis_tickets', JSON.stringify(tickets));
    }
    renderTickets();
    updateStats();
}

// ===== SAVE TICKETS =====
function saveTickets() {
    localStorage.setItem('anubis_tickets', JSON.stringify(tickets));
}

// ===== RENDER TICKETS =====
function renderTickets() {
    let filtered = tickets;
    
    if (currentFilter === 'open') {
        filtered = tickets.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'pending');
    } else if (currentFilter === 'closed') {
        filtered = tickets.filter(t => t.status === 'closed');
    }
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const list = document.getElementById('ticketsList');
    const empty = document.getElementById('emptyState');
    
    if (!list) {
        console.error('❌ Elementul ticketsList nu există!');
        return;
    }
    
    if (filtered.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    list.innerHTML = filtered.map(ticket => `
        <div class="ticket-item" data-id="${ticket.id}">
            <span class="ticket-id">#${ticket.id}</span>
            <div class="ticket-info">
                <div class="ticket-title">${ticket.title}</div>
                <div class="ticket-meta">${formatTime(ticket.createdAt)} • ${ticket.player !== 'N/A' ? ticket.player : 'anonim'}</div>
            </div>
            <span class="ticket-type">${ticket.typeLabel}</span>
            <span class="ticket-status ${ticket.status}">${ticket.statusLabel}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">${ticket.priorityLabel}</span>
            <div class="ticket-actions">
                <button class="btn-view" onclick="openTicketModal('${ticket.id}')" title="Vezi detalii">
                    <i class="fas fa-eye"></i>
                </button>
                ${ticket.status !== 'closed' ? `
                    <button class="btn-close-ticket" onclick="closeTicket('${ticket.id}')" title="Marchează ca rezolvat">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="deleteTicket('${ticket.id}')" title="Șterge ticket">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    updateStats();
}

// ===== UPDATE STATS =====
function updateStats() {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'pending').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    
    const totalEl = document.getElementById('totalTickets');
    const openEl = document.getElementById('openTickets');
    const closedEl = document.getElementById('closedTickets');
    
    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (closedEl) closedEl.textContent = closed;
}

// ===== FORMAT TIME =====
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'acum câteva secunde';
    if (diff < 3600) return 'acum ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'acum ' + Math.floor(diff / 3600) + ' ore';
    return date.toLocaleDateString('ro-RO');
}

// ===== GENERATE ID =====
function generateId() {
    const existing = tickets.map(t => parseInt(t.id));
    let max = 0;
    existing.forEach(id => { if (id > max) max = id; });
    return String(max + 1).padStart(3, '0');
}

// ===== SWITCH SECTION =====
function switchSection(section) {
    console.log('🔄 Schimbare secțiune:', section);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(section + 'Section');
    if (target) {
        target.classList.add('active');
        console.log('✅ Secțiunea', section, 'activată');
    } else {
        console.error('❌ Secțiunea', section, 'nu există!');
    }
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector('.nav-links a[onclick*="' + section + '"]');
    if (link) link.classList.add('active');
    
    if (section === 'tickets') loadTickets();
    if (section === 'rules') loadRules();
}

// ===== OPEN TICKET FORM =====
function openTicketForm(type) {
    const typeData = TICKET_TYPES[type];
    const container = document.getElementById('ticketFormContainer');
    document.getElementById('selectedTypeLabel').textContent = typeData.icon + ' ' + typeData.label;
    document.getElementById('ticketType').value = type;
    container.classList.add('visible');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => document.getElementById('ticketTitle').focus(), 300);
}

// ===== CLOSE TICKET FORM =====
function closeTicketForm() {
    document.getElementById('ticketFormContainer').classList.remove('visible');
    document.getElementById('ticketForm').reset();
}

// ===== CREATE TICKET =====
function createTicket() {
    const type = document.getElementById('ticketType').value;
    const title = document.getElementById('ticketTitle').value.trim();
    const description = document.getElementById('ticketDesc').value.trim();
    const player = document.getElementById('playerName').value.trim() || 'N/A';
    const discord = document.getElementById('discordTag').value.trim() || 'N/A';
    const evidence = document.getElementById('evidence').value.trim() || '';
    const priority = document.getElementById('priority').value;
    
    if (!type || !title || !description) {
        showToast('❌ Eroare', 'Completează toate câmpurile obligatorii!', 'error');
        return;
    }
    
    const typeData = TICKET_TYPES[type];
    const priorityMap = {
        'low': '🟢 Scăzută',
        'medium': '🟡 Medie',
        'high': '🟠 Ridicată',
        'urgent': '🔴 Urgent'
    };
    
    const ticket = {
        id: generateId(),
        type: type,
        typeLabel: typeData.icon + ' ' + typeData.label,
        title: title,
        description: description,
        player: player,
        discord: discord,
        evidence: evidence,
        priority: priority,
        priorityLabel: priorityMap[priority] || priority,
        status: 'open',
        statusLabel: 'Deschis',
        createdAt: new Date().toISOString(),
        comments: []
    };
    
    tickets.unshift(ticket);
    saveTickets();
    closeTicketForm();
    showToast('✅ Ticket Creat!', 'Ticketul #' + ticket.id + ' a fost trimis cu succes.');
    switchSection('tickets');
    loadTickets();
}

// ===== OPEN TICKET MODAL cu comentarii =====
function openTicketModal(id) {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
        showToast('❌ Eroare', 'Ticketul nu a fost găsit!', 'error');
        return;
    }
    
    currentTicketId = id;
    
    const modal = document.getElementById('ticketModal');
    const content = document.getElementById('ticketModalContent');
    
    // Verifică dacă utilizatorul este staff
    const isStaff = window.auth && window.auth.isStaff ? window.auth.isStaff() : false;
    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser.name : 'Anonim';
    
    const statusColors = {
        'open': '🟢 Deschis',
        'pending': '🟡 În așteptare',
        'in-progress': '🔵 În lucru',
        'closed': '⚫ Rezolvat'
    };
    
    // Construiește comentariile
    let commentsHtml = '';
    if (ticket.comments && ticket.comments.length > 0) {
        commentsHtml = ticket.comments.map(comment => `
            <div style="background:rgba(0,0,0,0.2);border-radius:6px;padding:8px 12px;margin-bottom:6px;border-left:3px solid ${comment.isStaff ? 'var(--gold)' : 'var(--primary-color)'};">
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);">
                    <span><strong style="color:${comment.isStaff ? 'var(--gold)' : 'var(--text-primary)'};">${comment.author}</strong> ${comment.isStaff ? '⭐' : ''}</span>
                    <span>${formatTime(comment.createdAt)}</span>
                </div>
                <div style="font-size:0.9rem;color:var(--text-primary);margin-top:2px;">${comment.text}</div>
            </div>
        `).join('');
    } else {
        commentsHtml = '<p style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">Nu există comentarii.</p>';
    }
    
    content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:1.2rem;font-weight:700;color:var(--gold);">#${ticket.id}</span>
                    <span style="font-size:0.85rem;color:var(--text-secondary);">${ticket.typeLabel}</span>
                    <span class="ticket-status ${ticket.status}" style="font-size:0.75rem;">${statusColors[ticket.status] || ticket.statusLabel}</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">${ticket.priorityLabel}</span>
                </div>
                <h3 style="font-size:1.3rem;margin-top:6px;color:var(--text-primary);">${ticket.title}</h3>
            </div>
            <button onclick="closeTicketModal()" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer;padding:4px 8px;">&times;</button>
        </div>
        
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:12px;">${ticket.description}</p>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;">
                <div><span style="color:var(--text-muted);">👤 Jucător:</span> <span style="color:var(--text-primary);">${ticket.player}</span></div>
                <div><span style="color:var(--text-muted);">💬 Discord:</span> <span style="color:var(--text-primary);">${ticket.discord}</span></div>
                <div style="grid-column:1/-1;"><span style="color:var(--text-muted);">📎 Dovezi:</span> <span style="color:var(--text-primary);">${ticket.evidence || 'N/A'}</span></div>
                <div style="grid-column:1/-1;"><span style="color:var(--text-muted);">📅 Creat:</span> <span style="color:var(--text-primary);">${new Date(ticket.createdAt).toLocaleString('ro-RO')}</span></div>
            </div>
        </div>
        
        <div style="border-top:1px solid var(--border-color);padding-top:12px;margin-bottom:12px;">
            <h4 style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:0.95rem;margin-bottom:10px;">
                <i class="fas fa-comments" style="color:var(--gold);"></i> Comentarii (${ticket.comments ? ticket.comments.length : 0})
            </h4>
            <div style="max-height:200px;overflow-y:auto;" id="commentsContainer">
                ${commentsHtml}
            </div>
        </div>
        
        ${ticket.status !== 'closed' ? `
            <div style="border-top:1px solid var(--border-color);padding-top:12px;">
                <div style="display:flex;gap:10px;">
                    <input type="text" id="commentInput" placeholder="Scrie un comentariu..." style="flex:1;padding:10px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;">
                    <button onclick="addComment('${ticket.id}')" class="btn btn-primary" style="width:auto;padding:10px 20px;white-space:nowrap;">
                        <i class="fas fa-paper-plane"></i> Trimite
                    </button>
                </div>
            </div>
        ` : ''}
        
        <div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--border-color);padding-top:12px;margin-top:12px;">
            ${ticket.status !== 'closed' ? `
                <button class="btn btn-primary" onclick="closeTicket('${ticket.id}');closeTicketModal();" style="padding:8px 24px;">
                    <i class="fas fa-check"></i> Marchează Rezolvat
                </button>
            ` : ''}
            <button class="btn btn-outline" onclick="closeTicketModal()" style="padding:8px 24px;">
                <i class="fas fa-times"></i> Închide
            </button>
            <button class="btn btn-danger" onclick="if(confirm('Sigur?')){deleteTicket('${ticket.id}');closeTicketModal();}" style="padding:8px 24px;margin-left:auto;">
                <i class="fas fa-trash"></i> Șterge
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const input = document.getElementById('commentInput');
        if (input) input.focus();
    }, 300);
}

// ===== ADD COMMENT =====
function addComment(ticketId) {
    const input = document.getElementById('commentInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) {
        showToast('❌ Eroare', 'Scrie un comentariu!', 'error');
        return;
    }
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    const isStaff = window.auth && window.auth.isStaff ? window.auth.isStaff() : false;
    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser.name : 'Anonim';
    
    if (!ticket.comments) ticket.comments = [];
    
    ticket.comments.push({
        author: currentUser,
        text: text,
        isStaff: isStaff,
        createdAt: new Date().toISOString()
    });
    
    saveTickets();
    input.value = '';
    showToast('✅ Comentariu adăugat!', 'Mesajul tău a fost trimis.');
    openTicketModal(ticketId);
}

// ===== CLOSE TICKET MODAL =====
function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTicketId = null;
}

// ===== CLOSE TICKET =====
function closeTicket(id) {
    if (!confirm('Ești sigur că vrei să marchezi acest ticket ca rezolvat?')) return;
    
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = 'closed';
        ticket.statusLabel = 'Rezolvat';
        saveTickets();
        renderTickets();
        showToast('✅ Ticket Rezolvat', 'Ticketul #' + id + ' a fost marcat ca rezolvat.');
    }
}

// ===== DELETE TICKET =====
function deleteTicket(id) {
    if (!confirm('Ești sigur că vrei să ștergi ticketul #' + id + '?')) return;
    
    tickets = tickets.filter(t => t.id !== id);
    saveTickets();
    renderTickets();
    showToast('🗑️ Ticket Șters', 'Ticketul #' + id + ' a fost șters.');
}

// ===== FILTER TICKETS =====
function filterTickets(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTickets();
}

// ===== LOAD RULES =====
function loadRules() {
    const container = document.getElementById('rulesContainer');
    if (!container) {
        console.error('❌ rulesContainer nu există!');
        return;
    }
    
    container.innerHTML = `
        <div class="rules-loading">
            <i class="fas fa-spinner"></i>
            <span>Încărcare regulament...</span>
        </div>
    `;
    
    fetch('rules.html')
        .then(response => {
            if (!response.ok) throw new Error('rules.html not found');
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyContent = doc.body.innerHTML;
            container.innerHTML = `
                <div style="padding:4px;max-height:550px;overflow-y:auto;">
                    ${bodyContent}
                </div>
            `;
        })
        .catch(() => {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-muted);">
                    <i class="fas fa-file-alt" style="font-size:2rem;margin-bottom:12px;display:block;color:var(--text-muted);opacity:0.3;"></i>
                    <h3 style="color:var(--text-secondary);">Regulamentul nu a putut fi încărcat</h3>
                    <p style="font-size:0.9rem;">Asigură-te că fișierul <strong>rules.html</strong> există.</p>
                    <br>
                    <a href="rules.html" target="_blank" class="btn btn-gold" style="display:inline-flex;">
                        <i class="fas fa-external-link-alt"></i> Deschide Regulament
                    </a>
                </div>
            `;
        });
}

// ===== TOGGLE STAFF PANEL =====
function toggleStaffPanel() {
    const panel = document.getElementById('staffPanel');
    if (!panel) {
        console.error('❌ staffPanel nu există!');
        return;
    }
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible') && window.staffManager) {
        window.staffManager.loadUsersList();
        window.staffManager.loadLogs();
    }
}

// ===== COPY COMMAND =====
function copyCmd(cmd) {
    navigator.clipboard.writeText(cmd).then(() => {
        showToast('📋 Copiat!', 'Comanda a fost copiată în clipboard.');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = cmd;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('📋 Copiat!', 'Comanda a fost copiată în clipboard.');
    });
}

// ===== TOAST =====
function showToast(title, message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icon = document.getElementById('toastIcon');
    const titleEl = document.getElementById('toastTitle');
    const messageEl = document.getElementById('toastMessage');
    
    toast.className = 'toast';
    if (type === 'error') toast.classList.add('error');
    
    icon.className = 'fas ' + (type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle') + ' toast-icon';
    if (type === 'error') icon.style.color = '#ff4757';
    else icon.style.color = '#00e676';
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Panel inițializat!');
    
    // Verifică sesiunea
    const session = JSON.parse(localStorage.getItem('anubis_session') || 'null');
    console.log('📀 Sesiune:', session);
    
    if (session) {
        const user = session;
        
        document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userId').textContent = 'ID: ' + user.id;
        document.getElementById('userIP').textContent = 'IP: ' + (user.ip || 'N/A');
        
        document.getElementById('panelName').textContent = user.name;
        document.getElementById('panelID').textContent = user.id;
        
        const rankLabel = window.auth ? window.auth.getRankLabel(user.rank) : user.rank;
        const rankColor = window.auth ? window.auth.getRankColor(user.rank) : '#ffd700';
        
        document.getElementById('panelRank').textContent = rankLabel;
        document.getElementById('panelRank').style.color = rankColor;
        document.getElementById('panelIP').textContent = user.ip || 'N/A';
        
        const users = window.auth ? window.auth.getAllUsers() : [];
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('staffCount').textContent = users.filter(u => ['staff','admin','owner'].includes(u.rank)).length;
        
        // Verifică dacă este staff
        const isStaff = ['staff', 'admin', 'owner'].includes(user.rank);
        console.log('🔑 Este staff:', isStaff);
        
        const staffActionBtn = document.getElementById('staffActionBtn');
        if (staffActionBtn) {
            staffActionBtn.style.display = isStaff ? 'inline-flex' : 'none';
        }
        
        const staffBadge = document.getElementById('staffBadge');
        if (staffBadge) {
            staffBadge.style.display = isStaff ? 'inline-block' : 'none';
        }
        
        const userRank = document.getElementById('userRank');
        if (userRank) {
            userRank.textContent = rankLabel;
            userRank.style.color = rankColor;
        }
    } else {
        console.warn('⚠️ Nicio sesiune găsită!');
    }
    
    // Încarcă tickete
    loadTickets();
    
    // Submit form
    const form = document.getElementById('ticketForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            createTicket();
        });
    } else {
        console.error('❌ Formularul ticketForm nu există!');
    }
    
    // Închide modal la click pe overlay
    const modal = document.getElementById('ticketModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeTicketModal();
        });
    }
    
    // Enter key pentru comentarii
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.getElementById('ticketModal').style.display === 'flex') {
            const input = document.getElementById('commentInput');
            if (input && document.activeElement === input) {
                e.preventDefault();
                addComment(currentTicketId);
            }
        }
    });
});

// ===== EXPOSE =====
// ===== SWITCH SECTION =====
function switchSection(section) {
    console.log('🔄 Schimbare secțiune:', section);
    
    // Ascunde toate secțiunile
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Mapează numele secțiunilor
    const sectionMap = {
        'dashboard': 'dashboardSection',
        'tickets': 'ticketsSection',
        'new-ticket': 'newTicketSection',
        'rules': 'rulesSection'
    };
    
    const targetId = sectionMap[section];
    const target = document.getElementById(targetId);
    
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        console.log('✅ Secțiunea', section, 'activată (ID:', targetId, ')');
    } else {
        console.error('❌ Secțiunea', section, 'nu există! ID căutat:', targetId);
        // Încearcă să găsești după ID direct
        const altTarget = document.getElementById(section + 'Section');
        if (altTarget) {
            altTarget.classList.add('active');
            altTarget.style.display = 'block';
            console.log('✅ Secțiunea găsită ca:', section + 'Section');
        }
    }
    
    // Activează link-ul din meniu
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector('.nav-links a[onclick*="' + section + '"]');
    if (link) link.classList.add('active');
    
    // Încarcă datele dacă e cazul
    if (section === 'tickets') loadTickets();
    if (section === 'rules') loadRules();
}
window.openTicketForm = openTicketForm;
window.closeTicketForm = closeTicketForm;
window.openTicketModal = openTicketModal;
window.closeTicketModal = closeTicketModal;
window.addComment = addComment;
window.closeTicket = closeTicket;
window.deleteTicket = deleteTicket;
window.filterTickets = filterTickets;
window.toggleStaffPanel = toggleStaffPanel;
window.copyCmd = copyCmd;
window.showToast = showToast;
window.loadTickets = loadTickets;
window.createTicket = createTicket;
window.renderTickets = renderTickets;
window.updateStats = updateStats;

console.log('✅ panel.js încărcat complet!');
console.log('📋 Funcții disponibile: switchSection, openTicketForm, createTicket, loadTickets, filterTickets');