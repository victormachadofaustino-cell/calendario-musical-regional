import React, { useState, useEffect } from 'react'; // Importa a base do React para criar o componente.
import { createPortal } from 'react-dom'; // Importa o portal para renderizar o modal por cima de tudo.
import { db } from '../firebaseConfig'; // Importa a conexão com o banco de dados.
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // Ferramentas de dados do Firebase.
import { Lightbulb, Send, X, Clock } from 'lucide-react'; // Ícones visuais.
import { motion, AnimatePresence } from 'framer-motion'; // Ferramentas de animação.

const Tickets = ({ user, userData, moduloAtual, titulosModulos }) => { // Inicia o componente com os dados necessários.
  const [showFeedback, setShowFeedback] = useState(false); // Controla se a janelinha está aberta.
  const [abaFeedback, setAbaFeedback] = useState('novo'); // Alterna entre Novo e Histórico.
  const [tipoFeedback, setTipoFeedback] = useState('sugestao'); // Categoria do ticket.
  const [textoFeedback, setTextoFeedback] = useState(''); // O que o usuário escreve.
  const [meusFeedbacks, setMeusFeedbacks] = useState([]); // Lista de tickets anteriores.
  const [enviandoFeedback, setEnviandoFeedback] = useState(false); // Trava de segurança no envio.

  useEffect(() => { // Busca o histórico apenas se houver músico logado.
    if (!user) { // Se for visitante...
        setMeusFeedbacks([]); // Limpa a lista de mensagens.
        return; // Encerra a busca.
    }
    const q = query( // Prepara a consulta ao banco.
      collection(db, "feedback_usuarios"), // Pasta de feedbacks.
      where("userId", "==", user.uid), // Filtra pelo ID do músico.
      orderBy("dataEnvio", "desc") // Ordena por data.
    );
    const unsub = onSnapshot(q, (snap) => { // Ouve mudanças em tempo real.
      setMeusFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Atualiza a lista.
    });
    return () => unsub(); // Limpa o ouvinte ao sair.
  }, [user]); // Monitora login/logout.

  const enviarFeedback = async (e) => { // Função de envio do formulário.
    e.preventDefault(); // Evita recarregar a página.
    if (!textoFeedback.trim()) return; // Ignora se estiver vazio.
    setEnviandoFeedback(true); // Ativa carregamento.
    try {
      await addDoc(collection(db, "feedback_usuarios"), { // Salva o ticket no Firebase.
        userId: user ? user.uid : 'visitante', // ID real ou marca de visitante.
        userName: userData?.nome || (user ? user.email : 'Usuário Visitante'), // Nome, e-mail ou rótulo.
        moduloContexto: moduloAtual, // Tela onde o usuário estava.
        tipo: tipoFeedback, // Categoria selecionada.
        mensagem: textoFeedback, // O texto escrito.
        status: 'pendente', // Status inicial para o Master.
        dataEnvio: new Date() // Carimbo de tempo.
      });
      setTextoFeedback(''); // Limpa o campo de texto.
      if (user) { // Se músico logado...
        setAbaFeedback('historico'); // Mostra a lista dele.
      } else { // Se visitante...
        alert("Sugestão enviada com sucesso! Deus abençoe."); // Mensagem de sucesso.
        setShowFeedback(false); // Fecha o modal.
      }
    } catch (err) { console.error(err); } // Registra erros no console.
    finally { setEnviandoFeedback(false); } // Libera o botão.
  };

  const traduzirStatus = (s) => { // Tradutor de termos do banco.
    const mapa = {
      'pendente': 'Enviado',
      'aprovado': 'Aprovado',
      'aplicado': '✅ Aplicado',
      'resolvido': '✅ Resolvido',
      'reprovado': 'Recusado',
      'não reproduzido': 'Não Reproduzido',
      'agradecido': '🙏 Gratidão'
    };
    return mapa[s] || s; // Retorna o texto amigável.
  };

  return (
    <>
      <button 
        onClick={() => setShowFeedback(!showFeedback)} 
        className={`fixed bottom-6 right-6 z-[1000] p-4 rounded-full shadow-2xl transition-all active:scale-90 ${
          showFeedback ? 'bg-amber-500 text-white rotate-12' : 'bg-white/20 text-slate-400 backdrop-blur-sm'
        }`}
      >
        <Lightbulb size={24} fill={showFeedback ? "currentColor" : "none"} /> {/* Desenha o ícone com a cor corrigida. */}
      </button>

      {showFeedback && createPortal( // Abre o modal por cima de tudo.
        <div onClick={() => setShowFeedback(false)} className="fixed inset-0 z-[2000] bg-slate-950/20 backdrop-blur-[2px] flex items-end justify-center p-4 pb-24">
          <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              {user ? ( // Abas apenas para músicos oficiais.
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setAbaFeedback('novo')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${abaFeedback === 'novo' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Novo</button>
                  <button onClick={() => setAbaFeedback('historico')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${abaFeedback === 'historico' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Histórico</button>
                </div>
              ) : ( // Título simples para visitantes.
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Enviar Sugestão</span>
              )}
              <button onClick={() => setShowFeedback(false)} className="p-2 bg-slate-50 text-slate-300 rounded-full active:scale-90"><X size={16}/></button>
            </div>

            {abaFeedback === 'novo' ? ( // Formulário de escrita.
              <form onSubmit={enviarFeedback} className="space-y-4">
                <div className="bg-slate-50 px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-600 uppercase border border-slate-100">Tela: {titulosModulos[moduloAtual]?.p1} {titulosModulos[moduloAtual]?.p2}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['bug', 'sugestao', 'elogio'].map(t => ( // Botões de categoria.
                    <button key={t} type="button" onClick={() => setTipoFeedback(t)} className={`py-2 rounded-xl border text-[8px] font-black uppercase transition-all ${tipoFeedback === t ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {t === 'bug' ? '🐞 Bug' : t === 'sugestao' ? '💡 Idéia' : '⭐ Elogio'}
                    </button>
                  ))}
                </div>
                <textarea required maxLength={200} value={textoFeedback} onChange={(e) => setTextoFeedback(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-bold outline-none h-32 resize-none placeholder:text-slate-300" placeholder="Encontrou um erro ou tem uma ideia? Conte para nós..." />
                <button disabled={enviandoFeedback} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all">
                  <Send size={14}/> {enviandoFeedback ? 'Enviando...' : 'Enviar Ticket'}
                </button>
              </form>
            ) : ( // Lista de histórico para logados.
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

export default Tickets; // Exporta o instrumento para a orquestra principal.