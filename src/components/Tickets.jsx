import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Lightbulb, Send, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Tickets = ({ user, userData, moduloAtual, titulosModulos }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [abaFeedback, setAbaFeedback] = useState('novo');
  const [tipoFeedback, setTipoFeedback] = useState('sugestao');
  const [textoFeedback, setTextoFeedback] = useState('');
  const [meusFeedbacks, setMeusFeedbacks] = useState([]);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "feedback_usuarios"),
      where("userId", "==", user.uid),
      orderBy("dataEnvio", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMeusFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const enviarFeedback = async (e) => {
    e.preventDefault();
    if (!user || !textoFeedback.trim()) return;
    setEnviandoFeedback(true);
    try {
      await addDoc(collection(db, "feedback_usuarios"), {
        userId: user.uid,
        userName: userData?.nome || user.email,
        moduloContexto: moduloAtual,
        tipo: tipoFeedback,
        mensagem: textoFeedback,
        status: 'pendente',
        dataEnvio: new Date()
      });
      setTextoFeedback('');
      setAbaFeedback('historico');
    } catch (err) { console.error(err); }
    finally { setEnviandoFeedback(false); }
  };

  const traduzirStatus = (s) => {
    const mapa = {
      'pendente': 'Enviado',
      'aprovado': 'Aprovado',
      'aplicado': '✅ Aplicado',
      'resolvido': '✅ Resolvido',
      'reprovado': 'Recusado',
      'não reproduzido': 'Não Reproduzido',
      'agradecido': '🙏 Gratidão'
    };
    return mapa[s] || s;
  };

  if (!user) return null;

  return (
    <>
      <button onClick={() => setShowFeedback(!showFeedback)} className={`fixed bottom-6 right-6 z-[1000] p-4 rounded-full shadow-2xl transition-all active:scale-90 ${showFeedback ? 'bg-amber-500 text-white rotate-12' : 'bg-white/20 text-slate-400 backdrop-blur-sm'}`}>
        <Lightbulb size={24} fill={showFeedback ? "currentColor" : "none"} />
      </button>

      {showFeedback && createPortal(
        <div onClick={() => setShowFeedback(false)} className="fixed inset-0 z-[2000] bg-slate-950/20 backdrop-blur-[2px] flex items-end justify-center p-4 pb-24">
          <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setAbaFeedback('novo')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${abaFeedback === 'novo' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Novo</button>
                <button onClick={() => setAbaFeedback('historico')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${abaFeedback === 'historico' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Histórico</button>
              </div>
              <button onClick={() => setShowFeedback(false)} className="p-2 bg-slate-50 text-slate-300 rounded-full"><X size={16}/></button>
            </div>

            {abaFeedback === 'novo' ? (
              <form onSubmit={enviarFeedback} className="space-y-4">
                <div className="bg-slate-50 px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-600 uppercase border border-slate-100">Tela: {titulosModulos[moduloAtual]?.p1} {titulosModulos[moduloAtual]?.p2}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['bug', 'sugestao', 'elogio'].map(t => (
                    <button key={t} type="button" onClick={() => setTipoFeedback(t)} className={`py-2 rounded-xl border text-[8px] font-black uppercase transition-all ${tipoFeedback === t ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {t === 'bug' ? '🐞 Bug' : t === 'sugestao' ? '💡 Idéia' : '⭐ Elogio'}
                    </button>
                  ))}
                </div>
                <textarea required maxLength={200} value={textoFeedback} onChange={(e) => setTextoFeedback(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-bold outline-none h-32 resize-none placeholder:text-slate-300" placeholder="No que podemos melhorar?" />
                <button disabled={enviandoFeedback} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all">
                  <Send size={14}/> {enviandoFeedback ? 'Enviando...' : 'Enviar Ticket'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pb-2">
                {meusFeedbacks.length === 0 ? <div className="py-12 text-center text-slate-300 text-[10px] font-black uppercase">Nenhum ticket enviado.</div> :
                  meusFeedbacks.map(f => (
                    <div key={f.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{f.tipo}</span>
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${f.status === 'aplicado' || f.status === 'resolvido' || f.status === 'agradecido' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {traduzirStatus(f.status)}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 leading-tight italic">"{f.mensagem}"</p>
                    </div>
                  ))
                }
              </div>
            )}
          </motion.div>
        </div>, document.body
      )}
    </>
  );
};

export default Tickets;