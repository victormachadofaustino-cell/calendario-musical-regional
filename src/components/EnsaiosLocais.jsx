import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { MapPin, Clock, User, AlertTriangle, Search, Filter, Edit3, Send, X, Share2, Navigation, Plus, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Feedback from './Feedback';

// Importação das constantes centralizadas e funções utilitárias
import { CIDADES_LISTA } from '../constants/cidades';
import { buscarCoordenadas, normalizarTexto } from '../constants/comuns';

const EnsaiosLocais = ({ todosEnsaios, diaFiltro: diaFiltroApp, loading, user }) => {
  const [busca, setBusca] = useState('');
  const [cidadeAberta, setCidadeAberta] = useState(null);
  const [filtroCidade, setFiltroCidade] = useState('Todas');
  
  // Estados de filtro de data
  const [semanaSelecionada, setSemanaSelecionada] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [sugestaoAberta, setSugestaoAberta] = useState(null);
  const [mapaSeletor, setMapaSeletor] = useState(null);
  const [confirmaExclusao, setConfirmaExclusao] = useState(null);
  const [mostraAdd, setMostraAdd] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [novoEnsaio, setNovoEnsaio] = useState({ cidade: 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' });
  const [formSugestao, setFormSugestao] = useState({ localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' });

  const isMaster = user?.nivel === 'master';
  const SEMANAS_LISTA = ["1ª", "2ª", "3ª", "4ª", "Últ."];
  const DIAS_SIGLAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Trava de segurança para sugestões baseada na cidade do usuário
  const podeSugerirAlteracao = (e) => {
    if (isMaster) return true;
    const cidadeUser = normalizarTexto(user?.cidade);
    const cidadeEnsaio = normalizarTexto(e.cidade);
    return cidadeUser !== "" && cidadeEnsaio !== "" && (cidadeUser.includes(cidadeEnsaio) || cidadeEnsaio.includes(cidadeUser));
  };

  useEffect(() => {
    if (diaFiltroApp) {
      setSemanaSelecionada(diaFiltroApp.split(' ')[0]);
      setDiaSelecionado(diaFiltroApp.split(' ')[1]);
      setFiltroCidade('Todas');
    }
    return () => {
      setSemanaSelecionada('');
      setDiaSelecionado('');
      setBusca('');
      setFiltroCidade('Todas');
    };
  }, [diaFiltroApp]);

  const abrirMapa = (app, localidade, cidade) => {
    const coords = buscarCoordenadas(cidade, localidade);
    let destino;

    if (coords) {
      destino = `${coords.lat},${coords.lon}`;
    } else {
      destino = encodeURIComponent(`CCB ${localidade} ${cidade}`);
    }

    const links = { 
      google: `https://www.google.com/maps/search/?api=1&query=${destino}`, 
      waze: `https://waze.com/ul?${coords ? 'll=' : 'q='}${destino}&navigate=yes` 
    };

    window.open(links[app], '_blank');
    setMapaSeletor(null);
  };

  const compartilharWapp = (e) => {
    const msg = `*Ensaio Local CCB*\n📍 ${e.localidade} - ${e.cidade}\n🗓️ ${e.dia} às ${e.hora}\n👤 Encarregado: ${e.encarregado || 'N/I'}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddEnsaio = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "ensaios_locais"), novoEnsaio);
      setFeedback({ msg: "Ensaio adicionado!", tipo: 'sucesso' });
      setMostraAdd(false);
      setNovoEnsaio({ cidade: 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' });
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); }
  };

  const handleExcluirDefinitivo = async () => {
    try {
      await deleteDoc(doc(db, "ensaios_locais", confirmaExclusao.id));
      setFeedback({ msg: "Removido!", tipo: 'sucesso' });
      setConfirmaExclusao(null);
    } catch (err) { setFeedback({ msg: "Erro ao excluir", tipo: 'erro' }); }
  };

  const enviarSugestao = async (ev) => {
    ev.preventDefault();
    setEnviando(true);
    try {
      if (isMaster) {
        await updateDoc(doc(db, "ensaios_locais", sugestaoAberta.id), formSugestao);
        setFeedback({ msg: "Atualizado!", tipo: 'sucesso' });
      } else {
        await addDoc(collection(db, "sugestoes_pendentes"), {
          ensaioId: sugestaoAberta.id, localidade: sugestaoAberta.localidade, cidade: sugestaoAberta.cidade, tipo: 'local',
          dadosAntigos: { ...sugestaoAberta }, dadosSugeridos: formSugestao, solicitanteNome: user.nome, status: 'pendente', dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Sugestão enviada!", tipo: 'sucesso' });
      }
      setSugestaoAberta(null);
    } catch (error) { setFeedback({ msg: "Erro no envio", tipo: 'erro' }); } 
    finally { setEnviando(false); }
  };

  const ensaiosFiltradosFinal = useMemo(() => {
    let filtrados = [...todosEnsaios];
    
    if (semanaSelecionada) {
        const termoBusca = semanaSelecionada.replace(/\D/g, "") || "Últ";
        filtrados = filtrados.filter(e => e.dia.includes(termoBusca));
    }

    if (diaSelecionado) filtrados = filtrados.filter(e => e.dia.includes(diaSelecionado));
    
    if (filtroCidade !== 'Todas') {
        const cidadeNormalizada = normalizarTexto(filtroCidade);
        filtrados = filtrados.filter(e => normalizarTexto(e.cidade) === cidadeNormalizada);
    }
    
    if (busca) {
      const b = normalizarTexto(busca);
      filtrados = filtrados.filter(e => 
        normalizarTexto(e.localidade).includes(b) || 
        (e.encarregado && normalizarTexto(e.encarregado).includes(b))
      );
    }

    const PESO_SEMANA = { "1ª": 1, "1º": 1, "2ª": 2, "2º": 2, "3ª": 3, "3º": 3, "4ª": 4, "4º": 4, "Últ": 5 };
    const PESO_DIA = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };

    return filtrados.sort((a, b) => {
      const semA = Object.keys(PESO_SEMANA).find(s => a.dia.includes(s)) || "";
      const semB = Object.keys(PESO_SEMANA).find(s => b.dia.includes(s)) || "";
      const diffSemana = (PESO_SEMANA[semA] || 99) - (PESO_SEMANA[semB] || 99);
      if (diffSemana !== 0) return diffSemana;

      const diaA = Object.keys(PESO_DIA).find(d => a.dia.includes(d)) || "";
      const diaB = Object.keys(PESO_DIA).find(d => b.dia.includes(d)) || "";
      const diffDia = (PESO_DIA[diaA] || 99) - (PESO_DIA[diaB] || 99);
      if (diffDia !== 0) return diffDia;

      return a.hora.localeCompare(b.hora) || a.localidade.localeCompare(b.localidade, undefined, { numeric: true });
    });
  }, [todosEnsaios, semanaSelecionada, diaSelecionado, filtroCidade, busca]);

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-[10px] uppercase tracking-[0.5em]">Sincronizando Banco...</div>;

  return (
    <div className="w-full text-left relative flex flex-col">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {isMaster && (
        <div className="px-6 pt-4">
          <button onClick={() => setMostraAdd(true)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Ensaio Local
          </button>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#F1F5F9]/95 backdrop-blur-xl px-6 py-4 space-y-3 border-b border-slate-200">
        <div className="flex gap-2">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Comum ou encarregado..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-[11px] font-bold outline-none shadow-sm" />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-[10px] font-bold outline-none appearance-none shadow-sm">
              {['Todas', ...CIDADES_LISTA].map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSemanaSelecionada('')} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${!semanaSelecionada ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>TDS</button>
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

      <div className="space-y-4 px-6 pb-24 mt-6">
        {CIDADES_LISTA.filter(c => (filtroCidade === 'Todas' || normalizarTexto(c) === normalizarTexto(filtroCidade))).map(cidade => {
          const ensaios = ensaiosFiltradosFinal.filter(e => normalizarTexto(e.cidade) === normalizarTexto(cidade));
          const isAberta = cidadeAberta === cidade;
          if (ensaios.length === 0) return null;

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
                <div className="p-4 space-y-4 animate-in fade-in">
                  {ensaios.map(e => (
                    <div key={e.id} className="bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100 space-y-3 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col text-left">
                          <h4 className="text-base font-[900] text-slate-950 uppercase leading-none italic pr-20">{e.localidade}</h4>
                          <span className="text-[8px] font-black text-slate-400 uppercase mt-1.5 tracking-widest">Congregação</span>
                        </div>
                        <div className="absolute top-5 right-5 flex gap-1 items-center">
                          {podeSugerirAlteracao(e) && (
                            <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e }); }} className="bg-amber-100 text-amber-600 p-2 rounded-xl active:scale-90 border border-amber-200 shadow-sm"><Edit3 size={16}/></button>
                          )}
                          {isMaster && (
                            <button onClick={() => setConfirmaExclusao(e)} className="bg-red-100 text-red-600 p-2 rounded-xl active:scale-90 border border-red-200 shadow-sm"><Trash2 size={16}/></button>
                          )}
                          <div className="bg-slate-950 text-white text-[9px] font-black px-3 py-2.5 rounded-xl uppercase shrink-0 shadow-md ml-1">{e.dia}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-500 py-1">
                        <div className="flex items-center gap-1.5 text-left overflow-hidden"><User size={14} className="shrink-0"/><span className="text-[10px] font-bold truncate uppercase">{e.encarregado || 'N/I'}</span></div>
                        <div className="flex items-center gap-1.5 font-black text-slate-950"><Clock size={14} className="text-amber-500 shrink-0"/> {e.hora}</div>
                      </div>

                      {e.observacao && (
                        <div className="bg-amber-100/50 p-3 rounded-2xl border border-amber-200 flex gap-2">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-bold text-amber-900 uppercase leading-relaxed text-left">{e.observacao}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => compartilharWapp(e)} className="bg-white border border-slate-200 text-slate-400 p-4 rounded-2xl active:scale-90 flex-1 flex justify-center shadow-sm"><Share2 size={18} /></button>
                        <button onClick={() => setMapaSeletor(e)} className="bg-slate-950 text-white p-4 rounded-2xl active:scale-90 flex-1 flex justify-center shadow-lg"><MapPin size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL EDITAR OU SUGERIR OU ADICIONAR */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
                {mostraAdd ? 'Novo Ensaio' : (isMaster ? 'Editar Ensaio' : 'Sugestão')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddEnsaio : enviarSugestao} className="space-y-3 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Cidade</span>
                <select value={mostraAdd ? novoEnsaio.cidade : (formSugestao.cidade || sugestaoAberta?.cidade)} 
                        onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, cidade: ev.target.value}) : setFormSugestao({...formSugestao, cidade: ev.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Comum</span>
                <input required type="text" value={mostraAdd ? novoEnsaio.localidade : formSugestao.localidade} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, localidade: ev.target.value}) : setFormSugestao({...formSugestao, localidade: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none shadow-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Dia (Ex: 2ª Sex)</span>
                  <input required type="text" value={mostraAdd ? novoEnsaio.dia : formSugestao.dia} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, dia: ev.target.value}) : setFormSugestao({...formSugestao, dia: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none shadow-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Hora</span>
                  <input required type="time" value={mostraAdd ? novoEnsaio.hora : formSugestao.hora} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, hora: ev.target.value}) : setFormSugestao({...formSugestao, hora: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none shadow-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Encarregado</span>
                <input type="text" value={mostraAdd ? novoEnsaio.encarregado : formSugestao.encarregado} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, encarregado: ev.target.value}) : setFormSugestao({...formSugestao, encarregado: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none shadow-none" />
              </div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all mt-4">
                <Send size={16}/> {enviando ? 'Processando...' : (isMaster ? 'Salvar no Banco' : 'Enviar Sugestão')}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* CONFIRMA EXCLUSÃO */}
      {confirmaExclusao && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover?</h3>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirDefinitivo} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95">Confirmar</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}

      {mapaSeletor && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 text-left">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6">Navegar para...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirMapa('google', mapaSeletor.localidade, mapaSeletor.cidade)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <Navigation size={20} className="text-blue-500" />
                <span className="text-[12px] font-black uppercase text-slate-950">Google Maps</span>
              </button>
              <button onClick={() => abrirMapa('waze', mapaSeletor.localidade, mapaSeletor.cidade)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <Navigation size={20} className="text-teal-500" />
                <span className="text-[12px] font-black uppercase text-slate-950">Waze</span>
              </button>
            </div>
            <button onClick={() => setMapaSeletor(null)} className="w-full mt-6 py-4 text-slate-400 text-[10px] font-black uppercase text-center">Cancelar</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosLocais;