import re
with open('README.md', 'r') as f:
    c = f.read()

c = re.sub(r'- `apps/legacy-site/` — Site public principal.*?\\n', '- `site/` — Frontend Vite principal (HTML/CSS/JS), servi comme racine de contenu.\\n', c)
c = re.sub(r'- `apps/vue-client/` — Prototype Vue 3.*?\\n', '', c)
c = c.replace('apps/legacy-site', 'site')
c = c.replace('apps/frontend', 'site')

with open('README.md', 'w') as f:
    f.write(c)

