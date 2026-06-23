/* ========================================
   ANUBIS ROMANIA - STAFF PANEL
   ======================================== */

class StaffManager {
    constructor() {
        this.auth = window.auth;
        this.init();
    }

    init() {
        this.updateUI();
        this.bindEvents();
        this.loadUsersList();
        this.loadLogs();
    }

    updateUI() {
        const isStaff = this.auth.isStaff();
        const isAdmin = this.auth.isAdmin();
        const isOwner = this.auth.isOwner();
        
        const staffPanel = document.getElementById('staffPanel');
        if (staffPanel) {
            staffPanel.style.display = isStaff ? 'block' : 'none';
        }
        
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
        
        document.querySelectorAll('.owner-only').forEach(el => {
            el.style.display = isOwner ? 'block' : 'none';
        });
        
        const staffBadge = document.getElementById('staffBadge');
        if (staffBadge) {
            staffBadge.style.display = isStaff ? 'inline-block' : 'none';
        }
        
        const userRank = document.getElementById('userRank');
        if (userRank && this.auth.currentUser) {
            userRank.textContent = this.auth.getRankLabel(this.auth.currentUser.rank);
            userRank.style.color = this.auth.getRankColor(this.auth.currentUser.rank);
        }
    }

    bindEvents() {
        document.querySelectorAll('.staff-action').forEach(action => {
            action.addEventListener('click', () => {
                const cmd = action.dataset.command;
                this.executeStaffCommand(cmd);
            });
        });
    }

    loadUsersList() {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        const users = this.auth.getAllUsers();
        const currentUser = this.auth.currentUser ? this.auth.currentUser.name : '';
        
        if (users.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Nu există utilizatori.</p>';
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-details">
                    <strong>${user.name}</strong>
                    <span style="color:var(--text-muted);font-size:0.8rem;">(ID: ${user.id})</span>
                    <span class="rank-badge ${['staff','admin','owner'].includes(user.rank) ? 'staff' : ''}">
                        ${this.auth.getRankLabel(user.rank)}
                    </span>
                    ${user.ip ? `<span style="font-size:0.7rem;color:var(--text-muted);font-family:monospace;">${user.ip}</span>` : ''}
                </div>
                ${this.auth.isAdmin() && user.name !== 'Administrator' && user.name !== currentUser ? `
                    <div class="user-actions">
                        <button class="btn-promote" data-user="${user.name}">⬆ Promovează</button>
                        <button class="btn-demote" data-user="${user.name}">⬇ Retrogradă</button>
                        <button class="btn-delete-user" data-user="${user.name}">🗑️</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        document.querySelectorAll('.btn-promote').forEach(btn => {
            btn.addEventListener('click', () => this.handlePromote(btn.dataset.user));
        });
        document.querySelectorAll('.btn-demote').forEach(btn => {
            btn.addEventListener('click', () => this.handleDemote(btn.dataset.user));
        });
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => this.handleDelete(btn.dataset.user));
        });
        
        const userCount = document.getElementById('userCount');
        if (userCount) userCount.textContent = 'Total: ' + users.length;
    }

    loadLogs() {
        const container = document.getElementById('logsList');
        if (!container) return;
        
        const logs = JSON.parse(localStorage.getItem('anubis_logs') || '[]');
        
        if (logs.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Nu există activități recente.</p>';
            return;
        }
        
        const recentLogs = logs.slice(-10).reverse();
        
        container.innerHTML = recentLogs.map(log => `
            <div class="log-item">
                <span class="log-time">${log.time}</span>
                <span class="log-action">${log.action}</span>
            </div>
        `).join('');
    }

    handlePromote(username) {
        if (!this.auth.isAdmin()) {
            this.showToast('⛔ Acces Interzis', 'Nu ai permisiunea să promovezi utilizatori.', 'error');
            return;
        }
        
        const result = this.auth.promoteUser(username);
        this.showToast(
            result.success ? '✅ Succes' : '❌ Eroare',
            result.message,
            result.success ? 'success' : 'error'
        );
        
        if (result.success) {
            this.loadUsersList();
            this.logAction('Promovat utilizatorul ' + username);
        }
    }

    handleDemote(username) {
        if (!this.auth.isAdmin()) {
            this.showToast('⛔ Acces Interzis', 'Nu ai permisiunea să retrogradezi utilizatori.', 'error');
            return;
        }
        
        const result = this.auth.demoteUser(username);
        this.showToast(
            result.success ? '✅ Succes' : '❌ Eroare',
            result.message,
            result.success ? 'success' : 'error'
        );
        
        if (result.success) {
            this.loadUsersList();
            this.logAction('Retrogradat utilizatorul ' + username);
        }
    }

    handleDelete(username) {
        if (!this.auth.isAdmin()) {
            this.showToast('⛔ Acces Interzis', 'Nu ai permisiunea să ștergi utilizatori.', 'error');
            return;
        }
        
        if (!confirm('Ești sigur că vrei să ștergi utilizatorul ' + username + '?')) return;
        
        const result = this.auth.deleteUser(username);
        this.showToast(
            result.success ? '✅ Succes' : '❌ Eroare',
            result.message,
            result.success ? 'success' : 'error'
        );
        
        if (result.success) {
            this.loadUsersList();
            this.logAction('Șters utilizatorul ' + username);
        }
    }

    executeStaffCommand(command) {
        switch(command) {
            case 'kick':
                const kickPlayer = prompt('ID-ul jucătorului de dat kick:');
                if (kickPlayer) {
                    this.showToast('✅ Kick', 'Jucătorul ' + kickPlayer + ' a primit kick.', 'success');
                    this.logAction('Kick jucător ' + kickPlayer);
                }
                break;
                
            case 'ban':
                const banPlayer = prompt('ID-ul jucătorului de banat:');
                if (banPlayer) {
                    const reason = prompt('Motivul banului:');
                    this.showToast('✅ Ban', 'Jucătorul ' + banPlayer + ' a fost banat. Motiv: ' + (reason || 'Nespecificat'), 'success');
                    this.logAction('Ban jucător ' + banPlayer + ' - ' + (reason || 'Nespecificat'));
                }
                break;
                
            case 'unban':
                const unbanPlayer = prompt('ID-ul jucătorului de debanat:');
                if (unbanPlayer) {
                    this.showToast('✅ Unban', 'Jucătorul ' + unbanPlayer + ' a fost debanat.', 'success');
                    this.logAction('Unban jucător ' + unbanPlayer);
                }
                break;
                
            case 'warn':
                const warnPlayer = prompt('ID-ul jucătorului de avertizat:');
                if (warnPlayer) {
                    const reason = prompt('Motivul avertismentului:');
                    this.showToast('⚠️ Avertisment', 'Jucătorul ' + warnPlayer + ' a primit avertisment. Motiv: ' + (reason || 'Nespecificat'), 'success');
                    this.logAction('Avertisment jucător ' + warnPlayer + ' - ' + (reason || 'Nespecificat'));
                }
                break;
                
            case 'freeze':
                const freezePlayer = prompt('ID-ul jucătorului de înghețat:');
                if (freezePlayer) {
                    this.showToast('❄️ Înghețat', 'Jucătorul ' + freezePlayer + ' a fost înghețat.', 'success');
                    this.logAction('Înghețat jucător ' + freezePlayer);
                }
                break;
                
            case 'unfreeze':
                const unfreezePlayer = prompt('ID-ul jucătorului de dezghețat:');
                if (unfreezePlayer) {
                    this.showToast('🔥 Dezghețat', 'Jucătorul ' + unfreezePlayer + ' a fost dezghețat.', 'success');
                    this.logAction('Dezghețat jucător ' + unfreezePlayer);
                }
                break;
                
            case 'announce':
                const message = prompt('Mesajul de anunțat:');
                if (message) {
                    this.showToast('📢 Anunț', 'Anunț trimis: ' + message, 'success');
                    this.logAction('Anunț: ' + message);
                }
                break;
                
            default:
                this.showToast('ℹ️', 'Comandă în dezvoltare.', '');
        }
    }

    logAction(action) {
        const logs = JSON.parse(localStorage.getItem('anubis_logs') || '[]');
        logs.push({
            time: new Date().toLocaleString('ro-RO'),
            action: action,
            user: this.auth.currentUser ? this.auth.currentUser.name : 'system'
        });
        localStorage.setItem('anubis_logs', JSON.stringify(logs));
        this.loadLogs();
    }

    showToast(title, message, type) {
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
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.staffManager = new StaffManager();
});