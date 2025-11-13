// Arquivo: locations.js

// 1. DEFINIÇÃO DAS CATEGORIAS
// Adicione ou edite categorias aqui. O 'id' é usado no código e a 'name' é para exibição.
// A 'iconUrl' aponta para o ícone do Google Maps.
const categories = {
    saude: {
        name: "Saúde",
        iconUrl: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    },
    abrigo: {
        name: "Abrigo",
        iconUrl: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    },
    assistencia: {
        name: "Assistência Social",
        iconUrl: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
    }
};

// 2. LISTA DE LOCAIS
// Adicione a propriedade 'category' em cada local, usando os 'ids' definidos acima.
const locations = [
    {
        name: "Consultório na Rua",
        category: "saude", // Categoria adicionada
        lat: -22.90495,
        lng: -43.18223,
        address: "R. da Carioca, 10 - Centro, Rio de Janeiro",
        details: "Equipe de saúde que atende a população em situação de rua no próprio local onde vivem.",
        phone: "(21 ) 98765-4321",
        hours: "Seg-Sex: 09:00 - 17:00"
    },
    {
        name: "Abrigo Municipal",
        category: "abrigo", // Categoria adicionada
        lat: -22.91105,
        lng: -43.20632,
        address: "Av. Pres. Vargas, 1997 - Centro, Rio de Janeiro",
        details: "Oferece pernoite, alimentação e higiene pessoal.",
        phone: "(21) 12345-6789",
        hours: "Aberto 24 horas"
    },
    {
        name: "Centro de Referência de Assistência Social (CRAS)",
        category: "assistencia", // Categoria adicionada
        lat: -22.89567,
        lng: -43.19234,
        address: "R. da Alfândega, 112 - Centro, Rio de Janeiro",
        details: "Porta de entrada para os serviços de assistência social do governo.",
        phone: "(21) 55555-5555",
        hours: "Seg-Sex: 08:00 - 18:00"
    }
    // Adicione mais locais aqui, sempre especificando a 'category'
];
