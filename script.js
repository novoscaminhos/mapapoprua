// script.js - versão completa, revisada e unificada
// Mantém 100% dos recursos que você já adicionou, corrigindo conflitos.

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

/* ---------- Ícone SVG dataURL ---------- */
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
let userMarker = null;
let userLocation = null;
let selectedMarker = null;

/* ---------- INICIAR MAPA ---------- */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -21.790, lng: -48.185 },
    zoom: 13,
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true
  });

  infoWindow = new google.maps.InfoWindow();

  createMarkers();
  fitToMarkers();
  initFilters();
  initListaLocais();
  initSearch();
  initBairroSearch();
  initGeoBtn();
  initPanelToggle();
}

/* ---------- Criar marcadores ---------- */
function createMarkers() {
  if (markerCluster) markerCluster.clearMarkers();
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const cfg = categoryConfig[p.category] || { color: "#333" };
    const iconUrl = makeSvgPin(cfg.color);

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      map,
      title: p.name,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      optimized: true,
      opacity: 1
    });

    marker._data = p;
    marker._category = p.category;
    marker._defaultIcon = { url: iconUrl, scaledSize: new google.maps.Size(36, 36) };

    marker.addListener("click", () => {
      highlightMarker(marker);
      openInfo(marker);
    });

    markers.push(marker);
  }

  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ---------- Abrir InfoWindow ---------- */
function openInfo(marker) {
  const p = marker._data;

  let distanceBlock = "";
  if (userLocation) {
    const dist = calcDistanceKm(
      userLocation.lat, userLocation.lng,
      p.lat, p.lng
    ).toFixed(2);
    distanceBlock = `<div><strong>Distância:</strong> ${dist} km</div>`;
  }

  const html = `
    <div style="min-width:240px">
      <h3>${escapeHtml(p.name)}</h3>
      ${p.address ? `<div><strong>Endereço:</strong> ${p.address}</div>` : ""}
      ${p.details ? `<div>${p.details}</div>` : ""}
      ${distanceBlock}
      <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking"
         target="_blank">Traçar rota</a>
    </div>
  `;

  infoWindow.setContent(html);
  infoWindow.open(map, marker);
}

/* ---------- Destacar marcador ---------- */
function highlightMarker(marker) {
  markers.forEach(m => {
    if (m !== marker) {
      m.setOpacity(0.25);
      m.setIcon(m._defaultIcon);
      m.setAnimation(null);
    }
  });

  marker.setOpacity(1);
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 700);

  const cfg = categoryConfig[marker._category] || { color: "#333" };
  marker.setIcon({
    url: makeSvgPin(cfg.color, 46),
    scaledSize: new google.maps.Size(46, 46)
  });

  selectedMarker = marker;

  map.panTo(marker.getPosition());
  map.setZoom(16);
}

/* ---------- Fit bounds ---------- */
function fitToMarkers(list = markers) {
  if (!list.length) return;
  const bounds = new google.maps.LatLngBounds();
  list.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

/* ---------- FILTROS ---------- */
function initFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";

  const presentCats = {};
  pontos.forEach(p => (presentCats[p.category] = true));

  Object.keys(categoryConfig).forEach(cat => {
    if (!presentCats[cat]) return;

    const id = "filter-" + slug(cat);
    const color = categoryConfig[cat].color;

    const wrapper = document.createElement("div");
    wrapper.className = "filter-item";
    wrapper.innerHTML = `
      <input type="checkbox" id="${id}" data-cat="${cat}" checked />
      <label for="${id}">
        <span class="dot" style="background:${color}"></span>
        ${cat}
      </label>
    `;

    box.appendChild(wrapper);

    wrapper.querySelector("input").addEventListener("change", onFilterChange);
  });
}

function onFilterChange() {
  const active = [...document.querySelectorAll("#filters input:checked")]
    .map(i => i.dataset.cat);

  markers.forEach(m => m.setVisible(active.includes(m._category)));

  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));

  renderListaLocais();
}

/* ---------- LISTA LATERAL ---------- */
function initListaLocais() {
  renderListaLocais();
}

function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  box.innerHTML = "";

  const activeCats = [...document.querySelectorAll("#filters input:checked")].map(i => i.dataset.cat);

  let visible = markers
    .filter(m => m.getVisible() && activeCats.includes(m._category))
    .map(m => ({ marker: m, data: m._data }));

  if (userLocation) {
    visible.forEach(v => {
      v.distance = calcDistanceKm(
        userLocation.lat, userLocation.lng,
        v.data.lat, v.data.lng
      );
    });
    visible.sort((a, b) => a.distance - b.distance);
  } else {
    visible.sort((a, b) =>
      a.data.category === b.data.category
        ? a.data.name.localeCompare(b.data.name)
        : a.data.category.localeCompare(b.data.category)
    );
  }

  visible.forEach(v => {
    const div = document.createElement("div");
    div.className = "place-item";
    div.innerHTML = `
      <span>${escapeHtml(v.data.name)}</span>
      <span class="place-distance">
        ${userLocation ? v.distance.toFixed(1) + " km" : v.data.category}
      </span>
    `;

    div.addEventListener("click", () => {
      highlightMarker(v.marker);
      openInfo(v.marker);
    });

    box.appendChild(div);
  });
}

/* ---------- BUSCA POR NOME ---------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clear = document.getElementById("btnClearSearch");

  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase();

    markers.forEach(m => {
      const d = m._data;
      const hay = `${d.name} ${d.address} ${d.details}`.toLowerCase();
      m.setVisible(hay.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
  });

  clear.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------- BUSCA POR BAIRRO ---------- */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");
  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase();

    if (!q) return onFilterChange();

    markers.forEach(m => {
      const hay = `${m._data.address} ${m._data.details}`.toLowerCase();
      m.setVisible(hay.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
    fitToMarkers(markers.filter(m => m.getVisible()));
  });
}

/* ---------- GEOLOCALIZAÇÃO ---------- */
function initGeoBtn() {
  document.getElementById("geoBtn").addEventListener("click", () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");

    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          map,
          position: userLocation,
          title: "Você está aqui",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#0b5ed7",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2
          }
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      renderListaLocais();

      const all = markers.filter(m => m.getVisible());
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);
      all.forEach(m => bounds.extend(m.getPosition()));
      map.fitBounds(bounds);

    }, err => alert("Erro ao localizar: " + err.message));
  });
}

/* ---------- UTILITÁRIOS ---------- */
function slug(s){ return s.toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,""); }
function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
