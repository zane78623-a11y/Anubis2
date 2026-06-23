/* ========================================
   ANUBIS ROMANIA - AUTH SYSTEM
   ======================================== */

const AUTH_CONFIG = {
    STORAGE_KEY: 'anubis_users',
    SESSION_KEY: 'anubis_session'
};

class AuthSystem {
    constructor() {
        this.users = {};
        this.currentUser = null;
        this.loadData();
        this.init();
    }

    loadData() {
        const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
        if (stored) {
            try {
                this.users = JSON.parse(stored);
            } catch {
                this.users = {};
            }
        }
        
        if (Object.keys(this.users).length === 0) {
            this.users = {
                '1': {
                    id: '1',
                    name: 'Administrator',
                    password: 'hash_12345',
                    rank: 'owner',
                    ip: '127.0.0.1',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }
            };
            this.saveUsers();
        }
        
        const session = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
            } catch {
                this.currentUser = null;
            }
        }
    }

    saveUsers() {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(this.users));
    }

    saveSession() {
        if (this.currentUser) {
            localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        }
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash = hash & hash;
        }
        return 'hash_' + hash;
    }

    generateId() {
        const ids = Object.keys(this.users).map(Number);
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        return String(maxId + 1);
    }

    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return '127.0.0.1';
        }
    }

    async register(name, password) {
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

        this.saveUsers();
        return { success: true, message: 'Cont creat!', id: id };
    }

    async login(name, password) {
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
        this.saveUsers();

        this.currentUser = {
            id: id,
            name: user.name,
            rank: user.rank,
            ip: ip
        };

        this.saveSession();
        return { success: true, user: this.currentUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isStaff() {
        return this.currentUser && ['staff', 'admin', 'owner'].includes(this.currentUser.rank);
    }

    isAdmin() {
        return this.currentUser && ['admin', 'owner'].includes(this.currentUser.rank);
    }

    isOwner() {
        return this.currentUser && this.currentUser.rank === 'owner';
    }

    getRankLabel(rank) {
        const labels = {
            'owner': '👑 Owner',
            'admin': '🛡️ Admin',
            'staff': '⭐ Staff',
            'member': '👤 Membru'
        };
        return labels[rank] || rank;
    }

    getRankColor(rank) {
        const colors = {
            'owner': '#ffd700',
            'admin': '#00e676',
            'staff': '#3498db',
            'member': '#8a9a8a'
        };
        return colors[rank] || '#8a9a8a';
    }

    getAllUsers() {
        return Object.values(this.users);
    }

    promoteUser(username) {
        const user = Object.values(this.users).find(u => u.name.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, message: 'Utilizatorul nu există!' };

        const ranks = ['member', 'staff', 'admin', 'head of staff' , 'owner'];
        const idx = ranks.indexOf(user.rank);
        if (idx >= ranks.length - 1) {
            return { success: false, message: 'Deja la rang maxim!' };
        }

        user.rank = ranks[idx + 1];
        this.saveUsers();
        return { success: true, message: username + ' promovat la ' + this.getRankLabel(user.rank) };
    }

    demoteUser(username) {
        if (username.toLowerCase() === 'administrator') {
            return { success: false, message: 'Nu poți demota owner-ul!' };
        }

        const user = Object.values(this.users).find(u => u.name.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, message: 'Utilizatorul nu există!' };

        const ranks = ['member', 'staff', 'admin', 'owner'];
        const idx = ranks.indexOf(user.rank);
        if (idx <= 0) {
            return { success: false, message: 'Deja la rang minim!' };
        }

        user.rank = ranks[idx - 1];
        this.saveUsers();
        return { success: true, message: username + ' retrogradat la ' + this.getRankLabel(user.rank) };
    }

    deleteUser(username) {
        if (username.toLowerCase() === 'administrator') {
            return { success: false, message: 'Nu poți șterge owner-ul!' };
        }

        const entry = Object.entries(this.users).find(([id, u]) => u.name.toLowerCase() === username.toLowerCase());
        if (!entry) return { success: false, message: 'Utilizatorul nu există!' };

        delete this.users[entry[0]];
        this.saveUsers();
        return { success: true, message: username + ' a fost șters!' };
    }

    init() {
        if (window.location.pathname.includes('panel.html')) {
            if (!this.isLoggedIn()) {
                window.location.href = 'index.html';
            }
        }
        
        if (window.location.pathname.includes('index.html')) {
            if (this.isLoggedIn()) {
                window.location.href = 'panel.html';
            }
        }
    }
}

window.auth = new AuthSystem();
console.log('✅ Auth System încărcat! Cont default: Administrator / admin2024');