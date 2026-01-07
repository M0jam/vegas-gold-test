/**
 * ROADMAP MODULE
 */
const Roadmap = {
    items: [
        { phase: "Phase 1", title: "Launch", desc: "Core games, VIP system, Shop", status: "completed" },
        { phase: "Phase 2", title: "Multiplayer", desc: "Live chat, PvP Blackjack, Leaderboards", status: "in_progress" },
        { phase: "Phase 3", title: "Expansion", desc: "Poker, Roulette, Mobile App", status: "pending" }
    ],
    
    init() {
        this.render();
    },

    render() {
        const list = document.getElementById('roadmap-list');
        if(!list) return;
        list.innerHTML = '';
        
        this.items.forEach(item => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.padding = '10px';
            div.style.borderRadius = '4px';
            div.style.borderLeft = item.status === 'completed' ? '3px solid var(--success)' : (item.status === 'in_progress' ? '3px solid var(--gold-2)' : '3px solid #666');
            
            div.innerHTML = `
                <div style="font-size:12px;color:var(--gold-4);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${item.phase}</div>
                <div style="font-weight:bold;color:#fff;margin-bottom:4px">${item.title}</div>
                <div style="font-size:11px;color:#aaa">${item.desc}</div>
            `;
            list.appendChild(div);
        });
    }
};

/**
 * CHANGELOG MODULE
 */
const Changelog = {
    entries: [
        {
            version: "1.3.4",
            date: "2026-01-06",
            changes: [
                "NEW CASES: Added Neon, Diamond, and Cyber Cases",
                "KEY SYSTEM: Cases now require specific Keys to open",
                "SHOP UPDATE: Purchase Keys directly from the Shop",
                "UI FIXES: Fixed Case Info Panel visibility and drop rates"
            ]
        },
        {
            version: "1.3.3",
            date: "2026-01-06",
            changes: [
                "MOBILE UPDATE: Vegas Case Shop is now fully playable on phones",
                "Responsive layout adjustments for smaller screens",
                "Optimized touch targets and navigation",
                "Fixed modal sizing for mobile devices"
            ]
        },
        {
            version: "1.3.2",
            date: "2026-01-06",
            changes: [
                "UI OVERHAUL: Brand new Vegas Case Shop design",
                "Added glassmorphism effects and hover animations",
                "Improved typography and layout for Case Cards",
                "CASE INFO: Click 'i' to see drop rates and contents",
                "Fixed 'Buy' button visibility and styling"
            ]
        },
        {
            version: "1.3.1",
            date: "2026-01-06",
            changes: [
                "Fixed Vegas Case Shop layout (horizontal alignment)",
                "Updated Case Shop buttons to 'Buy'",
                "Enabled opening Cases from Inventory",
                "Optimized Inventory Grid for Cases"
            ]
        },
        {
            version: "1.3.0",
            date: "2026-01-06",
            changes: [
                "INVENTORY 2.0: Added search, filters, and chronological sorting",
                "VEGAS CASES OVERHAUL: New 'Vegas Vault' shop UI and better animations",
                "CASE MECHANICS: Cases now go to inventory first (open them when you want)",
                "VISUALS: New particle effects, updated icons, and cleaner layouts",
                "MARKET: Items are now tradeable directly from inventory"
            ]
        },
        {
            version: "1.2.1",
            date: "2026-01-06",
            changes: [
                "Moved Hot Streak Meter below game UI for better visibility",
                "Cleaned up Main Menu: Removed text logo & emojis",
                "Fixed Top Menu alignment issues",
                "Added 'Updates' tab to view patch notes"
            ]
        },
        {
            version: "1.2.0",
            date: "2026-01-06",
            changes: [
                "Added HOT STREAK System",
                "Win streaks grant multipliers (up to 1.25x)",
                "Added visual effects for 3/5/10 win streaks",
                "Integrated streak logic into all games"
            ]
        },
        {
            version: "1.1.0",
            date: "2026-01-05",
            changes: [
                "Added VIP Shop with exclusive backgrounds",
                "Added Profile Name Tags",
                "Added Golden Arrow indicator to Daily Wheel",
                "Optimized Particle System"
            ]
        }
    ],

    init() {
        this.render();
    },

    open() {
        this.render();
        document.getElementById('changelog-modal').classList.add('active');
    },

    render() {
        const targets = [
            document.getElementById('changelog-list'),
            document.getElementById('changelog-list-modal')
        ];

        targets.forEach(list => {
            if (!list) return;
            list.innerHTML = '';

            this.entries.forEach(entry => {
                const item = document.createElement('div');
                item.style.marginBottom = "20px";
                item.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                item.style.paddingBottom = "15px";
                
                let html = `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                        <span style="color:var(--gold-2);font-weight:bold;font-size:18px">v${entry.version}</span>
                        <span style="color:var(--gold-4);font-size:12px">${entry.date}</span>
                    </div>
                    <ul style="list-style:none;padding-left:10px">
                `;
                
                entry.changes.forEach(change => {
                    html += `<li style="color:#ddd;margin-bottom:5px;font-size:14px;display:flex;align-items:start">
                        <span style="color:var(--gold-3);margin-right:8px">➢</span> ${change}
                    </li>`;
                });
                
                html += `</ul></div>`;
                item.innerHTML = html;
                list.appendChild(item);
            });
        });
    }
};

// Init Content
Roadmap.init();
Changelog.init();