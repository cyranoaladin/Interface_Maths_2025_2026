# Sauvegarde & Restauration – SQLite

## Sauvegarde manuelle

```bash
sqlite3 /opt/interface_maths/apps/backend/data/app.db ".backup 'app-backup-$(date +%F).db'"
```

## Restauration

```bash
sudo systemctl stop interface-maths
cp app-backup-YYYY-MM-DD.db /opt/interface_maths/apps/backend/data/app.db
sudo systemctl start interface-maths
```

## Cron quotidien (exemple)

```
0 2 * * * sqlite3 /opt/interface_maths/apps/backend/data/app.db ".backup '/opt/backups/app-$(date +\%F).db'"
```
