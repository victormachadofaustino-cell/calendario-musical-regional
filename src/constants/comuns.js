// src/constants/comuns.js

/**
 * Função Única de Normalização para todo o App.
 * Remove acentos, espaços extras e padroniza termos como 'Paulista' e 'Pta'.
 */
export const normalizarTexto = (t) => {
  if (!t) return "";
  return t
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bPAULISTA\b/g, "")
    .replace(/\bPTA\b/g, "")
    .replace(/\s+/g, "")
    .trim();
};

export const LISTA_COMUNS_COORDENADAS = [
  // --- CAIEIRAS ---
  { cidade: "Caieiras", localidade: "Sítio Aparecida", lat: -23.3512, lon: -46.7588 },
  { cidade: "Caieiras", localidade: "Serpa", lat: -23.3725, lon: -46.7451 },
  { cidade: "Caieiras", localidade: "Jardim dos Eucaliptos", lat: -23.3589, lon: -46.7321 },
  { cidade: "Caieiras", localidade: "Jardim Esperança", lat: -23.3445, lon: -46.7490 },
  { cidade: "Caieiras", localidade: "Parque Santa Inês", lat: -23.3321, lon: -46.7612 },
  { cidade: "Caieiras", localidade: "Portal das Laranjeiras", lat: -23.3810, lon: -46.7215 },
  { cidade: "Caieiras", localidade: "Vila dos Pinheiros", lat: -23.3654, lon: -46.7388 },
  { cidade: "Caieiras", localidade: "Vila Rosina", lat: -23.3912, lon: -46.7654 },
  { cidade: "Caieiras", localidade: "Jardim Marcelino", lat: -23.3521, lon: -46.7243 },
  { cidade: "Caieiras", localidade: "Laranjeiras", lat: -23.3855, lon: -46.7230 },
  { cidade: "Caieiras", localidade: "Vila Miraval", lat: -23.3612, lon: -46.7488 },
  { cidade: "Caieiras", localidade: "Jardim Helena", lat: -23.3688, lon: -46.7155 },
  { cidade: "Caieiras", localidade: "Central", lat: -23.3630, lon: -46.7410 },
  { cidade: "Caieiras", localidade: "Jardim Vera Tereza", lat: -23.3422, lon: -46.7712 },

  // --- CAJAMAR ---
  { cidade: "Cajamar", localidade: "Ponunduva", lat: -23.3388, lon: -46.9512 },
  { cidade: "Cajamar", localidade: "Panorama", lat: -23.3155, lon: -46.8922 },
  { cidade: "Cajamar", localidade: "Jordanésia", lat: -23.3250, lon: -46.8780 },
  { cidade: "Cajamar", localidade: "Vila União", lat: -23.3211, lon: -46.8855 },
  { cidade: "Cajamar", localidade: "Parque Maria Aparecida", lat: -23.3312, lon: -46.8655 },
  { cidade: "Cajamar", localidade: "Gato Preto", lat: -23.3022, lon: -46.8512 },
  { cidade: "Cajamar", localidade: "Vila Nova", lat: -23.3355, lon: -46.8812 },
  { cidade: "Cajamar", localidade: "Polvilho", lat: -23.4150, lon: -46.8520 },
  { cidade: "Cajamar", localidade: "Guaturinho", lat: -23.4088, lon: -46.8412 },
  { cidade: "Cajamar", localidade: "Jardim Santana", lat: -23.4212, lon: -46.8588 },
  { cidade: "Cajamar", localidade: "Vila Abrão", lat: -23.4255, lon: -46.8612 },
  { cidade: "Cajamar", localidade: "Parque São Roberto", lat: -23.4188, lon: -46.8322 },
  { cidade: "Cajamar", localidade: "Central", lat: -23.3555, lon: -46.8722 },

  // --- FRANCISCO MORATO ---
  { cidade: "Francisco Morato", localidade: "Jardim Liliane", lat: -23.2722, lon: -46.7512 },
  { cidade: "Francisco Morato", localidade: "Jardim Arpoador", lat: -23.2688, lon: -46.7455 },
  { cidade: "Francisco Morato", localidade: "Jardim Silvia", lat: -23.2855, lon: -46.7312 },
  { cidade: "Francisco Morato", localidade: "Jardim Vassouras", lat: -23.2912, lon: -46.7488 },
  { cidade: "Francisco Morato", localidade: "Vila Capuá", lat: -23.2822, lon: -46.7555 },
  { cidade: "Francisco Morato", localidade: "Jardim Álamo", lat: -23.2788, lon: -46.7622 },
  { cidade: "Francisco Morato", localidade: "Jardim Alegria", lat: -23.2650, lon: -46.7350 },
  { cidade: "Francisco Morato", localidade: "Jardim Nova Morato", lat: -23.2755, lon: -46.7388 },
  { cidade: "Francisco Morato", localidade: "Jardim Primavera", lat: -23.2888, lon: -46.7212 },
  { cidade: "Francisco Morato", localidade: "Parque 120", lat: -23.2512, lon: -46.7455 },
  { cidade: "Francisco Morato", localidade: "Vila Suíça", lat: -23.2955, lon: -46.7312 },
  { cidade: "Francisco Morato", localidade: "Vila Belmiro", lat: -23.2712, lon: -46.7288 },
  { cidade: "Francisco Morato", localidade: "Jardim Santo Antônio", lat: -23.2833, lon: -46.7655 },
  { cidade: "Francisco Morato", localidade: "Vila Guilherme", lat: -23.2688, lon: -46.7712 },
  { cidade: "Francisco Morato", localidade: "Jardim Virgínia", lat: -23.2744, lon: -46.7522 },
  { cidade: "Francisco Morato", localidade: "Vila São José", lat: -23.2899, lon: -46.7388 },
  { cidade: "Francisco Morato", localidade: "Vila Espatódia", lat: -23.2777, lon: -46.7255 },
  { cidade: "Francisco Morato", localidade: "Central", lat: -23.2810, lon: -46.7450 },
  { cidade: "Francisco Morato", localidade: "Hípica", lat: -23.2988, lon: -46.7512 },
  { cidade: "Francisco Morato", localidade: "Jardim Antunes", lat: -23.2622, lon: -46.7488 },
  { cidade: "Francisco Morato", localidade: "Parque Ressaca", lat: -23.2920, lon: -46.7580 },
  { cidade: "Francisco Morato", localidade: "Recanto Feliz", lat: -23.3055, lon: -46.7412 },
  { cidade: "Francisco Morato", localidade: "Vila Rossi", lat: -23.2766, lon: -46.7344 },

  // --- FRANCO DA ROCHA ---
  { cidade: "Franco da Rocha", localidade: "Jardim das Colinas", lat: -23.3155, lon: -46.7122 },
  { cidade: "Franco da Rocha", localidade: "Vila Palmares", lat: -23.3212, lon: -46.7355 },
  { cidade: "Franco da Rocha", localidade: "Jardim dos Reis", lat: -23.3422, lon: -46.7288 },
  { cidade: "Franco da Rocha", localidade: "Parque Vitória", lat: -23.3420, lon: -46.7150 },
  { cidade: "Franco da Rocha", localidade: "Vila Lanfranchi", lat: -23.3322, lon: -46.7055 },
  { cidade: "Franco da Rocha", localidade: "Lago Azul", lat: -23.2988, lon: -46.6855 },
  { cidade: "Franco da Rocha", localidade: "Monte Verde", lat: -23.3388, lon: -46.6955 },
  { cidade: "Franco da Rocha", localidade: "Parque Paulista", lat: -23.3255, lon: -46.7455 },
  { cidade: "Franco da Rocha", localidade: "Vila Santista", lat: -23.3288, lon: -46.7212 },
  { cidade: "Franco da Rocha", localidade: "Jardim Cruzeiro", lat: -23.3188, lon: -46.7322 },
  { cidade: "Franco da Rocha", localidade: "Jardim Luciana", lat: -23.3150, lon: -46.7020 },
  { cidade: "Franco da Rocha", localidade: "Vila Bela", lat: -23.3355, lon: -46.7155 },
  { cidade: "Franco da Rocha", localidade: "Central", lat: -23.3290, lon: -46.7260 },

  // --- ITATIBA ---
  { cidade: "Itatiba", localidade: "Bairro da Ponte", lat: -23.0150, lon: -46.8250 },
  { cidade: "Itatiba", localidade: "Bairro do Engenho", lat: -22.9955, lon: -46.8512 },
  { cidade: "Itatiba", localidade: "Central", lat: -23.0058, lon: -46.8383 },
  { cidade: "Itatiba", localidade: "Jardim das Nações", lat: -23.0212, lon: -46.8422 },
  { cidade: "Itatiba", localidade: "Vila Centenário", lat: -23.0122, lon: -46.8311 },
  { cidade: "Itatiba", localidade: "San Francisco", lat: -22.9855, lon: -46.8212 },
  { cidade: "Itatiba", localidade: "Parque da Colina", lat: -23.0288, lon: -46.8555 },
  { cidade: "Itatiba", localidade: "Jardim Ipê", lat: -23.0322, lon: -46.8188 },
  { cidade: "Itatiba", localidade: "Jardim Harmonia", lat: -23.0088, lon: -46.8655 },

  // --- ITUPEVA ---
  { cidade: "Itupeva", localidade: "Central", lat: -23.1531, lon: -47.0578 },
  { cidade: "Itupeva", localidade: "Bairro da Mina", lat: -23.1322, lon: -47.0155 },
  { cidade: "Itupeva", localidade: "Monte Serrat", lat: -23.1855, lon: -47.0855 },
  { cidade: "Itupeva", localidade: "Vila Independência", lat: -23.1588, lon: -47.0622 },
  { cidade: "Itupeva", localidade: "Pachoalotto", lat: -23.1455, lon: -47.0422 },
  { cidade: "Itupeva", localidade: "Guacuri", lat: -23.1955, lon: -47.1022 },
  { cidade: "Itupeva", localidade: "Hortênsias", lat: -23.1622, lon: -47.0755 },
  { cidade: "Itupeva", localidade: "Parque das Samambaias", lat: -23.1411, lon: -47.0512 },
  { cidade: "Itupeva", localidade: "Jardim Vitória", lat: -23.1555, lon: -47.0688 },
  { cidade: "Itupeva", localidade: "Rio Abaixo", lat: -23.1122, lon: -47.0355 },
  { cidade: "Itupeva", localidade: "Nova Itupeva", lat: -23.1655, lon: -47.0712 },
  { cidade: "Itupeva", localidade: "Gleba Santa Isabel", lat: -23.2122, lon: -47.1255 },

  // --- LOUVEIRA ---
  { cidade: "Louveira", localidade: "Central", lat: -23.0850, lon: -46.9510 },
  { cidade: "Louveira", localidade: "Santo Antônio", lat: -23.1022, lon: -46.9355 },
  { cidade: "Louveira", localidade: "Vila Pasti", lat: -23.0911, lon: -46.9455 },

  // --- CABREÚVA ---
  { cidade: "Cabreúva", localidade: "Bananal", lat: -23.3322, lon: -47.1555 },
  { cidade: "Cabreúva", localidade: "Pinhal", lat: -23.2855, lon: -47.0255 },
  { cidade: "Cabreúva", localidade: "Jacaré", lat: -23.2450, lon: -47.0150 },
  { cidade: "Cabreúva", localidade: "Vilarejo", lat: -23.2388, lon: -47.0055 },
  { cidade: "Cabreúva", localidade: "Central", lat: -23.3070, lon: -47.1330 },
  { cidade: "Cabreúva", localidade: "Vale Verde", lat: -23.2555, lon: -47.0312 },
  { cidade: "Cabreúva", localidade: "Bonfim", lat: -23.2988, lon: -47.1122 },

  // --- MORUNGABA ---
  { cidade: "Morungaba", localidade: "Central", lat: -22.8820, lon: -46.7930 },

  // --- CAMPO LIMPO PAULISTA ---
  { cidade: "Campo Limpo Paulista", localidade: "Vila Imape", lat: -23.2088, lon: -46.7755 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Marchetti", lat: -23.2122, lon: -46.7912 },
  { cidade: "Campo Limpo Paulista", localidade: "Santa Lúcia", lat: -23.2155, lon: -46.7822 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Europa", lat: -23.1988, lon: -46.7655 },
  { cidade: "Campo Limpo Paulista", localidade: "Botujuru", lat: -23.2280, lon: -46.7550 },
  { cidade: "Campo Limpo Paulista", localidade: "Outeiro das Flores", lat: -23.2188, lon: -46.7955 },
  { cidade: "Campo Limpo Paulista", localidade: "Central", lat: -23.2050, lon: -46.7860 },
  { cidade: "Campo Limpo Paulista", localidade: "São José", lat: -23.1950, lon: -46.7720 },
  { cidade: "Campo Limpo Paulista", localidade: "Vila Marieta", lat: -23.2012, lon: -46.7788 },

  // --- VÁRZEA PAULISTA ---
  { cidade: "Várzea Paulista", localidade: "América", lat: -23.2212, lon: -46.8355 },
  { cidade: "Várzea Paulista", localidade: "Jardim Paulista", lat: -23.2250, lon: -46.8150 },
  { cidade: "Várzea Paulista", localidade: "Cidade Nova", lat: -23.2355, lon: -46.8055 },
  { cidade: "Várzea Paulista", localidade: "Vila Real", lat: -23.2080, lon: -46.8420 },
  { cidade: "Várzea Paulista", localidade: "Jardim Promeca", lat: -23.2022, lon: -46.8155 },
  { cidade: "Várzea Paulista", localidade: "Central", lat: -23.2100, lon: -46.8270 },

  // --- JUNDIAÍ ---
  { cidade: "Jundiaí", localidade: "Central", lat: -23.1857, lon: -46.8978 },
  { cidade: "Jundiaí", localidade: "Vila Rio Branco", lat: -23.1722, lon: -46.8911 },
  { cidade: "Jundiaí", localidade: "Jardim da Fonte", lat: -23.1788, lon: -46.8855 },
  { cidade: "Jundiaí", localidade: "Vila Hortolândia", lat: -23.1655, lon: -46.9022 },
  { cidade: "Jundiaí", localidade: "Jardim Tarumã", lat: -23.1650, lon: -46.8520 },
  { cidade: "Jundiaí", localidade: "Cidade Santos Dumont", lat: -23.2012, lon: -46.8455 },
  { cidade: "Jundiaí", localidade: "Engordadouro", lat: -23.1455, lon: -46.9122 },
  { cidade: "Jundiaí", localidade: "Parque da Represa", lat: -23.1588, lon: -46.8955 },
  { cidade: "Jundiaí", localidade: "Vila Rami", lat: -23.2122, lon: -46.8922 },
  { cidade: "Jundiaí", localidade: "Jardim Santa Gertrudes", lat: -23.2455, lon: -46.8655 },
  { cidade: "Jundiaí", localidade: "Vila Maringá", lat: -23.2150, lon: -46.8750 },
  { cidade: "Jundiaí", localidade: "Jardim do Lago", lat: -23.2288, lon: -46.8855 },
  { cidade: "Jundiaí", localidade: "Vila Progresso", lat: -23.2055, lon: -46.8912 },
  { cidade: "Jundiaí", localidade: "Tulipas", lat: -23.1520, lon: -46.9850 },
  { cidade: "Jundiaí", localidade: "Fazenda Grande", lat: -23.1580, lon: -46.9650 },
  { cidade: "Jundiaí", localidade: "Parque Eloy Chaves", lat: -23.1722, lon: -46.9755 },
  { cidade: "Jundiaí", localidade: "Varjão", lat: -23.1488, lon: -46.9555 },
  { cidade: "Jundiaí", localidade: "Medeiros", lat: -23.1855, lon: -46.9955 },
  { cidade: "Jundiaí", localidade: "Caxambu", lat: -23.1350, lon: -46.8450 },
  { cidade: "Jundiaí", localidade: "Roseira", lat: -23.1155, lon: -46.8322 },
  { cidade: "Jundiaí", localidade: "Jardim Pacaembu", lat: -23.1812, lon: -46.8655 },
  { cidade: "Jundiaí", localidade: "Vila Aparecida", lat: -23.1722, lon: -46.8788 },
  { cidade: "Jundiaí", localidade: "Ivoturucaia", lat: -23.1655, lon: -46.8122 },
  { cidade: "Jundiaí", localidade: "Almerinda Chaves", lat: -23.1511, lon: -46.9712 },
  { cidade: "Jundiaí", localidade: "Champirra", lat: -23.1055, lon: -46.8612 },
  { cidade: "Jundiaí", localidade: "Colônia", lat: -23.1755, lon: -46.8555 },
  { cidade: "Jundiaí", localidade: "Vila Espéria", lat: -23.1888, lon: -46.8722 },
  { cidade: "Jundiaí", localidade: "Vila Esperança", lat: -23.1922, lon: -46.8611 }
];

/**
 * Encontra as coordenadas de uma localidade específica.
 * Utiliza a função normalizarTexto para garantir precisão no de/para.
 */
export const buscarCoordenadas = (cidade, localidade) => {
  const cNorm = normalizarTexto(cidade);
  const lNorm = normalizarTexto(localidade);

  const comum = LISTA_COMUNS_COORDENADAS.find(c => 
    normalizarTexto(c.cidade).includes(cNorm) && normalizarTexto(c.localidade) === lNorm
  );
  return comum ? { lat: comum.lat, lon: comum.lon } : null;
};