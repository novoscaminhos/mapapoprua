/* ============================================================
   MAPA POP RUA – SCRIPT PRINCIPAL (VERSÃO CORRIGIDA)
   - render lista lateral
   - filtros
   - MarkerClusterer local (se disponível)
   - bottom-panel usa classes de estado do CSS
   ============================================================ */

let map;
let markers = [];
let markerCluster = null;
let infoData = [];
let activeMarker = null;

// -----------------------------
// Carrega dados (dados.json na raiz)
// -----------------------------
async function loadData() {
  try {
    const res = await fetch('dados.json', {cache: "no-cache"});
    if (!res.ok) throw new Error(`fetch dados.json status ${res.status}`);
    infoData = await res.json();
    console.log('dados.json carregado — registros:', infoData.length);
  } catch (err) {
    console.error('Erro ao carregar dados.json:', err);
    infoData = [];
  }
}

// -----------------------------
// Render lista lateral
// -----------------------------
function renderList(items = infoData) {
  const listEl = document.getElementById('listaLocais');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!items.length) {
    listEl.innerHTML = '<div class="lista-item">Nenhum local encontrado.</div>';
    return;
  }

  items.forEach((loc, idx) => {
    const div = document.createElement('div');
    div.className = 'lista-item';
    div.tabIndex = 0;
    div.innerHTML = `
      <strong>${loc.name || '—'}</strong>
      <div style="font-size:13px;color:var(--muted);margin-top:6px;">
        ${loc.address ? loc.address + ' • ' : ''}
        ${loc.category ? loc.category : ''}
      </div>
    `;
    div.addEventListener('click', () => {
      const m = markers[idx];
      if (m) {
        map.panTo(m.getPosition());
        map.setZoom(16);
        google.maps.event.trigger(m, 'click');
      } else {
        updateBottomPanel(loc);
      }
    });
    div.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') div.click();
    });
    listEl.appendChild(div);
  });
}

// -----------------------------
// Bottom panel (usa classes de estado do CSS: state-mid / state-closed)
// -----------------------------
function updateBottomPanel(local) {
  const panel = document.getElementById('bottom-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="sheet-handle"><div class="handle-bar"></div></div>
    <button class="close-details" aria-label="Fechar">×</button>
    <div class="details-content">
      <h2>${local.name || ''}</h2>
      ${local.photo ? `<img class="details-photo" src="${local.photo}" alt="${local.name}">` : ''}
      ${local.address ? `<p><strong>Endereço:</strong> ${local.address}</p>` : ''}
      ${local.category ? `<p><strong>Categoria:</strong> ${local.category}</p>` : ''}
      ${local.details ? `<p><strong>Detalhes:</strong> ${local.details}</p>` : ''}
      ${local.phone ? `<p><strong>Telefone:</strong> ${local.phone}</p>` : ''}
      ${local.hours ? `<p><strong>Funcionamento:</strong> ${local.hours}</p>` : ''}
    </div>
  `;

  // abrir em tamanho médio
  panel.classList.remove('state-closed','state-compact','state-expanded');
  panel.classList.add('state-mid');

  // fechar botão
  const closeBtn = panel.querySelector('.close-details');
  if (closeBtn) closeBtn.addEventListener('click', clearBottomPanel);
}

function clearBottomPanel() {
  const panel = document.getElementById('bottom-panel');
  if (!panel) return;
  panel.classList.remove('state-mid','state-expanded','state-compact');
  panel.classList.add('state-closed');
  panel.innerHTML = '';
}

// -----------------------------
// Criar marcadores e cluster
// -----------------------------
function createMarkers(filteredData = infoData) {
  // remove markers antigos
  markers.forEach(m => m.setMap(null));
  markers = [];
  if (markerCluster) {
    try { markerCluster.clearMarkers(); } catch(e){/*ignore*/ }
    markerCluster = null;
  }

  filteredData.forEach((local) => {
    if (typeof local.lat !== 'number' || typeof local.lng !== 'number') {
      // ignora pontos inválidos
      return;
    }

    const marker = new google.maps.Marker({
      position: { lat: local.lat, lng: local.lng },
      title: local.name || '',
      map,
    });

    marker.addListener('click', () => {
      activeMarker = marker;
      updateBottomPanel(local);
    });

    markers.push(marker);
  });

  // Se MarkerClusterer (local) estiver disponível, use-o
  if (window.MarkerClusterer) {
    markerCluster = new MarkerClusterer({ markers, map });
  } else {
    // fallback: sem clusterer (markers já adicionados ao mapa)
    console.warn('MarkerClusterer não encontrado — carregando sem cluster');
  }
}

// -----------------------------
// Aplicar filtros (checkboxes)
// -----------------------------
function applyFiltersAndRender() {
  const checked = Array.from(document.querySelectorAll('.filters input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  const filtered = infoData.filter(loc => {
    // se não houver category definido, inclua
    if (!loc.category) return true;
    return checked.includes(loc.category);
  });

  // recria marcadores e lista
  createMarkers(filtered);
  renderList(filtered);
}

// -----------------------------
// INITMAP (global)
// -----------------------------
window.initMap = async function () {
  await loadData();

  // central Araraquara
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -21.784, lng: -48.178 },
    zoom: 13,
    gestureHandling: 'greedy',
    mapId: 'MAPA_POP_RUA',
  });

  // cria marcadores e lista
  createMarkers();
  renderList();

  // bind filtros
  const inputs = document.querySelectorAll('.filters input[type="checkbox"]');
  inputs.forEach(i => i.addEventListener('change', () => applyFiltersAndRender()));

  // mapa click fecha painel
  map.addListener('click', () => clearBottomPanel());

  console.log('initMap concluído — mapa pronto');
};

// -----------------------------
// DOM ready (informativo)
// -----------------------------
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado — aguardando Google Maps...');
});
