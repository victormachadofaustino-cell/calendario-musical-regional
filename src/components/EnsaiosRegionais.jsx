// src/components/EnsaiosRegionais.jsx // Localização do arquivo de agenda de ensaios regionais.

import React, { useState, useMemo } from 'react'; // Ferramenta base para criar componentes e gerenciar o que aparece na tela.
import { createPortal } from 'react-dom'; // Permite desenhar as janelas flutuantes (modais) por cima de tudo.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco de dados.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Comandos para ler, gravar, editar e apagar dados.
import { 
  MapPin, Clock, Calendar, X, Edit3, Send, Plus, Trash2, ChevronDown, Share2 
} from 'lucide-react'; // Ícones modernos usados nos botões e avisos.
import Feedback from './Feedback'; // Componente que mostra o alerta de "Sucesso" ou "Erro".

// Importações centralizadas e motor de permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de municípios da regional.
import { normalizarTexto, registrarEvento } from '../constants/comuns'; // Importa a afinadora de textos e o olheiro de telemetria.
import { isMaster, podeVerBotoesDeGestao } from '../constants/permissions'; // Motor de regras de acesso.

// Ferramentas centralizadas para abrir mapas e compartilhar dados.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; // Funções globais de GPS e WhatsApp.

const EnsaiosRegionais = ({ ensaiosRegionais = [], loading, user, userData }) => { // Início do componente recebendo o perfil (userData).
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade escolhida no filtro.
  const [filtroMes, setFiltroMes] = useState('Todos'); // Guarda o mês escolhido no filtro.
  const [semanaSelecionada, setSemanaSelecionada] = useState(''); // Filtro por semana (1ª, 2ª, etc.).

  const [feedback, setFeedback] = useState(null); // Mensagem de aviso após salvar.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Dados do regional em edição.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Regional a remover.
  const [mostraAdd, setMostraAdd] = useState(false); // Aparecimento do formulário de cadastro.
  const [enviando, setEnviando] = useState(false); // Travinha contra cliques duplos.

  const [novoReg, setNovoReg] = useState({ sede: 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' }); // Form de criação.
  const [formSugestao, setFormSugestao] = useState({ local: '', dia: '', mes: '', weekday: '', hora: '' }); // Form de edição.

  const SEMANAS = ["1ª", "2ª", "3ª", "4ª", "Últ"]; // Opções de filtro rápido.
  const MESES_LISTA = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']; // Lista oficial.

  const acaoAbrirMapa = (local, sede) => { // Dispara o GPS.
    // TELEMETRIA IDENTIFICADA: Registra quem está indo viajar para um ensaio regional.
    registrarEvento('Ensaios Regionais', 'Clique Mapa', `Sede: ${sede} - ${local}`, userData); 
    abrirGoogleMaps(local, sede); 
  };

  const acaoCompartilhar = (ensaio) => { // Partilha o ensaio.
    // TELEMETRIA IDENTIFICADA: Registra quem está divulgando a agenda regional.
    registrarEvento('Ensaios Regionais', 'Clique Compartilhar', `Sede: ${ensaio.sede}`, userData); 
    compartilharEnsaio(ensaio, true); 
  };

  const lidarComFiltroCidade = (cid) => { // Registro de busca por cidade.
    setFiltroCidade(cid); 
    if (cid !== 'Todas') {
      // TELEMETRIA IDENTIFICADA: Registra o interesse do usuário em pesquisar outra cidade.
      registrarEvento('Ensaios Regionais', 'Filtro Cidade', cid, userData); 
    }
  };

  const handleAddRegional = async (e) => { // Adiciona novo regional.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      const payload = { ...novoReg, dia: Number(novoReg.dia), sede: novoReg.sede.toUpperCase() }; 
      if (isMaster(userData)) { 
        await addDoc(collection(db, "ensaios_regionais"), payload); 
        setFeedback({ msg: "Regional adicionado com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          tipo: 'regional_criacao', 
          sede: userData?.cidade || payload.sede, 
          localidade: payload.local, 
          dadosSugeridos: payload, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Regional", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Regional enviado para aprovação!", tipo: 'sucesso' }); 
      }
      setMostraAdd(false); 
      setNovoReg({ sede: userData?.cidade || 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' }); 
    } catch (err) { setFeedback({ msg: "Erro ao tentar salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const enviarSugestaoOuEdicao = async (ev) => { // Edita regional.
    ev.preventDefault(); 
    setEnviando(true); 
    try {
      const dadosSaneados = { ...formSugestao, dia: Number(formSugestao.dia) }; 
      if (isMaster(userData)) { 
        await updateDoc(doc(db, "ensaios_regionais", sugestaoAberta.id), dadosSaneados); 
        setFeedback({ msg: "Dados atualizados com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: sugestaoAberta.id, 
          localidade: sugestaoAberta.local, 
          cidade: userData?.cidade || sugestaoAberta.sede, 
          tipo: 'regional', 
          dadosAntigos: { ...sugestaoAberta }, 
          dadosSugeridos: dadosSaneados, 
          solicitanteNome: userData?.nome || user?.email || "Oficial", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Sugestão enviada!", tipo: 'sucesso' }); 
      }
      setSugestaoAberta(null); 
    } catch (error) { setFeedback({ msg: "Falha ao processar pedido", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const handleExcluirOuSugerir = async () => { // Apaga regional.
    try {
      if (isMaster(userData)) { 
        await deleteDoc(doc(db, "ensaios_regionais", confirmaExclusao.id)); 
        setFeedback({ msg: "Regional removido!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: confirmaExclusao.id, 
          tipo: 'regional_exclusao', 
          cidade: userData?.cidade || confirmaExclusao.sede, 
          localidade: confirmaExclusao.local, 
          dadosAntigos: confirmaExclusao, 
          solicitanteNome: userData?.nome || user?.email || "Secretário", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Pedido de remoção enviado!", tipo: 'sucesso' }); 
      }
      setConfirmaExclusao(null); 
    } catch (err) { setFeedback({ msg: "Erro na operação", tipo: 'erro' }); } 
  };

  const regionaisFiltrados = useMemo(() => { // Lógica de filtros e organização cronológica.
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 }; 
    return ensaiosRegionais.filter(e => { 
      const sedeNormalizada = normalizarTexto(e.sede); 
      const matchCidade = filtroCidade === 'Todas' || sedeNormalizada === normalizarTexto(filtroCidade); 
      const matchMes = filtroMes === 'Todos' || e.mes === filtroMes; 
      let matchSemana = true; 
      if (semanaSelecionada) { 
        const termoBusca = semanaSelecionada.replace(/\D/g, ""); 
        matchSemana = e.weekday && (e.weekday.includes(termoBusca) || e.weekday.includes(semanaSelecionada)); 
      }
      return matchCidade && matchMes && matchSemana; 
    }).sort((a, b) => (ordemMeses[a.mes] - ordemMeses[b.mes]) || Number(a.dia) - Number(b.dia)); 
  }, [ensaiosRegionais, filtroCidade, filtroMes, semanaSelecionada]); 

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse text-[10px] tracking-widest">Sincronizando Regionais...</div>; 

  return ( 
    <div className="flex flex-col animate-in text-left pb-24">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {podeVerBotoesDeGestao(userData, userData?.cidade) && ( 
        <div className="px-6 pt-4">
          <button onClick={() => { setNovoReg(prev => ({...prev, sede: userData.cidade})); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Regional em {isMaster(userData) ? 'Qualquer Cidade' : userData.cidade}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS CENTRALIZADA */}
      <div className="sticky top-0 z-40 bg-[#F1F5F9]/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-3">
        <div className="flex gap-2">
          <select value={filtroCidade} onChange={(e) => lidarComFiltroCidade(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-3 outline-none flex-[2] shadow-sm appearance-none text-center">
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

      {/* LISTAGEM DOS CARDS */}
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
                    {podeVerBotoesDeGestao(userData, e.sede) && (
                      <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e }); }} className="text-amber-500 bg-amber-500/10 p-2.5 rounded-xl active:scale-90 border border-amber-500/20"><Edit3 size={16} /></button>
                    )}
                    {podeVerBotoesDeGestao(userData, e.sede) && (
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
                <button onClick={() => acaoCompartilhar(e)} className="bg-white/10 text-emerald-500 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-sm border border-white/5"><Share2 size={18} /></button>
                <button onClick={() => acaoAbrirMapa(e.local, e.sede)} className="bg-amber-500 text-slate-950 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-lg"><MapPin size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULÁRIO MODAL */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Regional' : (isMaster(userData) ? 'Editar Regional' : 'Sugerir Edição')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddRegional : enviarSugestaoOuEdicao} className="space-y-3 mt-6">
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

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
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

export default EnsaiosRegionais; // Exporta a agenda regional com a telemetria identificada integrada.