(() => {
  const container = document.getElementById('auto-index-body')
  if (!container) return

  function groupTree(node){
    const groups = {
      'EDS Première': [],
      'EDS Terminale': [],
      'Maths expertes': [],
      Autres: [],
    }
    function walk(n, basePath=[]){
      if(!n || !n.children) return
      for(const c of n.children){
        if(c.type === 'dir') walk(c, basePath.concat(c.name))
        else if(c.type === 'file'){
          const path = (c.path || '').toLowerCase()
          const item = { title: c.title || c.name, url: '/content/' + c.path }
          if(path.startsWith('eds_premiere/')) groups['EDS Première'].push(item)
          else if(path.startsWith('eds_terminale/')) groups['EDS Terminale'].push(item)
          else if(path.startsWith('maths_expertes/')) groups['Maths expertes'].push(item)
          else groups['Autres'].push(item)
        }
      }
    }
    walk(node)
    return groups
  }

  function renderGroups(groups){
    const frag = document.createDocumentFragment()
    for(const [label, items] of Object.entries(groups)){
      if(label === 'Autres') continue // masquer le groupe "Autres"
      if(!items.length) continue
      const section = document.createElement('section')
      const h3 = document.createElement('h3'); h3.textContent = label
      const ul = document.createElement('ul')
      items.sort((a,b)=>a.title.localeCompare(b.title, 'fr')).forEach(it => {
        const li = document.createElement('li')
        const a = document.createElement('a'); a.href = it.url; a.textContent = it.title; a.target = '_blank'; a.rel = 'noopener'
        li.appendChild(a); ul.appendChild(li)
      })
      section.appendChild(h3); section.appendChild(ul)
      frag.appendChild(section)
    }
    container.innerHTML = ''
    if(!frag.childNodes.length){ container.innerHTML = '<small>Aucun contenu détecté.</small>'; return }
    container.appendChild(frag)
  }

  // Préférer le statique en production (pas d'API sur le VPS)
  const isHttp = location.protocol === 'http:' || location.protocol === 'https:'
  function fetchApiTree() {
    return fetch('/api/tree').then(r => {
      if (!r.ok) throw new Error('no api');
      return r.json();
    });
  }

  function handleApiTree(tree) {
    const groups = groupTree(tree);
    renderGroups(groups);
  }

  function handleApiError(e) {
    container.innerHTML = '<small>Impossible de charger le sommaire.</small>';
  }

  const tryApi = () =>
    fetchApiTree()
      .then(handleApiTree)
      .catch(handleApiError);
  const tryStaticJson = () => fetch('assets/contents.json').then(r=>{ if(!r.ok) throw new Error('no contents.json'); return r.json() }).then(data => { if (data && data.groups) renderGroups(data.groups); else throw new Error('invalid contents.json') })
  const tryStaticJs = () => new Promise((resolve,reject)=>{
    const s = document.createElement('script'); s.src = 'assets/contents.static.js'; s.onload = () => { try { if (window.__SITE_CONTENTS__?.groups) { renderGroups(window.__SITE_CONTENTS__.groups); resolve() } else reject(new Error('no data')) } catch(e){ reject(e) } }; s.onerror = reject; document.head.appendChild(s);
  })
  // Ordre: JSON statique -> JS statique -> API (si dispo)
  tryStaticJson().catch(()=> tryStaticJs().catch(()=> (isHttp ? tryApi() : Promise.reject()))).catch(()=>{
    container.innerHTML = '<small>Impossible de charger le sommaire.</small>'
  })
})()

