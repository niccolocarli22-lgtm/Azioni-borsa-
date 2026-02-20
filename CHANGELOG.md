# CHANGELOG

## [1.0.0] - 2026-02-20

### ✨ Nuovo

- **Tracking variazioni prezzi**: Visualizza +/- con colori verde (su) e rosso (giu)
- **Gestione errori migliorata**: Message system per errori e successi
- **Loading states**: Spinner durante caricamento dati
- **Status bar**: Mostra ultimo aggiornamento e stato connessione
- **Local Storage**: Salva preferenze utente (unità selezionata)
- **Cache system**: 5 min TTL per API, fallback offline
- **Service Worker avanzato**: Network-first per API, cache-first per assets
- **PWA completa**: Installabile su iOS e Android
- **Keyboard support**: Enter per ricerca azioni
- **Header dinamico**: Pulsanti refresh e settings
- **Better UX**: Hover effects, smooth transitions, responsive design
- **Error boundary**: Try-catch su tutte le funzioni
- **Network detection**: Auto-refresh quando connessione torna

### 🔧 Modificato

- **HTML**: Refactored con semantic HTML, meta tags ottimizzati
- **CSS**: Variabili CSS, design system coerente, responsive migliorato
- **JavaScript**: Organizzato in funzioni modulari, comments chiari
- **Manifest.json**: Aggiunto scope, shortcuts, screenshots
- **Service Worker**: Caching strategy separato per API e assets
- **App.js**: Separato da HTML (best practice)

### 🐛 Fix

- Gestione errori API che non ritornano dati
- CORS pre-flight handling
- Memory leak da interval non cancellati
- Rendering doppio prezzi
- Fallback per API key vuota

### 📚 Documentazione

- README completo con setup e features
- API_DOCS con endpoint dettagliati
- Inline comments nel codice
- CHANGELOG (questo file)
- .gitignore e package.json

### 🎯 Performance

- Lazy loading per TradingView (display:none by default)
- CSS minified da future tools
- JavaScript tree-shakeable (vanilla, no deps)
- Service Worker cache per ridurre API calls
- Local storage per preferenze (no API call)

### 🔒 Security

- No hardcoding secrets (API key in app, non ideale per prod)
- HTTPS only in production
- CSP headers (via server)
- Input sanitization per search

### 📱 PWA

- Offline support con Service Worker
- Home screen icon
- Responsive design mobile-first
- Install prompt on compatible browsers
- Shortcuts per azioni rapide

---

## Versioni Future

### [1.1.0] - Planned

- [ ] Backend proxy per API key sicura
- [ ] Database locale (IndexedDB) per storico prezzi
- [ ] Grafici storici con Chart.js
- [ ] Alert/Notifiche per variazioni prezzo
- [ ] Portafoglio personalizzato
- [ ] Multi-valuta support
- [ ] Dark/Light mode toggle
- [ ] Push notifications

### [1.2.0] - Planned

- [ ] Mobile app nativa (React Native)
- [ ] Export CSV/PDF
- [ ] Advanced analytics
- [ ] Social features (share quotazioni)
- [ ] API pubblica per third-party

---

## Note Sviluppo

### Come aggiornare versione

1. Modifica `version` in `package.json`
2. Modifica `CACHE_NAME` in `sw.js`
3. Aggiungi entry in CHANGELOG
4. Commit e tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

### Testing checklist

- [ ] Prezzi caricate corretti
- [ ] Offline funziona (DevTools → Offline)
- [ ] Service Worker registrato (DevTools → SW)
- [ ] Cache valido (DevTools → Application → Cache Storage)
- [ ] Responsive su mobile (DevTools → Device Toolbar)
- [ ] Notizie caricate (max 8)
- [ ] Ricerca azioni funziona
- [ ] Grafico TradingView carica
- [ ] PWA installabile (menu → Installa app)

### Deployment steps

1. Verifica cache non troppo grande
2. Test PWA su iOS/Android
3. Test offline mode
4. Monitor API rate limits (Finnhub dashboard)
5. Setup 301 redirects (se cambio domini)
6. SSL certificate (HTTPS obbligatorio per SW)
7. Update manifest.json per deployment

---

**Maintained by**: Borsa Carli Team
**Last Updated**: 2026-02-20
**License**: MIT
