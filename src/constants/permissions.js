// src/constants/permissions.js // Localização do arquivo no projeto para o sistema se encontrar.
import { normalizarTexto } from './comuns'; // Importa a função que "afina" os nomes das cidades, tirando acentos e padronizando abreviações.

/** // Início do comentário de documentação técnica.
 * Este arquivo centraliza todas as regras de acesso do sistema. // Define que as leis do App moram aqui.
 * Ele protege o App garantindo que cada irmão acesse apenas o que lhe compete. // Proteção contra acessos indevidos.
 */ // Fim do comentário.

// 🛠️ LISTA ÚNICA: Cargos oficiais para aparecerem nos formulários de cadastro.
export const LISTA_CARGOS_OFICIAL = [ // Inicia a lista de cargos que o sistema reconhece.
  "Encarregado Regional", // Irmão da banca regional.
  "Encarregado Local", // Irmão que cuida do ensaio da comum.
  "Examinadora", // Irmã responsável pelas organistas.
  "Instrutor", // Irmão que ensina novos músicos.
  "Organista", // Irmã que serve no órgão.
  "Ancião", // Liderança espiritual da irmandade.
  "Secretário da Música Regional", // O administrador com visão total.
  "Secretário da Música Cidade" // O administrador focado em uma cidade.
]; // Fim da lista oficial de cargos.

// 1. Definição dos cargos para lógica interna do sistema.
export const CARGOS = { // Objeto usado para o sistema comparar cargos sem erros de texto.
  REGIONAL: "Secretário da Música Regional", // Define o nome exato do cargo de autoridade máxima.
  ANCIAO: "Ancião", // Nome exato para identificar os anciães.
  ENC_REGIONAL: "Encarregado Regional", // Nome exato para identificar a banca regional.
  EXAMINADORA: "Examinadora", // Nome exato para identificar as examinadoras.
  SEC_CIDADE: "Secretário da Música Cidade" // Nome exato para o administrador local.
}; // Fim da lista para lógica.

/** // Início do comentário explicativo.
 * 2. Motor de Identificação de Nível // O "Crachá Virtual".
 * Esta função decide se o usuário tem poder total ou limitado.
 */ // Fim do comentário.
export const obterNivelAcesso = (usuario) => { // Função que analisa quem está logado no momento.
  if (!usuario) return 'visitante'; // Se não estiver logado, é apenas alguém assistindo (visitante).
  
  // REGRA DE OURO: Secretário Regional ou usuário marcado como 'master' no banco vira Maestro.
  if (usuario.cargo === CARGOS.REGIONAL || usuario.nivel === 'master') { // Checa se o usuário é o Maestro Regional.
    return 'master'; // Concede acesso total ao sistema.
  } // Fecha a trava do Master.
  
  return 'editor'; // Para os demais cargos, concede apenas o direito de sugerir mudanças (Editor).
}; // Fecha a função de análise de nível.

/** // Início do comentário explicativo.
 * 3. Função de Identificação da Comissão Musical // NOVO DISTINTIVO.
 * Checa se o irmão tem permissão para ver conteúdos administrativos (Reuniões/Dash).
 */ // Fim do comentário.
export const isComissao = (usuario) => { // Função que verifica se o usuário tem o fleg de comissão.
  if (!usuario) return false; // Se não estiver logado, não é da comissão.
  const nivel = obterNivelAcesso(usuario); // Verifica o nível básico dele.
  return nivel === 'master' || usuario.isComissao === true; // É da comissão se for Master OU se tiver o fleg "isComissao" no banco.
}; // Fim da verificação da comissão.

/** // Início do comentário explicativo.
 * 4. Tabela de Permissões por Nível // O que cada porta libera.
 * Define tecnicamente o que cada tipo de usuário vê na tela.
 */ // Fim do comentário.
export const REGRAS = { // Objeto que guarda as chaves de cada funcionalidade.
  master: { // Regras para o Maestro do Sistema.
    podeGerenciarUsuarios: true, // Pode aprovar, bloquear ou editar outros usuários.
    podeEditarTudo: true, // Pode alterar dados de qualquer igreja em qualquer cidade.
    podeAdicionarTudo: true, // Pode cadastrar novos ensaios em qualquer lugar.
    podeExcluirDireto: true, // Pode apagar dados sem passar por revisão.
    tipoAcao: 'direta' // O que ele faz é salvo instantaneamente.
  }, // Fim das regras do Master.
  editor: { // Regras para os Secretários e Examinadoras locais.
    podeGerenciarUsuarios: false, // Não tem permissão para mexer no cadastro de outros irmãos.
    podeEditarTudo: false, // Não altera o banco direto; cria uma "Sugestão de Mudança".
    podeAdicionarTudo: false, // Novos cadastros precisam de aprovação do Regional.
    podeExcluirDireto: false, // Não apaga nada sem o aval do Master.
    tipoAcao: 'sugestao' // Tudo o que ele faz entra numa fila de conferência.
  }, // Fim das regras do Editor.
  visitante: { // Regras para o público em geral.
    podeGerenciarUsuarios: false, // Bloqueado.
    podeEditarTudo: false, // Bloqueado (não vê o lápis).
    podeAdicionarTudo: false, // Bloqueado (não vê o botão +).
    podeExcluirDireto: false, // Bloqueado (não vê a lixeira).
    tipoAcao: 'bloqueado' // Apenas visualiza informações públicas.
  } // Fim das regras do Visitante.
}; // Fim da tabela de regras.

/** // Início do comentário explicativo.
 * 5. Acesso à Sala de Estatísticas (Dashboard).
 * Regra: Somente Liderança Regional ou Membros da Comissão visualizam os gráficos.
 */ // Fim do comentário.
export const temAcessoAoDashboard = (usuario) => { // Função que decide quem vê a tela de gráficos.
  if (!usuario) return false; // Se não houver login, o acesso é negado.
  
  // REGRA AMPLIADA: Entra se for Master, Comissão, ou tiver cargos de alta gestão.
  return ( // Início da verificação.
    isMaster(usuario) || // Maestros sempre entram.
    isComissao(usuario) || // Integrantes da comissão ganham acesso total aos dados.
    usuario.cargo === CARGOS.ANCIAO || // Anciães têm acesso aos dados da região.
    usuario.cargo === CARGOS.ENC_REGIONAL // Encarregados Regionais também visualizam estatísticas.
  ); // Retorna verdadeiro se um dos critérios for atendido.
}; // Fim da função de acesso ao Dashboard.

/** // Início do comentário explicativo.
 * 6. Validador de Territorialidade // A "Cerca por Cidade".
 * Garante que cada colaborador cuide apenas da sua própria área de atuação.
 */ // Fim do comentário.
export const podeVerBotoesDeGestao = (usuario, cidadeDoCard) => { // Função que mostra ou esconde botões de edição.
  const nivel = obterNivelAcesso(usuario); // Descobre o cargo técnico do usuário.
  
  if (nivel === 'master') return true; // O Maestro Regional vê os botões em todas as cidades.
  if (!usuario || nivel === 'visitante') return false; // Visitantes nunca veem botões de edição.
  
  // Usa a normalização para ignorar erros como 'Várzea Paulista' vs 'Varzea Pta'.
  const minhaCidadeLimpa = normalizarTexto(usuario.cidade || ""); // Pega a cidade do cadastro do usuário e a "afina".
  const cidadeDoCardLimpa = normalizarTexto(cidadeDoCard || ""); // Pega a cidade que está no ensaio e a "afina".
  
  return minhaCidadeLimpa === cidadeDoCardLimpa; // Só libera o lápis se o usuário pertencer àquela cidade.
}; // Fim da regra de territorialidade.

/** // Início do comentário explicativo.
 * 7. Atalhos para o Programador.
 */ // Fim do comentário.
export const isMaster = (usuario) => obterNivelAcesso(usuario) === 'master'; // Atalho rápido para checar se é o Maestro.
export const isLogado = (usuario) => !!usuario; // Atalho rápido para saber se o usuário está logado.