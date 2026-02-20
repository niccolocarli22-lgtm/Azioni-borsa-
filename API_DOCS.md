# Documentazione API - Borsa Carli

## 📡 Endpoint e Fonti Dati

### 1. Yahoo Finance API

**Base URL**: `https://query1.finance.yahoo.com/v8/finance/chart`

#### Metalli Preziosi

| Ticker | Asset | Unità |
|--------|-------|-------|
| `GC=F` | Oro (Oro futures) | USD/troy oz |
| `SI=F` | Argento (Silver futures) | USD/troy oz |
| `ALI=F` | Alluminio | USD/tonnellata |

**Endpoint**: 
```
GET /v8/finance/chart/{TICKER}
```

**Response**:
```json
{
  "chart": {
    "result": [
      {
        "meta": {
          "regularMarketPrice": 2850.50
        }
      }
    ]
  }
}
```

**Rate Limit**: ✅ Illimitato (no auth)
**Latenza**: 200-500ms
**Update freq**: Real-time (min by min)

---

### 2. Finnhub API

**Base URL**: `https://finnhub.io/api/v1`
**Autenticazione**: Token URL parameter
**Key**: `d6b3blpr01qnr27jgq90d6b3blpr01qnr27jgq9g` (Free Tier)

#### Quote Endpoint

```
GET /quote
Params:
  - symbol: String (es. "AAPL", "BINANCE:BTCUSDT", "FX:EURUSD")
  - token: String (API key)
```

**Response**:
```json
{
  "c": 2850.50,        // Current price
  "h": 2860.00,        // High
  "l": 2840.00,        // Low
  "o": 2845.00,        // Open
  "pc": 2840.00,       // Previous close
  "t": 1614556800      // Timestamp
}
```

#### News Endpoint

```
GET /news
Params:
  - category: String (es. "general", "forex", "crypto")
  - min_id: Number (pagination)
  - token: String
```

**Response**:
```json
[
  {
    "id": "12345",
    "headline": "Gold prices rise amid...",
    "url": "https://...",
    "image": "https://...",
    "category": "general",
    "datetime": 1614556800
  }
]
```

**Rate Limit (Free Tier)**:
- Standard: 60 calls/min
- News: 60 calls/min
- Totale: ~20-30 richieste/min app

**Upgrade**: https://finnhub.io/pricing

---

### 3. TradingView Widget

**Library**: `https://s3.tradingview.com/tv.js`
**No auth**: Public widget
**Limit**: Illimitato (client-side)

**Usage**:
```javascript
new TradingView.widget({
  "autosize": true,
  "symbol": "NASDAQ:AAPL",
  "theme": "dark",
  "container_id": "tv-widget",
  "interval": "D",
  "style": "1",
  "timezone": "Europe/Rome"
})
```

---

## 💾 Caching Strategy

| Data | TTL | Strategy |
|------|-----|----------|
| Quote (Oro, Argento, etc.) | 5 min | Network-first |
| Cambio EUR/USD | 5 min | Network-first |
| News | 10 min | Network-first |
| Assets (CSS, JS) | Forever | Cache-first |
| TradingView charts | Not cached | Network |

---

## 🔄 Flusso Aggiornamento

```
┌─────────────────────────────────┐
│  Avvio Applicazione             │
├─────────────────────────────────┤
│ 1. Carica dati da cache         │
│ 2. Fetch dati da API (parallelo)│
│    ├─ Cambio EUR/USD            │
│    ├─ Prezzi metalli            │
│    ├─ Bitcoin                   │
│    └─ Notizie                   │
│ 3. Aggiorna UI                  │
│ 4. Salva in cache               │
└─────────────────────────────────┘
     ↓ (ogni 60 secondi)
┌─────────────────────────────────┐
│  updateAll() - Auto Refresh     │
└─────────────────────────────────┘
```

---

## 📝 Esempi di Chiamate

### Prezzo Oro

```javascript
// Yahoo Finance - Oro
fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F')
  .then(r => r.json())
  .then(data => {
    const price = data.chart.result[0].meta.regularMarketPrice;
    console.log('Oro: $' + price + '/oz');
  });
```

### Cambio EUR/USD

```javascript
// Finnhub - Cambio
const API_KEY = "YOUR_KEY";
fetch(`https://finnhub.io/api/v1/quote?symbol=FX:EURUSD&token=${API_KEY}`)
  .then(r => r.json())
  .then(data => {
    const rate = 1 / data.c; // Inverti per EUR/USD
    console.log('1 EUR = $' + rate);
  });
```

### Bitcoin

```javascript
// Finnhub - Bitcoin
fetch(`https://finnhub.io/api/v1/quote?symbol=BINANCE:BTCUSDT&token=${API_KEY}`)
  .then(r => r.json())
  .then(data => {
    console.log('BTC: $' + data.c);
  });
```

### Notizie

```javascript
// Finnhub - News
fetch(`https://finnhub.io/api/v1/news?category=general&token=${API_KEY}`)
  .then(r => r.json())
  .then(news => {
    news.forEach(article => {
      console.log(article.headline);
    });
  });
```

---

## ⚠️ Limitazioni e CORS

### CORS Issues

Le API da queste source hanno restrizioni:
- **Yahoo Finance**: ✅ CORS abilitato
- **Finnhub**: ✅ CORS abilitato  
- **TradingView**: ✅ CORS abilitato

Se vedi errori CORS:
```javascript
// Soluzione: Usa un proxy CORS
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
fetch(CORS_PROXY + API_URL)
```

### Rate Limiting

Finnhub Free Tier:
- **60 richieste/minuto**
- App update ogni 60s = 4 richieste/minuto
- News ogni 60s = 1 richiesta/minuto
- Ricerca = 1-2 richieste per search

**Total**: ~5-7 req/min in normal use ✅ OK

### Error Handling

```javascript
async function fetchSafe(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    // Fallback a cache locale
    return getFromCache();
  }
}
```

---

## 🔐 Secure API Key Management

**NON fare**:
```javascript
const API_KEY = "d6b3blpr01qnr27jgq90d6b3blpr01qnr27jgq9g";  // ❌ VISIBILE!
```

**Fare** (in produzione):
1. Salva in `.env` (non committare)
2. Carica da backend
3. Usa un proxy server

**.env**:
```
FINNHUB_KEY=d6b3blpr01qnr27jgq90d6b3blpr01qnr27jgq9g
```

**.gitignore**:
```
.env
.env.local
```

**Backend proxy** (Node.js):
```javascript
app.get('/api/quote/:symbol', async (req, res) => {
  const key = process.env.FINNHUB_KEY;
  const url = `https://finnhub.io/api/v1/quote?symbol=${req.params.symbol}&token=${key}`;
  const data = await fetch(url).then(r => r.json());
  res.json(data);
});
```

---

## 📊 Data Latency e Accuratezza

| Source | Latency | Accuracy | Notes |
|--------|---------|----------|-------|
| Yahoo Finance | ~30-60s | Derivato | Real futures |
| Finnhub | ~30s | Aggregato | Multi-source |
| Cambio EURUSD | ~5-10s | Live | Base calcoli |
| TradingView | Real-time | Multi-source | Grafico |

---

**Last Updated**: February 2026 | Version 1.0.0
