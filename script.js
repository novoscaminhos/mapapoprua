/* ============================================================
   MAPA POP RUA – SCRIPT PRINCIPAL
   Versão corrigida e compatível com Google Maps async loading
   ============================================================ */

let map;
let markers = [];
let infoData = [];
let activeMarker = null;

// ================================
// 1) Carregar dados do JSON
// ================================
async function loadData() {
    try {
        const response = await fetch("dados.json");
        infoData = await response.json();
    } catch (error) {
        console.error("Erro ao carregar dados.json:", error);
    }
}

// ================================
// 2) Criar cartão no painel inferior
// ================================
function updateBottomPanel(local) {
    const panel = document.getElementById("bottom-panel");
    if (!panel) return;

    panel.innerHTML = `
        <h2>${local.nome}</h2>
        <p><strong>Endereço:</strong> ${local.endereco}</p>
        <p><strong>Categoria:</strong> ${local.tipo}</p>
        ${local.obs ? `<p><strong>Observações:</strong> ${local.obs}</p>` : ""}
    `;

    panel.classList.add("visible");
}

function clearBottomPanel() {
    const panel = document.getElementById("bottom-panel");
    if (!panel) return;
    panel.classList.remove("visible");
    panel.innerHTML = "";
}

// ================================
// 3) Criar os Marcadores
// ================================
function createMarkers() {
    const customIcon = {
        url: "icons/pin.png",
        scaledSize: new google.maps.Size(45, 45),
        anchor: new google.maps.Point(22, 45),
    };

    infoData.forEach((local) => {
        const marker = new google.maps.Marker({
            position: { lat: local.lat, lng: local.lng },
            map,
            icon: customIcon,
            title: local.nome
        });

        marker.addListener("click", () => {
            activeMarker = marker;
            updateBottomPanel(local);
        });

        markers.push(marker);
    });

    // Clustering opcional
    new markerClusterer.MarkerClusterer({ map: map, markers: markers });
}

// ================================
// 4) INITMAP – agora ALWAYS GLOBAL
// ================================
window.initMap = async function () {
    await loadData();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12,
        gestureHandling: "greedy",
        mapId: "MAPA_POP_RUA",
    });

    createMarkers();

    // Fecha o painel ao clicar no mapa
    map.addListener("click", () => {
        clearBottomPanel();
    });
};

// Garantir que o script esteja disponível globalmente
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, aguardando Google Maps...");
});
