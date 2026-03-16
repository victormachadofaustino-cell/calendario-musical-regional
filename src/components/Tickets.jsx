import React, { useState, useEffect } from 'react'; // Importa a base do React para criar o componente e gerenciar memória.
import { createPortal } from 'react-dom'; // Importa o portal para renderizar o modal por cima de toda a interface do app.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco de dados da Regional.
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // Ferramentas para enviar e ler dados em tempo real.
import { Lightbulb, Send, X, Clock, MessageSquare, AlertCircle, Filter, CheckCircle2 } from 'lucide-react'; // Ícones visuais para suporte e filtragem.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para fazer o modal subir e descer suavemente.

// Este componente é a "Lâmpada": agora maior, com filtros e exibição de datas para o irmão.
const Tickets = ({ user, userData, moduloAtual, titulosModulos }) => { 
  const [showFeedback, setShowFeedback] = useState(false); // Controla se a janelinha do suporte está aberta na tela.
  const [abaFeedback, setAbaFeedback] = useState('novo'); // Alterna entre a tela de "Escrever Novo" e "Meus Chamados".
  const [tipoFeedback, setTipoFeedback] = useState('sugestao'); // Categoria do ticket (Bug, Ideia ou Elogio).
  const [textoFeedback, setTextoFeedback] = useState(''); // Guarda o texto que o irmão está digitando.
  const [meusFeedbacks, setMeusFeedbacks] = useState([]); // Lista de tickets que este irmão já enviou.
  const [enviandoFeedback, setEnviandoFeedback] = useState(false); // Trava de segurança no botão para evitar cliques duplos.
  const [filtroHistorico, setFiltroHistorico] = useState('todos'); // Estado para filtrar entre abertos e concluídos no histórico.

  // 1. ESCUTA O HISTÓRICO: Busca os tickets deste usuário específico em tempo real.
  useEffect(() => { 
    if (!user) { // Se não houver login, limpa a lista.
        setMeusFeedbacks([]); 
        return; 
    }
    const q = query( // Prepara a busca no banco de dados.
      collection(db, "feedback_usuarios"), 
      where("userId", "==", user.uid), 
      orderBy("dataEnvio", "desc") // Pela data, do mais novo para o antigo.
    );
    const unsub = onSnapshot(q, (snap) => { // Cria a escuta real-time.
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // LÓGICA DE ORDENAÇÃO EXECUTIVA:
      const ordenados = dados.sort((a, b) => {
        const statusA = a.status === 'pendente' ? 0 : 1; // Peso para pendentes subirem.
        const statusB = b.status === 'pendente' ? 0 : 1;
        if (statusA !== statusB) return statusA - statusB;

        const respA = (a.respostaMaster && a.status !== 'resolvido') ? 0 : 1; // Peso para respondidos subirem.
        const respB = (b.respostaMaster && b.status !== 'resolvido') ? 0 : 1;
        if (respA !== respB) return respA - respB;

        return b.dataEnvio?.toDate() - a.dataEnvio?.toDate(); // Ordenação final por data.
      });

      setMeusFeedbacks(ordenados); // Salva a lista organizada.
    });
    return () => unsub(); // Limpa a conexão ao fechar.
  }, [user]);

  // 2. FUNÇÃO DE ENVIO: Grava o pedido do irmão no banco.
  const enviarFeedback = async (e) => { 
    e.preventDefault(); 
    if (!textoFeedback.trim()) return; 
    setEnviandoFeedback(true); 
    try {
      await addDoc(collection(db, "feedback_usuarios"), { 
        userId: user ? user.uid : 'visitante', 
        userName: userData?.nome || (user ? user.email : 'Visitante'), 
        moduloContexto: moduloAtual, 
        tipo: tipoFeedback, 
        mensagem: textoFeedback, 
        status: 'pendente', 
        prioridade: 'normal', 
        dataEnvio: new Date() 
      });
      setTextoFeedback(''); 
      if (user) setAbaFeedback('historico'); 
      else setShowFeedback(false);
    } catch (err) { console.error(err); } 
    finally { setEnviandoFeedback(false); }
  };

  // 3. TRADUTORES VISUAIS: Formata status e data para o irmão.
  const traduzirStatus = (s) => { 
    const mapa = {
      'pendente': 'Enviado', 'analise': '🔍 Em Análise', 'aprovado': '💡 Ideia Aprovada',
      'aplicado': '✅ No App!', 'resolvido': '✅ Finalizado', 'reprovado': 'Recusado',
      'não reproduzido': 'Não localizado', 'agradecido': '🙏 Gratidão'
    };
    return mapa[s] || s; 
  };

  // FUNÇÃO AUXILIAR: Transforma o carimbo do banco em data de calendário.
  const formatarData = (d) => {
    if (!d) return ""; // Se não tiver data, volta vazio.
    return d.toDate().toLocaleDateString('pt-BR'); // Formata para Dia/Mês/Ano.
  };

  // 4. FILTRAGEM DO HISTÓRICO: Filtra a lista baseada no botão de filtro escolhido.
  const feedbacksFiltrados = meusFeedbacks.filter(f => {
    if (filtroHistorico === 'abertos') return f.status === 'pendente' || f.status === 'analise';
    if (filtroHistorico === 'concluidos') return f.status === 'aplicado' || f.status === 'resolvido';
    return true; 
  });

  return (
    <>
      {/* BOTÃO FLUTUANTE DA LÂMPADA */}
      <button 
        onClick={() => setShowFeedback(!showFeedback)} 
        className={`fixed bottom-6 right-6 z-[1000] p-4 rounded-full shadow-2xl transition-all active:scale-90 ${
          showFeedback ? 'bg-amber-500 text-white rotate-12' : 'bg-white/20 text-slate-400 backdrop-blur-sm border border-white/30'
        }`}
      >
        <Lightbulb size={24} fill={showFeedback ? "currentColor" : "none"} />
      </button>

      {/* MODAL DE SUPORTE MAIOR NA TELA */}
      {showFeedback && createPortal( 
        <div onClick={() => setShowFeedback(false)} className="fixed inset-0 z-[2000] bg-slate-950/40 backdrop-blur-[4px] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            onClick={e => e.stopPropagation()} 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-[#F8FAFC] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* CABEÇALHO DO MODAL COM ABAS */}
            <div className="flex justify-between items-center mb-6 shrink-0">
              {user ? (
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                  <button onClick={() => setAbaFeedback('novo')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${abaFeedback === 'novo' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Novo Ticket</button>
                  <button onClick={() => setAbaFeedback('historico')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${abaFeedback === 'historico' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Meus Chamados</button>
                </div>
              ) : ( 
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Enviar Sugestão</span>
              )}
              <button onClick={() => setShowFeedback(false)} className="p-2.5 bg-white text-slate-300 rounded-full shadow-sm active:scale-90"><X size={18}/></button>
            </div>

            {abaFeedback === 'novo' ? ( 
              /* TELA DE CRIAÇÃO */
              <form onSubmit={enviarFeedback} className="space-y-4 overflow-y-auto no-scrollbar">
                <div className="bg-white px-4 py-3 rounded-2xl text-[10px] font-bold text-slate-500 uppercase border border-slate-100 shadow-sm">Contexto: {titulosModulos[moduloAtual]?.p1} {titulosModulos[moduloAtual]?.p2}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['bug', 'sugestao', 'elogio'].map(t => ( 
                    <button key={t} type="button" onClick={() => setTipoFeedback(t)} className={`py-3 rounded-2xl border text-[9px] font-black uppercase transition-all ${tipoFeedback === t ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {t === 'bug' ? '🐞 Erro' : t === 'sugestao' ? '💡 Idéia' : '⭐ Elogio'}
                    </button>
                  ))}
                </div>
                <textarea required maxLength={250} value={textoFeedback} onChange={(e) => setTextoFeedback(e.target.value)} className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 text-[12px] font-bold outline-none h-48 resize-none placeholder:text-slate-300 shadow-inner focus:ring-2 focus:ring-amber-500/20" placeholder="Conte para o Maestro o que aconteceu..." />
                <button disabled={enviandoFeedback} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all"><Send size={16}/> {enviandoFeedback ? 'Sincronizando...' : 'Enviar ao Maestro'}</button>
              </form>
            ) : ( 
              /* TELA DE HISTÓRICO COM DATA DO CHAMADO */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar shrink-0">
                   {['todos', 'abertos', 'concluidos'].map(f => (
                     <button key={f} onClick={() => setFiltroHistorico(f)} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase border transition-all ${filtroHistorico === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{f}</button>
                   ))}
                </div>

                <div className="space-y-4 overflow-y-auto no-scrollbar pb-6 pr-1">
                  {feedbacksFiltrados.length === 0 ? <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3"><CheckCircle2 size={40}/><p className="text-[10px] font-black uppercase">Nenhum ticket aqui</p></div> :
                    feedbacksFiltrados.map(f => (
                      <div key={f.id} className={`bg-white p-5 rounded-[2.2rem] border transition-all relative shadow-sm ${f.status === 'pendente' ? 'border-amber-100 ring-1 ring-amber-50' : 'border-slate-100'}`}>
                        
                        <div className={`absolute top-4 right-5 px-2 py-0.5 rounded-md text-[6px] font-black uppercase ${f.prioridade === 'critica' ? 'bg-red-100 text-red-600' : f.prioridade === 'alta' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                          Prioridade: {f.prioridade || 'Normal'}
                        </div>

                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1.5 items-center">
                             <span className="text-[7px] font-[900] uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{f.tipo}</span>
                             <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${f.status === 'aplicado' || f.status === 'resolvido' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{traduzirStatus(f.status)}</span>
                             {/* DATA DO CHAMADO: Mostra quando o irmão enviou o pedido */}
                             <div className="flex items-center gap-1 ml-1 opacity-40">
                               <Clock size={8} />
                               <span className="text-[7px] font-black">{formatarData(f.dataEnvio)}</span>
                             </div>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic mb-3">"{f.mensagem}"</p>
                        
                        {f.respostaMaster && (
                          <div className="mt-3 pt-3 border-t border-dashed border-slate-100 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-1.5 mb-2"><div className="w-1 h-3 bg-blue-600 rounded-full" /><span className="text-[7px] font-black uppercase text-blue-600 tracking-widest">Resposta do Maestro</span></div>
                            <p className="text-[11px] font-black text-slate-800 leading-tight bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50">{f.respostaMaster}</p>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </motion.div>
        </div>, document.body
      )}
    </>
  );
};

export default Tickets; // Exporta o componente completo com data e histórico.