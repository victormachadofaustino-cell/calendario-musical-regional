// src/constants/permissions.js // Localização do arquivo no projeto.

/** // Início do comentário de documentação.
 * Este arquivo centraliza todas as regras de acesso do sistema. // Define o objetivo do arquivo.
 * Ele protege o App garantindo que cada irmão acesse apenas o que lhe compete. // Explica a utilidade para o negócio.
 */ // Fim do comentário.

// 1. Definição estrita dos cargos que o sistema reconhece // Comentário organizador.
export const CARGOS = { // Lista oficial de cargos aceitos pelo sistema.
  REGIONAL: "Secretário da Música Regional", // Cargo com poder administrativo total e mestre.
  ANCIAO: "Ancião", // Cargo de liderança com acesso ao Dashboard.
  ENC_REGIONAL: "Encarregado Regional", // Cargo de liderança com acesso ao Dashboard.
  EXAMINADORA: "Examinadora", // Cargo operacional focado na cidade.
  SEC_CIDADE: "Secretário da Música Cidade" // Cargo operacional focado na cidade.
}; // Fim da lista de cargos.

/** // Início do comentário explicativo.
 * 2. Motor de Identificação de Nível // Título da seção.
 * Esta função decide se o usuário é um 'Mestre' ou um 'Colaborador de Cidade'. // Explica a lógica de separação.
 */ // Fim do comentário.
export const obterNivelAcesso = (usuario) => { // Função que analisa quem é o usuário logado.
  if (!usuario) return 'visitante'; // Se não houver ninguém logado, define como visitante comum.
  
  // REGRA DE OURO: Secretário Regional sempre entra como Master técnico // Comentário de regra de negócio.
  if (usuario.cargo === CARGOS.REGIONAL || usuario.nivel === 'master') { // Verifica se é o cargo de Secretário Regional.
    return 'master'; // Retorna o nível de controle total.
  } // Fecha a verificação de Master.
  
  return 'editor'; // Para todos os outros cargos logados, define como editor restrito.
}; // Fecha a função de nível de acesso.

/** // Início do comentário explicativo.
 * 3. Tabela de Permissões por Nível // Título da seção.
 * Define o que aparece na tela para cada tipo de usuário de forma técnica. // Explica o propósito.
 */ // Fim do comentário.
export const REGRAS = { // Objeto que guarda as permissões de cada nível.
  master: { // Regras para quem é Mestre.
    podeGerenciarUsuarios: true, // Autoriza o mestre a aprovar ou remover usuários.
    podeEditarTudo: true, // Mostra botões de edição em todos os lugares.
    podeAdicionarTudo: true, // Mostra botões de "Novo Evento" em todos os lugares.
    podeExcluirDireto: true, // Permite apagar dados sem pedir aprovação a ninguém.
    tipoAcao: 'direta' // Define que as mudanças salvam na hora no banco de dados.
  }, // Fim das regras de Master.
  editor: { // Regras para cargos como Ancião, Encarregados de Cidade, etc.
    podeGerenciarUsuarios: false, // Impede que eles mexam nas contas de outros irmãos.
    podeEditarTudo: false, // Bloqueia a edição direta; os botões dependem da cidade.
    podeAdicionarTudo: false, // Bloqueia a adição direta para evitar lixo no banco.
    podeExcluirDireto: false, // Impede que apaguem dados oficiais diretamente.
    tipoAcao: 'sugestao' // Define que tudo o que fizerem precisa ser aprovado pelo Master.
  }, // Fim das regras de Editor.
  visitante: { // Regras para quem apenas baixou o app e não logou.
    podeGerenciarUsuarios: false, // Visitante não vê quem são os usuários.
    podeEditarTudo: false, // Visitante não vê botões de editar.
    podeAdicionarTudo: false, // Visitante não vê botões de adicionar.
    podeExcluirDireto: false, // Visitante não vê botões de excluir.
    tipoAcao: 'bloqueado' // Define que o visitante só pode ler as informações.
  } // Fim das regras de Visitante.
}; // Fim do objeto de regras.

/** // Início do comentário explicativo.
 * 4. Verificação de Acesso ao Dashboard // Título da seção.
 * Regra: Apenas Master, Ancião e Encarregado Regional visualizam gráficos. // Explica a nova regra solicitada.
 */ // Fim do comentário.
export const temAcessoAoDashboard = (usuario) => { // Função que decide se mostra o botão de Dashboard.
  if (!usuario) return false; // Se não estiver logado, o acesso é negado.
  
  const nivel = obterNivelAcesso(usuario); // Pega o nível técnico (master ou editor).
  
  // Liberado se for Master OU se o cargo for Ancião OU se o cargo for Encarregado Regional // Explicação da lógica.
  return ( // Início da validação múltipla.
    nivel === 'master' || // Verifica se é o administrador do sistema.
    usuario.cargo === CARGOS.ANCIAO || // Verifica se é um Ancião.
    usuario.cargo === CARGOS.ENC_REGIONAL // Verifica se é um Encarregado Regional.
  ); // Retorna 'sim' se qualquer uma das condições for verdadeira.
}; // Fecha a função do Dashboard.

/** // Início do comentário explicativo.
 * 5. Validador de Territorialidade // Título da seção.
 * Garante que um colaborador de Jundiaí não sugira mudanças em Itatiba. // Explica a trava de segurança.
 */ // Fim do comentário.
export const podeVerBotoesDeGestao = (usuario, cidadeDoCard) => { // Função que mostra botões de Editar/Excluir nos cards.
  const nivel = obterNivelAcesso(usuario); // Identifica se é Master ou Editor.
  
  if (nivel === 'master') return true; // Se for o mestre, ele vê os botões em todos os cards do app.
  if (!usuario || nivel === 'visitante') return false; // Se for visitante, nunca verá botões de edição.
  
  const minhaCidade = usuario.cidade?.toUpperCase().trim(); // Pega a cidade cadastrada no perfil do usuário.
  const cidadeAlvo = cidadeDoCard?.toUpperCase().trim(); // Pega a cidade que está escrita no card do ensaio.
  
  return minhaCidade === cidadeAlvo; // Só mostra o botão de editar se a cidade do usuário for a mesma do ensaio.
}; // Fecha a função de territorialidade.

/** // Início do comentário explicativo.
 * 6. Atalhos Úteis // Título da seção.
 * Pequenas funções para facilitar o uso no restante do código. // Explica a utilidade.
 */ // Fim do comentário.
export const isMaster = (usuario) => obterNivelAcesso(usuario) === 'master'; // Atalho rápido para saber se é Master.
export const isLogado = (usuario) => !!usuario; // Atalho rápido para saber se o usuário entrou com e-mail e senha.