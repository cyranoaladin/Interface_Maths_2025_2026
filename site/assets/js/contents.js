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
      if(!items.length) continue
      const section = document.createElement('section')
      const h3 = document.createElement('h3'); h3.textContent = label
      const ul = document.createElement('ul')
      items.sort((a,b)=>a.title.localeCompare(b.title)).forEach(it => {
        const li = document.createElement('li')
        const a = document.createElement('a'); a.href = it.url; a.textContent = it.title
        li.appendChild(a); ul.appendChild(li)
      })
      section.appendChild(h3); section.appendChild(ul)
      frag.appendChild(section)
    }
    container.innerHTML = ''
    if(!frag.childNodes.length){ container.innerHTML = '<small>Aucun contenu détecté.</small>'; return }
    container.appendChild(frag)
  }

  fetch('/api/tree').then(r=>r.json()).then(tree => {
    const groups = groupTree(tree)
    renderGroups(groups)
  }).catch(() => {
    container.innerHTML = '<small>Impossible de charger le sommaire dynamique.</small>'
  })
})()

