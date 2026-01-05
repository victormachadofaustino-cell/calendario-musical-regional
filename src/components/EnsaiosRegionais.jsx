import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { MapPin, Clock, Calendar, Star, Share2, Navigation, X, Edit3, Send, Plus, Trash2 } from 'lucide-react';
import Feedback from './Feedback';

// CORREÇÃO: Caminho corrigido para minúsculo
import { CIDADES_LISTA } from '../constants/cidades';

const EnsaiosRegionais = ({ ensaiosRegionais = [], loading, user }) => {
  const [filtroCidade, setFiltroCidade] = useState('Todas');
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [semanaSelecionada, setSemanaSelecionada] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [sugestaoAberta, setSugestaoAberta] = useState(null);
  const [mapaSeletor, setMapaSeletor] = useState(null);
  const [confirmaExclusao, setConfirmaExclusao] = useState(null);
  const [mostraAdd, setMostraAdd] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [novoReg, setNovoReg] = useState({ sede: 'JUNDIAÍ', local: '', mes: 'Janeiro', dia: '', weekday: '', hora: '' });
  const [formSugestao, setFormSugestao] = useState({ local: '', dia: '', mes: '', weekday: '', hora: '' });

  const isMaster = user?.nivel === 'master';

  // FUNÇÃO DE NORMALIZAÇÃO TOTAL (Blindagem contra Paulista/Pta e Acentos)
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/PAULISTA/g, "")       
      .replace(/PTA/g, "")             
      .replace(/\s+/g, "")             
      .trim();
  };

  // TRAVA SIMPLIFICADA: Se a cidade do usuário bater com a sede do ensaio, ele edita.
  const podeEditarRegional = (e) => {
    if (isMaster) return true;
    if (!user?.cidade || !e.sede) return false;
    return normalizarParaComparacao(user.cidade) === normalizarParaComparacao(e.sede);
  };

  const SEMANAS = ["1ª", "2ª", "3ª", "4ª", "Últ"];

  const mesesUnicos = ['Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const abrirMapa = (app, local, sede) => {
    const termoBusca = `CCB ${local} ${sede}`;
    const termoEncoded = encodeURIComponent(termoBusca);
    const links = { 
      google: `https://www.google.com/maps/search/?api=1&query=${termoEncoded}`, 
      waze: `https://waze.com/ul?q=${termoEncoded}&navigate=yes` 
    };
    window.open(links[app], '_blank');
    setMapaSeletor(null);
  };

  const compartilharWapp = (e) => {
    const msg = `*Ensaio Regional CCB*\n📍 ${e.sede} (${e.local})\n📅 ${e.dia}/${e.mes} às ${e.hora}\n🗓️ ${e.weekday}\n\n🚙 Como Chegar: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('CCB ' + e.local + ' ' + e.sede)}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
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

  const regionaisFiltrados = useMemo(() => {
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 };
    return ensaiosRegionais.filter(e => {
      const pertenceARegional = CIDADES_LISTA.some(c => normalizarParaComparacao(c) === normalizarParaComparacao(e.sede));
      if (!pertenceARegional) return false;
      const matchCidade = filtroCidade === 'Todas' || normalizarParaComparacao(e.sede) === normalizarParaComparacao(filtroCidade);
      const matchMes = filtroMes === 'Todos' || e.mes === filtroMes;
      let matchSemana = true;
      if (semanaSelecionada) {
        const termoBusca = semanaSelecionada.replace(/\D/g, "") || semanaSelecionada;
        matchSemana = e.weekday && e.weekday.includes(termoBusca);
      }
      return matchCidade && matchMes && matchSemana;
    }).sort((a, b) => (ordemMeses[a.mes] - ordemMeses[b.mes]) || Number(a.dia) - Number(b.dia));
  }, [ensaiosRegionais, filtroCidade, filtroMes, semanaSelecionada]);

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse">Sincronizando...</div>;

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
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-2 outline-none flex-grow shadow-sm">
            <option value="Todas">Toda a Região</option>
            {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold rounded-xl px-3 py-2 outline-none min-w-[100px] shadow-sm">
            {mesesUnicos.map(m => <option key={m} value={m}>{m === 'Todos' ? 'Mês' : m}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSemanaSelecionada('')} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${!semanaSelecionada ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>TDS</button>
          {SEMANAS.map(s => (
            <button key={s} onClick={() => setSemanaSelecionada(s)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${semanaSelecionada === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {regionaisFiltrados.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px]">Nenhum regional encontrado</div>
        ) : (
          regionaisFiltrados.map((e) => (
            <div key={e.id} className="bg-slate-950 rounded-[2.2rem] p-6 shadow-xl border border-slate-800 flex flex-col gap-4 relative">
              <div className="flex justify-between items-start">
                <div className="flex flex-col text-left">
                  <span className="text-amber-500 text-[14px] font-[900] uppercase italic tracking-tight">{e.mes}</span>
                  <span className="text-white/40 text-[9px] font-black uppercase mt-1">{e.weekday}</span>
                </div>
                <div className="flex gap-1">
                  {podeEditarRegional(e) && (
                    <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e }); }} className="text-amber-500 bg-amber-500/10 p-2.5 rounded-xl active:scale-90 border border-amber-500/20"><Edit3 size={18} /></button>
                  )}
                  {isMaster && (
                    <button onClick={() => setConfirmaExclusao(e)} className="text-red-500 bg-red-500/10 p-2.5 rounded-xl active:scale-90 border border-red-500/20"><Trash2 size={18} /></button>
                  )}
                </div>
              </div>

              <div className="flex flex-col text-left">
                <h3 className="text-white text-2xl font-[900] uppercase italic leading-tight tracking-tighter">{e.sede}</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1.5 truncate opacity-80">{e.local}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white text-[12px] font-black uppercase italic"><Calendar size={14} className="text-amber-500" /> Dia {e.dia}</div>
                <div className="flex items-center gap-2 text-white text-[12px] font-black uppercase italic"><Clock size={14} className="text-amber-500" /> {e.hora}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => compartilharWapp(e)} className="w-full bg-white/10 text-white py-4 rounded-2xl active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                  <Share2 size={16} /> Enviar
                </button>
                <button onClick={() => setMapaSeletor(e)} className="w-full bg-amber-500 text-slate-950 py-4 rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                  <Navigation size={16} /> Rota
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {mapaSeletor && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 text-left">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6">Navegar para...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirMapa('google', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100"><Navigation size={20} className="text-blue-500" /><span className="text-[12px] font-black uppercase text-slate-950">Google Maps</span></button>
              <button onClick={() => abrirMapa('waze', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100"><Navigation size={20} className="text-teal-500" /><span className="text-[12px] font-black uppercase text-slate-950">Waze</span></button>
            </div>
            <button onClick={() => setMapaSeletor(null)} className="w-full mt-6 py-4 text-slate-400 text-[10px] font-black uppercase">Cancelar</button>
          </div>
        </div>, document.body
      )}

      {sugestaoAberta && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => setSugestaoAberta(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none">{isMaster ? 'Editar Regional' : 'Sugestão'}</h3>
            <form onSubmit={enviarSugestao} className="space-y-3 mt-6">
              <input type="text" value={formSugestao.local} onChange={ev => setFormSugestao({...formSugestao, local: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none shadow-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={formSugestao.dia} onChange={ev => setFormSugestao({...formSugestao, dia: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none shadow-none" />
                <input type="time" value={formSugestao.hora} onChange={ev => setFormSugestao({...formSugestao, hora: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none shadow-none" />
              </div>
              <input type="text" value={formSugestao.mes} onChange={ev => setFormSugestao({...formSugestao, mes: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none shadow-none" />
              <input type="text" value={formSugestao.weekday} onChange={ev => setFormSugestao({...formSugestao, weekday: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none shadow-none" />
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl flex justify-center items-center gap-2">
                <Send size={16}/> Enviar
              </button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosRegionais;