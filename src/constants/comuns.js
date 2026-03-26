// src/constants/comuns.js // Identifica que este é o arquivo de locais e funções compartilhadas.

import { db } from '../firebaseConfig'; // Conecta com o banco de dados oficial da Regional.
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Prepara as ferramentas de escrita do Google.

/**
 * Função Única de Normalização para todo o App. // Nome da função que padroniza os textos.
 * Remove acentos, espaços extras e padroniza termos.
 */
export const normalizarTexto = (t) => { // Cria a função "afinadora" de palavras para evitar duplicados.
  if (!t) return ""; // Se o campo estiver vazio, retorna nada para não travar o sistema.
  return t // Começa a transformar o texto original enviado pelo usuário.
    .toUpperCase() // Deixa tudo em letra MAIÚSCULA para o banco não diferenciar 'Jundiaí' de 'jundiaí'.
    .normalize("NFD") // Desmonta os acentos (faz o sistema entender que 'á' é apenas um 'a' com marcação).
    .replace(/[\u0300-\u036f]/g, "") // Remove fisicamente os acentos para facilitar buscas.
    .replace(/\bPAULISTA\b/g, "") // Tira a palavra "PAULISTA" para encurtar nomes de cidades no gráfico.
    .replace(/\bPTA\b/g, "") // Tira a abreviação "PTA" para padronizar o ranking territorial.
    .replace(/\s+/g, "") // Arranca todos os espaços para transformar em uma "chave" única de texto.
    .trim(); // Limpa espaços invisíveis que sobram nas pontas.
}; // Fecha a lógica da função afinadora.

/**
 * REGISTRADOR DE ACESSOS (O Porteiro da Orquestra) // NOVO: Alimenta os gráficos de Acessos Diários e Anuais.
 * Esta função anota cada vez que o link do aplicativo é carregado.
 */
export const registrarAcesso = async (userData, cidadeDetectada) => { // Inicia o sensor de entrada no App.
  try { // Tenta gravar a informação no banco de dados.
    const hoje = new Date(); // Pega o relógio interno do dispositivo.
    const colecaoAcessos = collection(db, "telemetria_acessos"); // Aponta para a gaveta de estatísticas de audiência.

    await addDoc(colecaoAcessos, { // Cria uma nova ficha de acesso com os seguintes dados:
      usuarioNome: userData?.nome || "Visitante", // Identifica se é um colaborador ou alguém de fora.
      usuarioCidade: userData?.cidade || cidadeDetectada || "Não Identificada", // Pega a cidade do perfil ou do IP.
      cidade: normalizarTexto(userData?.cidade || cidadeDetectada || "OUTRA"), // Salva a cidade "limpa" para o gráfico.
      dia: hoje.getDate(), // Guarda o número do dia (ex: 26).
      mes: hoje.getMonth() + 1, // Guarda o mês (ex: 3 para Março).
      ano: hoje.getFullYear(), // Guarda o ano (ex: 2026).
      data: serverTimestamp(), // Pega o horário oficial direto do satélite do Google (Auditoria).
      tipo: "Entrada no App" // Define que este log é uma abertura do sistema.
    }); // Fim da ficha.
  } catch (e) { // Se a internet cair ou houver erro...
    console.error("Falha ao registrar acesso único:", e); // Avisa o erro apenas no console técnico.
  } // Fim da proteção de erro.
}; // Fecha a função do Porteiro.

/**
 * REGISTRADOR DE TELEMETRIA DE INTERAÇÃO (O Olheiro da Orquestra) // Função que grava cliques em botões.
 */
export const registrarEvento = async (categoria, acao, rotulo, user = null) => { // Registra movimentos como cliques em mapas ou contatos.
  try { // Tenta realizar a gravação.
    // PREPARAÇÃO DO "CRACHÁ" DIGITAL: Pega os dados reais do perfil para saber quem usou qual ferramenta.
    const nomeUsuario = user?.nome || user?.displayName || "Visitante Anônimo"; // Identifica o irmão ou visitante.
    const cargoUsuario = user?.cargo || "Visitante"; // Identifica o cargo ministerial.
    const cidadeOficial = user?.cidade || user?.cidadeDetectada || "Não Identificada"; // Prioriza cidade do cadastro.
    const uidUsuario = user?.uid || "anonimo"; // Código de segurança do usuário.

    await addDoc(collection(db, "telemetria_interacoes"), { // Abre a gaveta de cliques no banco.
      categoria: categoria || "Geral", // Ex: 'Ensaios Locais' ou 'Navegação'.
      acao: acao || "Interação", // Ex: 'Clique Mapa' ou 'Troca de Módulo'.
      rotulo: rotulo || "Não Identificado", // Nome da igreja ou do botão que recebeu o toque.
      usuarioNome: nomeUsuario, // Nome que aparecerá no Dashboard de Zelo.
      usuarioCargo: cargoUsuario, // Cargo para filtros de uso por função.
      usuarioCidade: cidadeOficial, // Cidade para o mapa de calor de cliques.
      usuarioUid: uidUsuario, // O código único no banco de dados.
      cidadeIp: user?.cidadeDetectada || "N/A", // Registro extra baseado na internet do usuário.
      data: serverTimestamp(), // Hora oficial do servidor do Google.
      timestamp: new Date().toISOString(), // Data em formato de texto para conferência rápida.
      mes: new Date().getMonth() + 1, // Mês para separação em relatórios.
      dia: new Date().getDate(), // Dia para monitorar picos de interesse.
      ano: new Date().getFullYear() // Ano para histórico de longo prazo.
    }); // Fecha o pacote de cliques enviado.
  } catch (err) { // Caso ocorra falha técnica.
    console.error("Falha na telemetria de cliques:", err); // Log técnico de erro.
  } // Fim da proteção.
}; // Fecha a função do Olheiro.

/**
 * REGISTRADOR DE PESQUISAS (O Termômetro de Interesse) // Grava o que a irmandade digita na busca.
 */
export const registrarPesquisa = async (termo, user = null) => { // Inicia o registro da barra de busca.
  if (!termo || termo.length < 3) return; // Só anota se o irmão digitar mais que 3 letras para evitar lixo no banco.
  try { // Tenta enviar a pesquisa ao banco.
    await addDoc(collection(db, "telemetria_pesquisas"), { // Abre a gaveta de termos pesquisados.
      termo: termo.toUpperCase().trim(), // Salva o texto em letras grandes para agrupar resultados iguais.
      usuarioNome: user?.nome || "Visitante Anônimo", // Quem está procurando.
      usuarioCargo: user?.cargo || "Visitante", // Função de quem buscou.
      usuarioCidade: user?.cidade || "Não Identificada", // De onde veio a dúvida.
      data: serverTimestamp() // Momento exato da busca.
    }); // Finaliza o envio.
  } catch (err) { // Se falhar...
    console.error("Erro ao registrar termo pesquisado:", err); // Log técnico.
  } // Fim da proteção.
}; // Fecha a função do Termômetro.

/**
 * FUNÇÃO DE BUSCA GEOGRÁFICA (O Maestro do GPS) 
 * Gera um link de pesquisa inteligente para o Google Maps encontrar a igreja sem erro.
 */
export const buscarDirecaoNoMapa = (cidade, localidade) => { // Gera o link que abre o GPS no celular.
  if (!cidade || !localidade) return "#"; // Se o dado estiver incompleto, retorna um link morto para segurança.
  
  // Monta a frase de busca que o Google Maps entende perfeitamente: 'Congregação Cristã no Brasil - Bairro - Cidade'.
  const buscaPadrao = `Congregacao Crista no Brasil - ${localidade} - ${cidade}`; 
  
  // Transforma espaços e símbolos em código que o navegador entende (ex: espaço vira %20).
  const queryFormatada = encodeURIComponent(buscaPadrao); 
  
  // Retorna o endereço oficial de busca do Google Maps corrigido para uso mobile.
  return `https://www.google.com/maps/search/?api=1&query=${queryFormatada}`; 
}; // Fecha o gerador de GPS.

/**
 * LISTA TÉCNICA DE COORDENADAS FIXAS (Exceções de Localização)
 * Usada apenas para igrejas onde a busca por texto do Google falha.
 */
export const LISTA_COMUNS_COORDENADAS = [ // Mantém pontos exatos de Latitude e Longitude para casos difíceis.
  { cidade: "Cabreúva", localidade: "Bananal", lat: -23.3322, lon: -47.1555 },
  { cidade: "Jundiaí", localidade: "Central", lat: -23.1857, lon: -46.8978 }
]; // Fim da lista técnica.

/**
 * BUSCA DE COORDENADAS: Decide se usa o ponto exato da lista acima ou a busca por texto.
 */
export const buscarCoordenadas = (cidade, localidade) => { // Inicia o processo de decisão do GPS.
  const cNorm = normalizarTexto(cidade); // Limpa o nome da cidade.
  const lNorm = normalizarTexto(localidade); // Limpa o nome da Comum.

  // Procura primeiro se essa igreja está na nossa lista de coordenadas fixas (casos especiais).
  const comum = LISTA_COMUNS_COORDENADAS.find(c => 
    normalizarTexto(c.cidade).includes(cNorm) && normalizarTexto(c.localidade) === lNorm 
  ); 
  
  // Se encontrar na lista de exceções, entrega o mapa exato (pin fixo).
  if (comum) return { lat: comum.lat, lon: comum.lon }; 
  
  // Se NÃO estiver na lista, o App usará automaticamente a busca por texto 'buscarDirecaoNoMapa'.
  return null; 
}; // Fim do seletor de coordenadas.