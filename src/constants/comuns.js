// src/constants/comuns.js // Identifica que este é o arquivo de locais e funções compartilhadas.

/**
 * Função Única de Normalização para todo o App. // Nome da função que padroniza os textos.
 * Remove acentos, espaços extras e padroniza termos.
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

/**
 * REGISTRADOR DE TELEMETRIA IDENTIFICADA (O Olheiro da Orquestra) // Função vital para gravar os passos reais.
 * Esta função grava cada clique importante com os dados reais do perfil do usuário.
 */
export const registrarEvento = async (categoria, acao, rotulo, user = null) => { // Inicia o registro do movimento recebendo o 'user'.
  try { // Tenta realizar a gravação no banco de dados.
    const { db } = await import('../firebaseConfig'); // Busca a conexão oficial com o banco.
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore'); // Prepara as ferramentas de escrita.
    
    // PREPARAÇÃO DO "CRACHÁ" DIGITAL: Pega os dados reais do JSON que você me mostrou.
    const nomeUsuario = user?.nome || user?.displayName || "Visitante Anônimo"; // Identifica o nome do irmão ou visitante.
    const cargoUsuario = user?.cargo || "Visitante"; // Identifica se é Secretário, Encarregado, etc.
    const cidadeOficial = user?.cidade || user?.cidadeDetectada || "Não Identificada"; // Prioriza a cidade do cadastro.
    const uidUsuario = user?.uid || "anonimo"; // Guarda o código '2ioPF3...' para sabermos que é a mesma pessoa.

    await addDoc(collection(db, "telemetria_interacoes"), { // Abre a gaveta de telemetria no banco.
      categoria: categoria || "Geral", // Ex: 'Ensaios Locais' ou 'Navegação'.
      acao: acao || "Interação",      // Ex: 'Clique Mapa' ou 'Troca de Módulo'.
      rotulo: rotulo || "Não Identificado",    // Nome da igreja ou do botão clicado.
      
      // DADOS IDENTIFICADOS (PARA CONSULTA PERIÓDICA)
      usuarioNome: nomeUsuario, // Nome completo do irmão.
      usuarioCargo: cargoUsuario, // Cargo ministerial dele.
      usuarioCidade: cidadeOficial, // Cidade onde ele atua.
      usuarioUid: uidUsuario, // O código único dele no seu banco.
      
      cidadeIp: user?.cidadeDetectada || "N/A", // Deixa guardado também o que o IP disse.
      data: serverTimestamp(), // Pega a hora exata direto do relógio do Google.
      timestamp: new Date().toISOString(), // Guarda uma versão da data fácil de ler em relatórios.
      mes: new Date().getMonth() + 1, // Guarda o mês para gráficos mensais (1 a 12).
      dia: new Date().getDate(), // Guarda o dia para gráficos diários.
      ano: new Date().getFullYear() // Guarda o ano para históricos de longo prazo.
    }); // Fecha o pacote de dados enviado ao Google.
  } catch (err) { // Caso a internet falhe ou o dado seja inválido.
    console.error("Falha na telemetria:", err); // Avisa o erro apenas para o técnico no console.
  } // Fim da proteção de erro.
}; // Fim da função de registro de cliques identificados.

/**
 * REGISTRADOR DE PESQUISAS (O Termômetro de Interesse)
 * Grava o que os irmãos estão digitando com identificação de quem buscou.
 */
export const registrarPesquisa = async (termo, user = null) => { // Inicia o registro da busca.
  if (!termo || termo.length < 3) return; // Só grava se o irmão digitar pelo menos 3 letras.
  try { // Tenta gravar.
    const { db } = await import('../firebaseConfig'); // Conecta ao banco.
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore'); // Prepara ferramentas.

    await addDoc(collection(db, "telemetria_pesquisas"), { // Abre a gaveta de pesquisas.
      termo: termo.toUpperCase().trim(), // Salva o que foi buscado em letras grandes.
      usuarioNome: user?.nome || "Visitante Anônimo", // Quem buscou.
      usuarioCargo: user?.cargo || "Visitante", // Cargo de quem buscou.
      usuarioCidade: user?.cidade || "Não Identificada", // Origem da busca.
      data: serverTimestamp() // Hora oficial.
    }); // Envia os dados.
  } catch (err) { // Proteção de erro.
    console.error("Erro ao registrar pesquisa:", err); // Aviso técnico.
  } // Fim da proteção.
}; // Fim da função de busca.

export const LISTA_COMUNS_COORDENADAS = [ // Inicia o banco de endereços precisos (Latitude e Longitude).
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
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do Iara (Atibaia)", lat: -23.2097, lon: -46.7019 },
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do Moinho", lat: -23.2485, lon: -46.7897 },
  { cidade: "Campo Limpo Paulista", localidade: "Bairro do pau Arcado", lat: -23.2241, lon: -46.7193 },
  { cidade: "Campo Limpo Paulista", localidade: "Botujuru", lat: -23.2358, lon: -46.7681 },
  { cidade: "Campo Limpo Paulista", localidade: "Colinas do Pontal", lat: -23.2245, lon: -46.7193 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Corcovado", lat: -23.1995, lon: -46.7745 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Laura", lat: -23.1781, lon: -46.7704 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Marajoara", lat: -23.1789, lon: -46.7863 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Marchetti", lat: -23.2067, lon: -46.7648 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Santo Antonio", lat: -23.2155, lon: -46.7639 },
  { cidade: "Campo Limpo Paulista", localidade: "Jardim Vera Regina", lat: -23.2169, lon: -46.7950 },
  { cidade: "Campo Limpo Paulista", localidade: "Parque Internacional", lat: -23.2098, lon: -46.7520 },
  { cidade: "Campo Limpo Paulista", localidade: "Vila Cardoso (Central)", lat: -23.2084, lon: -46.7852 },
  { cidade: "Campo Limpo Paulista", localidade: "Vila Chacrinha", lat: -23.2290, lon: -46.7715 },
  { cidade: "Campo Limpo Paulista", localidade: "Vila Firenze", lat: -23.2463, lon: -46.7588 },

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
]; // Finaliza a lista técnica de coordenadas.

/**
 * Encontra as coordenadas de uma localidade específica.
 */
export const buscarCoordenadas = (cidade, localidade) => { // Inicia o "Maestro do GPS".
  const cNorm = normalizarTexto(cidade); // "Afina" o nome da cidade.
  const lNorm = normalizarTexto(localidade); // "Afina" o nome da localidade.

  const comum = LISTA_COMUNS_COORDENADAS.find(c => // Procura o local exato na lista acima.
    normalizarTexto(c.cidade).includes(cNorm) && normalizarTexto(c.localidade) === lNorm // Faz a comparação afinada.
  ); // Termina a busca.
  return comum ? { lat: comum.lat, lon: comum.lon } : null; // Se achou, entrega o GPS.
}; // Fim da função.