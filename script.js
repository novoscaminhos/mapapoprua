/* ============================================================
   MAPA POP RUA – SCRIPT PRINCIPAL
   Versão corrigida + compatível com dados.json
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
        const response = await fetch("dados.json");
        if (!response.ok) throw new Error("Não foi possível carregar dados.json");
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
        <h2>${local.name}</h2>

        ${local.address ? `<p><strong>Endereço:</strong> ${local.address}</p>` : ""}

        ${local.category ? `<p><strong>Categoria:</strong> ${local.category}</p>` : ""}

        ${local.details ? `<p><strong>Detalhes:</strong> ${local.details}</p>` : ""}

        ${local.phone ? `<p><strong>Telefone:</strong> ${local.phone}</p>` : ""}

        ${local.hours ? `<p><strong>Funcionamento:</strong> ${local.hours}</p>` : ""}
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
// 3) Criar Marcadores (SEM CLUSTERER)
// ================================
function createMarkers() {
    const iconConfig = {
        url: null,   // Ícone padrão do Google Maps
        scaledSize: new google.maps.Size(40, 40),
    };

    infoData.forEach((local) => {
        const marker = new google.maps.Marker({
            position: { lat: local.lat, lng: local.lng },
            map,
            icon: iconConfig.url ? iconConfig : null,
            title: local.name
        });

        marker.addListener("click", () => {
            activeMarker = marker;
            updateBottomPanel(local);
        });

        markers.push(marker);
    });
}

// ================================
// 4) INITMAP – GLOBAL
// ================================
window.initMap = async function () {
    await loadData();

    // Centraliza Araraquara
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -21.784, lng: -48.178 },
        zoom: 13,
        gestureHandling: "greedy",
        mapId: "MAPA_POP_RUA",
    });

    createMarkers();

    map.addListener("click", () => {
        clearBottomPanel();
    });
};

// ================================
// 5) DOM READY
// ================================
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, aguardando Google Maps...");
});
