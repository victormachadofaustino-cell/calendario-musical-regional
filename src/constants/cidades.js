export const COORDENADAS_CIDADES = [
  { nome: "Jundiaí", lat: -23.1857, lon: -46.8978 },
  { nome: "Itatiba", lat: -23.0058, lon: -46.8383 },
  { nome: "Itupeva", lat: -23.1531, lon: -47.0578 },
  { nome: "Várzea Paulista", lat: -23.2100, lon: -46.8270 },
  { nome: "Campo Limpo Paulista", lat: -23.2050, lon: -46.7860 },
  { nome: "Louveira", lat: -23.0850, lon: -46.9510 },
  { nome: "Cabreúva", lat: -23.3070, lon: -47.1330 },
  { nome: "Caieiras", lat: -23.3630, lon: -46.7410 },
  { nome: "Cajamar", lat: -23.3550, lon: -46.8780 },
  { nome: "Francisco Morato", lat: -23.2810, lon: -46.7450 },
  { nome: "Franco da Rocha", lat: -23.3290, lon: -46.7260 },
  { nome: "Morungaba", lat: -22.8820, lon: -46.7930 }
];

export const CIDADES_LISTA = COORDENADAS_CIDADES.map(c => c.nome).sort();

export const CARGOS_LISTA = [
  "Ancião", 
  "Encarregado Regional", 
  "Examinadora", 
  "Secretário da Música Regional", 
  "Secretário da Música Cidade"
];