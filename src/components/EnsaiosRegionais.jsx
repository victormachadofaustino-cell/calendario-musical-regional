import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  MapPin, Clock, Calendar, Navigation, X, Edit3, Send, Plus, Trash2, 
  MessageCircle, ChevronRight
} from 'lucide-react';
import Feedback from './Feedback';

// Importações centralizadas
import { CIDADES_LISTA } from '../constants/cidades';
import { normalizarTexto, buscarCoordenadas } from '../constants/comuns';

const EnsaiosRegionais = ({ ensaiosRegionais = [], loading, user }) => {
  const [filtroCidade, setFiltroCidade] = useState('Todas');
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [semanaSelecionada, setSemanaSelecionada] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [sugestaoAberta, setSugestaoAberta] = useState(null);
  const [mapaSeletor, setMapaSeletor] = useState(null);
  const [wappSeletor, setWappSeletor] = useState(null);
  const [confirmaExclusao, setConfirmaExclusao] = useState(null);
  const [mostraAdd, setMostraAdd] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [novoReg, setNovoReg] = useState({ sede: 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' });
  const [formSugestao, setFormSugestao] = useState({ local: '', dia: '', mes: '', weekday: '', hora: '' });

  const isMaster = user?.nivel === 'master';
  const SEMANAS = ["1ª", "2ª", "3ª", "4ª", "Últ"];
  const MESES_LISTA = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const podeEditarRegional = (e) => {
    if (isMaster) return true;
    if (!user?.cidade || !e.sede) return false;
    return normalizarTexto(user.cidade) === normalizarTexto(e.sede);
  };

  const abrirMapa = (app, local, sede) => {
    const coords = buscarCoordenadas(sede, local);
    let destino;
    
    if (app === 'google') {
      destino = coords ? `${coords.lat},${coords.lon}` : encodeURIComponent(`CCB ${local} ${sede}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank');
    } else {
      if (coords) {
        window.open(`https://waze.com/ul?ll=${coords.lat},${coords.lon}&navigate=yes`, '_blank');
      } else {
        destino = encodeURIComponent(`CCB ${local} ${sede}`);
        window.open(`https://waze.com/ul?q=${destino}&navigate=yes`, '_blank');
      }
    }
    setMapaSeletor(null);
  };

  const abrirWapp = (tipo, e) => {
    const msg = `*CCB Jundiaí - Ensaio Regional*\n📍 ${e.sede} (${e.local})\n📅 ${e.dia}/${e.mes} às ${e.hora}\n🗓️ ${e.weekday}`;
    const base = tipo === 'business' ? 'https://wa.me/' : 'https://api.whatsapp.com/send?text=';
    window.open(`${base}${encodeURIComponent(msg)}`, '_blank');
    setWappSeletor(null);
  };

  const handleAddRegional = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const payload = { ...novoReg, dia: Number(novoReg.dia), sede: novoReg.sede.toUpperCase() };
      await addDoc(collection(db, "ensaios_regionais"), payload);
      setFeedback({ msg: "Regional adicionado!", tipo: 'sucesso' });
      setMostraAdd(false);
      setNovoReg({ sede: 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' });
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); }
  };

  const enviarSugestao = async (ev) => {
    ev.preventDefault();
    setEnviando(true);
    try {
      const dadosSaneados = { ...formSugestao, dia: Number(formSugestao.dia) };
      if (isMaster) {
        await updateDoc(doc(db, "ensaios_regionais", sugestaoAberta.id), dadosSaneados);
        setFeedback({ msg: "Banco atualizado!", tipo: 'sucesso' });
      } else {
        await addDoc(collection(db, "sugestoes_pendentes"), {
          ensaioId: sugestaoAberta.id, localidade: sugestaoAberta.sede, cidade: sugestaoAberta.sede, tipo: 'regional',
          dadosAntigos: { ...sugestaoAberta }, dadosSugeridos: dadosSaneados, solicitanteNome: user.nome, status: 'pendente', dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Sugestão enviada!", tipo: 'sucesso' });
      }
      setSugestaoAberta(null);
    } catch (error) { setFeedback({ msg: "Erro no envio", tipo: 'erro' }); }
    finally { setEnviando(false); }
  };

  const handleExcluirDefinitivo = async () => {
    try {
      await deleteDoc(doc(db, "ensaios_regionais", confirmaExclusao.id));
      setFeedback({ msg: "Removido!", tipo: 'sucesso' });
      setConfirmaExclusao(null);
    } catch (err) { setFeedback({ msg: "Erro ao excluir", tipo: 'erro' }); }
  };

  const regionaisFiltrados = useMemo(() => {
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 };
    
    return ensaiosRegionais.filter(e => {
      const sedeNormalizada = normalizarTexto(e.sede);
      const pertenceARegional = CIDADES_LISTA.some(c => normalizarTexto(c) === sedeNormalizada);
      if (!pertenceARegional) return false;

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

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse text-[10px] tracking-widest">Sincronizando Banco...</div>;

  return (
    <div className="flex flex-col animate-in text-left pb-24">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {isMaster && (
        <div className="px-6 pt-4">
          <button onClick={() => setMostraAdd(true)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Regional
          </button>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-[#F1F5F9]/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-3">
        <div className="flex gap-2">
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-3 outline-none flex-[2] shadow-sm appearance-none">
            <option value="Todas">Toda a Região</option>
            {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-3 outline-none flex-1 shadow-sm appearance-none">
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
                    {podeEditarRegional(e) && (
                      <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e }); }} className="text-amber-500 bg-amber-500/10 p-2.5 rounded-xl active:scale-90 border border-amber-500/20"><Edit3 size={16} /></button>
                    )}
                    {isMaster && (
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
                <button onClick={() => setWappSeletor(e)} className="bg-white/10 text-emerald-500 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-sm border border-white/5"><MessageCircle size={18} /></button>
                <button onClick={() => setMapaSeletor(e)} className="bg-amber-500 text-slate-950 p-4 rounded-2xl active:scale-90 flex justify-center items-center shadow-lg"><MapPin size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL SELETOR WHATSAPP */}
      {wappSeletor && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 text-left">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6 leading-tight">Compartilhar via...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirWapp('standard', wappSeletor)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><MessageCircle size={20} /></div>
                <span className="text-[12px] font-[900] uppercase text-slate-950">WhatsApp Padrão</span>
              </button>
              <button onClick={() => abrirWapp('business', wappSeletor)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <div className="p-3 bg-emerald-600 text-white rounded-xl"><MessageCircle size={20} /></div>
                <span className="text-[12px] font-[900] uppercase text-slate-950">WhatsApp Business</span>
              </button>
            </div>
            <button onClick={() => setWappSeletor(null)} className="w-full mt-6 py-2 text-slate-400 text-[10px] font-black uppercase text-center">Cancelar</button>
          </div>
        </div>, document.body
      )}

      {/* MODAL SELETOR MAPA */}
      {mapaSeletor && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 text-left">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6">Navegar para...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirMapa('google', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100"><Navigation size={20} className="text-blue-500" /><span className="text-[12px] font-black uppercase text-slate-950">Google Maps</span></button>
              <button onClick={() => abrirMapa('waze', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100"><Navigation size={20} className="text-teal-500" /><span className="text-[12px] font-black uppercase text-slate-950">Waze</span></button>
            </div>
            <button onClick={() => setMapaSeletor(null)} className="w-full mt-6 py-2 text-slate-400 text-[10px] font-black uppercase text-center">Cancelar</button>
          </div>
        </div>, document.body
      )}

      {/* MODAL EDITAR/ADD */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Regional' : (isMaster ? 'Editar Regional' : 'Sugestão')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddRegional : enviarSugestao} className="space-y-3 mt-6">
              <select value={mostraAdd ? novoReg.sede : (formSugestao.sede || sugestaoAberta?.sede)} 
                      onChange={ev => mostraAdd ? setNovoReg({...novoReg, sede: ev.target.value}) : setFormSugestao({...formSugestao, sede: ev.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase">
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
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover Regional?</h3>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirDefinitivo} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">Confirmar</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosRegionais;