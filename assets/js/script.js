/* =========================================================================
   Motion Hookah Club – Speisekarte
   Rendert die gesamte Karte aus assets/data/menu-data.json.
   Um Gerichte/Preise zu ändern: NUR die JSON-Datei bearbeiten, nicht hier.

   Navigation: Kachel-Übersicht -> Kategorie -> Positionen, gesteuert per
   URL-Hash (#<kategorie-id>), damit Browser-Zurück und Lesezeichen auf eine
   Kategorie funktionieren. Suche überlagert beide Ansichten und ist von
   überall aus erreichbar (Suchfeld bleibt sichtbar).
   ========================================================================= */
(function () {
  "use strict";

  var DATA_URL = "assets/data/menu-data.json";
  var ALLERGY_STORAGE_KEY = "motion-hookah-allergy-ack";

  var menuContentEl = document.getElementById("menu-content");
  var searchInput = document.getElementById("menu-search");
  var topbarEl = document.getElementById("view-topbar");
  var topbarTitleEl = document.getElementById("view-topbar-title");
  var topbarBackBtn = document.getElementById("view-back");

  var categoryData = [];
  var categoryIds = {};
  var lastViewKey = null;
  var assetVersion = "1";

  /**
   * Hängt die assetVersion (aus menu-data.json) als "?v=" an Bild-Pfade an.
   * Hostinger cacht Fotos serverseitig bis zu ein Jahr (auch im Browser der
   * Gäste) — nach dem Austausch eines Fotos MUSS assetVersion in
   * menu-data.json erhöht werden, sonst sieht man ggf. monatelang das alte
   * Bild weiter, obwohl die Datei längst ersetzt wurde.
   */
  function withVersion(path) {
    return path + (path.indexOf("?") === -1 ? "?" : "&") + "v=" + assetVersion;
  }

  // menu-data.json selbst NIE cachen lassen (eigener Cache-Buster pro
  // Seitenaufruf) — sonst würden neue/geänderte Positionen und Preise aus
  // demselben Grund erst mit großer Verzögerung sichtbar.
  fetch(DATA_URL + "?t=" + Date.now())
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      categoryData = (data && data.categories) || [];
      assetVersion = (data && data.assetVersion) || "1";
      categoryData.forEach(function (cat) {
        categoryIds[cat.id] = true;
      });
      render();
    })
    .catch(function (err) {
      console.error("Menüdaten konnten nicht geladen werden:", err);

      // Sehr häufige Ursache beim lokalen Testen: Datei per Doppelklick
      // geöffnet (file://) statt über einen echten Server/die Live-URL.
      // Browser blockieren dann fetch() auf lokale Dateien. Dafür einen
      // konkreten, umsetzbaren Hinweis statt nur "geht nicht" zeigen.
      var isFileProtocol = location.protocol === "file:";
      var message = isFileProtocol
        ? "Die Speisekarte kann nicht direkt aus dem Dateisystem geöffnet werden " +
          "(file://). Bitte die Seite über einen echten Webserver aufrufen – " +
          "entweder die hochgeladene Adresse auf Hostinger, oder zum lokalen " +
          "Testen einen einfachen lokalen Server starten (z.B. „python -m " +
          "http.server“ im Projektordner, dann http://localhost:8000 öffnen)."
        : "Die Speisekarte konnte gerade nicht geladen werden. Bitte Seite neu " +
          "laden oder später erneut versuchen.";

      menuContentEl.innerHTML = '<p class="no-results">' + escapeHtml(message) + "</p>";
    });

  /* ---------------------------------------------------------------- */
  /* Router: entscheidet zwischen Übersicht / Kategorie / Suche        */
  function currentCategoryId() {
    var id = decodeURIComponent(location.hash.replace(/^#/, ""));
    return categoryIds[id] ? id : null;
  }

  function render() {
    var query = searchInput.value.trim();
    var catId = query ? null : currentCategoryId();
    var viewKey = query ? "search" : catId ? "cat:" + catId : "grid";

    if (viewKey !== lastViewKey) {
      window.scrollTo(0, 0);
    }
    lastViewKey = viewKey;

    if (query) {
      renderSearchView(query);
    } else if (catId) {
      renderCategoryView(catId);
    } else {
      renderGridView();
    }
  }

  window.addEventListener("hashchange", render);

  searchInput.addEventListener("input", render);

  topbarBackBtn.addEventListener("click", function () {
    if (searchInput.value.trim()) {
      searchInput.value = "";
      render();
    } else if (location.hash) {
      location.hash = "";
      render();
    }
  });

  /* ---------------------------------------------------------------- */
  /* Ansicht: Kachel-Übersicht                                         */
  function renderGridView() {
    hideTopbar();
    var grid = document.createElement("div");
    grid.className = "category-grid";
    categoryData.forEach(function (cat) {
      grid.appendChild(renderCategoryTile(cat));
    });
    setContent(grid);
  }

  function renderCategoryTile(cat) {
    var a = document.createElement("a");
    a.href = "#" + cat.id;
    a.className = "category-tile";

    var photo = document.createElement("div");
    photo.className = "category-tile-photo";
    var img = document.createElement("img");
    img.src = withVersion(cat.image);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    photo.appendChild(img);

    var info = document.createElement("div");
    info.className = "category-tile-info";
    info.innerHTML =
      '<span class="category-tile-name">' + escapeHtml(cat.name) + "</span>" +
      '<span class="category-tile-count">' + cat.items.length + " Positionen</span>";

    a.appendChild(photo);
    a.appendChild(info);
    return a;
  }

  /* ---------------------------------------------------------------- */
  /* Ansicht: eine geöffnete Kategorie                                 */
  function renderCategoryView(catId) {
    var cat = categoryData.filter(function (c) {
      return c.id === catId;
    })[0];

    if (!cat) {
      renderGridView();
      return;
    }

    showTopbar(cat.name);
    var list = document.createElement("div");
    list.className = "menu-list";
    cat.items.forEach(function (item) {
      list.appendChild(renderMenuRow(item));
    });
    setContent(list);
  }

  /* ---------------------------------------------------------------- */
  /* Ansicht: Sucherergebnisse (über alle Kategorien)                  */
  function renderSearchView(query) {
    var q = query.toLowerCase();
    var matches = [];
    categoryData.forEach(function (cat) {
      cat.items.forEach(function (item) {
        if (itemSearchText(item).indexOf(q) !== -1) {
          matches.push({ item: item, categoryName: cat.name });
        }
      });
    });

    showTopbar(
      matches.length + (matches.length === 1 ? " Treffer" : " Treffer") + " für „" + query + "“"
    );

    if (!matches.length) {
      var empty = document.createElement("p");
      empty.className = "no-results";
      empty.textContent = "Keine Treffer für deine Suche.";
      setContent(empty);
      return;
    }

    var list = document.createElement("div");
    list.className = "menu-list";
    matches.forEach(function (m) {
      list.appendChild(renderMenuRow(m.item, m.categoryName));
    });
    setContent(list);
  }

  function itemSearchText(item) {
    return [item.name, item.description || "", (item.tags || []).join(" "), (item.flavors || []).join(" ")]
      .join(" ")
      .toLowerCase();
  }

  /* ---------------------------------------------------------------- */
  function setContent(node) {
    menuContentEl.innerHTML = "";
    menuContentEl.appendChild(node);
  }

  function showTopbar(title) {
    topbarTitleEl.textContent = title;
    topbarEl.hidden = false;
  }

  function hideTopbar() {
    topbarEl.hidden = true;
  }

  /* ---------------------------------------------------------------- */
  /* Menü-Zeile (in Kategorie- und Suchansicht verwendet) — klassische
     Speisekarten-Typografie: Name ······· Preis, statt App-Karte.      */
  function renderMenuRow(item, categoryLabel) {
    var row = document.createElement("article");
    row.className = "menu-row";

    var photo = document.createElement("div");
    photo.className = "menu-row-photo";
    var img = document.createElement("img");
    img.src = withVersion(item.image);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    photo.appendChild(img);

    var body = document.createElement("div");
    body.className = "menu-row-body";

    if (categoryLabel) {
      var label = document.createElement("span");
      label.className = "menu-row-category-label";
      label.textContent = categoryLabel;
      body.appendChild(label);
    }

    var line = document.createElement("div");
    line.className = "menu-row-line";
    line.innerHTML =
      '<span class="menu-row-name">' + escapeHtml(item.name) + "</span>" +
      '<span class="menu-row-dots" aria-hidden="true"></span>' +
      '<span class="menu-row-price">' + escapeHtml(item.price) + "</span>";
    body.appendChild(line);

    appendItemDetails(body, item);

    row.appendChild(photo);
    row.appendChild(body);
    return row;
  }

  /**
   * Ein Item kann unabhängig voneinander haben:
   * - tags: kurze Hinweise (z.B. "Koffeinhaltig", "4cl")
   * - description: normaler Fließtext (Zutaten, Hinweise)
   * - flavors: lange Auswahlliste (aktuell nur Shisha-Sorten), ein-/ausklappbar
   */
  function appendItemDetails(body, item) {
    if (item.description) {
      var descP = document.createElement("p");
      descP.className = "menu-row-desc";
      descP.textContent = item.description;
      body.appendChild(descP);
    }

    if (item.tags && item.tags.length) {
      var tagsP = document.createElement("p");
      tagsP.className = "menu-row-tags";
      tagsP.textContent = item.tags.join(" · ");
      body.appendChild(tagsP);
    }

    if (item.flavors && item.flavors.length) {
      appendFlavorList(body, item.flavors);
    }
  }

  function appendFlavorList(body, flavors) {
    var previewCount = 4;
    var previewP = document.createElement("p");
    previewP.className = "menu-row-desc";
    previewP.textContent =
      flavors.slice(0, previewCount).join(", ") + (flavors.length > previewCount ? " …" : "");
    body.appendChild(previewP);

    var fullList = document.createElement("ul");
    fullList.className = "menu-row-flavors";
    fullList.hidden = true;
    flavors.forEach(function (flavor) {
      var li = document.createElement("li");
      li.textContent = flavor;
      fullList.appendChild(li);
    });
    body.appendChild(fullList);

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "menu-row-toggle";
    toggle.textContent = "Alle " + flavors.length + " Sorten anzeigen";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      var nowExpanded = fullList.hidden; // wird gleich umgeschaltet
      fullList.hidden = !nowExpanded;
      previewP.hidden = nowExpanded;
      toggle.textContent = nowExpanded
        ? "Weniger anzeigen"
        : "Alle " + flavors.length + " Sorten anzeigen";
      toggle.setAttribute("aria-expanded", nowExpanded ? "true" : "false");
    });
    body.appendChild(toggle);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------------------- */
  /* Allergie-Hinweis                                                  */
  var allergyNotice = document.getElementById("allergy-notice");
  var allergyOkBtn = document.getElementById("allergy-ok");

  if (allergyNotice && allergyOkBtn) {
    var alreadyAcknowledged = false;
    try {
      alreadyAcknowledged = window.localStorage.getItem(ALLERGY_STORAGE_KEY) === "1";
    } catch (e) {
      /* localStorage evtl. blockiert -> Hinweis sicherheitshalber immer zeigen */
    }

    if (!alreadyAcknowledged) {
      allergyNotice.hidden = false;
      allergyOkBtn.focus();
    }

    allergyOkBtn.addEventListener("click", function () {
      allergyNotice.hidden = true;
      try {
        window.localStorage.setItem(ALLERGY_STORAGE_KEY, "1");
      } catch (e) {
        /* nicht kritisch */
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Zurück-nach-oben                                                  */
  var backToTopBtn = document.getElementById("back-to-top");
  if (backToTopBtn) {
    window.addEventListener(
      "scroll",
      function () {
        backToTopBtn.classList.toggle("is-visible", window.scrollY > 600);
      },
      { passive: true }
    );
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------- */
  var yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
