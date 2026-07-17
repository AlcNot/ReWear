# ReWear su MySQL

Questo schema richiede MySQL 8.0.16 o superiore e crea un database `rewear` con utenti, sessioni, categorie, prodotti, immagini, spedizioni, preferiti, ordini, messaggi e recensioni.

## Installazione su Ubuntu 24.04

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

## Creazione dell'utente applicativo

Sostituisci la password con una lunga password casuale, mai con quella di root.

```bash
sudo mysql
```

```sql
CREATE USER 'rewear_app'@'localhost' IDENTIFIED BY 'sostituisci-con-password-lunga-e-casuale';
GRANT SELECT, INSERT, UPDATE, DELETE ON rewear.* TO 'rewear_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Importazione

Trasferisci `database/mysql/schema.sql` sulla VPS, poi esegui:

```bash
sudo mysql < schema.sql
sudo mysql -e "USE rewear; SHOW TABLES;"
```

Non esporre la porta 3306 pubblicamente. Il database deve restare raggiungibile solo dall'applicazione in locale o tramite rete privata.

## Importante

Lo schema sostituisce il database, non Supabase come prodotto. L'attuale codice Next.js usa Supabase per Auth, Storage, RLS, query e Stripe webhook. Per rendere MySQL operativo nell'app occorre rifattorizzare backend e autenticazione, ad esempio con Drizzle/Prisma, Auth.js e S3 o MinIO per le immagini.
