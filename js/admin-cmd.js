/* ========================================
   ANUBIS ROMANIA - ADMIN CMD
   Comenzi pentru consolă (F12)
   ======================================== */

console.log('%c╔════════════════════════════════════════╗', 'color: #00e676; font-weight: bold;');
console.log('%c║   ANUBIS ROMANIA - COMENZI ADMIN    ║', 'color: #ffd700; font-weight: bold;');
console.log('%c╚════════════════════════════════════════╝', 'color: #00e676; font-weight: bold;');
console.log('');
console.log('%c💡 Tastează anubis.help() pentru lista completă', 'color: #a29bfe;');
console.log('');

const anubis = {
    help: function() {
        console.log('%c📋 COMENZI DISPONIBILE:', 'color: #ffd700; font-weight: bold;');
        console.log('');
        console.log('  %c> anubis.users.list()', 'color: #00e676;');
        console.log('  %c  - Afișează toți utilizatorii', 'color: #8a9a8a;');
        console.log('  %c> anubis.users.promote("nume")', 'color: #00e676;');
        console.log('  %c  - Promovează un utilizator', 'color: #8a9a8a;');
        console.log('  %c> anubis.users.demote("nume")', 'color: #00e676;');
        console.log('  %c  - Retrogradă un utilizator', 'color: #8a9a8a;');
        console.log('  %c> anubis.users.delete("nume")', 'color: #00e676;');
        console.log('  %c  - Șterge un utilizator', 'color: #8a9a8a;');
        console.log('  %c> anubis.staff.give("nume")', 'color: #00e676;');
        console.log('  %c  - Oferă rang de staff', 'color: #8a9a8a;');
        console.log('  %c> anubis.staff.remove("nume")', 'color: #00e676;');
        console.log('  %c  - Elimină rangul de staff', 'color: #8a9a8a;');
        console.log('  %c> anubis.logs.show()', 'color: #00e676;');
        console.log('  %c  - Afișează logurile', 'color: #8a9a8a;');
        console.log('  %c> anubis.logs.clear()', 'color: #00e676;');
        console.log('  %c  - Șterge toate logurile', 'color: #8a9a8a;');
        console.log('  %c> anubis.reset()', 'color: #00e676;');
        console.log('  %c  - Resetează sistemul (doar owner)', 'color: #8a9a8a;');
        console.log('');
    },

    users: {
        list: function() {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            const users = auth.getAllUsers();
            console.log('%c👥 UTILIZATORI:', 'color: #3498db; font-weight: bold;');
            console.log('─'.repeat(50));
            
            users.forEach(user => {
                const rankColor = auth.getRankColor(user.rank);
                const rankLabel = auth.getRankLabel(user.rank);
                console.log(
                    '%c' + user.name, 'font-weight: bold;',
                    '%c(ID: ' + user.id + ')', 'color: #8a9a8a;',
                    '%c' + rankLabel, 'color: ' + rankColor + ';',
                    '%cIP: ' + (user.ip || 'N/A'), 'color: #4a5a4a; font-size: 0.8rem;'
                );
            });
            console.log('─'.repeat(50));
            console.log('%cTotal: ' + users.length + ' utilizatori', 'color: #00e676;');
        },

        promote: function(username) {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            if (!username) {
                console.error('❌ Specifică un username: anubis.users.promote("nume")');
                return;
            }
            
            const result = auth.promoteUser(username);
            if (result.success) {
                console.log('%c✅ ' + result.message, 'color: #00e676;');
                this.list();
            } else {
                console.error('%c❌ ' + result.message, 'color: #ff4757;');
            }
        },

        demote: function(username) {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            if (!username) {
                console.error('❌ Specifică un username: anubis.users.demote("nume")');
                return;
            }
            
            const result = auth.demoteUser(username);
            if (result.success) {
                console.log('%c✅ ' + result.message, 'color: #00e676;');
                this.list();
            } else {
                console.error('%c❌ ' + result.message, 'color: #ff4757;');
            }
        },

        delete: function(username) {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            if (!username) {
                console.error('❌ Specifică un username: anubis.users.delete("nume")');
                return;
            }
            
            const result = auth.deleteUser(username);
            if (result.success) {
                console.log('%c✅ ' + result.message, 'color: #00e676;');
                this.list();
            } else {
                console.error('%c❌ ' + result.message, 'color: #ff4757;');
            }
        }
    },

    staff: {
        give: function(username) {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            if (!username) {
                console.error('❌ Specifică un username: anubis.staff.give("nume")');
                return;
            }
            
            const result = auth.promoteUser(username);
            if (result.success) {
                console.log('%c✅ ' + username + ' a primit rang de staff!', 'color: #00e676;');
                anubis.users.list();
            } else {
                console.error('%c❌ ' + result.message, 'color: #ff4757;');
            }
        },

        remove: function(username) {
            const auth = window.auth;
            if (!auth) {
                console.error('❌ Auth System nu este încărcat!');
                return;
            }
            
            if (!username) {
                console.error('❌ Specifică un username: anubis.staff.remove("nume")');
                return;
            }
            
            const result = auth.demoteUser(username);
            if (result.success) {
                console.log('%c✅ Rangul de staff a fost eliminat pentru ' + username, 'color: #00e676;');
                anubis.users.list();
            } else {
                console.error('%c❌ ' + result.message, 'color: #ff4757;');
            }
        }
    },

    logs: {
        show: function() {
            const logs = JSON.parse(localStorage.getItem('anubis_logs') || '[]');
            
            if (logs.length === 0) {
                console.log('%c📋 Nu există loguri.', 'color: #8a9a8a;');
                return;
            }
            
            console.log('%c📋 LOGURI RECENTE:', 'color: #3498db; font-weight: bold;');
            console.log('─'.repeat(60));
            
            logs.slice(-20).reverse().forEach(log => {
                console.log(
                    '%c' + log.time, 'color: #4a5a4a;',
                    '%c' + log.user, 'color: #ffd700;',
                    '%c' + log.action, 'color: #e8f5e9;'
                );
            });
            console.log('─'.repeat(60));
            console.log('%cTotal: ' + logs.length + ' loguri', 'color: #00e676;');
        },

        clear: function() {
            const auth = window.auth;
            if (!auth || !auth.isAdmin()) {
                console.error('%c❌ Nu ai permisiunea să ștergi logurile!', 'color: #ff4757;');
                return;
            }
            
            localStorage.setItem('anubis_logs', '[]');
            console.log('%c✅ Logurile au fost șterse!', 'color: #00e676;');
        }
    },

    reset: function() {
        const auth = window.auth;
        if (!auth || !auth.isOwner()) {
            console.error('%c❌ Doar owner-ul poate reseta sistemul!', 'color: #ff4757;');
            return;
        }
        
        if (!confirm('⚠️ Ești sigur că vrei să resetezi complet sistemul?')) return;
        
        localStorage.removeItem('anubis_users');
        localStorage.removeItem('anubis_session');
        localStorage.removeItem('anubis_logs');
        
        console.log('%c✅ Sistem resetat! Reîncarcă pagina.', 'color: #00e676;');
        location.reload();
    }
};

window.anubis = anubis;
console.log('%c💡 Tastează anubis.help() pentru lista completă de comenzi', 'color: #a29bfe;');