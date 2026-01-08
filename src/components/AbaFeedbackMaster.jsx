import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Check, X, Trash2, Clock, CheckCircle2, Bug, Lightbulb } from 'lucide-react';

const AbaFeedbackMaster = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cálculo para eliminar da visão bugs resolvidos há mais de 10 dias
    const limiteDias = new Date();
    limiteDias.setDate(limiteDias.getDate() - 10);

    const q = query(collection(db, "feedback_usuarios"), orderBy("dataEnvio", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const filtrados = todos.filter(t => {
        // Se for bug e já estiver resolvido/não reproduzido
        if (t.tipo === 'bug' && (t.status === 'resolvido' || t.status === 'não reproduzido')) {
          const dataAcao = t.dataAcaoMaster?.toDate() || new Date();
          return dataAcao > limiteDias; // Só mantém se tiver menos de 10 dias
        }
        return true;
      });

      setTickets(filtrados);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const alterarStatus = async (id, novoStatus) => {
    try {
      await updateDoc(doc(db, "feedback_usuarios", id), { 
        status: novoStatus,
        dataAcaoMaster: new Date() 
      });
    } catch (err) { console.error(err); }
  };

  const excluirTicket = async (id) => {
    try { await deleteDoc(doc(db, "feedback_usuarios", id)); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-black uppercase text-[10px]">Carregando Tickets...</div>;

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <div className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">Nenhum ticket pendente.</div>
      ) : (
        tickets.map(t => (
          <div key={t.id} className="bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-sm relative overflow-hidden text-left">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              t.status === 'aplicado' || t.status === 'resolvido' || t.status === 'agradecido' ? 'bg-green-500' : 
              t.status === 'reprovado' || t.status === 'não reproduzido' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-900">{t.userName}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase italic">Módulo: {t.moduloContexto}</span>
              </div>
              <span className="text-[12px]">{t.tipo === 'bug' ? '🐞' : t.tipo === 'elogio' ? '🙏' : '💡'}</span>
            </div>

            <p className="text-[11px] font-bold text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl italic">"{t.mensagem}"</p>

            <div className="flex justify-between items-center border-t pt-3">
               <span className="text-[8px] font-black text-slate-300 uppercase">Status: {t.status}</span>
               
               <div className="flex gap-2">
                 {/* ELOGIO */}
                 {t.tipo === 'elogio' && t.status === 'pendente' && (
                    <button onClick={() => alterarStatus(t.id, 'agradecido')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                      <span className="text-sm">🙏</span><span className="text-[8px] font-black uppercase">Gratidão</span>
                    </button>
                 )}

                 {/* BUG */}
                 {t.tipo === 'bug' && t.status === 'pendente' && (
                   <>
                     <button onClick={() => alterarStatus(t.id, 'resolvido')} className="p-2 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase active:scale-95">Resolvido</button>
                     <button onClick={() => alterarStatus(t.id, 'não reproduzido')} className="p-2 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase active:scale-95">Não Reprod.</button>
                   </>
                 )}

                 {/* SUGESTÃO */}
                 {t.tipo === 'sugestao' && (
                   <>
                     {t.status === 'pendente' && (
                       <>
                        <button onClick={() => alterarStatus(t.id, 'aprovado')} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase active:scale-95">Aprovar</button>
                        <button onClick={() => alterarStatus(t.id, 'reprovado')} className="p-2 bg-red-50 text-red-600 rounded-lg text-[8px] font-black uppercase active:scale-95">Reprovar</button>
                       </>
                     )}
                     {t.status === 'aprovado' && (
                       <button onClick={() => alterarStatus(t.id, 'aplicado')} className="p-2 bg-green-500 text-white rounded-lg flex items-center gap-1 animate-pulse active:scale-95">
                         <CheckCircle2 size={14}/><span className="text-[8px] font-black uppercase">Aplicar Agora</span>
                       </button>
                     )}
                   </>
                 )}
                 
                 <button onClick={() => excluirTicket(t.id)} className="p-2 bg-slate-100 text-slate-400 rounded-lg active:scale-90"><Trash2 size={14}/></button>
               </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AbaFeedbackMaster;