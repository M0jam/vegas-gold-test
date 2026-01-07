/**
 * SHOP SYSTEM
 */
const Shop = {
  items: [
    { id: 'lucky_charm', name: 'Lucky Charm', desc: 'Increases Slot win chance significantly', cost: 1000, icon: '🍀' },
    { id: 'refund_ins', name: 'Refund Insurance', desc: '10% chance to refund a lost bet', cost: 2000, icon: '🛡️' },
    { id: 'vip_card', name: 'VIP Card', desc: '10% Discount on all items', cost: 5000, icon: '💳' },
    { id: 'plinko_guide', name: 'Plinko Guide', desc: 'Slightly improves ball control', cost: 3000, icon: '🎯' }
  ],
  
  init() { this.render(); },
  
  render() {
    const c = document.getElementById('shop-grid');
    if(!c) return;
    c.innerHTML = '';
    
    this.items.forEach(item => {
      const owned = app.hasPerk(item.id);
      let cost = item.cost;
      if(app.hasPerk('vip_card') && item.id !== 'vip_card') cost = Math.floor(cost * 0.9);
      
      const div = document.createElement('div');
      div.className = `achievement-card ${owned ? 'unlocked' : ''}`;
      div.style.opacity = '1';
      div.style.borderColor = owned ? 'var(--success)' : 'var(--gold-5)';
      
      div.innerHTML = `
        <div class="ach-icon">${item.icon}</div>
        <strong>${item.name}</strong>
        <div style="font-size:12px;margin-bottom:10px">${item.desc}</div>
        ${owned 
          ? '<button class="gold-btn secondary" disabled style="width:100%;font-size:12px;padding:5px">OWNED</button>'
          : `<button class="gold-btn" style="width:100%;font-size:12px;padding:5px" onclick="Shop.buy('${item.id}')">BUY V$${cost}</button>`
        }
      `;
      c.appendChild(div);
    });
  },
  
  buy(id) {
    const item = this.items.find(i => i.id === id);
    if(!item) return;
    if(app.hasPerk(id)) return;
    
    let cost = item.cost;
    if(app.hasPerk('vip_card') && id !== 'vip_card') cost = Math.floor(cost * 0.9);
    
    if(app.data.balance >= cost) {
      app.addBalance(-cost);
      app.data.inventory.push(id);
      app.save();
      app.toast(`Purchased ${item.name}!`, "Shop");
      app.playWin();
      this.render();
      if(window.Inventory) Inventory.render();
    } else {
      app.toast("Insufficient funds", "Shop");
    }
  }
};

/**
 * VIP SHOP SYSTEM
 */
const VIPShop = {
  items: [
    { id: 'bg_midnight', type: 'background', name: 'Midnight Gold', desc: 'Dark luxury wallpaper', cost: 10000, icon: '🌃' },
    { id: 'bg_royal_red', type: 'background', name: 'Royal Red', desc: 'Regal velvet atmosphere', cost: 15000, icon: '🍷' },
    { id: 'bg_cash_rain', type: 'background', name: 'Cash Rain', desc: 'Money everywhere', cost: 25000, icon: '💸' },
    
    { id: 'frame_gold', type: 'frame', name: 'Solid Gold Frame', desc: 'A border of pure gold', cost: 5000, icon: '🖼️' },
    { id: 'frame_diamond', type: 'frame', name: 'Diamond Edge', desc: 'Sparkling diamond border', cost: 20000, icon: '💎' },
    { id: 'frame_neon', type: 'frame', name: 'Neon Pulse', desc: 'Cyberpunk aesthetic', cost: 12000, icon: '🔮' },
    
    { id: 'tag_high_roller', type: 'tag', name: 'High Roller Tag', desc: 'Show your status', cost: 8000, icon: '🏷️' },
    { id: 'tag_whale', type: 'tag', name: 'Whale Tag', desc: 'For the big spenders', cost: 30000, icon: '🐋' },
    { id: 'tag_vip', type: 'tag', name: 'VIP Tag', desc: 'Exclusive club member', cost: 50000, icon: '👑' }
  ],
  
  init() { this.render(); },
  
  render() {
    const c = document.getElementById('vip-shop-grid');
    if(!c) return;
    c.innerHTML = '';
    
    this.items.forEach(item => {
      const owned = app.hasPerk(item.id);
      
      const div = document.createElement('div');
      div.className = `vip-item-card ${owned ? 'owned' : ''}`;
      
      div.innerHTML = `
        <div class="ach-icon" style="font-size:30px">${item.icon}</div>
        <div class="vip-tag">${item.type.toUpperCase()}</div>
        <strong style="color:var(--gold-2)">${item.name}</strong>
        <div style="font-size:12px;margin-bottom:10px;color:#aaa">${item.desc}</div>
        ${owned 
          ? '<button class="gold-btn secondary" disabled style="width:100%;font-size:12px;padding:5px">OWNED</button>'
          : `<button class="gold-btn" style="width:100%;font-size:12px;padding:5px" onclick="VIPShop.buy('${item.id}')">BUY V$${item.cost.toLocaleString()}</button>`
        }
      `;
      c.appendChild(div);
    });
  },
  
  buy(id) {
    const item = this.items.find(i => i.id === id);
    if(!item) return;
    if(app.hasPerk(id)) return;
    
    if(app.data.balance >= item.cost) {
      app.addBalance(-item.cost);
      app.data.inventory.push(id);
      app.save();
      app.toast(`Purchased ${item.name}!`, "VIP Shop");
      app.playWin();
      this.render();
      if(window.Cosmetics) Cosmetics.render();
    } else {
      app.toast("Insufficient funds", "VIP Shop");
    }
  }
};

/**
 * INVENTORY SYSTEM
 */
const Inventory = {
  filter: 'all',
  search: '',

  init() { this.render(); },
  
  render() {
    const container = document.getElementById('inventory-grid');
    if(!container) return;
    
    // Inject Controls if not present
    let controls = document.getElementById('inv-controls');
    if(!controls) {
        controls = document.createElement('div');
        controls.id = 'inv-controls';
        controls.style.display = 'flex';
        controls.style.gap = '15px';
        controls.style.marginBottom = '20px';
        controls.style.gridColumn = '1 / -1';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control';
        searchInput.placeholder = 'Search items...';
        searchInput.style.flex = '1';
        searchInput.oninput = (e) => {
            this.search = e.target.value.toLowerCase();
            this.renderGrid();
        };
        
        const filterSelect = document.createElement('select');
        filterSelect.className = 'form-control';
        filterSelect.style.width = '150px';
        ['all', 'skin', 'case', 'upgrade', 'vip'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt.toUpperCase();
            filterSelect.appendChild(o);
        });
        filterSelect.onchange = (e) => {
            this.filter = e.target.value;
            this.renderGrid();
        };
        
        controls.appendChild(searchInput);
        controls.appendChild(filterSelect);
        container.parentNode.insertBefore(controls, container);
    }
    
    this.renderGrid();
  },

  renderGrid() {
    const c = document.getElementById('inventory-grid');
    if(!c) return;
    c.innerHTML = '';
    
    if(!app.data.inventory || app.data.inventory.length === 0) {
      c.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">Your vault is empty. Visit the Shop!</div>';
      return;
    }
    
    // Aggregate all possible items
    const allItems = [
        ...Shop.items.map(i => ({...i, type: 'upgrade', rarity: 'purple'})), 
        ...VIPShop.items.map(i => ({...i, type: 'vip', rarity: 'gold'}))
    ];

    // Map inventory IDs to item objects and add timestamp/index for sorting if needed
    let inventoryItems = app.data.inventory.map((id, index) => {
        const item = allItems.find(i => i.id === id);
        return item ? { ...item, originalIndex: index } : null;
    }).filter(i => i !== null);

    // Apply Filter & Search
    inventoryItems = inventoryItems.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(this.search);
        let matchFilter = true;
        if(this.filter !== 'all') {
            matchFilter = item.type === this.filter;
        }
        return matchSearch && matchFilter;
    });

    // Sorting: Cases First, then Chronological (Newest First)
    inventoryItems.sort((a, b) => {
        if(this.filter === 'all') {
            const aIsCase = a.id.startsWith('case_');
            const bIsCase = b.id.startsWith('case_');
            if(aIsCase && !bIsCase) return -1;
            if(!aIsCase && bIsCase) return 1;
        }
        return b.originalIndex - a.originalIndex;
    });

    if(inventoryItems.length === 0) {
        c.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No items found.</div>';
        return;
    }

    inventoryItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'achievement-card'; // Base class
      div.classList.add('unlocked');

      // Icon rendering
      const renderIcon = (icon) => {
          if(!icon) return '';
          if(icon.startsWith('icon-')) return `<svg class="ach-icon-svg" style="width:40px;height:40px;fill:currentColor"><use href="#${icon}"/></svg>`;
          return `<div class="ach-icon">${icon}</div>`;
      };

      let actionBtn = `<div style="font-size:10px;color:var(--success);margin-top:10px;text-align:center">ACTIVE</div>`;

      div.innerHTML = `
        <div style="text-align:center; margin-bottom:10px; color:${item.color || 'inherit'}">${renderIcon(item.icon)}</div>
        <div style="text-align:center">
            <strong style="color:${item.color || 'inherit'}">${item.name}</strong>
            <div style="font-size:11px; margin-top:5px; color:#aaa">${item.desc}</div>
            ${actionBtn}
        </div>
      `;
      
      c.appendChild(div);
    });
  }
};

/**
 * COMMUNITY MARKET
 */
const Market = {
  list: [],
  
  init() { 
    this.load(); 
    this.render(); 
  },
  
  // Helper to get all game items with normalized properties
  getAllItems() {
      // Base items
      const shopItems = Shop.items.map(i => ({...i, rarity: 'purple', type: 'upgrade'}));
      const vipItems = VIPShop.items.map(i => ({...i, rarity: 'gold', type: 'vip'}));
      return [...shopItems, ...vipItems];
  },

  load() {
    try {
      const s = localStorage.getItem('vg_market');
      this.list = s ? JSON.parse(s) : [];
    } catch(e) { this.list = []; }
    if(this.list.length === 0) {
      // Seed sample listings
      this.list = [
        { id: 'mk_4', skinId: 'vip_card', seller: 'vipTrader', price: 4500 } // Added sample non-skin
      ];
      this.save();
    }
  },
  
  save() {
    localStorage.setItem('vg_market', JSON.stringify(this.list));
  },
  
  render() {
    const sellC = document.getElementById('market-sell');
    const grid = document.getElementById('market-grid');
    if(!sellC || !grid) return;
    
    const allItems = this.getAllItems();

    const renderIcon = (icon) => {
        if(!icon) return '';
        if(icon.startsWith('icon-')) return `<svg style="width:30px;height:30px;fill:currentColor;vertical-align:middle"><use href="#${icon}"/></svg>`;
        return icon;
    };

    // Controls (Search & Filter)
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.marginBottom = '10px';
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'form-control';
    search.placeholder = 'Search market...';
    const rarity = document.createElement('select');
    rarity.className = 'form-control';
    ['all','gray','green','purple','gold','ultra'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r.toUpperCase();
      rarity.appendChild(opt);
    });
    controls.appendChild(search);
    controls.appendChild(rarity);
    
    // Manage controls insertion
    if(grid.previousElementSibling && grid.previousElementSibling.querySelector('input')) {
         grid.previousElementSibling.remove();
    }
    grid.parentElement.insertBefore(controls, grid);
    
    // Sell Form
    sellC.innerHTML = '';
    // Find all owned items that are valid game items
    const ownedIds = app.data.inventory || [];
    const sellable = ownedIds.filter(id => allItems.some(x => x.id === id));

    if(sellable.length === 0) {
      sellC.innerHTML = '<div style="text-align:center;color:var(--text-muted)">No sellable items in inventory.</div>';
    } else {
      const select = document.createElement('select');
      select.className = 'form-control';
      
      const uniqueIds = [...new Set(sellable)];
      
      uniqueIds.forEach(uid => {
        const item = allItems.find(x => x.id === uid);
        const count = sellable.filter(x => x === uid).length;
        if(item) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = `${item.name} (${item.rarity ? item.rarity.toUpperCase() : 'ITEM'}) x${count}`;
          select.appendChild(opt);
        }
      });
      
      const priceInput = document.createElement('input');
      priceInput.type = 'number';
      priceInput.className = 'form-control';
      priceInput.placeholder = 'Price (V$)';
      
      const btn = document.createElement('button');
      btn.className = 'gold-btn';
      btn.textContent = 'LIST FOR SALE';
      btn.onclick = () => {
        const itemId = select.value;
        const price = parseInt(priceInput.value, 10);
        if(!itemId || !price || price <= 0) {
          app.toast('Enter a valid price', 'Market');
          return;
        }
        // Remove ONE instance from inventory
        const idx = app.data.inventory.indexOf(itemId);
        if(idx > -1) {
            app.data.inventory.splice(idx, 1);
            app.save();
            Inventory.render(); // Update inventory view
            // Add to market
            this.list.push({ id: 'mk_' + Date.now(), skinId: itemId, seller: (app.user ? app.user.name : 'guest'), price });
            this.save();
            this.render();
            app.toast('Listed on market', 'Market');
        } else {
            app.toast('Item not found', 'Error');
        }
      };
      
      sellC.appendChild(select);
      sellC.appendChild(priceInput);
      sellC.appendChild(btn);
    }
    
    // Listings Grid
    grid.innerHTML = '';
    
    const applyFilter = () => {
      grid.innerHTML = '';
      const term = (search.value || '').toLowerCase();
      const rar = rarity.value;
      
      const filtered = this.list.filter(l => {
        const item = allItems.find(x => x.id === l.skinId);
        if(!item) return false; // Item definition missing?
        
        const okR = rar === 'all' ? true : (item.rarity === rar);
        const okT = term ? (item.name.toLowerCase().includes(term)) : true;
        return okR && okT;
      });
      
      if(filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No listings match.</div>';
        return;
      }
      
      filtered.forEach(l => {
        const item = allItems.find(x => x.id === l.skinId);
        if(!item) return;
        
        const div = document.createElement('div');
        div.className = `achievement-card rarity-${item.rarity || 'gray'}`;
        div.innerHTML = `
          <div style="text-align:center;margin-bottom:10px">${renderIcon(item.icon)}</div>
          <strong>${item.name}</strong>
          <div style="font-size:12px;color:#aaa">Seller: ${l.seller}</div>
          <div style="font-size:12px;margin-bottom:8px">Price: V$ ${l.price.toLocaleString()}</div>
          ${(app.user && l.seller === app.user.name) 
             ? `<button class="gold-btn secondary" style="font-size:12px;padding:6px" onclick="Market.cancel('${l.id}')">CANCEL</button>`
             : `<button class="gold-btn" style="font-size:12px;padding:6px" onclick="Market.buy('${l.id}')">BUY</button>`
          }
        `;
        grid.appendChild(div);
      });
    };
    
    search.oninput = applyFilter;
    rarity.onchange = applyFilter;
    
    if(this.list.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No listings yet.</div>';
    } else {
      applyFilter();
    }
  },
  
  buy(listingId) {
    const l = this.list.find(x => x.id === listingId);
    if(!l) return;
    if(app.data.balance < l.price) {
      app.toast('Insufficient funds', 'Market');
      return;
    }
    app.addBalance(-l.price);
    app.data.inventory.push(l.skinId);
    app.save();
    Inventory.render();
    this.list = this.list.filter(x => x.id !== listingId);
    this.save();
    this.render();
    app.toast('Purchase completed', 'Market');
  },

  cancel(listingId) {
    const l = this.list.find(x => x.id === listingId);
    if(!l) return;
    app.data.inventory.push(l.skinId);
    this.list = this.list.filter(x => x.id !== listingId);
    app.save();
    this.save();
    Inventory.render();
    this.render();
    app.toast('Listing cancelled', 'Market');
  }
};
