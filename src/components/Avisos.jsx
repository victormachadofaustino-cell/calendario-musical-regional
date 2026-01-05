import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Loader2, BookOpen, CheckCircle2, XCircle, Clock, Plus, Trash2, Edit3, X, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import Feedback from './Feedback';
import OrquestraDiagrama from './OrquestraDiagrama';

const Avisos = ({ user }) => {
  const [avisos, setAvisos] = useState([]);
  const [linhasTabela, setLinhasTabela] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editandoLinha, setEditandoLinha] = useState(null);
  const [mostraAdd, setMostraAdd] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const isMaster = user?.nivel === 'master';
  const [formAviso, setFormAviso] = useState({ titulo: '', conteudo: '', ordem: 1, prioridade: 'normal', categoria: 'Instrução', tituloSecundario: '', cordas: '', madeiras: '', metais: '' });
  const [formLinha, setFormLinha] = useState({ s: '', o: true, n: true, rb: true, rnb: true, me: true });

  useEffect(() => {
    const unsubAvisos = onSnapshot(query(collection(db, "avisos"), orderBy("ordem", "asc")), (snap) => {
      setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubTabela = onSnapshot(query(collection(db, "tabela_permissoes"), orderBy("ordem", "asc")), (snap) => {
      setLinhasTabela(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAvisos(); unsubTabela(); };
  }, []);

  const handleSalvarAviso = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (editando) await updateDoc(doc(db, "avisos", editando.id), formAviso);
      else await addDoc(collection(db, "avisos"), { ...formAviso, data: new Date() });
      setFeedback({ msg: "Atualizado!", tipo: 'sucesso' });
      setMostraAdd(false);
    } catch (err) { setFeedback({ msg: "Erro", tipo: 'erro' }); }
    finally { setEnviando(false); }
  };

  const handleSalvarLinha = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await updateDoc(doc(db, "tabela_permissoes", editandoLinha.id), formLinha);
      setFeedback({ msg: "Tabela salva!", tipo: 'sucesso' });
      setEditandoLinha(null);
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); }
    finally { setEnviando(false); }
  };

  const fecharModal = () => { setMostraAdd(false); setEditando(null); };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;

  const cabecalho = avisos.find(a => a.categoria === 'Cabecalho');
  const instrucoes = avisos.filter(a => a.categoria === 'Instrução');
  const diagramaMeta = avisos.find(a => a.categoria === 'Diagrama');

  return (
    <div className="flex flex-col animate-in px-6 py-6 space-y-6 pb-24 text-left no-scrollbar relative">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      {/* 1. CABEÇALHO COM DATA ENFATIZADA */}
      <div className="relative">
        <div className="border-2 border-slate-950 p-6 rounded-[2.5rem] text-center space-y-4 bg-white shadow-sm">
          <h2 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">{cabecalho?.titulo}</h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight px-4 whitespace-pre-line">{cabecalho?.conteudo}</p>
          <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2 rounded-full shadow-md">
              <Clock size={14} className="text-amber-400" /><span className="text-[12px] font-[900] uppercase italic tracking-tighter">{cabecalho?.tituloSecundario}</span>
            </div>
          </div>
        </div>
        {isMaster && cabecalho && <button onClick={() => { setEditando(cabecalho); setFormAviso(cabecalho); setMostraAdd(true); }} className="absolute -top-2 -right-2 p-3 bg-amber-500 text-white rounded-full shadow-lg border-2 border-white active:scale-90"><Edit3 size={16}/></button>}
      </div>

      {/* 2. ORIENTAÇÕES */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-[1px] flex-grow bg-slate-200"></div><h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Instruções</h3><div className="h-[1px] flex-grow bg-slate-200"></div>
        {isMaster && <button onClick={() => { setEditando(null); setFormAviso({titulo:'', conteudo:'', ordem: instrucoes.length + 1, prioridade:'normal', categoria:'Instrução'}); setMostraAdd(true); }} className="bg-slate-950 text-white p-2 rounded-full active:scale-90"><Plus size={16}/></button>}
      </div>
      <div className="space-y-4">
        {instrucoes.map((aviso) => (
          <div key={aviso.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4 relative">
            <div className="flex gap-4"><span className="text-2xl font-[900] italic text-slate-200 leading-none">{aviso.ordem}</span>
            <div className="flex flex-col gap-1 pr-16"><h4 className="text-slate-950 font-[900] text-[11px] uppercase tracking-wider">{aviso.titulo}</h4><p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase">{aviso.conteudo}</p></div></div>
            {isMaster && <div className="absolute top-4 right-4 flex flex-col gap-2"><button onClick={() => { setEditando(aviso); setFormAviso(aviso); setMostraAdd(true); }} className="p-2.5 bg-amber-100 text-amber-600 rounded-xl active:scale-90"><Edit3 size={16}/></button><button onClick={() => deleteDoc(doc(db, "avisos", aviso.id))} className="p-2.5 bg-red-100 text-red-600 rounded-xl active:scale-90"><Trash2 size={16}/></button></div>}
          </div>
        ))}
      </div>

      {/* 3. ORDEM DOS INSTRUMENTOS */}
      <div className="flex items-center gap-3 pt-4"><div className="h-[1px] flex-grow bg-slate-200"></div><h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Diagrama</h3><div className="h-[1px] flex-grow bg-slate-200"></div></div>
      <div className="relative">
        <OrquestraDiagrama dados={diagramaMeta} />
        {isMaster && <button onClick={() => { setEditando(diagramaMeta); setFormAviso(diagramaMeta); setMostraAdd(true); }} className="absolute top-4 right-4 p-2.5 bg-amber-500 text-white rounded-full border-2 border-white active:scale-90"><Edit3 size={16}/></button>}
      </div>

      {/* 4. TABELA OTIMIZADA DESIGN UI */}
      <div className="flex items-center gap-3 pt-4"><div className="h-[1px] flex-grow bg-slate-200"></div><h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Onde Poderei Tocar</h3><div className="h-[1px] flex-grow bg-slate-200"></div></div>
      
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative mt-12">
        <div className="overflow-x-auto no-scrollbar pt-20">
          <table className="w-full text-[8px] font-black uppercase border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="p-4 text-left border-b-2 border-slate-950 leading-tight bg-slate-950 text-white min-w-[140px] sticky left-0 z-20 rounded-tr-[2rem]">
                  Classificação do Serviço
                </th>
                {["Oficializado", "Não Oficial.", "RJM (Bat.)", "RJM (Ñ Bat.)", "Ensaios"].map((tit, idx) => (
                  <th key={idx} className="border-b-2 border-slate-950 relative h-16 min-w-[50px] px-0">
                    <div className="absolute -top-16 left-0 right-0 bottom-0 flex items-end justify-center pb-2">
                      <span className="inline-block transform -rotate-[45deg] whitespace-nowrap text-slate-950 text-[7px] font-black tracking-tighter w-full text-center origin-bottom-left ml-6">
                        {tit}
                      </span>
                    </div>
                  </th>
                ))}
                {isMaster && <th className="border-b-2 border-slate-950 p-2 bg-slate-950 text-white">#</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhasTabela.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  <td className="p-4 text-slate-950 font-black border-r border-slate-100 leading-tight sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {row.s}
                  </td>
                  {[row.o, row.n, row.rb, row.rnb, row.me].map((val, idx) => (
                    <td key={idx} className={`p-2 text-center border-slate-100 ${idx < 4 ? 'border-r' : ''}`}>
                      <div className="flex flex-col items-center justify-center">
                        {typeof val === 'string' ? (
                          <>
                            {val.includes('SIM') ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                            <span className="text-[6px] font-black mt-0.5 text-slate-400">{val.replace('SIM', '').replace('NÃO', '')}</span>
                          </>
                        ) : (
                          val ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />
                        )}
                      </div>
                    </td>
                  ))}
                  {isMaster && (
                    <td className="p-2 text-center bg-inherit">
                      <button onClick={() => { setEditandoLinha(row); setFormLinha(row); }} className="text-amber-500 active:scale-90"><Edit3 size={14}/></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-950 p-5 space-y-2">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            <span className="text-amber-500 mr-1 italic">1 -</span> Somente na Região do seu Município
          </p>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            <span className="text-amber-500 mr-1 italic">2 -</span> Conforme circular 145/2022
          </p>
        </div>
      </div>

      <div className="pt-4 flex flex-col items-center gap-2 opacity-30 pb-10">
        <BookOpen size={16} />
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-center">Regional Jundiaí • Oficial</span>
      </div>

      {/* MODAIS DE EDIÇÃO */}
      {editandoLinha && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setEditandoLinha(null)}></div>
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative text-left animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-950 mb-6">Editar Serviço</h3>
            <form onSubmit={handleSalvarLinha} className="space-y-4">
              <input required type="text" value={formLinha.s} onChange={e => setFormLinha({...formLinha, s: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold uppercase outline-none" />
              <div className="grid grid-cols-2 gap-3">
                {['o', 'n', 'rb', 'rnb', 'me'].map(key => (
                  <button key={key} type="button" onClick={() => setFormLinha({...formLinha, [key]: typeof formLinha[key] === 'boolean' ? !formLinha[key] : (formLinha[key].includes('SIM') ? 'NÃO' + formLinha[key].replace('SIM', '') : 'SIM' + formLinha[key].replace('NÃO', ''))})} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${formLinha[key] === true || (typeof formLinha[key] === 'string' && formLinha[key].includes('SIM')) ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {key}: {formLinha[key] === true || (typeof formLinha[key] === 'string' && formLinha[key].includes('SIM')) ? 'SIM' : 'NÃO'}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] mt-4 shadow-xl">Salvar Tabela</button>
            </form>
          </div>
        </div>, document.body
      )}

      {mostraAdd && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={fecharModal}></div>
          <div className="bg-white w-full max-w-[360px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left overflow-y-auto max-h-[90vh]">
            <button onClick={fecharModal} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-6 leading-none">{editando ? 'Editar' : 'Novo'} {formAviso.categoria}</h3>
            <form onSubmit={handleSalvarAviso} className="space-y-4">
              {formAviso.categoria === 'Diagrama' ? (
                <div className="space-y-4">
                  {['cordas', 'madeiras', 'metais'].map(sec => <div key={sec} className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">{sec}</span><textarea rows="3" value={formAviso[sec]} onChange={ev => setFormAviso({...formAviso, [sec]: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none resize-none" /></div>)}
                </div>
              ) : (
                <div className="space-y-3">
                  <input required type="text" value={formAviso.titulo} onChange={ev => setFormAviso({...formAviso, titulo: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold uppercase outline-none" placeholder="Título" />
                  <textarea required rows="4" value={formAviso.conteudo} onChange={ev => setFormAviso({...formAviso, conteudo: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold uppercase resize-none outline-none" placeholder="Conteúdo" />
                  {formAviso.categoria === 'Cabecalho' && <input type="text" value={formAviso.tituloSecundario} onChange={ev => setFormAviso({...formAviso, tituloSecundario: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" placeholder="Data da Reunião" />}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2"><input required type="number" value={formAviso.ordem} onChange={ev => setFormAviso({...formAviso, ordem: Number(ev.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold" /><select value={formAviso.prioridade} onChange={ev => setFormAviso({...formAviso, prioridade: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase"><option value="normal">Normal</option><option value="alta">Alta</option></select></div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] mt-4 shadow-xl transition-all"><Send size={16}/> {enviando ? 'Gravando...' : 'Salvar Alterações'}</button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Avisos;