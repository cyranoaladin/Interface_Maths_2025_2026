(function initPortal() {
  "use strict";

  var STORAGE_KEY = "safa_rattrapage_last_pdf";
  var timers = {
    prep: { duration: 20 * 60, remaining: 20 * 60, interval: null, outputId: "prep-timer", endsAt: 0 },
    talk: { duration: 20 * 60, remaining: 20 * 60, interval: null, outputId: "talk-timer", endsAt: 0 }
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function allResources() {
    var data = window.RATTRAPAGE_RESOURCES;
    return [].concat(data.guides, data.mathsSubjects, data.nsiSubjects);
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Le portail reste utilisable si le stockage local est désactivé ou plein.
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignorer les erreurs de stockage non critiques.
    }
  }

  function findResource(id) {
    return allResources().find(function findById(resource) {
      return resource.id === id;
    });
  }

  function priorityClass(priority) {
    if (priority === 1) return "priority-badge p1";
    if (priority === 2) return "priority-badge p2";
    return "priority-badge bonus";
  }

  function renderPdfButtons(resource) {
    var row = createElement("div", "button-row");
    var view = createElement("button", "button button-primary", "Lire dans la page");
    view.type = "button";
    view.dataset.resourceId = resource.id;
    view.classList.add("js-open-pdf");

    var download = createElement("a", "button button-secondary", "Télécharger");
    download.href = resource.path;
    download.setAttribute("download", "");

    var open = createElement("a", "button button-secondary", "Nouvel onglet");
    open.href = resource.path;
    open.target = "_blank";
    open.rel = "noopener";

    row.append(view, download, open);
    return row;
  }

  function renderGuides() {
    var container = $("#guides-list");
    window.RATTRAPAGE_RESOURCES.guides.forEach(function renderGuide(resource) {
      var card = createElement("article", "resource-card");
      var badge = createElement("span", priorityClass(resource.priority), "Priorité " + resource.priority);
      var title = createElement("h3", "", resource.title);
      var description = createElement("p", "", resource.description);
      card.append(badge, title, description, renderPdfButtons(resource));
      container.append(card);
    });
  }

  function renderMathsSubjects() {
    var container = $("#maths-subjects");
    window.RATTRAPAGE_RESOURCES.mathsSubjects.forEach(function renderMaths(resource) {
      var card = createElement("article", "subject-card");
      card.append(
        createElement("span", priorityClass(resource.priority), "Priorité " + resource.priority),
        createElement("h3", "", resource.title),
        createElement("p", "", resource.description),
        createElement("p", "", resource.recommended),
        renderPdfButtons(resource)
      );
      container.append(card);
    });
  }

  function renderFilters() {
    var container = $("#nsi-filters");
    window.RATTRAPAGE_RESOURCES.filters.forEach(function renderFilter(filter, index) {
      var button = createElement("button", "filter-button" + (index === 0 ? " is-selected" : ""), filter);
      button.type = "button";
      button.dataset.filter = filter;
      container.append(button);
    });
  }

  function renderNsiSubjects(filter) {
    var activeFilter = filter || "Tous";
    var container = $("#nsi-subjects");
    container.textContent = "";
    window.RATTRAPAGE_RESOURCES.nsiSubjects
      .filter(function subjectMatches(subject) {
        if (activeFilter === "Tous") return true;
        if (activeFilter === "Priorité 1") return subject.priority === 1;
        return subject.filter === activeFilter;
      })
      .forEach(function renderSubject(subject) {
        var card = createElement("article", "subject-card");
        var meta = createElement("div", "meta-line");
        meta.append(
          createElement("span", "", subject.theme),
          createElement("span", "", subject.order)
        );
        card.append(
          createElement("span", priorityClass(subject.priority), subject.priority === 1 ? "Priorité 1" : "Priorité 2"),
          createElement("h3", "", subject.title),
          meta,
          createElement("p", "", "Objectif oral : " + subject.oralGoal),
          renderPdfButtons(subject)
        );
        container.append(card);
      });
  }

  function openPdf(resource) {
    if (!resource) return;
    var viewer = $(".pdf-viewer");
    var title = $("#pdf-title");
    var frame = $("#pdf-frame");
    var download = $("#pdf-download");
    var open = $("#pdf-open");

    title.textContent = resource.title;
    frame.src = resource.path;
    download.href = resource.path;
    download.download = resource.path.split("/").pop();
    open.href = resource.path;
    viewer.hidden = false;
    storageSet(STORAGE_KEY, JSON.stringify({ id: resource.id, title: resource.title, path: resource.path }));
    updateResumeButton();
    viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function focusViewer() {
      $(".pdf-viewer__header").focus();
    }, 120);
  }

  function closePdf() {
    var viewer = $(".pdf-viewer");
    $("#pdf-frame").src = "about:blank";
    viewer.hidden = true;
  }

  function updateResumeButton() {
    var button = $("#resume-last");
    var raw = storageGet(STORAGE_KEY);
    if (!raw) {
      button.hidden = true;
      return;
    }
    try {
      var resource = JSON.parse(raw);
      button.hidden = false;
      button.textContent = "Reprendre : " + resource.title;
      button.dataset.resourceId = resource.id;
    } catch (error) {
      storageRemove(STORAGE_KEY);
      button.hidden = true;
    }
  }

  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
  }

  function renderTimer(name) {
    var timer = timers[name];
    var output = document.getElementById(timer.outputId);
    output.textContent = formatTime(timer.remaining);
  }

  function startTimer(name) {
    var timer = timers[name];
    if (timer.interval) return;
    timer.endsAt = Date.now() + timer.remaining * 1000;
    timer.interval = window.setInterval(function tick() {
      timer.remaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      renderTimer(name);
      if (timer.remaining === 0) {
        window.clearInterval(timer.interval);
        timer.interval = null;
        timer.endsAt = 0;
      }
    }, 250);
    renderTimer(name);
  }

  function resetTimer(name) {
    var timer = timers[name];
    if (timer.interval) {
      window.clearInterval(timer.interval);
      timer.interval = null;
    }
    timer.endsAt = 0;
    timer.remaining = timer.duration;
    renderTimer(name);
  }

  function bindEvents() {
    var navToggle = $(".nav-toggle");
    var nav = $("#main-nav");
    navToggle.addEventListener("click", function toggleMenu() {
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function closeOnNav(event) {
      if (event.target.matches("a")) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function handleDocumentClick(event) {
      var pdfButton = event.target.closest(".js-open-pdf");
      if (pdfButton) {
        openPdf(findResource(pdfButton.dataset.resourceId));
        return;
      }

      var filterButton = event.target.closest(".filter-button");
      if (filterButton) {
        document.querySelectorAll(".filter-button").forEach(function removeSelected(button) {
          button.classList.remove("is-selected");
        });
        filterButton.classList.add("is-selected");
        renderNsiSubjects(filterButton.dataset.filter);
        return;
      }

      var timerButton = event.target.closest(".js-timer");
      if (timerButton) {
        var action = timerButton.dataset.action;
        var timer = timerButton.dataset.timer;
        if (action === "start") startTimer(timer);
        if (action === "reset") resetTimer(timer);
      }
    });

    $("#pdf-close").addEventListener("click", closePdf);
    $("#resume-last").addEventListener("click", function resumeLast(event) {
      openPdf(findResource(event.currentTarget.dataset.resourceId));
    });
  }

  function bindActiveNav() {
    if (!("IntersectionObserver" in window)) return;
    var links = Array.from(document.querySelectorAll(".main-nav a"));
    var observer = new IntersectionObserver(function observe(entries) {
      entries.forEach(function mark(entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function clear(link) { link.classList.remove("is-active"); });
        var current = links.find(function findLink(link) { return link.getAttribute("href") === "#" + entry.target.id; });
        if (current) current.classList.add("is-active");
      });
    }, { rootMargin: "-35% 0px -60% 0px", threshold: 0.01 });
    document.querySelectorAll("main section[id]").forEach(function observeSection(section) {
      observer.observe(section);
    });
  }

  document.addEventListener("DOMContentLoaded", function boot() {
    renderGuides();
    renderMathsSubjects();
    renderFilters();
    renderNsiSubjects("Tous");
    bindEvents();
    bindActiveNav();
    updateResumeButton();
    renderTimer("prep");
    renderTimer("talk");
  });
})();
