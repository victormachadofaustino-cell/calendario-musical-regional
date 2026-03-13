// src/constants/permissions.js // Localização do arquivo no projeto para o sistema se encontrar.

/** // Início do comentário de documentação técnica.
 * Este arquivo centraliza todas as regras de acesso do sistema. // Define o objetivo: ser o único lugar de regras.
 * Ele protege o App garantindo que cada irmão acesse apenas o que lhe compete. // Explica o valor para a Regional.
 */ // Fim do comentário.

// 1. Definição estrita dos cargos que o sistema reconhece // Organização dos nomes oficiais.
export const CARGOS = { // Lista oficial de cargos que o banco de dados pode conter.
  REGIONAL: "Secretário da Música Regional", // Cargo máximo: o Maestro com controle total.
  ANCIAO: "Ancião", // Cargo de liderança: vê gráficos, mas não mexe na configuração técnica.
  ENC_REGIONAL: "Encarregado Regional", // Cargo de liderança: tem acesso à sala de estatísticas (Dashboard).
  EXAMINADORA: "Examinadora", // Cargo operacional: cuida dos contatos da sua cidade.
  SEC_CIDADE: "Secretário da Música Cidade" // Cargo operacional: focado na zeladoria da sua sede.
}; // Fim da lista de cargos.

/** // Início do comentário explicativo.
 * 2. Motor de Identificação de Nível // O "Cérebro" que reconhece o crachá do usuário.
 * Esta função decide se o usuário é um 'Master' ou um 'Editor'. // Explica a separação de poderes.
 */ // Fim do comentário.
export const obterNivelAcesso = (usuario) => { // Função que analisa o perfil de quem logou.
  if (!usuario) return 'visitante'; // Se não houver login, o sistema o trata como alguém da plateia (visitante).
  
  // REGRA DE OURO: Secretário Regional ou fleg de 'master' no banco ganha poder total.
  if (usuario.cargo === CARGOS.REGIONAL || usuario.nivel === 'master') { // Verifica se é o cargo de Maestro Regional.
    return 'master'; // Retorna o nível de autoridade máxima.
  } // Fecha a verificação de Master.
  
  return 'editor'; // Para todos os outros cargos oficiais, define como um colaborador restrito (Editor).
}; // Fecha a função de nível de acesso.

/** // Início do comentário explicativo.
 * 3. Tabela de Permissões por Nível // Define o que cada "crachá" libera na tela.
 * Define o que aparece na tela para cada tipo de usuário de forma técnica. // Propósito da tabela.
 */ // Fim do comentário.
export const REGRAS = { // Objeto que guarda as chaves de cada porta do App.
  master: { // Regras para o Maestro (Master).
    podeGerenciarUsuarios: true, // Pode aprovar novos irmãos ou remover quem saiu do cargo.
    podeEditarTudo: true, // Vê botões de edição em qualquer cidade da Regional.
    podeAdicionarTudo: true, // Pode criar novos ensaios em qualquer lugar.
    podeExcluirDireto: true, // Pode apagar um erro no banco sem pedir permissão.
    tipoAcao: 'direta' // O que ele faz, salva na hora no banco oficial.
  }, // Fim das regras de Master.
  editor: { // Regras para os Músicos/Secretários (Editores).
    podeGerenciarUsuarios: false, // Não pode mexer no cadastro de outros irmãos.
    podeEditarTudo: false, // Não edita direto; o botão de salvar vira um botão de "Sugerir".
    podeAdicionarTudo: false, // Criação de novos itens passa pela triagem do Master.
    podeExcluirDireto: false, // Se quiser apagar algo, o Master precisa autorizar.
    tipoAcao: 'sugestao' // Tudo o que ele faz entra na "Fila de Fomentos" para o Master conferir.
  }, // Fim das regras de Editor.
  visitante: { // Regras para a Plateia (Visitante não logado).
    podeGerenciarUsuarios: false, // Não vê nomes nem cargos de ninguém.
    podeEditarTudo: false, // Não vê lápis de edição.
    podeAdicionarTudo: false, // Não vê botão de sinal de mais (+).
    podeExcluirDireto: false, // Não vê ícone de lixeira.
    tipoAcao: 'bloqueado' // Apenas observa as informações públicas.
  } // Fim das regras de Visitante.
}; // Fim do objeto de regras.

/** // Início do comentário explicativo.
 * 4. Verificação de Acesso ao Dashboard // A "Sala de Comando" da Regional.
 * Regra: Apenas Master, Ancião e Encarregado Regional visualizam gráficos. // Privacidade de dados.
 */ // Fim do comentário.
export const temAcessoAoDashboard = (usuario) => { // Função que decide se o botão de Dashboard aparece.
  if (!usuario) return false; // Visitante nunca entra na sala de gráficos.
  
  const nivel = obterNivelAcesso(usuario); // Descobre o nível técnico (master ou editor).
  
  // Condição para entrar: Ser Master OU ter cargo de liderança regional.
  return ( // Início da validação de acesso.
    nivel === 'master' || // Se for o dono do sistema.
    usuario.cargo === CARGOS.ANCIAO || // Se for um Ancião.
    usuario.cargo === CARGOS.ENC_REGIONAL // Se for um Encarregado Regional.
  ); // Retorna 'sim' se o usuário preencher qualquer um desses requisitos.
}; // Fecha a função do Dashboard.

/** // Início do comentário explicativo.
 * 5. Validador de Territorialidade // A "Cerca Eletrônica" por cidade.
 * Garante que um colaborador de Jundiaí não sugira mudanças em Itatiba. // Proteção contra erros geográficos.
 */ // Fim do comentário.
export const podeVerBotoesDeGestao = (usuario, cidadeDoCard) => { // Decide se mostra o Lápis/Lixo nos cards de ensaio.
  const nivel = obterNivelAcesso(usuario); // Identifica se é Master ou Editor.
  
  if (nivel === 'master') return true; // O Master é onipresente: vê e edita todas as cidades.
  if (!usuario || nivel === 'visitante') return false; // Visitante nunca vê botões de gestão.
  
  const minhaCidade = normalizarTexto(usuario.cidade); // Pega a cidade do músico e limpa o texto.
  const cidadeAlvo = normalizarTexto(cidadeDoCard); // Pega a cidade do evento e limpa o texto.
  
  return minhaCidade === cidadeAlvo; // Só libera o botão se o músico pertencer àquela cidade específica.
}; // Fecha a função de territorialidade.

/** // Início do comentário explicativo.
 * 6. Atalhos Rápidos // Facilita a escrita do código em outras partes do App.
 */ // Fim do comentário.
export const isMaster = (usuario) => obterNivelAcesso(usuario) === 'master'; // Atalho para perguntar: "É o Maestro?".
export const isLogado = (usuario) => !!usuario; // Atalho para perguntar: "Alguém entrou no sistema?".