// src/constants/comuns.js // Identifica que este é o arquivo de locais e funções compartilhadas.

/**
 * Função Única de Normalização para todo o App. // Nome da função que padroniza os textos.
 * Remove acentos, espaços extras e padroniza termos como 'Paulista' e 'Pta'. // O que ela faz para evitar erros.
 */
export const normalizarTexto = (t) => { // Cria a função "afinadora" de palavras.
  if (!t) return ""; // Se o campo estiver vazio, retorna nada para não travar.
  return t // Começa a transformar o texto original.
    .toUpperCase() // Deixa tudo em letra MAIÚSCULA.
    .normalize("NFD") // Desmonta os acentos (o 'á' vira 'a' + '´').
    .replace(/[\u0300-\u036f]/g, "") // Remove fisicamente os acentinhos que sobraram.
    .replace(/\bPAULISTA\b/g, "") // Tira a palavra "PAULISTA" para facilitar o encontro.
    .replace(/\bPTA\b/g, "") // Tira o "PTA" para o sistema não se confundir.
    .replace(/\s+/g, "") // Arranca todos os espaços para virar uma palavra só.
    .trim(); // Limpa as pontas do texto.
}; // Fecha a lógica da função.

export const LISTA_COMUNS_COORDENADAS = [ // Inicia o banco de endereços precisos (Latitude e Longitude).
  // --- CAIEIRAS --- // Inicia a lista da cidade de Caieiras.
  { cidade: "Caieiras", localidade: "Sítio Aparecida", lat: -23.3512, lon: -46.7588 }, // Endereço GPS da igreja Sítio Aparecida.
  { cidade: "Caieiras", localidade: "Serpa", lat: -23.3725, lon: -46.7451 }, // Endereço GPS da igreja Serpa.
  { cidade: "Caieiras", localidade: "Jardim dos Eucaliptos", lat: -23.3589, lon: -46.7321 }, // Endereço GPS da igreja Jd. dos Eucaliptos.
  { cidade: "Caieiras", localidade: "Jardim Esperança", lat: -23.3445, lon: -46.7490 }, // Endereço GPS da igreja Jd. Esperança.
  { cidade: "Caieiras", localidade: "Parque Santa Inês", lat: -23.3321, lon: -46.7612 }, // Endereço GPS da igreja Pq. Santa Inês.
  { cidade: "Caieiras", localidade: "Portal das Laranjeiras", lat: -23.3810, lon: -46.7215 }, // Endereço GPS da igreja Portal das Laranjeiras.
  { cidade: "Caieiras", localidade: "Vila dos Pinheiros", lat: -23.3654, lon: -46.7388 }, // Endereço GPS da igreja Vila dos Pinheiros.
  { cidade: "Caieiras", localidade: "Vila Rosina", lat: -23.3912, lon: -46.7654 }, // Endereço GPS da igreja Vila Rosina.
  { cidade: "Caieiras", localidade: "Jardim Marcelino", lat: -23.3521, lon: -46.7243 }, // Endereço GPS da igreja Jd. Marcelino.
  { cidade: "Caieiras", localidade: "Laranjeiras", lat: -23.3855, lon: -46.7230 }, // Endereço GPS da igreja Laranjeiras.
  { cidade: "Caieiras", localidade: "Vila Miraval", lat: -23.3612, lon: -46.7488 }, // Endereço GPS da igreja Vila Miraval.
  { cidade: "Caieiras", localidade: "Jardim Helena", lat: -23.3688, lon: -46.7155 }, // Endereço GPS da igreja Jd. Helena.
  { cidade: "Caieiras", localidade: "Central", lat: -23.3630, lon: -46.7410 }, // Endereço GPS da igreja Central de Caieiras.
  { cidade: "Caieiras", localidade: "Jardim Vera Tereza", lat: -23.3422, lon: -46.7712 }, // Endereço GPS da igreja Jd. Vera Tereza.

  // --- CAJAMAR --- // Inicia a lista da cidade de Cajamar.
  { cidade: "Cajamar", localidade: "Ponunduva", lat: -23.3388, lon: -46.9512 }, // Endereço GPS da igreja Ponunduva.
  { cidade: "Cajamar", localidade: "Panorama", lat: -23.3155, lon: -46.8922 }, // Endereço GPS da igreja Panorama.
  { cidade: "Cajamar", localidade: "Jordanésia", lat: -23.3250, lon: -46.8780 }, // Endereço GPS da igreja Jordanésia.
  { cidade: "Cajamar", localidade: "Vila União", lat: -23.3211, lon: -46.8855 }, // Endereço GPS da igreja Vila União.
  { cidade: "Cajamar", localidade: "Parque Maria Aparecida", lat: -23.3312, lon: -46.8655 }, // Endereço GPS da igreja Pq. Maria Aparecida.
  { cidade: "Cajamar", localidade: "Gato Preto", lat: -23.3022, lon: -46.8512 }, // Endereço GPS da igreja Gato Preto.
  { cidade: "Cajamar", localidade: "Vila Nova", lat: -23.3355, lon: -46.8812 }, // Endereço GPS da igreja Vila Nova.
  { cidade: "Cajamar", localidade: "Polvilho", lat: -23.4150, lon: -46.8520 }, // Endereço GPS da igreja Polvilho.
  { cidade: "Cajamar", localidade: "Guaturinho", lat: -23.4088, lon: -46.8412 }, // Endereço GPS da igreja Guaturinho.
  { cidade: "Cajamar", localidade: "Jardim Santana", lat: -23.4212, lon: -46.8588 }, // Endereço GPS da igreja Jd. Santana.
  { cidade: "Cajamar", localidade: "Vila Abrão", lat: -23.4255, lon: -46.8612 }, // Endereço GPS da igreja Vila Abrão.
  { cidade: "Cajamar", localidade: "Parque São Roberto", lat: -23.4188, lon: -46.8322 }, // Endereço GPS da igreja Pq. São Roberto.
  { cidade: "Cajamar", localidade: "Central", lat: -23.3555, lon: -46.8722 }, // Endereço GPS da igreja Central de Cajamar.

  // --- FRANCISCO MORATO --- // Inicia a lista da cidade de Francisco Morato.
  { cidade: "Francisco Morato", localidade: "Jardim Liliane", lat: -23.2722, lon: -46.7512 }, // Endereço GPS da igreja Jd. Liliane.
  { cidade: "Francisco Morato", localidade: "Jardim Arpoador", lat: -23.2688, lon: -46.7455 }, // Endereço GPS da igreja Jd. Arpoador.
  { cidade: "Francisco Morato", localidade: "Jardim Silvia", lat: -23.2855, lon: -46.7312 }, // Endereço GPS da igreja Jd. Silvia.
  { cidade: "Francisco Morato", localidade: "Jardim Vassouras", lat: -23.2912, lon: -46.7488 }, // Endereço GPS da igreja Jd. Vassouras.
  { cidade: "Francisco Morato", localidade: "Vila Capuá", lat: -23.2822, lon: -46.7555 }, // Endereço GPS da igreja Vila Capuá.
  { cidade: "Francisco Morato", localidade: "Jardim Álamo", lat: -23.2788, lon: -46.7622 }, // Endereço GPS da igreja Jd. Álamo.
  { cidade: "Francisco Morato", localidade: "Jardim Alegria", lat: -23.2650, lon: -46.7350 }, // Endereço GPS da igreja Jd. Alegria.
  { cidade: "Francisco Morato", localidade: "Jardim Nova Morato", lat: -23.2755, lon: -46.7388 }, // Endereço GPS da igreja Jd. Nova Morato.
  { cidade: "Francisco Morato", localidade: "Jardim Primavera", lat: -23.2888, lon: -46.7212 }, // Endereço GPS da igreja Jd. Primavera.
  { cidade: "Francisco Morato", localidade: "Parque 120", lat: -23.2512, lon: -46.7455 }, // Endereço GPS da igreja Pq. 120.
  { cidade: "Francisco Morato", localidade: "Vila Suíça", lat: -23.2955, lon: -46.7312 }, // Endereço GPS da igreja Vila Suíça.
  { cidade: "Francisco Morato", localidade: "Vila Belmiro", lat: -23.2712, lon: -46.7288 }, // Endereço GPS da igreja Vila Belmiro.
  { cidade: "Francisco Morato", localidade: "Jardim Santo Antônio", lat: -23.2833, lon: -46.7655 }, // Endereço GPS da igreja Jd. Santo Antônio.
  { cidade: "Francisco Morato", localidade: "Vila Guilherme", lat: -23.2688, lon: -46.7712 }, // Endereço GPS da igreja Vila Guilherme.
  { cidade: "Francisco Morato", localidade: "Jardim Virgínia", lat: -23.2744, lon: -46.7522 }, // Endereço GPS da igreja Jd. Virgínia.
  { cidade: "Francisco Morato", localidade: "Vila São José", lat: -23.2899, lon: -46.7388 }, // Endereço GPS da igreja Vila São José.
  { cidade: "Francisco Morato", localidade: "Vila Espatódia", lat: -23.2777, lon: -46.7255 }, // Endereço GPS da igreja Vila Espatódia.
  { cidade: "Francisco Morato", localidade: "Central", lat: -23.2810, lon: -46.7450 }, // Endereço GPS da igreja Central de Francisco Morato.
  { cidade: "Francisco Morato", localidade: "Hípica", lat: -23.2988, lon: -46.7512 }, // Endereço GPS da igreja Hípica.
  { cidade: "Francisco Morato", localidade: "Jardim Antunes", lat: -23.2622, lon: -46.7488 }, // Endereço GPS da igreja Jd. Antunes.
  { cidade: "Francisco Morato", localidade: "Parque Ressaca", lat: -23.2920, lon: -46.7580 }, // Endereço GPS da igreja Pq. Ressaca.
  { cidade: "Francisco Morato", localidade: "Recanto Feliz", lat: -23.3055, lon: -46.7412 }, // Endereço GPS da igreja Recanto Feliz.
  { cidade: "Francisco Morato", localidade: "Vila Rossi", lat: -23.2766, lon: -46.7344 }, // Endereço GPS da igreja Vila Rossi.

  // --- FRANCO DA ROCHA --- // Inicia a lista da cidade de Franco da Rocha.
  { cidade: "Franco da Rocha", localidade: "Jardim das Colinas", lat: -23.3155, lon: -46.7122 }, // Endereço GPS da igreja Jd. das Colinas.
  { cidade: "Franco da Rocha", localidade: "Vila Palmares", lat: -23.3212, lon: -46.7355 }, // Endereço GPS da igreja Vila Palmares.
  { cidade: "Franco da Rocha", localidade: "Jardim dos Reis", lat: -23.3422, lon: -46.7288 }, // Endereço GPS da igreja Jd. dos Reis.
  { cidade: "Franco da Rocha", localidade: "Parque Vitória", lat: -23.3420, lon: -46.7150 }, // Endereço GPS da igreja Pq. Vitória.
  { cidade: "Franco da Rocha", localidade: "Vila Lanfranchi", lat: -23.3322, lon: -46.7055 }, // Endereço GPS da igreja Vila Lanfranchi.
  { cidade: "Franco da Rocha", localidade: "Lago Azul", lat: -23.2988, lon: -46.6855 }, // Endereço GPS da igreja Lago Azul.
  { cidade: "Franco da Rocha", localidade: "Monte Verde", lat: -23.3388, lon: -46.6955 }, // Endereço GPS da igreja Monte Verde.
  { cidade: "Franco da Rocha", localidade: "Parque Paulista", lat: -23.3255, lon: -46.7455 }, // Endereço GPS da igreja Pq. Paulista.
  { cidade: "Franco da Rocha", localidade: "Vila Santista", lat: -23.3288, lon: -46.7212 }, // Endereço GPS da igreja Vila Santista.
  { cidade: "Franco da Rocha", localidade: "Jardim Cruzeiro", lat: -23.3188, lon: -46.7322 }, // Endereço GPS da igreja Jd. Cruzeiro.
  { cidade: "Franco da Rocha", localidade: "Jardim Luciana", lat: -23.3150, lon: -46.7020 }, // Endereço GPS da igreja Jd. Luciana.
  { cidade: "Franco da Rocha", localidade: "Vila Bela", lat: -23.3355, lon: -46.7155 }, // Endereço GPS da igreja Vila Bela.
  { cidade: "Franco da Rocha", localidade: "Central", lat: -23.3290, lon: -46.7260 }, // Endereço GPS da igreja Central de Franco da Rocha.

  // --- ITATIBA --- // Inicia a lista da cidade de Itatiba.
  { cidade: "Itatiba", localidade: "Bairro da Ponte", lat: -23.0150, lon: -46.8250 }, // Endereço GPS da igreja Bairro da Ponte.
  { cidade: "Itatiba", localidade: "Bairro do Engenho", lat: -22.9955, lon: -46.8512 }, // Endereço GPS da igreja Bairro do Engenho.
  { cidade: "Itatiba", localidade: "Central", lat: -23.0058, lon: -46.8383 }, // Endereço GPS da igreja Central de Itatiba.
  { cidade: "Itatiba", localidade: "Jardim das Nações", lat: -23.0212, lon: -46.8422 }, // Endereço GPS da igreja Jd. das Nações.
  { cidade: "Itatiba", localidade: "Vila Centenário", lat: -23.0122, lon: -46.8311 }, // Endereço GPS da igreja Vila Centenário.
  { cidade: "Itatiba", localidade: "San Francisco", lat: -22.9855, lon: -46.8212 }, // Endereço GPS da igreja San Francisco.
  { cidade: "Itatiba", localidade: "Parque da Colina", lat: -23.0288, lon: -46.8555 }, // Endereço GPS da igreja Pq. da Colina.
  { cidade: "Itatiba", localidade: "Jardim Ipê", lat: -23.0322, lon: -46.8188 }, // Endereço GPS da igreja Jd. Ipê.
  { cidade: "Itatiba", localidade: "Jardim Harmonia", lat: -23.0088, lon: -46.8655 }, // Endereço GPS da igreja Jd. Harmonia.

  // --- ITUPEVA --- // Inicia a lista da cidade de Itupeva.
  { cidade: "Itupeva", localidade: "Central", lat: -23.1531, lon: -47.0578 }, // Endereço GPS da igreja Central de Itupeva.
  { cidade: "Itupeva", localidade: "Bairro da Mina", lat: -23.1322, lon: -47.0155 }, // Endereço GPS da igreja Bairro da Mina.
  { cidade: "Itupeva", localidade: "Monte Serrat", lat: -23.1855, lon: -47.0855 }, // Endereço GPS da igreja Monte Serrat.
  { cidade: "Itupeva", localidade: "Vila Independência", lat: -23.1588, lon: -47.0622 }, // Endereço GPS da igreja Vila Independência.
  { cidade: "Itupeva", localidade: "Pachoalotto", lat: -23.1455, lon: -47.0422 }, // Endereço GPS da igreja Pachoalotto.
  { cidade: "Itupeva", localidade: "Guacuri", lat: -23.1955, lon: -47.1022 }, // Endereço GPS da igreja Guacuri.
  { cidade: "Itupeva", localidade: "Hortênsias", lat: -23.1622, lon: -47.0755 }, // Endereço GPS da igreja Hortênsias.
  { cidade: "Itupeva", localidade: "Parque das Samambaias", lat: -23.1411, lon: -47.0512 }, // Endereço GPS da igreja Pq. das Samambaias.
  { cidade: "Itupeva", localidade: "Jardim Vitória", lat: -23.1555, lon: -47.0688 }, // Endereço GPS da igreja Jd. Vitória.
  { cidade: "Itupeva", localidade: "Rio Abaixo", lat: -23.1122, lon: -47.0355 }, // Endereço GPS da igreja Rio Abaixo.
  { cidade: "Itupeva", localidade: "Nova Itupeva", lat: -23.1655, lon: -47.0712 }, // Endereço GPS da igreja Nova Itupeva.
  { cidade: "Itupeva", localidade: "Gleba Santa Isabel", lat: -23.2122, lon: -47.1255 }, // Endereço GPS da igreja Gleba Santa Isabel.

  // --- LOUVEIRA --- // Inicia a lista da cidade de Louveira.
  { cidade: "Louveira", localidade: "Central", lat: -23.0850, lon: -46.9510 }, // Endereço GPS da igreja Central de Louveira.
  { cidade: "Louveira", localidade: "Santo Antônio", lat: -23.1022, lon: -46.9355 }, // Endereço GPS da igreja Santo Antônio.
  { cidade: "Louveira", localidade: "Vila Pasti", lat: -23.0911, lon: -46.9455 }, // Endereço GPS da igreja Vila Pasti.

  // --- CABREÚVA --- // Inicia a lista da cidade de Cabreúva.
  { cidade: "Cabreúva", localidade: "Bananal", lat: -23.3322, lon: -47.1555 }, // Endereço GPS da igreja Bananal.
  { cidade: "Cabreúva", localidade: "Pinhal", lat: -23.2855, lon: -47.0255 }, // Endereço GPS da igreja Pinhal.
  { cidade: "Cabreúva", localidade: "Jacaré", lat: -23.2450, lon: -47.0150 }, // Endereço GPS da igreja Jacaré.
  { cidade: "Cabreúva", localidade: "Vilarejo", lat: -23.2388, lon: -47.0055 }, // Endereço GPS da igreja Vilarejo.
  { cidade: "Cabreúva", localidade: "Central", lat: -23.3070, lon: -47.1330 }, // Endereço GPS da igreja Central de Cabreúva.
  { cidade: "Cabreúva", localidade: "Vale Verde", lat: -23.2555, lon: -47.0312 }, // Endereço GPS da igreja Vale Verde.
  { cidade: "Cabreúva", localidade: "Bonfim", lat: -23.2988, lon: -47.1122 }, // Endereço GPS da igreja Bonfim.

  // --- MORUNGABA --- // Inicia a lista da cidade de Morungaba.
  { cidade: "Morungaba", localidade: "Central", lat: -22.8820, lon: -46.7930 }, // Endereço GPS da igreja Central de Morungaba.

  // --- CAMPO LIMPO PAULISTA (APENAS AS 15 REAIS E EM ORDEM ALFABÉTICA) --- // Seção exclusiva e afinada.
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do Iara (Atibaia)", lat: -23.2097, lon: -46.7019 }, // Coordenadas do Bairro do Iara.
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do Moinho", lat: -23.2485, lon: -46.7897 }, // Coordenadas do Bairro do Moinho.
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do pau Arcado", lat: -23.2241, lon: -46.7193 }, // Coordenadas do Pau Arcado.
  { cidade: "Campo Limpo Paulista", localidade: "Botujuru", lat: -23.2358, lon: -46.7681 }, // Coordenadas de Botujuru.
  { cidade: "Campo Limpo Paulista", localidade: "Colinas do Pontal", lat: -23.2245, lon: -46.7193 }, // Coordenadas do Colinas do Pontal.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Corcovado", lat: -23.1995, lon: -46.7745 }, // Coordenadas do Jd. Corcovado.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Laura", lat: -23.1781, lon: -46.7704 }, // Coordenadas do Jd. Laura.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Marajoara", lat: -23.1789, lon: -46.7863 }, // Coordenadas do Jd. Marajoara.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Marchetti", lat: -23.2067, lon: -46.7648 }, // Coordenadas do Jd. Marchetti.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Santo Antonio", lat: -23.2155, lon: -46.7639 }, // Coordenadas do Jd. Santo Antônio.
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Vera Regina", lat: -23.2169, lon: -46.7950 }, // Coordenadas do Jd. Vera Regina.
  { cidade: "Campo Limpo Paulista", localidade: "Parque Internacional", lat: -23.2098, lon: -46.7520 }, // Coordenadas do Pq. Internacional.
  { cidade: "Campo Limpo Paulista", localidade: "Vila Cardoso (Central)", lat: -23.2084, lon: -46.7852 }, // Coordenadas da Central de Campo Limpo.
  { cidade: "Campo Limpo Paulista", localidade: "Vila Chacrinha", lat: -23.2290, lon: -46.7715 }, // Coordenadas da Vila Chacrinha.
  { cidade: "Campo Limpo Paulista", localidade: "Vila Firenze", lat: -23.2463, lon: -46.7588 }, // Coordenadas da Vila Firenze.

  // --- VÁRZEA PAULISTA --- // Inicia a lista da cidade de Várzea Paulista.
  { cidade: "Várzea Paulista", localidade: "América", lat: -23.2212, lon: -46.8355 }, // Endereço GPS da igreja América.
  { cidade: "Várzea Paulista", localidade: "Jardim Paulista", lat: -23.2250, lon: -46.8150 }, // Endereço GPS da igreja Jd. Paulista.
  { cidade: "Várzea Paulista", localidade: "Cidade Nova", lat: -23.2355, lon: -46.8055 }, // Endereço GPS da igreja Cidade Nova.
  { cidade: "Várzea Paulista", localidade: "Vila Real", lat: -23.2080, lon: -46.8420 }, // Endereço GPS da igreja Vila Real.
  { cidade: "Várzea Paulista", localidade: "Jardim Promeca", lat: -23.2022, lon: -46.8155 }, // Endereço GPS da igreja Jd. Promeca.
  { cidade: "Várzea Paulista", localidade: "Central", lat: -23.2100, lon: -46.8270 }, // Endereço GPS da igreja Central de Várzea.

  // --- JUNDIAÍ --- // Inicia a lista da cidade de Jundiaí.
  { cidade: "Jundiaí", localidade: "Central", lat: -23.1857, lon: -46.8978 }, // Endereço GPS da igreja Central de Jundiaí.
  { cidade: "Jundiaí", localidade: "Vila Rio Branco", lat: -23.1722, lon: -46.8911 }, // Endereço GPS da igreja Vila Rio Branco.
  { cidade: "Jundiaí", localidade: "Jardim da Fonte", lat: -23.1788, lon: -46.8855 }, // Endereço GPS da igreja Jd. da Fonte.
  { cidade: "Jundiaí", localidade: "Vila Hortolândia", lat: -23.1655, lon: -46.9022 }, // Endereço GPS da igreja Vila Hortolândia.
  { cidade: "Jundiaí", localidade: "Jardim Tarumã", lat: -23.1650, lon: -46.8520 }, // Endereço GPS da igreja Jd. Tarumã.
  { cidade: "Jundiaí", localidade: "Cidade Santos Dumont", lat: -23.2012, lon: -46.8455 }, // Endereço GPS da igreja Santos Dumont.
  { cidade: "Jundiaí", localidade: "Engordadouro", lat: -23.1455, lon: -46.9122 }, // Endereço GPS da igreja Engordadouro.
  { cidade: "Jundiaí", localidade: "Parque da Represa", lat: -23.1588, lon: -46.8955 }, // Endereço GPS da igreja Pq. da Represa.
  { cidade: "Jundiaí", localidade: "Vila Rami", lat: -23.2122, lon: -46.8922 }, // Endereço GPS da igreja Vila Rami.
  { cidade: "Jundiaí", localidade: "Jardim Santa Gertrudes", lat: -23.2455, lon: -46.8655 }, // Endereço GPS da igreja Jd. Santa Gertrudes.
  { cidade: "Jundiaí", localidade: "Vila Maringá", lat: -23.2150, lon: -46.8750 }, // Endereço GPS da igreja Vila Maringá.
  { cidade: "Jundiaí", localidade: "Jardim do Lago", lat: -23.2288, lon: -46.8855 }, // Endereço GPS da igreja Jd. do Lago.
  { cidade: "Jundiaí", localidade: "Vila Progresso", lat: -23.2055, lon: -46.8912 }, // Endereço GPS da igreja Vila Progresso.
  { cidade: "Jundiaí", localidade: "Tulipas", lat: -23.1520, lon: -46.9850 }, // Endereço GPS da igreja Tulipas.
  { cidade: "Jundiaí", localidade: "Fazenda Grande", lat: -23.1580, lon: -46.9650 }, // Endereço GPS da igreja Fazenda Grande.
  { cidade: "Jundiaí", localidade: "Parque Eloy Chaves", lat: -23.1722, lon: -46.9755 }, // Endereço GPS da igreja Eloy Chaves.
  { cidade: "Jundiaí", localidade: "Varjão", lat: -23.1488, lon: -46.9555 }, // Endereço GPS da igreja Varjão.
  { cidade: "Jundiaí", localidade: "Medeiros", lat: -23.1855, lon: -46.9955 }, // Endereço GPS da igreja Medeiros.
  { cidade: "Jundiaí", localidade: "Caxambu", lat: -23.1350, lon: -46.8450 }, // Endereço GPS da igreja Caxambu.
  { cidade: "Jundiaí", localidade: "Roseira", lat: -23.1155, lon: -46.8322 }, // Endereço GPS da igreja Roseira.
  { cidade: "Jundiaí", localidade: "Jardim Pacaembu", lat: -23.1812, lon: -46.8655 }, // Endereço GPS da igreja Jd. Pacaembu.
  { cidade: "Jundiaí", localidade: "Vila Aparecida", lat: -23.1722, lon: -46.8788 }, // Endereço GPS da igreja Vila Aparecida.
  { cidade: "Jundiaí", localidade: "Ivoturucaia", lat: -23.1655, lon: -46.8122 }, // Endereço GPS da igreja Ivoturucaia.
  { cidade: "Jundiaí", localidade: "Almerinda Chaves", lat: -23.1511, lon: -46.9712 }, // Endereço GPS da igreja Almerinda Chaves.
  { cidade: "Jundiaí", localidade: "Champirra", lat: -23.1055, lon: -46.8612 }, // Endereço GPS da igreja Champirra.
  { cidade: "Jundiaí", localidade: "Colônia", lat: -23.1755, lon: -46.8555 }, // Endereço GPS da igreja Colônia.
  { cidade: "Jundiaí", localidade: "Vila Espéria", lat: -23.1888, lon: -46.8722 }, // Endereço GPS da igreja Vila Espéria.
  { cidade: "Jundiaí", localidade: "Vila Esperança", lat: -23.1922, lon: -46.8611 } // Endereço GPS da igreja Vila Esperança.
]; // Finaliza a lista técnica de coordenadas.

/**
 * Encontra as coordenadas de uma localidade específica. // Comentário da função de busca.
 * Utiliza a função normalizarTexto para garantir precisão no de/para. // Explicação da precisão.
 */
export const buscarCoordenadas = (cidade, localidade) => { // Inicia o "Maestro do GPS".
  const cNorm = normalizarTexto(cidade); // "Afina" o nome da cidade.
  const lNorm = normalizarTexto(localidade); // "Afina" o nome da localidade.

  const comum = LISTA_COMUNS_COORDENADAS.find(c => // Procura o local exato na lista acima.
    normalizarTexto(c.cidade).includes(cNorm) && normalizarTexto(c.localidade) === lNorm // Faz a comparação afinada.
  ); // Termina a busca.
  return comum ? { lat: comum.lat, lon: comum.lon } : null; // Se achou, entrega o GPS. Se não achou (null), ativa o Plano B.
}; // Fim da função.