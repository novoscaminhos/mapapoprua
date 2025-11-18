/* ============================================================
   MAPA REDE DE APOIO — ARARAQUARA/SP
   script.js — versão revisada e corrigida (substituição completa)
   ============================================================ */

/* ---------------------- DADOS DO MAPA ---------------------- */
const pontos = [
  {
    name: "Centro Pop",
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7895843,
    lng: -48.1775678,
    photo: "fotos/centro_pop.jpg"
  },
  {
    name: 'Casa de acolhida "Assad-Kan"',
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7905161,
    lng: -48.1917449,
    photo: "fotos/assad_kan.jpg"
  },
  {
    name: "CRAS Central",
    category: "Serviços Públicos de Referência",
    address: "Rua Gonçalves Dias, 468 Centro (antigo prédio da UMED, esquina com Av. Espanha)",
    details: "Centro de Referência da Assistência Social - Unidade Central",
    phone: "",
    hours: "",
    lat: -21.791522,
    lng: -48.173929,
    photo: "fotos/cras_central.jpg"
  },
  {
    name: "Associação São Pio (masculino)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.824304,
    lng: -48.2037705,
    photo: "fotos/sao_pio_m.jpg"
  },
  {
    name: "Associação São Pio (feminina)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.7665622,
    lng: -48.1782641,
    photo: "fotos/sao_pio_f.jpg"
  },
  {
    name: "Fundo Social de Solidariedade de Araraquara",
    category: "Pontos de doação",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7788367,
    lng: -48.1921867,
    photo: "fotos/fundo_social.jpg"
  }
];

/* ----------------- CONFIGURAÇÃO DE CATEGORIAS ----------------- */
const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff" },
  "Pontos de Apoio e Parcerias": { color: "#28a745" },
  "Pontos de doação": { color: "#ff8c42" }
};

/* ---------------------- VARIÁVEIS GLOBAIS ---------------------- */
let map;
let infoWindow;
let markers = [];
let markerCluster = null;
let userLocation = null;
let userMarker = null;
let selectedMarker = null;
let previousMapCenter = null;
let previousMapZoom = null;

/* Elements cache */
const detailsPanel = () => document.getElementById("detailsPanel");
const sheetHandle = () => document.getElementById("sheetHandle");
const detailsExtraBlock = () => document.getElementById("detailsExtraBlock");

/* ---------------------- INICIALIZAÇÃO MAPA ---------------------- */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -21.79, lng: -48.185 },
    zoom: 13,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: "greedy"
  });

  infoWindow = new google.maps.InfoWindow();

  createMarkers();
  fitToMarkers();
  initFilters();
  initListaLocais();
  initSearch();
  initBairroSearch();
  initGeoBtn();
  initNearbyBtn();
  initHamburgerMenu();
  initDetailsPanel();
}

/* ---------------------- CRIAR MARCADORES ---------------------- */
function createMarkers() {
  // Remove antigos
  if (markerCluster) {
    try { markerCluster.clearMarkers(); } catch (e) {}
    markerCluster = null;
  }
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const color = categoryConfig[p.category]?.color || "#555";

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      icon: {
        url: makeSvgPin(color),
        scaledSize: new google.maps.Size(36, 36)
      },
      map
    });

    // attach data
    marker._data = p;
    marker._category = p.category;

    marker.addListener("click", () => openDetailsPanel(marker));
    markers.push(marker);
  }

  // Safe: instantiate cluster if we have markers
  if (markers.length > 0) {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
  }
}

/* ---------------------- ÍCONE SVG ---------------------- */
function makeSvgPin(color) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
    <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z"
      fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ---------------------- FILTROS ---------------------- */
function initFilters() {
  const box = document.getElementById("filters");
  if (!box) return;
  box.innerHTML = "";

  Object.keys(categoryConfig).forEach(cat => {
    const id = slug(cat);
    const color = categoryConfig[cat].color;

    const label = document.createElement("label");
    label.className = "filter-item";
    label.innerHTML = `<input type="checkbox" id="${id}" data-cat="${cat}" checked>
                       <span class="dot" style="background:${color}"></span> ${cat}`;
    box.appendChild(label);
  });

  // listeners
  document.querySelectorAll("#filters input").forEach(chk => {
    chk.addEventListener("change", applyFilters);
  });
}

function applyFilters() {
  const active = [...document.querySelectorAll("#filters input:checked")]
    .map(i => i.dataset.cat);

  markers.forEach(m => m.setVisible(active.includes(m._category)));

  // rebuild cluster with visible markers
  if (markerCluster) {
    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
  } else {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers: markers.filter(m => m.getVisible()) });
  }

  renderListaLocais();
}

/* ---------------------- BUSCA POR NOME ---------------------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clearBtn = document.getElementById("btnClearSearch");
  if (!box || !clearBtn) return;

  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();

    markers.forEach(m => {
      const d = m._data;
      const hay = (d.name + " " + (d.address || "") + " " + (d.details || "")).toLowerCase();
      m.setVisible(hay.includes(q));
    });

    if (markerCluster) {
      markerCluster.clearMarkers();
      markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    }
    renderListaLocais();
  });

  clearBtn.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------------------- BUSCA POR BAIRRO ---------------------- */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");
  if (!box) return;
  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();
    markers.forEach(m => {
      const hay = (m._data.address || "").toLowerCase();
      m.setVisible(hay.includes(q));
    });
    if (markerCluster) {
      markerCluster.clearMarkers();
      markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    }
    renderListaLocais();
  });
}

/* ---------------------- LISTA DE LOCAIS ---------------------- */
function initListaLocais() {
  renderListaLocais();
}

function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  if (!box) return;
  box.innerHTML = "";

  let vis = markers.filter(m => m.getVisible());

  if (userLocation) {
    vis.forEach(m => {
      m._distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        m._data.lat, m._data.lng
      );
    });
    vis.sort((a, b) => a._distance - b._distance);
  }

  vis.forEach(m => {
    const d = m._data;
    const dist = userLocation ? ` — ${m._distance.toFixed(1)} km` : "";

    const item = document.createElement("div");
    item.className = "lista-item";
    item.innerHTML = `<strong>${escapeHtml(d.name)}</strong><br><span>${escapeHtml(d.category)}${dist}</span>`;

    item.addEventListener("click", () => {
      // close menu if open
      const panel = document.getElementById("panel");
      const overlay = document.getElementById("menuOverlay");
      if (panel && panel.classList.contains("open")) {
        panel.classList.remove("open");
        if (overlay) overlay.classList.add("hidden");
      }

      // pan to marker and open details compact
      map.panTo({ lat: d.lat, lng: d.lng });
      map.setZoom(16);

      // find corresponding marker object
      const marker = markers.find(mm => mm._data && mm._data.name === d.name && mm._data.lat === d.lat && mm._data.lng === d.lng);
      if (marker) openDetailsPanel(marker);
    });

    box.appendChild(item);
  });
}

/* ---------------------- DETALHES (BOTTOM SHEET) ---------------------- */

/* States: 'closed' | 'compact' | 'mid' | 'expanded' */
function setPanelState(state) {
  const panel = detailsPanel();
  if (!panel) return;

  // cleanup any inline height to let CSS classes control visual
  panel.style.height = "";
  panel.classList.remove("state-closed", "state-compact", "state-mid", "state-expanded");

  switch (state) {
    case 'closed':
      panel.classList.add("state-closed");
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      // restore body scroll
      document.body.style.overflow = "";
      break;
    case 'compact':
      panel.classList.remove("hidden");
      panel.classList.add("state-compact");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "";
      break;
    case 'mid':
      panel.classList.remove("hidden");
      panel.classList.add("state-mid");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      break;
    case 'expanded':
      panel.classList.remove("hidden");
      panel.classList.add("state-expanded");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      break;
    default:
      panel.classList.add("state-compact");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "";
  }
}

/* Abre o painel e popula com dados do marker */
function openDetailsPanel(marker) {
  // guard: don't open details while side panel is open (avoid overlap)
  const side = document.getElementById("panel");
  if (side && side.classList.contains("open")) {
    // close side panel first, allow map to show
    const overlay = document.getElementById("menuOverlay");
    side.classList.remove("open");
    if (overlay) overlay.classList.add("hidden");
    // small delay to let UI update
    setTimeout(() => openDetailsPanel(marker), 180);
    return;
  }

  selectedMarker = marker;

  previousMapCenter = map.getCenter();
  previousMapZoom = map.getZoom();

  const p = marker._data || {};

  // Destacar marcador
  highlightMarker(marker);

  // Populate content in the specified order:
  // Title/Category -> Buttons -> Image -> Texts -> Extra block
  document.getElementById("detailsName").textContent = p.name || "";
  document.getElementById("detailsCategory").textContent = p.category || "";
  document.getElementById("detailsAddress").textContent = p.address || "";
  document.getElementById("detailsDetails").textContent = p.details || "";
  document.getElementById("detailsPhone").textContent = p.phone || "";
  document.getElementById("detailsHours").textContent = p.hours || "";

  // Photo: set src directly with onerror fallback
  const photoEl = document.getElementById("detailsPhoto");
  if (photoEl) {
    photoEl.onerror = function () { this.src = "placeholder.jpg"; };
    photoEl.src = p.photo || "placeholder.jpg";
  }

  // Distance
  if (userLocation && p.lat && p.lng) {
    const dist = haversineDistance(
      userLocation.lat, userLocation.lng,
      p.lat, p.lng
    );
    document.getElementById("detailsDistance").textContent =
      `Distância: ${dist.toFixed(1)} km`;
  } else {
    document.getElementById("detailsDistance").textContent = "";
  }

  // Route button
  const routeBtn = document.getElementById("routeBtn");
  if (routeBtn) {
    routeBtn.onclick = () => {
      if (p.lat && p.lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, "_blank");
      } else {
        alert("Coordenadas não disponíveis.");
      }
    };
  }

  // Ensure extra block hidden by default
  const extra = detailsExtraBlock();
  if (extra) {
    extra.classList.add("hidden");
    extra.style.display = "none";
  }

  // Set to compact first (single-line visible) and then nudge the map so the marker is visible
  setPanelState('compact');

  // Wait a bit for panel to render and then pan map so marker is visible above the panel
  setTimeout(() => {
    try {
      // compute offset: move map up by approx half panel height
      const panelEl = detailsPanel();
      const panelHeight = (panelEl && panelEl.clientHeight) ? panelEl.clientHeight : window.innerHeight * 0.15;
      // use panBy in pixels: negative to move up
      // reduce a bit so marker isn't exactly at top
      const offset = Math.round(panelHeight / 2.2);
      map.panBy(0, -offset);
    } catch (e) {
      // ignore pan errors
    }
  }, 260);
}

/* Fechar painel inicialização */
function initDetailsPanel() {
  const closeBtn = document.getElementById("closeDetails");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      setPanelState('closed');

      // restaura marcadores
      markers.forEach(m => m.setOpacity(1));

      // Restaurar mapa
      if (previousMapCenter) {
        map.panTo(previousMapCenter);
        map.setZoom(previousMapZoom);
      }
      // cleanup
      closePanelCleanup();
    });
  }

  // Botão "Carregar mais detalhes" revela bloco extra (C)
  const moreBtn = document.getElementById("detailsMoreBtn");
  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      const block = detailsExtraBlock();
      if (!block) return;
      if (block.classList.contains("hidden")) {
        block.classList.remove("hidden");
        block.style.display = "block";
        // smooth scroll para o bloco quando expandir
        setTimeout(() => {
          block.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      } else {
        block.classList.add("hidden");
        block.style.display = "none";
      }
    });
  }

  // Inicializa drag/gesture do painel (versão A — touch/mouse pointer)
  initPanelDrag();
}

/* =======================
   Drag do painel de detalhes (touch + mouse)
   3 níveis: compact (pequeno), mid (médio), expanded (grande)
   ======================= */
function initPanelDrag() {
  const panel = detailsPanel();
  const handle = sheetHandle();
  if (!panel || !handle) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  let startHeight = 0;

  function decideStateFromHeight(heightPx) {
    const vh = window.innerHeight;
    const ratio = heightPx / vh;
    if (ratio >= 0.75) return 'expanded';
    if (ratio >= 0.3) return 'mid';
    return 'compact';
  }

  function onStart(e) {
    dragging = true;
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    currentY = startY;
    startHeight = panel.getBoundingClientRect().height || (window.innerHeight * 0.15);
    panel.style.transition = 'none';
    // prevent accidental text selection
    document.body.style.userSelect = 'none';
    e.preventDefault && e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    currentY = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = currentY - startY;
    // newHeight = startHeight - dy (because dragging up decreases clientY)
    const newHeight = Math.max(80, startHeight - dy);
    panel.style.height = newHeight + 'px';
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = ''; // restore transition
    document.body.style.userSelect = '';

    // determine snapped state
    const finalHeight = parseInt(panel.style.height || panel.getBoundingClientRect().height, 10);
    const snap = decideStateFromHeight(finalHeight);

    // if user dragged down enough from compact -> close entirely
    // compute delta:
    const delta = currentY - startY;
    if (delta > 140 && (panel.classList.contains('state-compact') || snap === 'compact')) {
      // close panel
      setPanelState('closed');
      panel.style.height = "";
      return;
    }

    // apply snapped state
    setPanelState(snap);

    // block body scrolling if necessary
    if (snap === 'expanded' || snap === 'mid') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // touch events
  handle.addEventListener('touchstart', onStart, { passive: false });
  handle.addEventListener('touchmove', onMove, { passive: false });
  handle.addEventListener('touchend', onEnd);

  // mouse events
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // quick click toggles state (if not dragged)
  handle.addEventListener('click', (ev) => {
    // if was a drag, ignore click
    if (Math.abs(currentY - startY) > 8) return;
    const panelEl = detailsPanel();
    if (!panelEl) return;
    const isClosed = panelEl.classList.contains('hidden') || panelEl.classList.contains('state-closed');
    if (isClosed) {
      setPanelState('compact');
      return;
    }
    if (panelEl.classList.contains('state-compact')) setPanelState('mid');
    else if (panelEl.classList.contains('state-mid')) setPanelState('expanded');
    else setPanelState('compact');
  });
}

/* Fechar/restaurar comportamento ao fechar (reset de overflow) */
function closePanelCleanup() {
  document.body.style.overflow = '';
}

/* ---------------------- HIGHLIGHT ---------------------- */
function highlightMarker(marker) {
  markers.forEach(m => {
    try {
      if (m === marker) {
        m.setOpacity(1);
        m.setAnimation && m.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => m.setAnimation && m.setAnimation(null), 800);
      } else {
        m.setOpacity && m.setOpacity(0.25);
      }
    } catch (e) { /* ignore */ }
  });
}

/* ---------------------- GEOLOCALIZAÇÃO ---------------------- */
function initGeoBtn() {
  const geoBtn = document.getElementById("geoBtn");
  if (!geoBtn) return;
  geoBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#0b5ed7",
            fillOpacity: 0.9,
            strokeColor: "#fff",
            strokeWeight: 2
          },
          title: "Você está aqui"
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      map.panTo(userLocation);
      map.setZoom(15);

      renderListaLocais();
    }, err => {
      alert("Não foi possível acessar a localização: " + (err.message || ""));
    });
  });
}

/* ---------------------- LOCAIS PRÓXIMOS ---------------------- */
function initNearbyBtn() {
  const nearby = document.getElementById("nearbyBtn");
  if (!nearby) return;
  nearby.addEventListener("click", () => {
    if (!userLocation) {
      alert("Ative a localização primeiro.");
      return;
    }

    markers.forEach(m => {
      m._distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        m._data.lat, m._data.lng
      );
    });

    const sorted = markers.slice().sort((a, b) => a._distance - b._distance);
    fitToMarkers(sorted.slice(0, 5));

    renderListaLocais();
  });
}

/* ---------------------- MENU MOBILE SLIDE + ONBOARD ANIM ---------------------- */
function initHamburgerMenu() {
  const btn = document.getElementById("menuBtn");
  const sidePanel = document.getElementById("panel");
  const overlay = document.getElementById("menuOverlay");

  if (!btn || !sidePanel || !overlay) return;

  function openMenu() {
    sidePanel.classList.add("open");
    overlay.classList.remove("hidden");
  }
  function closeMenu() {
    sidePanel.classList.remove("open");
    overlay.classList.add("hidden");
  }

  btn.addEventListener("click", () => {
    if (sidePanel.classList.contains("open")) closeMenu();
    else openMenu();
  });

  overlay.addEventListener("click", () => {
    closeMenu();
  });

  // Onboarding: animação uma vez
  try {
    const key = 'mapapoprua_menu_onboard_v2';
    if (!localStorage.getItem(key)) {
      setTimeout(() => {
        openMenu();
        setTimeout(() => {
          closeMenu();
          localStorage.setItem(key, '1');
        }, 820);
      }, 520);
    }
  } catch (e) { /* ignore */ }

  // Ensure clicking a lista-item closes the side panel (delegation)
  const listaBox = document.getElementById("listaLocais");
  if (listaBox) {
    listaBox.addEventListener("click", (ev) => {
      const el = ev.target.closest(".lista-item");
      if (!el) return;
      // close side panel
      closeMenu();
      // allow the existing click handler on item to run (we used renderListaLocais to attach)
    });
  }
}

/* ---------------------- AJUDARES ---------------------- */
function fitToMarkers(list = markers) {
  if (!map || !markers || markers.length === 0) return;
  const bounds = new google.maps.LatLngBounds();
  list.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------------- UTIL ---------------------- */
function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =======================
   Export helpers para console / outro script usar
   ======================= */
window.mapapoprua = {
  openDetailsPanel,
  setPanelState,
  fitToMarkers
};

/* =======================
   DOMContentLoaded: setups iniciais
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  // Garante que blocos extras iniciem escondidos
  const extra = detailsExtraBlock();
  if (extra) {
    extra.classList.add("hidden");
    extra.style.display = "none";
  }

  // garante comportamento do painel fechado inicialmente
  setPanelState('closed');

  // If map already inited, initMap() will be called by Google callback.
  // Otherwise, in testing environments you can call initMap() manually.
});
