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
    
    // PREPARAÇÃO DO "CRACHÁ" DIGITAL: Pega os dados reais do perfil.
    const nomeUsuario = user?.nome || user?.displayName || "Visitante Anônimo"; // Identifica o nome do irmão ou visitante.
    const cargoUsuario = user?.cargo || "Visitante"; // Identifica se é Secretário, Encarregado, etc.
    const cidadeOficial = user?.cidade || user?.cidadeDetectada || "Não Identificada"; // Prioriza a cidade do cadastro.
    const uidUsuario = user?.uid || "anonimo"; // Guarda o código único do usuário.

    await addDoc(collection(db, "telemetria_interacoes"), { // Abre a gaveta de telemetria no banco.
      categoria: categoria || "Geral", // Ex: 'Ensaios Locais' ou 'Navegação'.
      acao: acao || "Interação", // Ex: 'Clique Mapa' ou 'Troca de Módulo'.
      rotulo: rotulo || "Não Identificado", // Nome da igreja ou do botão clicado.
      usuarioNome: nomeUsuario, // Nome completo do irmão.
      usuarioCargo: cargoUsuario, // Cargo ministerial dele.
      usuarioCidade: cidadeOficial, // Cidade onde ele atua.
      usuarioUid: uidUsuario, // O código único dele no seu banco.
      cidadeIp: user?.cidadeDetectada || "N/A", // Deixa guardado também o que o IP disse.
      data: serverTimestamp(), // Pega a hora exata direto do relógio do Google.
      timestamp: new Date().toISOString(), // Guarda uma versão da data fácil de ler.
      mes: new Date().getMonth() + 1, // Guarda o mês para gráficos mensais.
      dia: new Date().getDate(), // Guarda o dia para gráficos diários.
      ano: new Date().getFullYear() // Guarda o ano para históricos.
    }); // Fecha o pacote de dados enviado ao Google.
  } catch (err) { // Caso a internet falhe ou o dado seja inválido.
    console.error("Falha na telemetria:", err); // Avisa o erro apenas no console técnico.
  } // Fim da proteção de erro.
}; // Fim da função de registro.

/**
 * REGISTRADOR DE PESQUISAS (O Termômetro de Interesse) // Grava o que os irmãos buscam.
 */
export const registrarPesquisa = async (termo, user = null) => { // Inicia o registro da busca.
  if (!termo || termo.length < 3) return; // Só grava se digitar pelo menos 3 letras.
  try { // Tenta gravar.
    const { db } = await import('../firebaseConfig'); // Conecta ao banco.
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore'); // Prepara ferramentas.

    await addDoc(collection(db, "telemetria_pesquisas"), { // Abre a gaveta de pesquisas.
      termo: termo.toUpperCase().trim(), // Salva a busca em letras grandes.
      usuarioNome: user?.nome || "Visitante Anônimo", // Quem buscou.
      usuarioCargo: user?.cargo || "Visitante", // Cargo de quem buscou.
      usuarioCidade: user?.cidade || "Não Identificada", // Origem da busca.
      data: serverTimestamp() // Hora oficial.
    }); // Envia os dados.
  } catch (err) { // Proteção de erro.
    console.error("Erro ao registrar pesquisa:", err); // Aviso técnico.
  } // Fim da proteção.
}; // Fim da função de busca.

/**
 * FUNÇÃO DE BUSCA GEOGRÁFICA (O Maestro do GPS) 
 * Em vez de coordenadas fixas, gera um link de pesquisa direta no Google Maps.
 * Formato: Congregação Cristã no Brasil - [Bairro] - [Cidade]
 */
export const buscarDirecaoNoMapa = (cidade, localidade) => { // Cria a função que gera o link do mapa.
  if (!cidade || !localidade) return "#"; // Se faltar dado, retorna um link vazio para não quebrar o app.
  
  // Monta a "partitura" de busca padronizada para o Google encontrar a igreja exata.
  const buscaPadrao = `Congregacao Crista no Brasil - ${localidade} - ${cidade}`; 
  
  // Transforma o texto em um formato que a internet entende (troca espaços por códigos).
  const queryFormatada = encodeURIComponent(buscaPadrao); 
  
  // Retorna o link oficial de busca do Google Maps.
  return `https://www.google.com/maps/search/?api=1&query=${queryFormatada}`; 
}; // Fim da função de geração de link.

/**
 * MANTEMOS A LISTA ABAIXO APENAS PARA LOCAIS QUE O GOOGLE NÃO ENCONTRA POR TEXTO.
 * Se a localidade estiver aqui, o App usará o ponto exato. Se não, usará a busca acima.
 */
export const LISTA_COMUNS_COORDENADAS = [ // Mantém a lista para compatibilidade e casos ultra-específicos.
  // Você pode apagar as que o Google já acha bem e deixar só as de difícil acesso.
  { cidade: "Cabreúva", localidade: "Bananal", lat: -23.3322, lon: -47.1555 },
  { cidade: "Jundiaí", localidade: "Central", lat: -23.1857, lon: -46.8978 }
]; // Fim da lista técnica.

/**
 * Maestro do GPS que decide entre a Coordenada Real ou a Busca por Texto.
 */
export const buscarCoordenadas = (cidade, localidade) => { // Inicia a verificação.
  const cNorm = normalizarTexto(cidade); // "Afina" o nome da cidade.
  const lNorm = normalizarTexto(localidade); // "Afina" o nome da localidade.

  // Tenta achar primeiro na lista de exceções (coordenadas fixas).
  const comum = LISTA_COMUNS_COORDENADAS.find(c => 
    normalizarTexto(c.cidade).includes(cNorm) && normalizarTexto(c.localidade) === lNorm 
  ); //
  
  // Se achou na lista, entrega a coordenada exata.
  if (comum) return { lat: comum.lat, lon: comum.lon }; //
  
  // Se NÃO achou na lista, o App usará a função 'buscarDirecaoNoMapa' definida acima.
  return null; 
}; // Fim da função.