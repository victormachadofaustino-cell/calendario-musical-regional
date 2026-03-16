import React, { useState, useMemo, useEffect } from 'react'; // Ferramenta base para criar componentes e gerenciar memória e dados.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes (modais) fora da estrutura principal.
import { db } from '../firebaseConfig'; // Importa a conexão com o banco de dados Firebase oficial.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para criar, ler, editar e apagar documentos no banco de dados.
import { 
  MapPin, Clock, User, AlertTriangle, Search, Filter, Edit3, Send, X, 
  Plus, Trash2, Calendar, ChevronDown, ChevronUp, Phone, Share2
} from 'lucide-react'; // Ícones modernos para os botões e indicações visuais da tela.
import Feedback from './Feedback'; // Componente que mostra avisos de "Sucesso" ou "Erro" no topo do App.

// Importação das constantes centralizadas, funções utilitárias e permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de cidades da região para os seletores.
import { normalizarTexto } from '../constants/comuns'; // Ferramenta para padronizar textos (ignorar acentos e abreviações).
import { isMaster, podeVerBotoesDeGestao } from '../constants/permissions'; // Motor de regras que decide quem pode editar cada cidade.

// Ferramentas centralizadas para ações de mapas e compartilhamento.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; // Importa funções para abrir o GPS e partilhar no WhatsApp.

const EnsaiosLocais = ({ todosEnsaios, diaFiltro: diaFiltroApp, loading, user, userData }) => { // Início do componente, agora recebendo o perfil completo (userData).
  const [busca, setBusca] = useState(''); // Guarda o texto que o utilizador digita para procurar uma igreja.
  const [cidadeAberta, setCidadeAberta] = useState(null); // Controla qual lista de cidade (sanfona) está aberta no momento.
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade selecionada no filtro do topo.
  
  const [semanaSelecionada, setSemanaSelecionada] = useState(''); // Filtro para ver apenas ensaios da 1ª, 2ª ou outras semanas.
  const [diaSelecionado, setDiaSelecionado] = useState(''); // Filtro para ver apenas Segunda, Terça ou outros dias específicos.

  const [feedback, setFeedback] = useState(null); // Controla a mensagem flutuante de sucesso ou erro.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Guarda os dados do ensaio que está a ser editado.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Guarda o ensaio que o utilizador deseja remover.
  const [mostraAdd, setMostraAdd] = useState(false); // Controla a abertura da janela de "Novo Ensaio".
  const [enviando, setEnviando] = useState(false); // Impede envios duplicados enquanto a internet processa a gravação.

  const [novoEnsaio, setNovoEnsaio] = useState({ cidade: 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); // Memória para o formulário de criação.
  const [formSugestao, setFormSugestao] = useState({ localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '', cidade: '' }); // Memória para o formulário de edição.

  const SEMANAS_LISTA = ["1ª", "2ª", "3ª", "4ª", "Últ."]; // Opções de semanas para os botões de filtro rápido.
  const DIAS_SIGLAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Opções de dias para os botões de filtro rápido.

  useEffect(() => { // Sincroniza os filtros caso o utilizador venha da tela inicial clicando num dia específico.
    if (diaFiltroApp) { // Se houver um filtro vindo do Hub...
      setSemanaSelecionada(diaFiltroApp.split(' ')[0]); // Define a semana automaticamente.
      setDiaSelecionado(diaFiltroApp.split(' ')[1]); // Define o dia da semana automaticamente.
      setFiltroCidade('Todas'); // Mostra todas as cidades para aquele dia específico.
    }
  }, [diaFiltroApp]); // Monitoriza mudanças externas no filtro.

  const ligarTelefone = (numero) => { // Inicia uma chamada telefónica ao clicar no ícone de telefone.
    if (!numero || numero === "-") return; // Se não houver número válido, não faz nada.
    const limpo = numero.replace(/\D/g, ""); // Remove espaços e traços do número.
    window.open(`tel:${limpo}`, '_self'); // Abre o discador do telemóvel.
  };

  const handleAddEnsaio = async (e) => { // Lógica para registar um novo ensaio no sistema.
    e.preventDefault(); // Impede o recarregamento da página.
    setEnviando(true); // Ativa o estado de carregamento no botão.
    try {
      if (isMaster(userData)) { // Se for o Administrador Master, salva direto na lista oficial.
        await addDoc(collection(db, "ensaios_locais"), novoEnsaio); // Grava no banco.
        setFeedback({ msg: "Ensaio adicionado com sucesso!", tipo: 'sucesso' }); // Exibe aviso de sucesso.
      } else { // Se for um Oficial de cidade, envia como sugestão para aprovação.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 AFINAÇÃO: Usa a cidade do perfil para passar nas regras do banco.
          tipo: 'local_criacao', 
          cidade: userData?.cidade || novoEnsaio.cidade, 
          localidade: novoEnsaio.localidade, 
          dadosSugeridos: novoEnsaio, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Musical", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Criação enviada para análise!", tipo: 'sucesso' }); // Avisa que o Master recebeu o pedido.
      }
      setMostraAdd(false); // Fecha a janela de cadastro.
      setNovoEnsaio({ cidade: userData?.cidade || 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); // Reseta os campos.
    } catch (err) { setFeedback({ msg: "Erro ao salvar ensaio", tipo: 'erro' }); } 
    finally { setEnviando(false); } // Libera o botão para novos cliques.
  };

  const handleExcluirOuSugerir = async () => { // Lógica inteligente para apagar um ensaio.
    try {
      if (isMaster(userData)) { // Master apaga do banco de dados imediatamente.
        await deleteDoc(doc(db, "ensaios_locais", confirmaExclusao.id)); // Remove o registo oficial.
        setFeedback({ msg: "Ensaio removido do sistema!", tipo: 'sucesso' }); //
      } else { // Editor solicita a remoção ao administrador regional.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 AFINAÇÃO: Assinatura territorial correta.
          ensaioId: confirmaExclusao.id, 
          tipo: 'local_exclusao', 
          cidade: userData?.cidade || confirmaExclusao.cidade, 
          localidade: confirmaExclusao.localidade, 
          dadosAntigos: confirmaExclusao, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Local", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Pedido de remoção enviado!", tipo: 'sucesso' }); //
      }
      setConfirmaExclusao(null); // Fecha o aviso de confirmação.
    } catch (err) { setFeedback({ msg: "Erro na operação", tipo: 'erro' }); } //
  };

  const enviarSugestaoOuEdicao = async (ev) => { // Lógica principal do botão "Salvar" no modo edição.
    ev.preventDefault(); // Bloqueia o comportamento padrão do navegador.
    setEnviando(true); // Inicia o carregamento visual.
    try {
      const dadosSaneados = { ...formSugestao, dia: formSugestao.dia }; // Prepara o pacote de dados.
      if (isMaster(userData)) { // Se for o Master, atualiza o banco oficial na hora.
        await updateDoc(doc(db, "ensaios_locais", sugestaoAberta.id), dadosSaneados); // Altera o documento.
        setFeedback({ msg: "Dados atualizados com sucesso!", tipo: 'sucesso' }); //
      } else { // Se for colaborador de cidade, envia a correção para a fila.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 CORREÇÃO CRÍTICA: Usa 'userData.cidade' para bater com as Rules do Firebase.
          ensaioId: sugestaoAberta.id, 
          localidade: sugestaoAberta.localidade, 
          cidade: userData?.cidade || sugestaoAberta.cidade, 
          tipo: 'local', 
          dadosAntigos: { ...sugestaoAberta }, 
          dadosSugeridos: dadosSaneados, 
          solicitanteNome: userData?.nome || user?.email || "Colaborador Jundiaí", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Sugestão enviada para análise!", tipo: 'sucesso' }); //
      }
      setSugestaoAberta(null); // Fecha a janela de edição.
    } catch (error) { setFeedback({ msg: "Falha ao processar pedido", tipo: 'erro' }); } // Exibe erro se o banco recusar.
    finally { setEnviando(false); } // Garante que a interface destrave.
  };

  const ensaiosFiltradosFinal = useMemo(() => { // Filtra e organiza a lista por semana, dia e cidade.
    let filtrados = [...todosEnsaios]; // Começa com a lista completa vinda do banco.
    if (semanaSelecionada) filtrados = filtrados.filter(e => e.dia.includes(semanaSelecionada.replace(/\D/g, "") || "Últ")); // Filtra pela semana (1ª, 2ª...).
    if (diaSelecionado) filtrados = filtrados.filter(e => e.dia.includes(diaSelecionado)); // Filtra pelo dia (Dom, Seg...).
    if (filtroCidade !== 'Todas') filtrados = filtrados.filter(e => normalizarTexto(e.cidade) === normalizarTexto(filtroCidade)); // Filtra por cidade de forma inteligente.
    if (busca) { // Filtra pelo texto digitado na lupa.
      const b = normalizarTexto(busca); //
      filtrados = filtrados.filter(e => normalizarTexto(e.localidade).includes(b) || (e.encarregado && normalizarTexto(e.encarregado).includes(b))); //
    }

    const PESO_SEMANA = { "1ª": 1, "1º": 1, "2ª": 2, "2º": 2, "3ª": 3, "3º": 3, "4ª": 4, "4º": 4, "Últ": 5 }; // Define a ordem cronológica das semanas.
    const PESO_DIA = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 }; // Define a ordem dos dias da semana.

    return filtrados.sort((a, b) => { // Ordena a lista para o utilizador.
      const semA = Object.keys(PESO_SEMANA).find(s => a.dia.includes(s)) || ""; //
      const semB = Object.keys(PESO_SEMANA).find(s => b.dia.includes(s)) || ""; //
      const diffSemana = (PESO_SEMANA[semA] || 99) - (PESO_SEMANA[semB] || 99); // Compara semanas.
      if (diffSemana !== 0) return diffSemana; //
      const diaA = Object.keys(PESO_DIA).find(d => a.dia.includes(d)) || ""; //
      const diaB = Object.keys(PESO_DIA).find(d => b.dia.includes(d)) || ""; //
      const diffDia = (PESO_DIA[diaA] ?? 99) - (PESO_DIA[diaB] ?? 99); // Compara dias.
      if (diffDia !== 0) return diffDia; //
      return a.hora.localeCompare(b.hora) || a.localidade.localeCompare(b.localidade); // Desempata pela hora e nome da igreja.
    });
  }, [todosEnsaios, semanaSelecionada, diaSelecionado, filtroCidade, busca]); // Atualiza sempre que um filtro mudar.

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-[10px] uppercase">Sincronizando Banco...</div>; // Efeito visual de carregamento.

  return ( // Renderização visual da tela de Ensaios Locais.
    <div className="w-full text-left relative flex flex-col">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {/* Botão de Adicionar Ensaio: Aparece para o Master ou para o Oficial dono daquela cidade. */}
      {podeVerBotoesDeGestao(userData, userData?.cidade) && ( //
        <div className="px-6 pt-4">
          <button onClick={() => { setNovoEnsaio(prev => ({...prev, cidade: userData.cidade})); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Ensaio em {isMaster(userData) ? 'Qualquer Cidade' : userData.cidade}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS: Fixa no topo para facilitar a navegação rápida. */}
      <div className="sticky top-0 z-30 bg-[#F1F5F9]/95 backdrop-blur-xl px-6 py-4 space-y-3 border-b border-slate-200">
        <div className="flex gap-2">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Igreja ou encarregado..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-[11px] font-bold outline-none shadow-sm" />
          </div>
          <div className="relative flex-1">
            <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-4 text-[10px] font-bold outline-none appearance-none shadow-sm text-center">
              {['Todas', ...CIDADES_LISTA].map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSemanaSelecionada('')} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${!semanaSelecionada ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>ToDoS</button>
          {SEMANAS_LISTA.map(s => (
            <button key={s} onClick={() => setSemanaSelecionada(s)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${semanaSelecionada === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-1">
          <button onClick={() => setDiaSelecionado('')} className={`p-2.5 rounded-xl border transition-all ${!diaSelecionado ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-200'}`}><Calendar size={14} /></button>
          {DIAS_SIGLAS.map(d => (
            <button key={d} onClick={() => setDiaSelecionado(d)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-tighter border transition-all ${diaSelecionado === d ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-200'}`}>{d}</button>
          ))}
        </div>
      </div>

      {/* LISTAGEM POR CIDADE: Organiza os ensaios em sanfonas (accordions) para melhor leitura. */}
      <div className="space-y-4 px-6 pb-32 mt-6">
        {CIDADES_LISTA.filter(c => (filtroCidade === 'Todas' || normalizarTexto(c) === normalizarTexto(filtroCidade))).map(cidade => {
          const ensaios = ensaiosFiltradosFinal.filter(e => normalizarTexto(e.cidade) === normalizarTexto(cidade));
          if (ensaios.length === 0) return null; // Não mostra a cidade se não houver ensaios filtrados nela.
          const isAberta = cidadeAberta === cidade;

          return (
            <div key={cidade} className="bg-white rounded-[2.2rem] shadow-sm border border-slate-100 overflow-hidden mb-4">
              <button onClick={() => setCidadeAberta(isAberta ? null : cidade)} className={`w-full p-6 flex justify-between items-center transition-colors ${isAberta ? 'bg-slate-50' : 'bg-white'}`}>
                <div className="flex flex-col items-start text-left">
                  <span className="text-slate-950 text-lg font-[900] tracking-tighter uppercase italic">{cidade}</span>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">{ensaios.length} Ensaios</span>
                </div>
                {isAberta ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
              </button>

              {isAberta && (
                <div className="p-4 space-y-4 animate-in fade-in zoom-in-95">
                  {ensaios.map(e => (
                    <div key={e.id} className="bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100 space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-2">
                             <h4 className="text-base font-[900] text-slate-950 uppercase leading-none italic pr-20">{e.localidade}</h4>
                             {e.observacao && <AlertTriangle size={18} className="text-red-500 animate-pulse shrink-0" />}
                          </div>
                          <div className="flex flex-col mt-2">
                             <div className="flex items-center gap-1.5"><User size={12} className="text-slate-400 shrink-0"/><span className="text-[10px] font-black uppercase text-slate-600">{e.encarregado || 'N/I'}</span></div>
                             <div className="text-[10px] font-black text-slate-400 mt-0.5 ml-4.5">{e.contato || '-'}</div>
                          </div>
                        </div>
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                          <div className="bg-slate-950 text-white text-[9px] font-black px-3 py-3 rounded-xl uppercase shrink-0 shadow-md">{e.dia}</div>
                          <div className="flex gap-1">
                            {/* Regra Territorial Afinada: Agora libera o lápis mesmo com abreviações territoriais. */}
                            {podeVerBotoesDeGestao(userData, e.cidade) && ( //
                              <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e, cidade: e.cidade }); }} className="bg-amber-100 text-amber-600 p-2.5 rounded-xl active:scale-90 border border-amber-200"><Edit3 size={16}/></button>
                            )}
                            {podeVerBotoesDeGestao(userData, e.cidade) && ( //
                              <button onClick={() => setConfirmaExclusao(e)} className="bg-red-100 text-red-600 p-2.5 rounded-xl active:scale-90 border border-red-200 shadow-sm"><Trash2 size={16}/></button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-black text-slate-950 pb-2"><Clock size={14} className="text-amber-500 shrink-0"/> {e.hora}</div>

                      {e.observacao && (
                        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex gap-2">
                          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-black text-red-700 uppercase leading-relaxed text-left">{e.observacao}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => ligarTelefone(e.contato)} className="bg-white border border-slate-200 text-blue-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Phone size={18} /></button>
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => compartilharEnsaio(e)} className="bg-white border border-slate-200 text-emerald-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Share2 size={18} /></button>
                        <button onClick={() => abrirGoogleMaps(e.localidade, e.cidade)} className="bg-slate-950 text-white p-4 rounded-2xl active:scale-90 flex justify-center shadow-lg"><MapPin size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FORMULÁRIO DE EDIÇÃO/CRIAÇÃO: Janela flutuante para gerir os dados dos ensaios locais. */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Ensaio' : (isMaster(userData) ? 'Editar Ensaio' : 'Sugerir Edição')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddEnsaio : enviarSugestaoOuEdicao} className="space-y-3 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Cidade</span>
                <select disabled={!isMaster(userData)} value={mostraAdd ? novoEnsaio.cidade : formSugestao.cidade} 
                        onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, cidade: ev.target.value}) : setFormSugestao({...formSugestao, cidade: ev.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase disabled:opacity-50">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Comum (Igreja)</span>
                <input required type="text" value={mostraAdd ? novoEnsaio.localidade : formSugestao.localidade} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, localidade: ev.target.value}) : setFormSugestao({...formSugestao, localidade: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Dia (Ex: 2ª Sex)</span>
                  <input required type="text" value={mostraAdd ? novoEnsaio.dia : formSugestao.dia} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, dia: ev.target.value}) : setFormSugestao({...formSugestao, dia: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Hora</span>
                  <input required type="time" value={mostraAdd ? novoEnsaio.hora : formSugestao.hora} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, hora: ev.target.value}) : setFormSugestao({...formSugestao, hora: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Encarregado</span>
                <input type="text" value={mostraAdd ? novoEnsaio.encarregado : formSugestao.encarregado} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, encarregado: ev.target.value}) : setFormSugestao({...formSugestao, encarregado: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">WhatsApp / Contato</span>
                <input type="text" value={mostraAdd ? novoEnsaio.contato : formSugestao.contato} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, contato: ev.target.value}) : setFormSugestao({...formSugestao, contato: ev.target.value})} 
                       placeholder="11999999999"
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Observações</span>
                <textarea rows="2" value={mostraAdd ? novoEnsaio.observacao : formSugestao.observacao} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, observacao: ev.target.value}) : setFormSugestao({...formSugestao, observacao: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold uppercase outline-none resize-none" />
              </div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all mt-4">
                <Send size={16}/> {enviando ? 'Processando...' : (isMaster(userData) ? 'Salvar no Banco' : 'Enviar Sugestão')}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO: Protege contra eliminações acidentais da agenda. */}
      {confirmaExclusao && createPortal(
        <div onClick={() => setConfirmaExclusao(null)} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover {confirmaExclusao.localidade}?</h3>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirOuSugerir} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">{isMaster(userData) ? "Excluir Agora" : "Pedir Exclusão"}</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosLocais; // Exporta a lista de ensaios locais afinada para aceitar assinaturas territoriais resilientes.