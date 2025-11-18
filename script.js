// script.js - versão estendida mantendo sua base original
// Depende de Google Maps JS + MarkerClusterer (referenciados no HTML)

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
let userMarker = null;           // marcador do usuário
let userLocation = null;         // {lat, lng}
let selectedMarker = null;

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
  initListaLocais();
  initSearch();
  initBairroSearch();
  initGeoBtn();
  initPanelToggle();
}

/* ---------- Cria marcadores a partir do JSON ---------- */
function createMarkers() {
  // limpar (mantendo cluster sincronizado)
  if (markerCluster) {
    markerCluster.clearMarkers();
  }
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const cfg = categoryConfig[p.category] || { color: "#666" };
    const iconUrl = makeSvgPin(cfg.color);

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      optimized: true,
      opacity: 1
    });

    marker._category = p.category;
    marker._data = p;

    // InfoWindow (mantendo sua função original)
    marker.addListener('click', () => {
      openInfoForMarker(marker);
    });

    markers.push(marker);
  }

  // marker cluster
  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ---------- Abrir InfoWindow e destacar marker ---------- */
function openInfoForMarker(marker) {
  const p = marker._data;
  const html = buildInfoHtml(p);
  infoWindow.setContent(html);
  infoWindow.open(map, marker);

  // destaque visual: anima o selecionado, diminui opacidade dos demais
  highlightMarker(marker);
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
  lines.push(`<div style="margin-top:8px"><a class="infow-route" href="${gmapsLink}" target="_blank" rel="noopener">Traçar rota</a></div>`);
  lines.push(`</div>`);
  return lines.join("");
}

/* ---------- Ajusta mapa para mostrar todos os marcadores ---------- */
function fitToMarkers(presentMarkers = markers) {
  if (!presentMarkers.length) return;
  const bounds = new google.maps.LatLngBounds();
  presentMarkers.forEach(m => bounds.extend(m.getPosition()));
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

    const chk = wrapper.querySelector("input");
    chk.addEventListener("change", onFilterChange);
  });
}

/* ---------- Filtra marcadores com base em checkboxes ---------- */
function onFilterChange() {
  const checks = Array.from(document.querySelectorAll("#filters input[type=checkbox]"));
  const active = checks.filter(c => c.checked).map(c => c.dataset.cat);

  // mostrar/ocultar markers e lista
  markers.forEach(m => {
    const show = active.includes(m._category);
    m.setVisible(show);
  });

  // atualizar cluster com apenas visíveis
  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));

  // atualizar lista para mostrar somente itens das categorias ativas
  renderListaLocais();
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
    renderListaLocais();
  });
  clearBtn.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------- Lupa por bairro / endereço (filtro específico) ---------- */
function initBairroSearch() {
  const bairroBox = document.getElementById("bairroBox");
  bairroBox.addEventListener("input", () => {
    const q = bairroBox.value.trim().toLowerCase();
    if (!q) {
      // revert to filters state
      onFilterChange();
      fitToMarkers(markers.filter(m => m.getVisible()));
      return;
    }
    // mostrar apenas markers que contenham a string no endereço/detalhes
    markers.forEach(m => {
      const hay = `${m._data.address || ""} ${m._data.details || ""}`.toLowerCase();
      const ok = hay.indexOf(q) !== -1;
      m.setVisible(ok);
    });
    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
    fitToMarkers(markers.filter(m => m.getVisible()));
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

  if (window.innerWidth < 900) {
    panel.style.display = "none";
    btn.textContent = "Filtros ▸";
  }
}

/* ---------- Lista de locais (ordenada por categoria -> nome, ou por distância se userLocation existe) ---------- */
function initListaLocais() {
  // cria a lista inicialmente
  renderListaLocais();
}

/* renderiza a lista com base no estado atual dos markers visíveis */
function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  box.innerHTML = "";

  // pegar categorias ativas para filtrar
  const activeCats = [...document.querySelectorAll("#filters input:checked")].map(i => i.dataset.cat);

  // criar array de pontos visíveis e pertencentes às categorias ativas
  let visiblePoints = markers
    .filter(m => m.getVisible())
    .filter(m => activeCats.includes(m._category))
    .map(m => ({ marker: m, data: m._data }));

  // se userLocation existe, calcular distâncias
  if (userLocation) {
    visiblePoints.forEach(v => {
      v.distance = haversineDistance(userLocation.lat, userLocation.lng, v.data.lat, v.data.lng);
    });
    // ordenar por distância
    visiblePoints.sort((a,b) => (a.distance || 9999) - (b.distance || 9999));
  } else {
    // ordenar por categoria -> nome
    visiblePoints.sort((a,b) => {
      if (a.data.category === b.data.category) {
        return a.data.name.localeCompare(b.data.name);
      }
      return a.data.category.localeCompare(b.data.category);
    });
  }

  // popular HTML
  visiblePoints.forEach((v, idx) => {
    const div = document.createElement('div');
    div.className = 'place-item';
    div.innerHTML = `<span>${escapeHtml(v.data.name)}</span>
                     <span class="place-distance">${userLocation && v.distance ? (v.distance.toFixed(1) + ' km') : v.data.category}</span>`;
    div.addEventListener('click', () => {
      // centralizar e abrir infowindow
      map.panTo({ lat: v.data.lat, lng: v.data.lng });
      map.setZoom(16);
      openInfoForMarker(v.marker);

      // destacar item na lista
      document.querySelectorAll('.place-item').forEach(el => el.classList.remove('place-active'));
      div.classList.add('place-active');

      // ao clicar, mostrar só a categoria desse ponto (com destaque visual)
      filterToCategory(v.data.category);
    });
    box.appendChild(div);
  });

  // exibir contagem
  const header = document.querySelector('#panel h2');
  // (não sobrescrevemos seu layout original — apenas atualizamos a lista)
}

/* ---------- Filtra para apenas uma categoria (usado ao clicar em item de lista) ---------- */
function filterToCategory(category) {
  // ativar somente o checkbox correspondente
  document.querySelectorAll('#filters input[type=checkbox]').forEach(chk => {
    chk.checked = chk.dataset.cat === category;
  });
  onFilterChange();

  // destacar os marcadores da categoria escolhida (deixar outros em sombreado)
  markers.forEach(m => {
    if (m._category === category) {
      m.setOpacity(1);
      // pequena animação
      m.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => m.setAnimation(null), 900);
    } else {
      m.setOpacity(0.25);
    }
  });

  // ajustar bounds para enquadrar apenas os marcadores visíveis
  fitToMarkers(markers.filter(m => m.getVisible()));
}

/* ---------- Função para destacar um marker (quando aberto por clique) ---------- */
function highlightMarker(marker) {
  // limpar destaque anterior
  if (selectedMarker && selectedMarker !== marker) {
    selectedMarker.setOpacity(1);
    // reset icon size if needed by recreating default icon
    const cfg = categoryConfig[selectedMarker._category] || { color: "#666" };
    selectedMarker.setIcon({ url: makeSvgPin(cfg.color), scaledSize: new google.maps.Size(36,36) });
  }

  // destacar este
  selectedMarker = marker;
  marker.setOpacity(1);
  // aumentar visualmente o ícone
  const cfg = categoryConfig[marker._category] || { color: "#666" };
  marker.setIcon({ url: makeSvgPin(cfg.color, 46), scaledSize: new google.maps.Size(46,46) });

  // faded nos demais
  markers.forEach(m => {
    if (m !== marker) m.setOpacity(0.25);
  });

  // atualizar cluster para refletir opacidade/visibilidade
  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));
}

/* ---------- Geolocalização: botão "Minha localização" ---------- */
function initGeoBtn() {
  const btn = document.getElementById('geoBtn');
  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador.');
      return;
    }
    btn.textContent = '📍 buscando...';
    navigator.geolocation.getCurrentPosition(pos => {
      btn.textContent = '📍 Minha localização';
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      userLocation = { lat, lng };

      // criar/atualizar marcador do usuário
      if (userMarker) {
        userMarker.setPosition({ lat, lng });
      } else {
        userMarker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: 'Você está aqui',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#0b5ed7',
            fillOpacity: 0.95,
            strokeColor: '#fff',
            strokeWeight: 2
          }
        });
      }

      // ordenar lista por distância e mostrar distâncias
      renderListaLocais();

      // ajustar bounds para incluir usuário e pontos visíveis
      const visible = markers.filter(m => m.getVisible());
      const bounds = new google.maps.LatLngBounds();
      visible.forEach(m => bounds.extend(m.getPosition()));
      bounds.extend(new google.maps.LatLng(lat, lng));
      map.fitBounds(bounds, 40);

    }, err => {
      btn.textContent = '📍 Minha localização';
      alert('Não foi possível obter sua localização: ' + err.message);
    }, { enableHighAccuracy: true, timeout: 8000 });
  });
}

/* ---------- Utilitários ---------- */
function slug(s){ return s.toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,""); }
function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g, function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]; }); }

/* ---------- Haversine distance (km) ---------- */
function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x){ return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ----------- função distância em km ---------- */
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ---------- Inicialização final (nota: initMap é chamado pela API do Google) ---------- */
/* Seu código original já chamava initMap via callback no script do Maps */

