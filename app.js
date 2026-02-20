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
    if (gold && gold > 0) {
      state.prevGold = state.rawGoldUSD;
      state.rawGoldUSD = gold;
      cache.gold.data = gold;
      cache.gold.timestamp = Date.now();
    } else if (isCacheValid('gold') && cache.gold.data) {
      state.rawGoldUSD = cache.gold.data;
    } else {
      // FALLBACK PRICES - Aggiornato 20 Febbraio 2026
      // Oro: $5086/oz | Argento: $82.3/oz | Alluminio: $3102/ton
      state.rawGoldUSD = 5086;
    }
    
    // Argento
    const silver = await fetchYahoo('SI=F');
    if (silver && silver > 0) {
      state.prevSilver = state.rawSilverUSD;
      state.rawSilverUSD = silver;
      cache.silver.data = silver;
      cache.silver.timestamp = Date.now();
    } else if (isCacheValid('silver') && cache.silver.data) {
      state.rawSilverUSD = cache.silver.data;
    } else {
      state.rawSilverUSD = 82.3;
    }
    
    // Alluminio
    const alu = await fetchYahoo('ALI=F');
    if (alu && alu > 0) {
      state.prevAlu = state.rawAluUSD;
      state.rawAluUSD = alu;
      cache.alu.data = alu;
      cache.alu.timestamp = Date.now();
    } else if (isCacheValid('alu') && cache.alu.data) {
      state.rawAluUSD = cache.alu.data;
    } else {
      state.rawAluUSD = 3102;
    }
  } catch(e) {
    console.error('Errore fetch metalli:', e);
    // Usa i fallback se tutto fallisce
    if (!state.rawGoldUSD || state.rawGoldUSD === 0) state.rawGoldUSD = 5086;
    if (!state.rawSilverUSD || state.rawSilverUSD === 0) state.rawSilverUSD = 82.3;
    if (!state.rawAluUSD || state.rawAluUSD === 0) state.rawAluUSD = 3102;
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
      // Prova NewsAPI per notizie in italiano
      const newsApiKey = "300c4587a894469e87c93c60c78837fb";
      const newsApiUrl = `https://newsapi.org/v2/everything?q=oro+argento+bitcoin+borsa&language=it&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`;
      
      try {
        const res = await fetch(newsApiUrl).then(r => r.json());
        if (res?.articles && res.articles.length > 0) {
          news = res.articles;
          cache.news.data = news;
          cache.news.timestamp = Date.now();
        } else {
          throw new Error('No articles');
        }
      } catch (newsError) {
        console.warn('NewsAPI fallback:', newsError);
        // Fallback a Finnhub se NewsAPI fallisce
        const res = await fetchFinnhub('/news', { category: 'general' });
        if (res && Array.isArray(res)) {
          news = res;
          cache.news.data = news;
          cache.news.timestamp = Date.now();
        }
      }
    }
    
    if (news && Array.isArray(news) && news.length > 0) {
      document.getElementById('news-list').innerHTML = news.slice(0, 8).map(n => {
        // Support sia NewsAPI che Finnhub format
        const title = n.title || n.headline;
        const url = n.url || n.url;
        const date = n.publishedAt ? new Date(n.publishedAt).toLocaleString('it-IT') : 
                     n.datetime ? new Date(n.datetime * 1000).toLocaleString('it-IT') : 'Ora sconosciuta';
        
        return `
          <div class="news-card">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              ● ${title.substring(0, 70)}${title.length > 70 ? '...' : ''}
            </a>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">
              ${date}
            </div>
          </div>
        `;
      }).join('');
      document.getElementById('news-status').textContent = '✓ Notizie aggiornate';
    } else {
      document.getElementById('news-list').innerHTML = '<p style="color:#94a3b8; font-size: 0.9rem;">Notizie non disponibili al momento</p>';
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
    // Se finisce con .MI, è un'azione italiana (Borsa Italiana)
    let symbol = q;
    if (!q.includes('.MI') && !q.includes(':')) {
      // Prova prima senza suffisso
      symbol = q;
    }
    
    const res = await fetchFinnhub('/quote', { symbol: symbol });
    
    if (!res?.c) {
      // Se non trova, prova con .MI (Borsa Italiana)
      if (!symbol.includes('.MI')) {
        const res2 = await fetchFinnhub('/quote', { symbol: symbol + '.MI' });
        if (res2?.c) {
          const price = res2.c;
          resultsDiv.innerHTML = `
            <div class="m-card" onclick="openChart('${symbol}.MI')" style="cursor:pointer; border-color:var(--primary); margin-top:10px; margin-bottom: 10px;">
              <strong>${symbol}.MI</strong><br>
              <span class="price-big">${price.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</span>
              <span class="price-change" style="color: #94a3b8;">Borsa Italiana - Clicca per grafico</span>
              <span class="info-tag">Clicca per visualizzare il grafico</span>
            </div>
          `;
          showSuccess(`${symbol}.MI trovato`);
          return;
        }
      }
      showError('Simbolo non trovato. Prova con: RACE, ENEL.MI, TERNA.MI');
      resultsDiv.innerHTML = '';
      return;
    }
    
    const price = symbol.includes('.MI') ? res.c : (res.c * state.fxRate);
    const exchange = symbol.includes('.MI') ? 'Borsa Italiana' : 'Internazionale';
    
    resultsDiv.innerHTML = `
      <div class="m-card" onclick="openChart('${symbol}')" style="cursor:pointer; border-color:var(--primary); margin-top:10px; margin-bottom: 10px;">
        <strong>${symbol}</strong><br>
        <span class="price-big">${price.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</span>
        <span class="price-change" style="color: #94a3b8;">${exchange}</span>
        <span class="info-tag">Clicca per visualizzare il grafico</span>
      </div>
    `;
    showSuccess(`${symbol} trovato`);
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
  const settingsHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;" onclick="this.remove()">
      <div style="background: var(--card); padding: 30px; border-radius: 16px; border: 1px solid var(--border); max-width: 400px; width: 90%;" onclick="event.stopPropagation()">
        <h2 style="color: var(--primary); margin-top: 0;">Impostazioni</h2>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">
            <strong>Intervallo Aggiornamento</strong>
          </label>
          <select id="refresh-interval" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: white;">
            <option value="30000">30 secondi</option>
            <option value="60000" selected>1 minuto (attuale)</option>
            <option value="120000">2 minuti</option>
            <option value="300000">5 minuti</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">
            <strong>Numero Notizie</strong>
          </label>
          <input type="number" id="news-count" min="5" max="20" value="8" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: white;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 10px; color: #cbd5e1; cursor: pointer;">
            <input type="checkbox" id="auto-refresh" checked>
            <span>Auto-aggiornamento abilitato</span>
          </label>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #1e293b; border-radius: 8px; border-left: 4px solid var(--primary);">
          <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">
            <strong>Cache locale:</strong> ${(localStorage.length)} elementi<br>
            <strong>AI:</strong> Gemini integrato ✓<br>
            <strong>Storage:</strong> ${navigator.storage ? 'Disponibile' : 'Non disponibile'}
          </p>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button onclick="document.querySelector('[onclick*=toggleSettings]').parentElement.remove(); saveSettings();" style="flex: 1; padding: 10px; background: var(--primary); color: #064e3b; border: none; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Salva
          </button>
          <button onclick="this.closest('[style*=fixed]').remove();" style="flex: 1; padding: 10px; background: var(--border); color: var(--text); border: none; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', settingsHTML);
}

function saveSettings() {
  const interval = document.getElementById('refresh-interval')?.value || 60000;
  const newsCount = document.getElementById('news-count')?.value || 8;
  const autoRefresh = document.getElementById('auto-refresh')?.checked ?? true;
  
  localStorage.setItem('refreshInterval', interval);
  localStorage.setItem('newsCount', newsCount);
  localStorage.setItem('autoRefresh', autoRefresh);
  
  showSuccess('Impostazioni salvate!');
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

// ===== AI GEMINI =====

const GEMINI_API_KEY = "AIzaSyAaZXjK0BIIiLQUqOe0ds9wS8zg13wCfWM";

async function askGemini(question) {
  try {
    const prompt = `Tu sei un assistente finanziario esperto di metalli preziosi, criptovalute e borsa italiana.
    
Dati attuali:
- Oro: $${state.rawGoldUSD}/oz
- Argento: $${state.rawSilverUSD}/oz
- Alluminio: $${state.rawAluUSD}/ton
- Bitcoin: $${state.rawBtcUSD}
- Cambio EUR/USD: ${state.fxRate.toFixed(4)}

Rispondi in italiano, in modo conciso e professionale. Spiega in termini semplici. Max 3 paragrafi.

Domanda: ${question}`;

    // Usa v1 API (più stabile e con modelli attuali)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(data?.error?.message || `API Error ${response.status}`);
    }

    if (data.candidates && data.candidates.length > 0) {
      const content = data.candidates[0].content;
      if (content && content.parts && content.parts.length > 0) {
        return content.parts[0].text;
      }
    }
    
    throw new Error('Nessun contenuto nella risposta Gemini');
  } catch (e) {
    console.error('Errore Gemini dettagliato:', e);
    throw e;
  }
}

function openAIChat() {
  const chatHTML = `
    <div id="ai-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="if(event.target.id==='ai-overlay') document.getElementById('ai-overlay').remove()">
      <div style="background: var(--card); padding: 20px; border-radius: 16px; border: 2px solid var(--primary); max-width: 600px; width: 95%; height: 80vh; display: flex; flex-direction: column; box-shadow: 0 0 30px rgba(52, 211, 153, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h2 style="color: var(--primary); margin: 0; font-size: 1.2rem;">🤖 Assistente Gemini AI</h2>
          <button onclick="document.getElementById('ai-overlay').remove();" style="background: var(--border); color: var(--text); border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-weight: 800;">✕</button>
        </div>
        
        <div id="ai-chat-box" style="flex: 1; overflow-y: auto; padding: 15px; background: #0f172a; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border); display: flex; flex-direction: column;">
          <div style="color: #34d399; font-size: 0.9rem; padding: 10px; background: #064e3b; border-radius: 8px; text-align: center;">
            Ciao! Sono Gemini, l'assistente AI. Puoi farmi domande su oro, argento, bitcoin, borsa e molto altro!
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <input type="text" id="ai-input" placeholder="Fai una domanda..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: white; outline: none; font-size: 0.95rem;" onkeypress="if(event.key==='Enter') askAI();">
          <button onclick="askAI()" style="padding: 12px 20px; background: var(--primary); color: #064e3b; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; min-width: 80px;">Invia</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', chatHTML);
  document.getElementById('ai-input').focus();
}

async function askAI() {
  const input = document.getElementById('ai-input');
  const chatBox = document.getElementById('ai-chat-box');
  const question = input.value.trim();
  
  if (!question) return;
  
  // Mostra domanda utente
  const userMsg = document.createElement('div');
  userMsg.style.cssText = 'margin-bottom: 12px; text-align: right; display: flex; justify-content: flex-end;';
  userMsg.innerHTML = `
    <div style="background: var(--primary); color: #064e3b; padding: 10px 12px; border-radius: 8px; max-width: 80%; word-wrap: break-word;">
      ${question}
    </div>
  `;
  chatBox.appendChild(userMsg);
  
  input.value = '';
  input.disabled = true;
  
  // Mostra loading
  const loadingMsg = document.createElement('div');
  loadingMsg.id = 'loading-msg';
  loadingMsg.style.cssText = 'margin-bottom: 12px; display: flex; gap: 8px;';
  loadingMsg.innerHTML = `
    <div style="background: var(--border); color: #cbd5e1; padding: 10px 12px; border-radius: 8px;">
      <span class="loader" style="width: 14px; height: 14px; border: 2px solid var(--border); border-top: 2px solid var(--primary); display: inline-block; margin-right: 8px;"></span>
      Gemini sta pensando...
    </div>
  `;
  chatBox.appendChild(loadingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  try {
    const response = await askGemini(question);
    
    // Rimuovi loading
    loadingMsg.remove();
    
    // Mostra risposta
    const aiMsg = document.createElement('div');
    aiMsg.style.cssText = 'margin-bottom: 12px; display: flex; justify-content: flex-start;';
    aiMsg.innerHTML = `
      <div style="background: #1e293b; color: #cbd5e1; padding: 10px 12px; border-radius: 8px; border-left: 3px solid var(--primary); max-width: 80%; word-wrap: break-word;">
        ${response.replace(/\n/g, '<br>')}
      </div>
    `;
    chatBox.appendChild(aiMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    console.error('Errore:', e);
    loadingMsg.remove();
    
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'margin-bottom: 12px; display: flex; justify-content: flex-start;';
    errorMsg.innerHTML = `
      <div style="background: #7f1d1d; color: #fecaca; padding: 10px 12px; border-radius: 8px; border-left: 3px solid #ef4444;">
        Errore: ${e.message || 'Errore sconosciuto'}
      </div>
    `;
    chatBox.appendChild(errorMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  input.disabled = false;
  input.focus();
}

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
