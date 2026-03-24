import React, { useState } from 'react'; // Ferramenta base do React para gerenciar a memória e o estado da tela.
import { 
  Shield, Edit3, Lock, ShieldCheck, ShieldAlert, 
  Search, Filter, Users, UserMinus, ChevronDown, ChevronUp,
  Star // Importa o ícone da estrela para identificar os membros da Comissão Musical.
} from 'lucide-react'; // Importa os ícones de segurança, busca, setas e gestão de usuários.
import { CIDADES_LISTA } from '../../constants/cidades'; // Importa a lista oficial de cidades para o uso exclusivo do Master.

// Este componente organiza os colaboradores por ordem ministerial; Editores apenas visualizam sua cidade, Master controla tudo.
const AbaGerenciarUsuarios = ({
  todosUsuarios, // Lista de todos os usuários aprovados vinda do banco de dados Firebase.
  gerenciarUsuario, // Função para salvar mudanças de nível, cargo ou cidade no banco.
  resetarSenhaUsuario, // Envia o e-mail oficial de recuperação de senha.
  setEditandoUser, // Abre a janela flutuante para ajustar cargo e cidade de um irmão.
  editandoUser, // Guarda qual irmão foi selecionado para o ajuste no momento.
  novoCargo, // Cargo que está sendo escolhido na janela de ajuste.
  setNovoCargo, // Função que atualiza o cargo escolhido na janela de ajuste.
  novaCidade, // Cidade que está sendo escolhida na janela de ajuste.
  setNovaCidade, // Função que atualiza a cidade escolhida na janela de ajuste.
  userLogado // Dados de quem está pilotando o sistema agora (Maestro Regional ou Editor Local).
}) => {
  const isMasterGlobal = userLogado?.nivel === 'master'; // SEGURANÇA: Verifica se quem está logado é o Maestro Regional.
  const [busca, setBusca] = useState(''); // Guarda o texto digitado para procurar um irmão pelo nome.
  
  // SEGURANÇA TERRITORIAL: O Master começa vendo "Todas", o Editor fica travado na sua "cidade".
  const [filtroCidade, setFiltroCidade] = useState(isMasterGlobal ? 'Todas' : userLogado?.cidade); 
  const [abertos, setAbertos] = useState({}); // Memória para saber quais "pastas" de cargos (accordions) estão abertas.

  // 1. ESCALA HIERÁRQUICA: Define a ordem ministerial exata da Regional (Anciães no topo).
  const ORDEM_CARGOS = [
    "Ancião", 
    "Encarregado Regional", 
    "Examinadora", 
    "Secretário da Música Regional", 
    "Secretário da Música Cidade"
  ];

  // 2. MOTOR DE FILTRAGEM: Filtra a lista pelo nome e aplica a trava de cidade (Regional vs Local).
  const usuariosFiltrados = todosUsuarios
    .filter(u => { // Inicia a triagem dos nomes e locais.
      const nomeNormal = u.nome?.toLowerCase() || ""; // Padroniza o nome para evitar erros de busca.
      const matchBusca = nomeNormal.includes(busca.toLowerCase()); // Verifica se a busca bate com o nome.
      const matchCidade = filtroCidade === 'Todas' || u.cidade === filtroCidade; // Trava a visualização na cidade permitida.
      return matchBusca && matchCidade; // Retorna o irmão se ele passar nos dois critérios.
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "")); // Organiza por ordem alfabética (A-Z).

  // 3. CONTROLE DA SANFONA: Função para abrir e fechar as pastas de ministérios.
  const alternarAccordion = (cargo) => {
    setAbertos(prev => ({ ...prev, [cargo]: !prev[cargo] })); // Abre se estiver fechado, fecha se estiver aberto.
  };

  return ( // Início da construção visual do painel.
    <div className="flex flex-col h-full text-left relative overflow-visible"> {/* Container principal alinhado à esquerda. */}

      {/* PAINEL DE BUSCA: FIXO NO TOPO DO MODAL */}
      <div className="sticky top-[-24px] z-30 bg-white border-b border-slate-200 px-6 py-5 mx-[-24px] mb-6 shadow-sm"> 
        {/* O fundo branco sólido garante que a lista deslize por baixo sem misturar as letras. */}
        <div className="space-y-4"> 
          <div className="relative"> {/* Campo de busca por nome (Lupa). */}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar irmão por nome..." 
              value={busca} 
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold outline-none uppercase transition-all focus:ring-2 focus:ring-slate-950"
            />
          </div>

          {/* SÓ MOSTRA O FILTRO DE CIDADES SE FOR O MASTER GLOBAL */}
          {isMasterGlobal && (
            <div className="flex items-center gap-2 animate-in fade-in"> 
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-grow">
                <Filter size={14} className="text-slate-400" />
                <select 
                  value={filtroCidade} 
                  onChange={(e) => setFiltroCidade(e.target.value)}
                  className="bg-transparent w-full text-[10px] font-black uppercase outline-none appearance-none"
                >
                  <option value="Todas">Toda a Região Jundiaí (Visão Master)</option>
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LISTA MINISTERIAL: ORGANIZADA POR CARGOS (ACCORDIONS) */}
      <div className="space-y-4 pb-32 relative z-10"> 
        {ORDEM_CARGOS.map(cargo => { // Percorre a hierarquia (Ancião até Secretário).
          const membrosDesteCargo = usuariosFiltrados.filter(u => u.cargo === cargo); // Pega apenas os irmãos do naipe atual.
          if (membrosDesteCargo.length === 0) return null; // Se não houver ninguém desse cargo na cidade/busca, não mostra.

          const isAberto = abertos[cargo]; // Verifica se esta sanfona está aberta.

          return (
            <div key={cargo} className="bg-white rounded-[2.2rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
              {/* CABEÇALHO DO MINISTÉRIO (BOTÃO DE ABRIR) */}
              <button 
                onClick={() => alternarAccordion(cargo)}
                className={`w-full p-6 flex justify-between items-center transition-all ${isAberto ? 'bg-slate-50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-10 rounded-full ${cargo === 'Ancião' ? 'bg-slate-950' : 'bg-blue-600'}`} /> {/* Cor lateral baseada no cargo. */}
                  <div className="flex flex-col items-start">
                    <span className="text-slate-950 text-sm font-[900] tracking-tighter uppercase italic leading-none">{cargo}</span>
                    <span className="text-slate-400 text-[9px] font-black uppercase mt-1.5 tracking-widest">{membrosDesteCargo.length} Integrantes</span>
                  </div>
                </div>
                {isAberto ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}
              </button>

              {/* LISTA DE IRMÃOS (CARDS INDIVIDUAIS) */}
              {isAberto && (
                <div className="p-4 space-y-4 bg-slate-50/20 border-t border-slate-50 animate-in fade-in zoom-in-95">
                  {membrosDesteCargo.map(u => {
                    const isMe = userLogado?.uid === u.id; // Identifica se é o próprio usuário para travas extras.
                    
                    return (
                      <div 
                        key={u.id} 
                        className={`p-5 rounded-[2rem] shadow-sm border transition-all relative overflow-hidden ${!u.ativo ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-slate-100'}`}
                      >
                        {/* SELO MASTER: Fica no canto superior direito */}
                        {u.nivel === 'master' && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[6px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">Master</div>
                        )}

                        {/* ESTRELA DA COMISSÃO: Fica no canto superior esquerdo para não quebrar o layout interno */}
                        {u.isComissao && (
                          <div className="absolute top-0 left-0 bg-blue-600 text-white p-1 rounded-br-lg shadow-md z-10 animate-in fade-in">
                            <Star size={8} fill="currentColor" />
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-2 flex-grow"> {/* O flex-grow garante que o texto use o espaço disponível sem empurrar os botões */}
                            <h4 className="text-[12px] font-[900] uppercase text-slate-950 italic leading-tight">
                              {u.nome} {isMe && <span className="text-amber-600 text-[8px] ml-1">(VOCÊ)</span>}
                            </h4>
                            <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{u.cidade}</p>
                            {!u.ativo && <span className="text-[7px] font-black text-red-500 uppercase mt-1 italic">Acesso Suspenso</span>}
                          </div>

                          {/* BLOCO DE BOTÕES: Agora com largura fixa para evitar quebras de layout */}
                          {isMasterGlobal && !isMe && (
                            <div className="flex gap-1.5 shrink-0 ml-2">
                              {/* BOTÃO COMISSÃO: Liga/Desliga o distintivo de comissão */}
                              <button 
                                onClick={() => gerenciarUsuario(u.id, { isComissao: !u.isComissao })} 
                                className={`p-2.5 rounded-xl active:scale-90 transition-all ${u.isComissao ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}
                                title={u.isComissao ? "Remover da Comissão" : "Adicionar à Comissão"}
                              >
                                <Star size={14} fill={u.isComissao ? "currentColor" : "none"} />
                              </button>

                              {/* BOTÃO PROMOVER: Transforma Editor em Master */}
                              <button 
                                onClick={() => gerenciarUsuario(u.id, { nivel: u.nivel === 'master' ? 'editor' : 'master' })} 
                                className={`p-2.5 rounded-xl active:scale-90 transition-all ${u.nivel === 'master' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                              >
                                <Shield size={14}/>
                              </button>
                              
                              {/* BOTÃO AJUSTAR: Abre modal para mudar cargo/cidade */}
                              <button 
                                onClick={() => { setEditandoUser(u); setNovoCargo(u.cargo); setNovaCidade(u.cidade); }} 
                                className="p-2.5 bg-slate-50 text-slate-500 rounded-xl active:scale-90 transition-all"
                              >
                                <Edit3 size={14}/>
                              </button>
                              
                              {/* BOTÃO STATUS: Ativa ou Desativa o acesso definitivo */}
                              <button 
                                onClick={() => gerenciarUsuario(u.id, { ativo: !u.ativo })} 
                                className={`p-2.5 rounded-xl active:scale-90 transition-all ${u.ativo ? 'bg-green-50 text-green-600' : 'bg-red-200 text-red-800'}`}
                              >
                                {u.ativo ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                              </button>
                            </div>
                          )}

                          {/* SE FOR EDITOR OU O PRÓPRIO CARD, MOSTRA APENAS O CADEADO TRAVADO */}
                          {(!isMasterGlobal || isMe) && (
                            <div className="p-3 bg-slate-50 text-slate-200 rounded-xl shrink-0">
                              <Lock size={14}/>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* MENSAGEM SE A BUSCA NÃO RETORNAR NADA */}
        {usuariosFiltrados.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <UserMinus size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Ninguém encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbaGerenciarUsuarios; // Exporta este componente com o layout agora corrigido e à prova de quebras.