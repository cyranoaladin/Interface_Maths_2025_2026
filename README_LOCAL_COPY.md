# Copie locale de maths.labomaths.tn

Date de copie: 2026-05-24
Serveur source: root@88.99.254.59

## Contenu

- `var-www/maths/`: webroot nginx actuellement servi pour `maths.labomaths.tn`
- `var-www/maths.labomaths.tn/Interface_Maths_2025_2026/`: dossier source trouve sur la prod
- `etc-nginx/maths.labomaths.tn.conf`: vhost nginx copie depuis `/etc/nginx/sites-enabled/maths.labomaths.tn`
- `opt/expose_premiers/`: service Node expose sur `127.0.0.1:8037`
- `opt/math-correction/`: projet Docker Compose du module `/correction/`
- `dumps/math-correction-postgres.dump`: dump PostgreSQL custom du conteneur `math-correction-postgres-1`
- `metadata/`: inventaire, tailles, comptes fichiers et verification du dump

## Notes

- La prod nginx sert `/var/www/maths` comme racine principale.
- `/api/` pointe vers `127.0.0.1:8002`, mais aucun listener `8002` n'a ete observe pendant la copie.
- `/expose_premiers/api/` pointe vers le service Node local en `8037`.
- `/correction/` utilise les conteneurs Docker `math-correction-*`.

## Verification effectuee

- Comptes fichiers local/prod identiques pour les dossiers copies.
- Dump PostgreSQL verifie avec `pg_restore --list`.
