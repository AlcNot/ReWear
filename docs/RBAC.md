# RBAC a cinque livelli

Questa implementazione usa Supabase/PostgreSQL. Non usa MySQL: le policy RLS, le funzioni gerarchiche e i ruoli sono applicati direttamente nel database Supabase.

## Ruoli e accesso alle dashboard

| Ruolo | Livello | Sezione disponibile | Capacità |
| --- | ---: | --- | --- |
| `user` | 1 | `/overview` | Compra, vende e usa il marketplace. |
| `trusted_user` | 2 | `/trusted` | Creator Studio e analisi vendite. |
| `moderator` | 3 | `/moderator` | Coda report e rimozione annunci di ruoli inferiori. |
| `lead_moderator` | 4 | `/supervisor` | Audit log, escalation, avvisi e sospensioni di ruoli inferiori. |
| `admin` | 5 | `/admin/settings` | Ruoli e impostazioni globali. |

`(dashboard)` è un Next.js route group: il suo nome non appare negli URL. Il middleware e il layout verificano entrambi le autorizzazioni lato server.

## Applicare la migration

1. In Supabase Dashboard apri **SQL Editor**.
2. Se è un nuovo progetto, esegui prima `supabase/schema.sql`.
3. Esegui poi l'intero file `supabase/migrations/20260717000100_add_five_tier_rbac.sql`.

Con Supabase CLI, dopo aver collegato il progetto, puoi usare:

```bash
npx supabase db push
```

## Creare il primo admin

1. Registra il primo utente dal sito oppure crealo in Supabase Auth.
2. In **Authentication → Users**, copia il suo UUID.
3. Esegui nel SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'INCOLLA-UUID-DEL-PRIMO-ADMIN';
```

Solo un admin già esistente può assegnare ruoli dalla dashboard. Non è possibile auto-promuoversi.

## Risolvere `Failed to fetch` in registrazione

La registrazione richiama Supabase Auth dal browser. Sulla VPS imposta valori reali in `.env.local`; non lasciare i valori di esempio e non condividere mai le chiavi in chat.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYMENT_PROVIDER=demo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In Supabase Dashboard, configura **Authentication → URL Configuration** con:

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Riavvia sempre Next.js dopo una modifica a `.env.local`:

```bash
rm -rf .next
npm run build
HOSTNAME=127.0.0.1 PORT=3000 npm run start
```

## Sicurezza

- RLS limita report, audit log e configurazioni globali.
- Le Server Actions validano ogni input con Zod e ricontrollano ruolo, stato account e gerarchia prima di usare il service role.
- I log di moderazione sono append-only lato client: solo il server con service role può inserirli.
- Non rendere pubbliche né la service role key né la porta del database.
