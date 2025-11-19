/* ============================================================
   MAPA POP RUA – SCRIPT PRINCIPAL
   Versão corrigida + carregamento correto do dados.json
   ============================================================ */

let map;
let markers = [];
let infoData = [];
let activeMarker = null;

// ================================
// 1) Carregar dados do JSON REAL
// ================================
async function loadData() {
    try {
        const response = await fetch("dados.json");  // <-- CORRETO
        if (!response.ok) {
            throw new Error("Não foi possível carregar dados.json");
        }
        infoData = await response.json();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// ================================
// 2) Painel inferior com informações
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
// 3) Criar Marcadores
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

    // Clustering
    new markerClusterer.MarkerClusterer({
        map: map,
        markers: markers
    });
}

// ================================
// 4) INITMAP – GLOBAL
// ================================
window.initMap = async function () {
    await loadData();

    // Centraliza na região desejada
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -21.784, lng: -48.178 }, // Araraquara/SP
        zoom: 13,
        gestureHandling: "greedy",
        mapId: "MAPA_POP_RUA",
    });

    createMarkers();

    map.addListener("click", () => {
        clearBottomPanel();
    });
};

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, aguardando Google Maps...");
});
