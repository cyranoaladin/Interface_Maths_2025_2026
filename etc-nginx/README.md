# Nginx production snippets

`maths.labomaths.tn.conf` includes `/etc/nginx/snippets/correction_api_auth_header.conf` for the correction API bearer header.

Install that local-only snippet on the server with:

```bash
ADMIN_API_TOKEN="$(openssl rand -hex 40)" sudo -E ./etc-nginx/install-correction-api-auth-header.sh
sudo nginx -t
sudo systemctl reload nginx
```

Use the same `ADMIN_API_TOKEN` value in the correction backend environment. Do not commit the generated snippet.
