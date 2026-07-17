# ReWear

ReWear è un marketplace peer-to-peer per abbigliamento second-hand, realizzato con Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase e Stripe.

## Architettura

- **Frontend:** Next.js 14+ / React 18, App Router e TypeScript in strict mode.
- **UI:** Tailwind CSS, componenti shadcn/ui locali e Lucide.
- **Stato lato client:** Zustand per preferiti e preferenze UI; TanStack React Query per dati client dei preferiti.
- **Backend:** Supabase Auth, Postgres, Storage, RLS e Realtime-ready.
- **Pagamento:** sessione Stripe Checkout lato server, ordine creato con service role e webhook firmato per aggiornare ordine e annuncio.
- **Sicurezza:** middleware di sessione, Server Action validata da Zod, service-role mai esposto al browser e RLS su tutte le tabelle applicative.

## Struttura delle cartelle

```text
.
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── favorites/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── profile/page.tsx
│   │   └── sell/page.tsx
│   ├── actions/product.ts
│   ├── api/stripe/
│   │   ├── checkout/route.ts
│   │   └── webhook/route.ts
│   ├── auth/callback/route.ts
│   ├── how-it-works/page.tsx
│   ├── products/[id]/page.tsx
│   ├── safety/page.tsx
│   ├── terms/page.tsx
│   ├── users/[id]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── input.tsx
│   ├── BuyProductButton.tsx
│   ├── FavoriteProducts.tsx
│   ├── MessageComposer.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── SellProductForm.tsx
├── hooks/use-product-favorite.ts
├── lib/
│   ├── supabase/
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   └── server.ts
│   ├── stripe.ts
│   └── utils.ts
├── providers/query-provider.tsx
├── store/
│   ├── use-favorite-store.ts
│   └── use-ui-store.ts
├── supabase/schema.sql
├── types/database.ts
├── .env.example
├── middleware.ts
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Prerequisiti per Ubuntu 24.04 LTS

Node 20 è il minimo richiesto dalla CLI Supabase, ma è fuori manutenzione: per un progetto nuovo usa l'attuale LTS di Node (24 al momento della stesura). Installa Git, i tool di compilazione e Docker per la stack Supabase locale:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git build-essential docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Chiudi e riapri la sessione dopo `usermod`, quindi installa Node e npm tramite nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
node --version
npm --version
git --version
docker --version
```

Il comando `node --version` deve indicare una versione maggiore o uguale a 20. L'installazione di nvm aggiunge il caricamento automatico alla shell; per la sessione corrente usa le quattro righe mostrate sopra.

## Installazione del progetto

Clona o copia il progetto, entra nella directory e installa sia le dipendenze dell'app sia la CLI Supabase locale al progetto:

```bash
cd /percorso/a/ReWear
npm install
npm install --save-dev supabase
npx supabase --help
```

La CLI è intenzionalmente una dipendenza del progetto: così tutto il team usa `npx supabase ...` e può fissarne la versione nel lockfile.

## Variabili d'ambiente

Crea il file locale e compila ogni valore:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- I valori `NEXT_PUBLIC_*` sono utilizzabili nel browser.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` sono solo server-side: non aggiungere mai il prefisso `NEXT_PUBLIC_` e non committarli.
- In Supabase Dashboard, configura **Authentication → URL Configuration** con `http://localhost:3000` come Site URL e `http://localhost:3000/auth/callback` tra le Redirect URLs. Aggiungi anche il dominio di produzione prima del deploy.

## Database e Storage Supabase

Il file [supabase/schema.sql](supabase/schema.sql) crea le tabelle `profiles`, `products`, `categories`, `orders`, `messages` e `reviews`; enum, indici, trigger `updated_at`, trigger di creazione profilo su `auth.users`, bucket pubblico `product-images` e le policy RLS.

### Opzione A — Supabase Cloud / SQL Editor

1. Crea un progetto su Supabase.
2. Apri **SQL Editor → New query**.
3. Incolla l'intero contenuto di `supabase/schema.sql` ed eseguilo una sola volta su un database vuoto.
4. In **Project Settings → API**, copia Project URL, anon/publishable key e service role key in `.env.local`.

### Opzione B — CLI e database locale

La stack locale richiede Docker in esecuzione.

```bash
cd /percorso/a/ReWear
npx supabase init
mkdir -p supabase/migrations
cp supabase/schema.sql supabase/migrations/20260717000000_rewear_schema.sql
npx supabase start
npx supabase db reset
```

Usa l'output di `npx supabase start` per impostare `NEXT_PUBLIC_SUPABASE_URL`, la chiave pubblica e la service role key locali in `.env.local`. La dashboard locale è normalmente disponibile su `http://127.0.0.1:54323`.

### Opzione C — Pubblicare lo schema con la CLI

Per inviare la stessa migration a un progetto Supabase remoto:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
mkdir -p supabase/migrations
cp supabase/schema.sql supabase/migrations/20260717000000_rewear_schema.sql
npx supabase db push
```

Non eseguire sia l'opzione A sia l'opzione C sullo stesso database senza rendere idempotente la migration: entrambe creano gli stessi oggetti.

## Stripe in test mode

1. Crea una chiave segreta test in Stripe e impostala come `STRIPE_SECRET_KEY`.
2. Avvia l'app con `npm run dev`.
3. In un altro terminale, usa Stripe CLI per inoltrare gli eventi:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copia il valore `whsec_...` mostrato da Stripe CLI in `STRIPE_WEBHOOK_SECRET`.

Il checkout crea un ordine `pending`; l'evento firmato `checkout.session.completed` lo porta a `paid` e rende il prodotto `reserved`. In produzione configura lo stesso endpoint webhook nella Dashboard Stripe e registra il relativo signing secret.

## Sviluppo e produzione

Avvio in sviluppo:

```bash
npm run dev
```

Apri `http://localhost:3000`.

Controllo tipi e build di produzione:

```bash
npm run typecheck
npm run build
npm run start
```

`npm run start` serve la build su `http://localhost:3000` salvo configurazioni della piattaforma di deploy.

## Deploy automatico sulla VPS

Il repository include una pipeline GitHub Actions che verifica e pubblica automaticamente ogni push sulla branch `main`. La configurazione iniziale completa della VPS, del servizio permanente e delle GitHub Secrets è in [deploy/README.md](deploy/README.md).

## Verifica manuale essenziale

1. Registra due account e conferma l'email.
2. Con il primo account pubblica un articolo: le immagini devono finire nel bucket `product-images` sotto il prefisso dell'utente.
3. Con il secondo account apri l'annuncio, invia un messaggio e avvia Checkout Stripe con una carta test.
4. Verifica nella dashboard Supabase che ordine, messaggi, prodotto e profili rispettino RLS, e nella dashboard Stripe che l'evento webhook sia consegnato.

## Note di sicurezza

- Le modifiche di stato dell'ordine sono eseguite da codice server con service role dopo autenticazione o da webhook Stripe verificato.
- Il browser può caricare solo nel proprio prefisso `storage.objects`; la Server Action accetta soltanto URL pubblici del bucket ReWear.
- Per un lancio pubblico aggiungi rate limiting, osservabilità, flusso di spedizione/rimborso, moderazione annunci, privacy policy e revisione legale.
