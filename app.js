// ===== CONFIGURAZIONE E VARIABILI GLOBALI =====
const API_KEY = "d6b3blpr01qnr27jgq90d6b3blpr01qnr27jgq9g";
const UPDATE_INTERVAL = 60000; // 60 secondi
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minuti
const TROY_OZ = 31.1034768;

// State
let state = {
  fxRate: 0.925,
  mode: '100g',
  rawGoldUSD: 0,
  rawSilverUSD: 0,
  rawAluUSD: 0,
  rawBtcUSD: 0,
  
  // Per tracking variazioni
  prevGold: 0,
  prevSilver: 0,
  prevAlu: 0,
  prevBtc: 0,
  
  lastUpdate: null,
  isLoading: false,
  hasError: false,
  autoRefreshEnabled: true
};

// Cache
let cache = {
  gold: { data: null, timestamp: 0 },
  silver: { data: null, timestamp: 0 },
  alu: { data: null, timestamp: 0 },
  btc: { data: null, timestamp: 0 },
  news: { data: null, timestamp: 0 },
  fx: { data: null, timestamp: 0 }
};

// ===== UTILITY FUNCTIONS =====

function isCacheValid(key) {
  const now = Date.now();
  return cache[key].timestamp && (now - cache[key].timestamp) < CACHE_EXPIRY;
}

function showError(message) {
  const container = document.getElementById('error-container');
  container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
  state.hasError = true;
  setTimeout(() => {
    container.innerHTML = '';
    state.hasError = false;
  }, 5000);
}

function showSuccess(message) {
  const container = document.getElementById('error-container');
  container.innerHTML = `<div class="success-message">✓ ${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 3000);
}

function updateStatus() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const statusEl = document.getElementById('main-status');
  
  if (navigator.onLine) {
    statusEl.className = 'status-bar online';
    statusEl.textContent = `✓ Connesso • Ultimo aggiornamento: ${timeStr}`;
  } else {
    statusEl.className = 'status-bar offline';
    statusEl.textContent = `✗ Offline • Mostrando dati in cache`;
  }
  
  state.lastUpdate = now;
}

function getPercentageChange(prev, current) {
  if (prev === 0) return null;
  const change = ((current - prev) / prev) * 100;
  return change.toFixed(2);
}

function renderPriceChange(elementId, prev, current) {
  const change = getPercentageChange(prev, current);
  const el = document.getElementById(elementId);
  
  if (change === null) return;
  
  const isPositive = change > 0;
  const symbol = isPositive ? '▲' : '▼';
  const className = isPositive ? 'positive' : 'negative';
  
  el.className = `price-change ${className}`;
  el.textContent = `${symbol} ${Math.abs(change)}%`;
}

// ===== FETCH FUNCTIONS =====

async function fetchYahoo(ticker) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`).then(r => r.json());
    return res.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch(e) { 
    console.error(`Errore fetch Yahoo ${ticker}:`, e);
    return null; 
  }
}

async function fetchFinnhub(endpoint, params = {}) {
  try {
    const url = new URL(`https://finnhub.io/api/v1${endpoint}`);
    url.searchParams.append('token', API_KEY);
    Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));
    
    const res = await fetch(url.toString()).then(r => r.json());
    return res;
  } catch(e) { 
    console.error(`Errore fetch Finnhub ${endpoint}:`, e);
    return null; 
  }
}

async function fetchFX() {
  if (isCacheValid('fx')) {
    state.fxRate = cache.fx.data;
    return;
  }
  
  try {
    const res = await fetchFinnhub('/quote', { symbol: 'FX:EURUSD' });
    if (res?.c) {
      state.fxRate = 1 / res.c;
      cache.fx.data = state.fxRate;
      cache.fx.timestamp = Date.now();
    }
  } catch(e) {
    console.error('Errore fetch FX:', e);
  }
}

async function fetchMetals() {
  try {
    // Oro
    const gold = await fetchYahoo('GC=F');
    if (gold) {
      state.prevGold = state.rawGoldUSD;
      state.rawGoldUSD = gold;
      cache.gold.data = gold;
      cache.gold.timestamp = Date.now();
    } else if (isCacheValid('gold')) {
      state.rawGoldUSD = cache.gold.data;
    }
    
    // Argento
    const silver = await fetchYahoo('SI=F');
    if (silver) {
      state.prevSilver = state.rawSilverUSD;
      state.rawSilverUSD = silver;
      cache.silver.data = silver;
      cache.silver.timestamp = Date.now();
    } else if (isCacheValid('silver')) {
      state.rawSilverUSD = cache.silver.data;
    }
    
    // Alluminio
    const alu = await fetchYahoo('ALI=F');
    if (alu) {
      state.prevAlu = state.rawAluUSD;
      state.rawAluUSD = alu;
      cache.alu.data = alu;
      cache.alu.timestamp = Date.now();
    } else if (isCacheValid('alu')) {
      state.rawAluUSD = cache.alu.data;
    }
  } catch(e) {
    console.error('Errore fetch metalli:', e);
  }
}

async function fetchCrypto() {
  try {
    const res = await fetchFinnhub('/quote', { symbol: 'BINANCE:BTCUSDT' });
    if (res?.c) {
      state.prevBtc = state.rawBtcUSD;
      state.rawBtcUSD = res.c;
      cache.btc.data = res.c;
      cache.btc.timestamp = Date.now();
    } else if (isCacheValid('btc')) {
      state.rawBtcUSD = cache.btc.data;
    }
  } catch(e) {
    console.error('Errore fetch Bitcoin:', e);
  }
}

// ===== RENDERING =====

function renderPrices() {
  const SPREAD = {
    '1g': 1.15,    // 15%
    'oz': 1.05,    // 5%
    '50g': 1.04,   // 4%
    '100g': 1.03   // 3%
  };
  
  const spread = SPREAD[state.mode] || 1.03;
  
  // Oro con spread
  const goldEUR = state.rawGoldUSD * state.fxRate * spread;
  let goldValue;
  
  if (state.mode === 'oz') {
    goldValue = goldEUR;
  } else if (state.mode === '1g') {
    goldValue = goldEUR / TROY_OZ;
  } else if (state.mode === '50g') {
    goldValue = (goldEUR / TROY_OZ) * 50;
  } else {
    goldValue = (goldEUR / TROY_OZ) * 100;
  }
  
  // Argento con spread fisico
  const silverEUR = state.rawSilverUSD * state.fxRate * 1.10;
  const silverQuantity = state.mode === 'oz' ? TROY_OZ : parseInt(state.mode);
  const silverValue = (silverEUR / TROY_OZ) * silverQuantity;
  
  // Rendering
  document.getElementById('gold-p').innerText = goldValue.toLocaleString('it-IT', {style:'currency', currency:'EUR'});
  document.getElementById('gold-info').innerText = `Quotazione Lingotto ${state.mode} (Inc. Spread)`;
  renderPriceChange('gold-change', state.prevGold, state.rawGoldUSD);
  
  document.getElementById('silver-p').innerText = silverValue.toLocaleString('it-IT', {style:'currency', currency:'EUR'});
  renderPriceChange('silver-change', state.prevSilver, state.rawSilverUSD);
  
  const aluEUR = state.rawAluUSD * state.fxRate;
  document.getElementById('alu-p').innerText = aluEUR.toLocaleString('it-IT', {style:'currency', currency:'EUR'});
  renderPriceChange('alu-change', state.prevAlu, state.rawAluUSD);
  
  const btcEUR = state.rawBtcUSD * state.fxRate;
  document.getElementById('btc-p').innerText = btcEUR.toLocaleString('it-IT', {style:'currency', currency:'EUR'});
  renderPriceChange('btc-change', state.prevBtc, state.rawBtcUSD);
}

function setUnit(m, btn) {
  state.mode = m;
  document.querySelectorAll('.u-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPrices();
  localStorage.setItem('selectedUnit', m);
}

async function loadNews() {
  try {
    let news;
    
    if (isCacheValid('news')) {
      news = cache.news.data;
    } else {
      const res = await fetchFinnhub('/news', { category: 'general' });
      if (res) {
        news = res;
        cache.news.data = news;
        cache.news.timestamp = Date.now();
      }
    }
    
    if (news && Array.isArray(news)) {
      document.getElementById('news-list').innerHTML = news.slice(0, 8).map(n => `
        <div class="news-card">
          <a href="${n.url}" target="_blank" rel="noopener noreferrer">
            ● ${n.headline.substring(0, 70)}${n.headline.length > 70 ? '...' : ''}
          </a>
        </div>
      `).join('');
      document.getElementById('news-status').textContent = '✓ Notizie aggiornate';
    }
  } catch(e) {
    console.error('Errore loadNews:', e);
    document.getElementById('news-list').innerHTML = '<p style="color:#ef4444;">Errore caricamento notizie</p>';
  }
}

async function updateAll() {
  if (!state.autoRefreshEnabled) return;
  
  state.isLoading = true;
  
  try {
    await Promise.all([
      fetchFX(),
      fetchMetals(),
      fetchCrypto(),
      loadNews()
    ]);
    
    renderPrices();
    updateStatus();
    
    if (!state.hasError) {
      console.log('✓ Aggiornamento completato');
    }
  } catch(e) {
    console.error('Errore updateAll:', e);
    showError('Errore durante l\'aggiornamento dei dati');
  } finally {
    state.isLoading = false;
  }
}

async function doSearch() {
  const q = document.getElementById('sInput').value.trim().toUpperCase();
  
  if (!q) {
    showError('Inserisci un simbolo valido');
    return;
  }
  
  const resultsDiv = document.getElementById('results-list');
  resultsDiv.innerHTML = '<div style="text-align:center;"><div class="loader"></div></div>';
  
  try {
    const res = await fetchFinnhub('/quote', { symbol: q });
    
    if (!res?.c) {
      showError('Simbolo non trovato');
      resultsDiv.innerHTML = '';
      return;
    }
    
    const price = q.includes('.MI') ? res.c : (res.c * state.fxRate);
    resultsDiv.innerHTML = `
      <div class="m-card" onclick="openChart('${q}')" style="cursor:pointer; border-color:var(--primary); margin-top:10px; margin-bottom: 10px;">
        <strong>${q}</strong><br>
        <span class="price-big">${price.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</span>
        <span class="info-tag">Clicca per visualizzare il grafico</span>
      </div>
    `;
    showSuccess(`${q} trovato`);
  } catch(e) {
    console.error('Errore doSearch:', e);
    showError('Errore nella ricerca');
    resultsDiv.innerHTML = '';
  }
}

function openChart(s) {
  document.getElementById('chart-container').style.display = "block";
  document.getElementById('tv-widget').innerHTML = "";
  
  try {
    new TradingView.widget({
      autosize: true, 
      symbol: s.includes('.MI') ? `MILAN:${s.split('.')[0]}` : s, 
      theme: "dark", 
      container_id: "tv-widget",
      interval: "D",
      style: "1",
      timezone: "Europe/Rome"
    });
  } catch(e) {
    console.error('Errore caricamento grafico TradingView:', e);
    showError('Errore caricamento grafico');
  }
}

function manualRefresh() {
  const btn = document.getElementById('refresh-btn');
  btn.style.animation = 'spin 0.6s linear';
  updateAll().then(() => {
    showSuccess('Dati aggiornati');
    setTimeout(() => { btn.style.animation = ''; }, 600);
  });
}

function toggleSettings() {
  // Placeholder per menu impostazioni futuro
  showSuccess('Impostazioni non ancora disponibili');
}

// ===== NETWORK DETECTION =====

window.addEventListener('online', () => {
  updateStatus();
  updateAll();
});

window.addEventListener('offline', () => {
  updateStatus();
  showError('Connessione persa. Utilizzo dati in cache.');
});

// ===== INIZIALIZZAZIONE =====

document.addEventListener('DOMContentLoaded', () => {
  // Ripristina unità selezionata
  const savedUnit = localStorage.getItem('selectedUnit') || '100g';
  const unitBtn = document.getElementById(`btn-${savedUnit}`);
  if (unitBtn) {
    setUnit(savedUnit, unitBtn);
  }
  
  // First update
  updateAll();
  
  // Auto-refresh ogni minuto
  setInterval(updateAll, UPDATE_INTERVAL);
  
  // Status update ogni 10 secondi
  setInterval(updateStatus, 10000);
  
  // Check connessione
  updateStatus();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  state.autoRefreshEnabled = false;
});
