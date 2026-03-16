import React, { useState, useMemo } from 'react'; // Ferramenta base para criar componentes e gerenciar o que aparece na tela.
import { createPortal } from 'react-dom'; // Permite desenhar as janelas flutuantes (modais) por cima de toda a interface.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco de dados da orquestra.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Comandos para ler, gravar, editar e apagar dados no banco.
import { 
  MapPin, Clock, Calendar, X, Edit3, Send, Plus, Trash2, ChevronDown, Share2 
} from 'lucide-react'; // Ícones modernos usados nos botões e avisos visuais.
import Feedback from './Feedback'; // Componente que mostra o alerta de "Sucesso" ou "Erro" no topo.

// Importações centralizadas e motor de permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de municípios da nossa regional.
import { normalizarTexto } from '../constants/comuns'; // Função que remove acentos e resolve o erro 'Paulista vs Pta'.
import { isMaster, podeVerBotoesDeGestao } from '../constants/permissions'; // Motor que decide quem tem a chave de cada cidade.

// Ferramentas centralizadas para abrir mapas e compartilhar dados.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; // Importa as funções globais de GPS e WhatsApp.

const EnsaiosRegionais = ({ ensaiosRegionais = [], loading, user, userData }) => { // Início do componente, recebendo os dados do músico e da agenda.
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade escolhida pelo usuário no filtro.
  const [filtroMes, setFiltroMes] = useState('Todos'); // Guarda o mês escolhido pelo usuário no filtro.
  const [semanaSelecionada, setSemanaSelecionada] = useState(''); // Guarda a semana (1ª, 2ª, etc.) escolhida para filtrar.

  const [feedback, setFeedback] = useState(null); // Controla a mensagem de aviso que surge após salvar algo.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Armazena os dados do regional que está sendo editado agora.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Guarda qual ensaio o usuário deseja apagar para confirmar.
  const [mostraAdd, setMostraAdd] = useState(false); // Controla se o formulário de novo cadastro deve aparecer.
  const [enviando, setEnviando] = useState(false); // Travinha que impede cliques duplos enquanto a internet processa o envio.

  const [novoReg, setNovoReg] = useState({ sede: 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' }); // Dados do formulário de criação.
  const [formSugestao, setFormSugestao] = useState({ local: '', dia: '', mes: '', weekday: '', hora: '' }); // Dados do formulário de edição.

  const SEMANAS = ["1ª", "2ª", "3ª", "4ª", "Últ"]; // Opções para os botões de filtro rápido por semana.
  const MESES_LISTA = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']; // Calendário oficial.

  const handleAddRegional = async (e) => { // Lógica para adicionar um novo ensaio regional ao sistema.
    e.preventDefault(); // Impede a página de recarregar sozinha.
    setEnviando(true); // Liga o sinal de "processando" no botão.
    try {
      const payload = { ...novoReg, dia: Number(novoReg.dia), sede: novoReg.sede.toUpperCase() }; // Formata os dados para o banco.
      if (isMaster(userData)) { // Se for o Administrador (Master), salva direto no banco oficial.
        await addDoc(collection(db, "ensaios_regionais"), payload); // Grava na gaveta de regionais.
        setFeedback({ msg: "Regional adicionado com sucesso!", tipo: 'sucesso' }); // Avisa que deu tudo certo.
      } else { // Se for um colaborador de cidade, envia como sugestão de criação.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 AFINAÇÃO: Usa a cidade do perfil para bater com a regra do banco.
          tipo: 'regional_criacao', 
          sede: userData?.cidade || payload.sede, 
          localidade: payload.local, 
          dadosSugeridos: payload, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Regional", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Regional enviado para aprovação do Master!", tipo: 'sucesso' }); //
      }
      setMostraAdd(false); // Fecha a janelinha de formulário.
      setNovoReg({ sede: userData?.cidade || 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' }); // Limpa os campos.
    } catch (err) { setFeedback({ msg: "Erro ao tentar salvar", tipo: 'erro' }); } //
    finally { setEnviando(false); } // Libera o botão novamente.
  };

  const enviarSugestaoOuEdicao = async (ev) => { // Lógica para salvar alterações em um ensaio que já existe.
    ev.preventDefault(); // Bloqueia o recarregamento da tela.
    setEnviando(true); // Inicia o carregamento.
    try {
      const dadosSaneados = { ...formSugestao, dia: Number(formSugestao.dia) }; // Garante formato numérico.
      if (isMaster(userData)) { // Se for Master, atualiza o registro oficial imediatamente.
        await updateDoc(doc(db, "ensaios_regionais", sugestaoAberta.id), dadosSaneados); // Altera o documento no banco.
        setFeedback({ msg: "Dados atualizados no banco oficial!", tipo: 'sucesso' }); //
      } else { // Se for oficial de cidade, a mudança entra na fila de análise.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 CORREÇÃO CRÍTICA: Envia a cidade do perfil para passar nas Rules.
          ensaioId: sugestaoAberta.id, 
          localidade: sugestaoAberta.local, 
          cidade: userData?.cidade || sugestaoAberta.sede, 
          tipo: 'regional', 
          dadosAntigos: { ...sugestaoAberta }, 
          dadosSugeridos: dadosSaneados, 
          solicitanteNome: userData?.nome || user?.email || "Oficial Regional", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Sugestão de alteração enviada!", tipo: 'sucesso' }); //
      }
      setSugestaoAberta(null); // Fecha o modal de edição.
    } catch (error) { setFeedback({ msg: "Falha ao processar sugestão", tipo: 'erro' }); } //
    finally { setEnviando(false); } // Destrava a interface.
  };

  const handleExcluirOuSugerir = async () => { // Lógica inteligente para remover eventos da agenda.
    try {
      if (isMaster(userData)) { // Master remove permanentemente agora.
        await deleteDoc(doc(db, "ensaios_regionais", confirmaExclusao.id)); // Apaga do banco.
        setFeedback({ msg: "Regional removido permanentemente!", tipo: 'sucesso' }); //
      } else { // Editor de cidade pede ao Master para apagar.
        await addDoc(collection(db, "sugestoes_pendentes"), { // 👈 AFINAÇÃO: Assinatura territorial correta.
          ensaioId: confirmaExclusao.id, 
          tipo: 'regional_exclusao', 
          cidade: userData?.cidade || confirmaExclusao.sede, 
          localidade: confirmaExclusao.local, 
          dadosAntigos: confirmaExclusao, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Regional", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Pedido de remoção enviado ao Master!", tipo: 'sucesso' }); //
      }
      setConfirmaExclusao(null); // Fecha a telinha de confirmação.
    } catch (err) { setFeedback({ msg: "Erro na operação", tipo: 'erro' }); } //
  };

  const regionaisFiltrados = useMemo(() => { // Lógica que organiza e filtra os regionais por data e território.
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 }; // Ordem cronológica.
    return ensaiosRegionais.filter(e => { // Começa a filtragem.
      const sedeNormalizada = normalizarTexto(e.sede); // Limpa o nome da cidade no banco (Ex: resolve Paulista vs Pta).
      const matchCidade = filtroCidade === 'Todas' || sedeNormalizada === normalizarTexto(filtroCidade); // Compara de forma inteligente.
      const matchMes = filtroMes === 'Todos' || e.mes === filtroMes; //
      let matchSemana = true; //
      if (semanaSelecionada) { //
        const termoBusca = semanaSelecionada.replace(/\D/g, ""); //
        matchSemana = e.weekday && (e.weekday.includes(termoBusca) || e.weekday.includes(semanaSelecionada)); //
      }
      return matchCidade && matchMes && matchSemana; // Retorna os que batem em tudo.
    }).sort((a, b) => (ordemMeses[a.mes] - ordemMeses[b.mes]) || Number(a.dia) - Number(b.dia)); // Coloca na ordem correta do calendário.
  }, [ensaiosRegionais, filtroCidade, filtroMes, semanaSelecionada]); //

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse text-[10px] tracking-widest">Sincronizando Banco...</div>; // Carregamento visual inicial.

  return ( // Montagem do corpo visual da agenda.
    <div className="flex flex-col animate-in text-left pb-24">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {/* Botão de Adicionar: Usa a regra territorial corrigida para todas as cidades. */}
      {podeVerBotoesDeGestao(userData, userData?.cidade) && ( //
        <div className="px-6 pt-4">
          <button onClick={() => { setNovoReg(prev => ({...prev, sede: userData.cidade})); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Regional em {isMaster(userData) ? 'Qualquer Cidade' : userData.cidade}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS: Centralizada no topo para facilitar a navegação rápida. */}
      <div className="sticky top-0 z-40 bg-[#F1F5F9]/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-3">
        <div className="flex gap-2">
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-3 outline-none flex-[2] shadow-sm appearance-none text-center">
            <option value="Todas">Toda a Região</option>
            {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-3 outline-none flex-1 shadow-sm appearance-none text-center">
            <option value="Todos">Meses</option>
            {MESES_LISTA.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSemanaSelecionada('')} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${!semanaSelecionada ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>TDS</button>
          {SEMANAS.map(s => (
            <button key={s} onClick={() => setSemanaSelecionada(s)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${semanaSelecionada === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DOS CARDS REGIONAIS */}
      <div className="px-6 py-6 space-y-4">
        {regionaisFiltrados.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px]">Nenhum regional encontrado</div>
        ) : (
          regionaisFiltrados.map(e => (
            <div key={e.id} className="bg-slate-950 rounded-[1.8rem] p-6 shadow-xl border border-slate-800 flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex flex-col text-left">
                  <h3 className="text-white text-xl font-[900] uppercase italic leading-tight tracking-tighter pr-20">{e.sede}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{e.local}</p>
                </div>
                <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                  <div className="bg-amber-500 text-slate-950 text-[10px] font-[900] px-3 py-3 rounded-xl uppercase shrink-0 shadow-md min-w-[55px] text-center italic">
                    {e.dia} {e.mes.substring(0, 3)}
                  </div>
                  <div className="flex gap-1">
                    {/* Regra Territorial Afinada: Agora libera o acesso mesmo se a cidade tiver abreviação. */}
                    {podeVerBotoesDeGestao(userData, e.sede) && ( //
                      <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e }); }} className="text-amber-500 bg-amber-500/10 p-2.5 rounded-xl active:scale-90 border border-amber-500/20"><Edit3 size={16} /></button>
                    )}
                    {podeVerBotoesDeGestao(userData, e.sede) && ( //
                      <button onClick={() => setConfirmaExclusao(e)} className="text-red-500 bg-red-500/10 p-2.5 rounded-xl active:scale-90 border border-red-500/20"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-white text-[11px] font-black uppercase italic"><Clock size={14} className="text-amber-500" /> {e.hora}</div>
                <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase italic tracking-wider"><Calendar size={12} /> {e.weekday}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => compartilharEnsaio(e, true)} className="bg-white/10 text-emerald-500 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-sm border border-white/5"><Share2 size={18} /></button>
                <button onClick={() => abrirGoogleMaps(e.local, e.sede)} className="bg-amber-500 text-slate-950 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-lg"><MapPin size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULÁRIO DE EDIÇÃO/CRIAÇÃO (Modal Flutuante) */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Regional' : (isMaster(userData) ? 'Editar Regional' : 'Sugerir Edição')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddRegional : enviarSugestaoOuEdicao} className="space-y-3 mt-6">
              {/* O seletor de cidade agora trava na cidade do músico para garantir a regra das Rules. */}
              <select disabled={!isMaster(userData)} value={mostraAdd ? novoReg.sede : (formSugestao.sede || sugestaoAberta?.sede)} 
                      onChange={ev => mostraAdd ? setNovoReg({...novoReg, sede: ev.target.value}) : setFormSugestao({...formSugestao, sede: ev.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase disabled:opacity-50">
                {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Comum/Local" value={mostraAdd ? novoReg.local : formSugestao.local} onChange={ev => mostraAdd ? setNovoReg({...novoReg, local: ev.target.value}) : setFormSugestao({...formSugestao, local: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Dia" value={mostraAdd ? novoReg.dia : formSugestao.dia} onChange={ev => mostraAdd ? setNovoReg({...novoReg, dia: ev.target.value}) : setFormSugestao({...formSugestao, dia: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
                <input type="time" value={mostraAdd ? novoReg.hora : formSugestao.hora} onChange={ev => mostraAdd ? setNovoReg({...novoReg, hora: ev.target.value}) : setFormSugestao({...formSugestao, hora: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
              </div>
              <select value={mostraAdd ? novoReg.mes : formSugestao.mes} onChange={ev => mostraAdd ? setNovoReg({...novoReg, mes: ev.target.value}) : setFormSugestao({...formSugestao, mes: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none">
                {MESES_LISTA.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="text" placeholder="Semana (Ex: 3º Domingo)" value={mostraAdd ? novoReg.weekday : formSugestao.weekday} onChange={ev => mostraAdd ? setNovoReg({...novoReg, weekday: ev.target.value}) : setFormSugestao({...formSugestao, weekday: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all mt-4">
                <Send size={16}/> {enviando ? 'Processando...' : (isMaster(userData) ? 'Salvar no Banco' : 'Enviar Sugestão')}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO (Para evitar erros permanentes) */}
      {confirmaExclusao && createPortal(
        <div onClick={() => setConfirmaExclusao(null)} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover {confirmaExclusao.sede}?</h3>
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

export default EnsaiosRegionais; // Exporta a agenda regional corrigida e resiliente para todas as cidades da orquestra.