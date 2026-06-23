/* ========================================
   ANUBIS ROMANIA - AUTH SYSTEM
   Cu localStorage + sync JSONBin
   ======================================== */

const AUTH_CONFIG = {
    STORAGE_KEY: 'anubis_users',
    SESSION_KEY: 'anubis_session',
    BIN_ID: '6a3aecc3da38895dfef3d556',
    API_KEY: '$2a$10$52mhwmpPmpXndDIYVZRhiiOfHtciYfJxDmdIWmdHPo65DLWMeBlu'
};

class AuthSystem {
    constructor() {
        this.users = {};
        this.currentUser = null;
        this.nextId = 1;
        this.syncEnabled = false;
        this.init();
    }

    // ===== LOAD DATA =====
    async loadData() {
        // Încarcă din localStorage
        const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
        if (stored) {
            try {
                this.users = JSON.parse(stored);
                const nextIdStored = localStorage.getItem('anubis_nextId');
                this.nextId = nextIdStored ? parseInt(nextIdStored) : Object.keys(this.users).length + 1;
                console.log('✅ Date încărcate din localStorage! Utilizatori:', Object.keys(this.users).length);
                return;
            } catch (e) {
                console.warn('⚠️ Eroare parsing localStorage:', e);
            }
        }

        // Dacă nu sunt date în localStorage, încearcă JSONBin
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${AUTH_CONFIG.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': AUTH_CONFIG.API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.users = data.record.users || {};
                this.nextId = data.record.nextId || Object.keys(this.users).length + 1;
                this.syncEnabled = true;
                localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(this.users));
                localStorage.setItem('anubis_nextId', String(this.nextId));
                console.log('✅ Date încărcate din JSONBin! Utilizatori:', Object.keys(this.users).length);
                return;
            }
        } catch (e) {
            console.warn('⚠️ JSONBin indisponibil:', e.message);
        }

        // Fallback - creează admin default
        this.users = {
            '1': {
                id: '1',
                name: 'Administrator',
                password: 'hash_12345',
                rank: 'owner',
                ip: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            }
        };
        this.nextId = 2;
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(this.users));
        localStorage.setItem('anubis_nextId', String(this.nextId));
        console.log('✅ Admin default creat!');
    }

    // ===== SAVE USERS =====
    async saveUsers() {
        // Salvează local
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(this.users));
        localStorage.setItem('anubis_nextId', String(this.nextId));
        
        // Încearcă să salveze în JSONBin
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${AUTH_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': AUTH_CONFIG.API_KEY
                },
                body: JSON.stringify({
                    users: this.users,
                    nextId: this.nextId
                })
            });
            
            if (response.ok) {
                this.syncEnabled = true;
                console.log('✅ Date salvate în JSONBin!');
            } else {
                console.warn('⚠️ JSONBin error:', response.status);
            }
        } catch (e) {
            console.warn('⚠️ JSONBin indisponibil, date salvate local');
        }
    }

    // ===== HASH PASSWORD =====
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash = hash & hash;
        }
        return 'hash_' + hash;
    }

    // ===== GENERATE ID =====
    generateId() {
        const id = String(this.nextId);
        this.nextId++;
        return id;
    }

    // ===== GET IP =====
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return '127.0.0.1';
        }
    }

    // ===== REGISTER =====
    async register(name, password) {
        await this.loadData();
        
        const exists = Object.values(this.users).find(u => u.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            return { success: false, message: 'Numele există deja!' };
        }

        const id = this.generateId();
        const ip = await this.getIP();

        this.users[id] = {
            id: id,
            name: name,
            password: this.hashPassword(password),
            rank: 'member',
            ip: ip,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        await this.saveUsers();
        return { success: true, message: 'Cont creat! ID: ' + id, id: id };
    }

    // ===== LOGIN =====
    async login(name, password) {
        await this.loadData();
        
        const entry = Object.entries(this.users).find(([id, u]) => 
            u.name.toLowerCase() === name.toLowerCase()
        );

        if (!entry) {
            return { success: false, message: 'Utilizatorul nu există!' };
        }

        const [id, user] = entry;

        if (this.hashPassword(password) !== user.password) {
            return { success: false, message: 'Parolă incorectă!' };
        }

        const ip = await this.getIP();
        user.ip = ip;
        user.lastLogin = new Date().toISOString();
        await this.saveUsers();

        this.currentUser = {
            id: id,
            name: user.name,
            rank: user.rank,
            ip: ip
        };

        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
    }

    // ===== LOGOUT =====
    logout() {
        this.currentUser = null;
        localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        window.location.href = 'index.html';
    }

    // ===== IS LOGGED IN =====
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // ===== IS STAFF =====
    isStaff() {
        return this.currentUser && ['staff', 'head_staff', 'admin', 'owner'].includes(this.currentUser.rank);
    }

    // ===== IS HEAD STAFF =====
    isHeadStaff() {
        return this.currentUser && ['head_staff', 'admin', 'owner'].includes(this.currentUser.rank);
    }

    // ===== IS ADMIN =====
    isAdmin() {
        return this.currentUser && ['admin', 'owner'].includes(this.currentUser.rank);
    }

    // ===== IS OWNER =====
    isOwner() {
        return this.currentUser && this.currentUser.rank === 'owner';
    }

    // ===== GET RANK LABEL =====
    getRankLabel(rank) {
        const labels = {
            'owner': '👑 Owner',
            'admin': '🛡️ Admin',
            'head_staff': '⭐ Head of Staff',
            'staff': '⭐ Staff',
            'member': '👤 Membru'
        };
        return labels[rank] || rank;
    }

    // ===== GET RANK COLOR =====
    getRankColor(rank) {
        const colors = {
            'owner': '#ffd700',
            'admin': '#00e676',
            'head_staff': '#ff6b6b',
            'staff': '#3498db',
            'member': '#8a9a8a'
        };
        return colors[rank] || '#8a9a8a';
    }

    // ===== GET ALL USERS =====
    getAllUsers() {
        return Object.values(this.users);
    }

    // ===== PROMOTE USER =====
    async promoteUser(username) {
        await this.loadData();
        
        const user = Object.values(this.users).find(u => u.name.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, message: 'Utilizatorul nu există!' };

        const ranks = ['member', 'staff', 'head_staff', 'admin', 'owner'];
        const idx = ranks.indexOf(user.rank);
        if (idx >= ranks.length - 1) {
            return { success: false, message: 'Deja la rang maxim!' };
        }

        user.rank = ranks[idx + 1];
        await this.saveUsers();
        return { success: true, message: username + ' promovat la ' + this.getRankLabel(user.rank) };
    }

    // ===== DEMOTE USER =====
    async demoteUser(username) {
        await this.loadData();
        
        if (username.toLowerCase() === 'administrator') {
            return { success: false, message: 'Nu poți demota owner-ul!' };
        }

        const user = Object.values(this.users).find(u => u.name.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, message: 'Utilizatorul nu există!' };

        const ranks = ['member', 'staff', 'head_staff', 'admin', 'owner'];
        const idx = ranks.indexOf(user.rank);
        if (idx <= 0) {
            return { success: false, message: 'Deja la rang minim!' };
        }

        user.rank = ranks[idx - 1];
        await this.saveUsers();
        return { success: true, message: username + ' retrogradat la ' + this.getRankLabel(user.rank) };
    }

    // ===== DELETE USER =====
    async deleteUser(username) {
        await this.loadData();
        
        if (username.toLowerCase() === 'administrator') {
            return { success: false, message: 'Nu poți șterge owner-ul!' };
        }

        const entry = Object.entries(this.users).find(([id, u]) => u.name.toLowerCase() === username.toLowerCase());
        if (!entry) return { success: false, message: 'Utilizatorul nu există!' };

        delete this.users[entry[0]];
        await this.saveUsers();
        return { success: true, message: username + ' a fost șters!' };
    }

    // ===== FORCE SYNC =====
    async forceSync() {
        console.log('🔄 Sincronizare forțată...');
        await this.saveUsers();
        console.log('✅ Sincronizare completă!');
    }

    // ===== INIT =====
    async init() {
        await this.loadData();
        
        const session = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                if (!this.users[this.currentUser.id]) {
                    this.currentUser = null;
                    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
                }
            } catch {
                this.currentUser = null;
            }
        }
        
        if (window.location.pathname.includes('panel.html') && !this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
        
        if (window.location.pathname.includes('index.html') && this.isLoggedIn()) {
            window.location.href = 'panel.html';
        }
    }
}

window.auth = new AuthSystem();
console.log('✅ Auth System încărcat!');
