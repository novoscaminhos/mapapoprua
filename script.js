// script.js - mapa com dados convertidos do seu CSV
// Substitua a API KEY no index.html.
// Depende de Google Maps JS + MarkerClusterer (já referenciados no HTML).

/* ---------- DADOS (JSON) - editáveis ---------- */
const pontos = [
  {
    name: "Centro Pop",
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7895843,
    lng: -48.1775678
  },
  {
    name: 'Casa de acolhida "Assad-Kan"',
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7905161,
    lng: -48.1917449
  },
  {
    name: "CRAS Central",
    category: "Serviços Públicos de Referência",
    address: "Rua Gonçalves Dias, 468 Centro (antigo prédio da UMED, esquina com Av. Espanha)",
    details: "Centro de Referência da Assistência Social - Unidade Central",
    phone: "",
    hours: "",
    lat: -21.791522,
    lng: -48.173929
  },
  {
    name: "Associação São Pio (masculino)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.824304,
    lng: -48.2037705
  },
  {
    name: "Associação São Pio (feminina)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.7665622,
    lng: -48.1782641
  },
  {
    name: "Fundo Social de Solidariedade de Araraquara",
    category: "Pontos de doação",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7788367,
    lng: -48.1921867
  }
];

/* ---------- Configurações de categorias e cores ---------- */
const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff", icon: null },
  "Pontos de Apoio e Parcerias": { color: "#28a745", icon: null },
  "Pontos de doação": { color: "#ff8c42", icon: null }
};

/* ---------- Função utilitária: gera ícone SVG dataURL com cor ---------- */
function makeSvgPin(color, size = 36, stroke = "#ffffff") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/* ---------- Estado global ---------- */
let map, infoWindow, markers = [], markerCluster;

/* ---------- Inicialização do mapa (callback do Google Maps API) ---------- */
function initMap() {
  const center = { lat: -21.790, lng: -48.185 }; // centraliza Araraquara
  map = new google.maps.Map(document.getElementById("map"), {
    center,
    zoom: 13,
    mapTypeId: "roadmap",
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true
  });

  infoWindow = new google.maps.InfoWindow();

  // Criar marcadores
  createMarkers();

  // Fit bounds (ajusta zoom para mostrar todos)
  fitToMarkers();

  // Inicializar UI
  initFilters();
  initSearch();
  initPanelToggle();
}

/* ---------- Cria marcadores a partir do JSON ---------- */
function createMarkers() {
  // limpar
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const cfg = categoryConfig[p.category] || { color: "#666" };
    const iconUrl = makeSvgPin(cfg.color);

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      optimized: true
    });

    // Estocar categoria nos dados do marker
    marker._category = p.category;
    marker._data = p;

    // InfoWindow
    marker.addListener("click", () => {
      const html = buildInfoHtml(p);
      infoWindow.setContent(html);
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  }

  // marker cluster
  if (markerCluster) {
    markerCluster.clearMarkers();
  }
  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ---------- Monta o HTML do InfoWindow ---------- */
function buildInfoHtml(p) {
  const lines = [];
  lines.push(`<div style="min-width:220px;font-family:Arial,Helvetica,sans-serif">`);
  lines.push(`<h3 style="margin:0 0 6px 0">${escapeHtml(p.name)}</h3>`);
  if (p.address) lines.push(`<div><strong>Endereço:</strong> ${escapeHtml(p.address)}</div>`);
  if (p.details) lines.push(`<div>${escapeHtml(p.details)}</div>`);
  if (p.hours) lines.push(`<div><strong>Horário:</strong> ${escapeHtml(p.hours)}</div>`);
  if (p.phone) lines.push(`<div><strong>Telefone:</strong> ${escapeHtml(p.phone)}</div>`);
  const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`;
  lines.push(`<div style="margin-top:8px"><a href="${gmapsLink}" target="_blank" rel="noopener">Traçar rota</a></div>`);
  lines.push(`</div>`);
  return lines.join("");
}

/* ---------- Ajusta mapa para mostrar todos os marcadores ---------- */
function fitToMarkers() {
  if (!markers.length) return;
  const bounds = new google.maps.LatLngBounds();
  markers.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds, 40);
}

/* ---------- UI: filtros (checkboxes gerados dinamicamente) ---------- */
function initFilters() {
  const filtersBox = document.getElementById("filters");
  filtersBox.innerHTML = "";

  // identificar categorias presentes
  const cats = {};
  pontos.forEach(p => {
    cats[p.category] = (cats[p.category] || 0) + 1;
  });

  Object.keys(categoryConfig).forEach(catKey => {
    if (!cats[catKey]) return; // somente categorias existentes
    const color = categoryConfig[catKey].color;
    const id = `chk-${slug(catKey)}`;
    const wrapper = document.createElement("div");
    wrapper.className = "filter-item";
    wrapper.innerHTML = `
      <input type="checkbox" id="${id}" data-cat="${escapeHtml(catKey)}" checked />
      <label for="${id}"><span class="dot" style="background:${color};width:12px;height:12px;display:inline-block;border-radius:50%;margin-right:8px"></span>${catKey} (<span class="count">${cats[catKey]}</span>)</label>
    `;
    filtersBox.appendChild(wrapper);

    // evento
    const chk = wrapper.querySelector("input");
    chk.addEventListener("change", onFilterChange);
  });
}

/* ---------- Filtra marcadores com base em checkboxes ---------- */
function onFilterChange() {
  const checks = Array.from(document.querySelectorAll("#filters input[type=checkbox]"));
  const active = checks.filter(c => c.checked).map(c => c.dataset.cat);

  // mostrar/ocultar markers
  markers.forEach(m => {
    const show = active.includes(m._category);
    m.setVisible(show);
  });

  // atualizar cluster
  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));
}

/* ---------- Busca simples por texto (nome/endereço) ---------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clearBtn = document.getElementById("btnClearSearch");
  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase();
    if (!q) {
      markers.forEach(m => m.setVisible(true));
    } else {
      markers.forEach(m => {
        const d = m._data;
        const hay = `${d.name} ${d.address} ${d.details}`.toLowerCase();
        const ok = hay.indexOf(q) !== -1;
        m.setVisible(ok);
      });
    }
    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
  });
  clearBtn.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------- Painel mobile toggle ---------- */
function initPanelToggle() {
  const btn = document.getElementById("togglePanel");
  const panel = document.getElementById("panel");
  btn.addEventListener("click", () => {
    const opened = panel.style.display !== "none";
    panel.style.display = opened ? "none" : "block";
    btn.textContent = opened ? "Filtros ▸" : "Filtros ▾";
  });

  // em telas pequenas, deixar o painel oculto inicialmente
  if (window.innerWidth < 900) {
    panel.style.display = "none";
    btn.textContent = "Filtros ▸";
  }
}

/* ---------- Utilitários ---------- */
function slug(s){ return s.toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,""); }
function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g, function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]; }); }

/* ---------- Inicializa marcadores quando o script for carregado */
/* Note: initMap é chamado pelo callback do Google Maps API */
