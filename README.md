# Borsa Carli - Quotazioni Metalli Preziosi 📊

Applicazione web moderna per consultare quotazioni in tempo reale di metalli preziosi, criptovalute e azioni. Ottimizzata come PWA con supporto offline.

## 🚀 Features

- **Quotazioni in tempo reale**: Oro, argento, alluminio e Bitcoin
- **Calcolo spread realistico**: Diverso per ogni taglio (1g, 50g, 100g, oncia)
- **Conversion EUR/USD automatica**: Basata su tassi di cambio live
- **Tracking variazioni**: Visualizza i + e - delle ultime 24h
- **Notizie di mercato**: Feed da Finnhub
- **Ricerca azioni**: Visualizza grafico TradingView in-app
- **Supporto offline**: Cache locale con fallback
- **PWA**: Installabile su mobile e desktop
- **Dark mode**: Design moderno e ottimizzato
- **Responsive**: Perfetto su qualsiasi dispositivo

## 🛠️ Tecnologie

- **HTML5** - Struttura semantica
- **CSS3** - Grid, Flexbox, animazioni
- **JavaScript vanilla** - Zero dipendenze (eccetto TradingView)
- **Service Worker** - Offline support e caching
- **PWA** - Installazione su home screen

## 📡 API utilizzate

| Servizio | Endpoint | Uso |
|----------|----------|-----|
| **Yahoo Finance** | `query1.finance.yahoo.com` | Oro, Argento, Alluminio (GC=F, SI=F, ALI=F) |
| **Finnhub** | `finnhub.io` | Cambio EUR/USD, Bitcoin, Notizie, Ricerca azioni |
| **TradingView** | `s3.tradingview.com/tv.js` | Grafici interattivi |

## 📦 Installazione

### Locale (sviluppo)

```bash
# Clone repo
git clone <repository-url>
cd borsacarli

# Serve con un web server (es. Python)
python -m http.server 8000

# Oppure con Node
npx http-server
```

Visita `http://localhost:8000`

### Deploy (produzione)

1. **Hosting statico** (Vercel, Netlify, GitHub Pages)
   - Non richiede backend
   - Tutto il lato client

2. **Docker** (opzionale per proxy API)
   ```dockerfile
   FROM nginx:alpine
   COPY . /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

## 📁 Struttura file

```
borsacarli/
├── index.html          # Layout principale
├── app.js              # Logica applicazione
├── sw.js               # Service Worker
├── manifest.json       # Config PWA
├── README.md           # Questo file
├── icona.png           # Logo app (512x512)
└── .gitignore          # Git ignore
```

## 🔧 Configurazione

### Modificare gli spreads (commissioni fisiche)

Nel file `app.js`, funzione `renderPrices()`:

```javascript
const SPREAD = {
  '1g': 1.15,    // 15% commissione
  'oz': 1.05,    // 5% commissione
  '50g': 1.04,   // 4% commissione
  '100g': 1.03   // 3% commissione
};
```

### Cambiare intervallo aggiornamento

Nel file `app.js`:

```javascript
const UPDATE_INTERVAL = 60000; // 60 secondi
// Cambia a: 30000 (30s), 120000 (2min), ecc.
```

### API Key Finnhub

Nel file `app.js`:

```javascript
const API_KEY = "d6b3blpr01qnr27jgq90d6b3blpr01qnr27jgq9g";
// Sostituisci con la tua da https://finnhub.io
```

**⚠️ IMPORTANTE**: Genera una tua API key gratuita da Finnhub e non condividere quella in repo!

## 🔒 Privacy e Sicurezza

- **No database**: Tutti i dati sono pubblici (API esterne)
- **Local storage**: Solo salva l'unità selezionata
- **CORS**: Alcune API potrebbero avere restrizioni cross-origin
- **No tracking**: Nessun analytics o tracciamento

## 📱 PWA Installation

### iOS (Safari)
1. Tap condividi → "Aggiungi a Home"
2. L'app apparirà in home screen

### Android (Chrome)
1. Menu (3 puntini) → "Installa app"
2. Oppure tap banner "Installa BorsaCarli"

### Desktop
1. Chrome: Menu → "Installa BorsaCarli"
2. Edge: Menu → "Installa questa app"

## 🐛 Troubleshooting

### Prezzi non si aggiornano
- Verificare la connessione internet
- Controllare che le API siano raggiungibili
- Controllare la console del browser (F12)

### Service Worker non funziona
```javascript
// Pulire cache manualmente:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### CORS errors
Se vedi errori CORS, le API potrebbero avere restrizioni. Soluzioni:
1. Usare un proxy CORS (es. https://cors-anywhere.herokuapp.com/)
2. Deploy su server backend che fa proxy
3. Contattare provider API

## 📊 Miglioramenti futuri

- [ ] Grafici storici prezzi
- [ ] Alert su variazioni prezzi
- [ ] Portafoglio personalizzato
- [ ] Export dati CSV
- [ ] Dark/Light mode toggle
- [ ] Notifiche push
- [ ] Support multi-valuta
- [ ] Storico transazioni

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

MIT - Vedi LICENSE.md

## 👨‍💻 Sviluppatore

**Borsa Carli** - 2026

- 📧 Email: info@borsacarli.it
- 🌐 Sito: https://borsacarli.it
- 📱 Mobile app PWA

## 🙏 Crediti

- Dati: Yahoo Finance, Finnhub, TradingView
- Design: Inter font (Google Fonts)
- Icons: Unicode symbols

## ⚠️ Disclaimer

Questa app è fornita per scopi informativi. Non è consulenza finanziaria. Verifica sempre i prezzi su fonti ufficiali prima di effettuare transazioni. L'autore non è responsabile per perdite finanziarie.

---

**Last Update**: February 2026 | **Version**: 1.0.0
