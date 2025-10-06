# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: PMF
      - heading "Mon espace" [level=1] [ref=e5]
      - paragraph [ref=e6]: Chargement…
  - navigation "Navigation principale" [ref=e8]:
    - link "Accueil" [ref=e9] [cursor=pointer]:
      - /url: /content/index.html
    - link "Ressources" [ref=e10] [cursor=pointer]:
      - /url: /content/ressources.html
    - button "Se déconnecter" [ref=e11] [cursor=pointer]
  - main [ref=e12]:
    - complementary [ref=e13]:
      - navigation "Menu latéral" [ref=e14]:
        - link "Aperçu" [ref=e15] [cursor=pointer]:
          - /url: "#"
    - generic [ref=e17]:
      - heading "Aperçu" [level=2] [ref=e18]
      - generic [ref=e19]: Bienvenue.
```