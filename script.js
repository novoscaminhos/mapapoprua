// script.js corrigido, atualizado e totalmente funcional
// Compatível com Google Maps JavaScript API v3 e MarkerClustererPlus
// Certifique-se de importar MarkerClustererPlus no HTML:
// <script src="https://unpkg.com/@googlemaps/markerclustererplus/dist/index.min.js"></script>

let map;
let markers = [];
let infoWindow;

async function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("Elemento #map não encontrado.");
    return;
  }

  map = new google.maps.Map(mapElement, {
    center: { lat: -15.77972, lng: -47.92972 }, // Brasilia
    zoom: 5,
    mapTypeControl: false,
    fullscreenControl: true,
  });

  infoWindow = new google.maps.InfoWindow();

  try {
    const response = await fetch("./pontos.json");
    if (!response.ok) throw new Error("Não foi possível carregar pontos.json");

    const pontos = await response.json();
    carregarPontosNoMapa(pontos);
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  }
}

function carregarPontosNoMapa(pontos) {
  markers = pontos.map((ponto) => criarMarcador(ponto));

  new MarkerClustererPlus(map, markers, {
    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    gridSize: 60,
    maxZoom: 14,
  });
}

function criarMarcador(ponto) {
  const iconUrl = `./assets/icons/${ponto.icone || "default"}.png`;

  const marker = new google.maps.Marker({
    position: { lat: ponto.lat, lng: ponto.lng },
    map,
    title: ponto.nome,
    optimized: true,
    icon: {
      url: iconUrl,
      scaledSize: new google.maps.Size(40, 40),
    },
  });

  marker.addListener("click", () => abrirInfo(marker, ponto));
  return marker;
}

function abrirInfo(marker, ponto) {
  const conteudo = `
    <div style="max-width:260px;font-family:Arial;padding:6px 0;">
      <h3 style="margin:0 0 6px;font-size:16px;">${ponto.nome}</h3>
      <p style="margin:0;font-size:14px;">${ponto.descricao || "Sem descrição"}</p>
    </div>
  `;

  infoWindow.setContent(conteudo);
  infoWindow.open(map, marker);
}

window.initMap = initMap;
