# Deploy automatico su GitHub Actions e VPS

Questo progetto viene pubblicato dalla branch `main` del repository GitHub `AlcNot/ReWear` alla VPS `51.255.167.28`. GitHub Actions esegue prima il controllo TypeScript e la build; solo se entrambi hanno successo sincronizza i file e riavvia il servizio `rewear`.

La pipeline non trasferisce e non sovrascrive `.env.local`, `node_modules`, `.next` o `.git`. Le variabili segrete rimangono quindi solo sulla VPS e la build di produzione usa il suo `.env.local`.

## 1. Prima sincronizzazione del codice sulla VPS

Se la cartella `~/ReWear` sulla VPS e' stata creata con `scp` o `tar` e non e' un clone Git, preserva la copia attuale in un backup e clona il repository. Il comando conserva `.env.local` se esiste.

```bash
cd ~
backup_dir="ReWear-backup-$(date +%Y%m%d-%H%M%S)"
mv ReWear "$backup_dir"
git clone https://github.com/AlcNot/ReWear.git ReWear
if [ -f "$backup_dir/.env.local" ]; then cp "$backup_dir/.env.local" ReWear/.env.local; fi
cd ~/ReWear
```

Se invece `~/ReWear` e' gia' un clone del repository, basta aggiornare la branch principale:

```bash
cd ~/ReWear
git pull --ff-only origin main
```

Il backup non viene cancellato. Dopo avere verificato che il sito funziona, potrai eventualmente rimuoverlo manualmente.

## 2. Preparazione una sola volta sulla VPS

Connettiti alla VPS:

```bash
ssh ubuntu@51.255.167.28
cd ~/ReWear
node --version
npm --version
test -f .env.local && echo ".env.local presente"
```

Il comando deve mostrare Node 24 e confermare la presenza di `.env.local`. Se manca, crealo senza inserirlo in Git:

```bash
cd ~/ReWear
cp .env.example .env.local
nano .env.local
```

Inserisci nella copia locale le chiavi reali di Supabase. In particolare, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sono necessari per registrazione e login; l'assenza o un valore fittizio provoca `Failed to fetch` nel browser.

Installa il servizio permanente. L'app resta privata su `127.0.0.1:3000`; Nginx riceve il traffico pubblico sulle porte HTTP e HTTPS:

```bash
cd ~/ReWear
sudo install -D -m 644 deploy/rewear.service /etc/systemd/system/rewear.service
sudo systemctl daemon-reload
sudo systemctl enable --now rewear
sudo systemctl status rewear --no-pager
curl -I http://127.0.0.1:3000
```

## 3. Dominio Wearware, Nginx e HTTPS

Nel gestore DNS di `wearware.it`, crea i record `A` per `@` e `www` verso `51.255.167.28`. Rimuovi eventuali record `AAAA` che non puntino alla VPS.

```bash
sudo apt update
sudo apt install -y nginx
sudo install -D -m 644 ~/ReWear/deploy/wearware.it.nginx.conf /etc/nginx/sites-available/wearware.it
sudo ln -sfn /etc/nginx/sites-available/wearware.it /etc/nginx/sites-enabled/wearware.it
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
```

Dopo la propagazione dei DNS, crea il certificato HTTPS:

```bash
sudo snap install --classic certbot
sudo ln -sfn /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d wearware.it -d www.wearware.it
sudo certbot renew --dry-run
```

Consenti al solo utente `ubuntu` di riavviare e controllare il servizio senza password: GitHub Actions potrà eseguire esclusivamente questi due comandi con `sudo`.

```bash
sudo tee /etc/sudoers.d/rewear-github-actions >/dev/null <<'EOF'
ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart rewear, /usr/bin/systemctl is-active rewear
EOF
sudo chmod 440 /etc/sudoers.d/rewear-github-actions
sudo visudo -cf /etc/sudoers.d/rewear-github-actions
```

L'ultimo comando deve rispondere che il file è valido. Se non lo è, non continuare: elimina il file con `sudo rm /etc/sudoers.d/rewear-github-actions` e correggi il comando.

## 4. Chiave SSH riservata a GitHub Actions

Sempre sulla VPS, crea una nuova chiave dedicata. Non inviare mai la chiave privata in chat né committarla nel repository.

```bash
install -d -m 700 ~/.ssh
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/rewear_github_actions -N '' -C 'github-actions-rewear'
cat ~/.ssh/rewear_github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/rewear_github_actions
```

L'ultimo comando stampa la chiave privata. Copiala direttamente nella secret GitHub del punto successivo, poi chiudi il terminale o cancella la selezione. La chiave pubblica è già stata autorizzata sul server.

Dal tuo PC ottieni anche l'impronta SSH della VPS da salvare su GitHub:

```bash
ssh-keyscan -t ed25519 -H 51.255.167.28
```

Verifica che l'impronta sia quella del tuo server prima di salvarla. Dalla VPS puoi visualizzare quella attesa con:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

## 5. Repository secrets GitHub

Apri `https://github.com/AlcNot/ReWear/settings/secrets/actions`, seleziona **New repository secret** e crea esattamente questi quattro secrets:

| Nome | Valore |
| --- | --- |
| `VPS_HOST` | `51.255.167.28` |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | Contenuto completo di `~/.ssh/rewear_github_actions` |
| `VPS_KNOWN_HOSTS` | Riga prodotta da `ssh-keyscan -t ed25519 -H 51.255.167.28` |

Le secrets non possono essere lette nuovamente da GitHub: se incolli un valore errato, sostituiscilo con **Update secret**.

## 6. Primo deploy e deploy successivi

Dopo avere creato le quattro secrets, apri `https://github.com/AlcNot/ReWear/actions/workflows/deploy.yml`, seleziona **Run workflow** e avvialo sulla branch `main`. Controlla che i job `Type-check and build` e `Deploy to production VPS` siano verdi.

Da quel momento, ogni `git push origin main` avvia automaticamente lo stesso deploy. Per controllare il servizio dopo un deploy:

```bash
ssh ubuntu@51.255.167.28 'sudo systemctl status rewear --no-pager'
ssh ubuntu@51.255.167.28 'journalctl -u rewear -n 100 --no-pager'
```

Apri `http://51.255.167.28` per verificare la pubblicazione. Dopo aver creato un record DNS `A` per il dominio verso l'IP della VPS, il sito sarà disponibile anche dal dominio. Per HTTPS è necessario configurare in seguito un reverse proxy con certificato TLS.
