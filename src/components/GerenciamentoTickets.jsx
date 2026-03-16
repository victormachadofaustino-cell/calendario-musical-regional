import React, { useState, useEffect } from 'react'; // Ferramenta base do React para gerenciar memória e o que aparece na tela.
import { db } from '../firebaseConfig'; // Conexão oficial com o banco de dados da Regional.
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Ferramentas para ler, salvar e apagar dados no banco.
import { 
  CheckCircle2, Clock, Bug, Lightbulb, Star, Trash2, 
  MessageSquare, ChevronRight, AlertCircle, X, Send, Filter, AlertTriangle, Archive 
} from 'lucide-react'; // Biblioteca de ícones para dar o visual profissional de painel de controle.
import Feedback from './Feedback'; // Componente de avisos coloridos (sucesso ou erro).

// Este componente é o Centro de Comando de Suporte, focado em organização por prioridade e status.
const GerenciamentoTickets = ({ user }) => {
  const [tickets, setTickets] = useState([]); // Lista principal que guarda todos os chamados vindos do banco.
  const [loading, setLoading] = useState(true); // Controla o estado de "Carregando" ao abrir a tela.
  const [filtroStatus, setFiltroStatus] = useState('pendente'); // Filtro principal: Novo, Em Análise, Aprovado, Concluído ou Arquivado.
  const [feedback, setFeedback] = useState(null); // Controla os balões de aviso na parte de cima da tela.
  const [respostaTexto, setRespostaTexto] = useState({}); // Guarda o texto que você está digitando para responder ao irmão.

  // 1. ESCUTA INTELIGENTE: Busca todos os tickets e organiza por urgência automaticamente.
  useEffect(() => {
    const q = query(collection(db, "feedback_usuarios"), orderBy("dataEnvio", "desc")); // Pega os chamados do mais novo para o mais antigo.
    const unsub = onSnapshot(q, (snap) => { // Abre o canal de comunicação em tempo real.
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() })); // Transforma os dados brutos em uma lista organizada.
      
      // LÓGICA DE MAGNETISMO: Coloca o que é "Crítico" e "Alta" no topo da fila de trabalho.
      const ordenados = todos.sort((a, b) => {
        const peso = { 'critica': 3, 'alta': 2, 'normal': 1, 'baixa': 0 }; // Define o valor de cada urgência.
        return (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0); // Joga os valores maiores para cima.
      });

      setTickets(ordenados); // Salva a lista já arrumada na memória do aplicativo.
      setLoading(false); // Remove o aviso de carregamento.
    });
    return () => unsub(); // Desliga a conexão ao sair para não gastar internet.
  }, []);

  // 2. FUNÇÕES DE GESTÃO DO MAESTRO: Alterar o destino de cada chamado.
  const gerenciarTicket = async (id, novosDados) => {
    try {
      await updateDoc(doc(db, "feedback_usuarios", id), { 
        ...novosDados, // Aplica as mudanças (status, prioridade ou resposta).
        dataAcaoMaster: new Date() // Carimba o horário que o Master mexeu no ticket.
      });
      setFeedback({ msg: "Ticket atualizado com sucesso!", tipo: 'sucesso' }); // Avisa que deu certo.
    } catch (err) { setFeedback({ msg: "Falha ao atualizar", tipo: 'erro' }); }
  };

  const excluirTicket = async (id) => {
    if (!window.confirm("Isso apagará o registro para sempre do banco de dados. Confirma?")) return; // Trava de segurança para não apagar por erro.
    try {
      await deleteDoc(doc(db, "feedback_usuarios", id)); // Remove do banco de dados definitivamente.
      setFeedback({ msg: "Registro excluído permanentemente", tipo: 'sucesso' });
    } catch (err) { setFeedback({ msg: "Erro ao excluir", tipo: 'erro' }); }
  };

  // 3. CÁLCULO DE TEMPO: Mostra há quanto tempo o irmão enviou o pedido.
  const calcularTempo = (data) => {
    if (!data) return "..."; // Se não houver data, retorna vazio.
    const diff = Math.floor((new Date() - data.toDate()) / (1000 * 60 * 60)); // Calcula a diferença em horas.
    if (diff < 1) return "Agora mesmo"; // Menos de 1 hora.
    if (diff < 24) return `Há ${diff} horas`; // Menos de 1 dia.
    return `Há ${Math.floor(diff / 24)} dias`; // Contagem em dias.
  };

  // 4. MOTOR DE FILTRAGEM: Decide o que aparece na tela baseado no botão clicado no topo.
  const ticketsVisiveis = tickets.filter(t => {
    if (filtroStatus === 'pendente') return t.status === 'pendente'; // Mostra apenas o que é novo.
    if (filtroStatus === 'analise') return t.status === 'analise'; // Mostra o que você está estudando.
    if (filtroStatus === 'aprovado') return t.status === 'aprovado'; // Mostra ideias boas esperando código.
    if (filtroStatus === 'concluido') return t.status === 'resolvido' || t.status === 'aplicado'; // Mostra o que deu certo e foi entregue.
    if (filtroStatus === 'arquivado') return t.status === 'reprovado'; // NOVO: Mostra os chamados recusados/arquivados.
    return false;
  });

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-[10px] uppercase text-slate-400">Sincronizando Mesa de Comando...</div>;

  return ( // Início da estrutura visual profissional.
    <div className="flex flex-col animate-in px-6 py-4 space-y-6 pb-32 text-left">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      {/* PAINEL DE FILTROS (PIPELINE) - ONDE VOCÊ SE LOCALIZA */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar gap-1">
        <button onClick={() => setFiltroStatus('pendente')} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase whitespace-nowrap transition-all ${filtroStatus === 'pendente' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>Novos ({tickets.filter(t=>t.status==='pendente').length})</button>
        <button onClick={() => setFiltroStatus('analise')} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase whitespace-nowrap transition-all ${filtroStatus === 'analise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Análise ({tickets.filter(t=>t.status==='analise').length})</button>
        <button onClick={() => setFiltroStatus('aprovado')} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase whitespace-nowrap transition-all ${filtroStatus === 'aprovado' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}>Aprovados ({tickets.filter(t=>t.status==='aprovado').length})</button>
        <button onClick={() => setFiltroStatus('concluido')} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase whitespace-nowrap transition-all ${filtroStatus === 'concluido' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}>Concluídos</button>
        <button onClick={() => setFiltroStatus('arquivado')} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase whitespace-nowrap transition-all ${filtroStatus === 'arquivado' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}>Recusados</button>
      </div>

      {/* LISTA DE CARDS DE GESTÃO */}
      <div className="space-y-5">
        {ticketsVisiveis.length === 0 ? (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-400">Nenhum registro nesta fase</p>
          </div>
        ) : (
          ticketsVisiveis.map(t => (
            <div key={t.id} className={`bg-white rounded-[2.2rem] p-6 shadow-sm border transition-all relative overflow-hidden ${t.prioridade === 'critica' ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'}`}>
              
              {/* TAG DE PRIORIDADE NO CANTO */}
              <div className={`absolute top-4 right-6 px-3 py-1 rounded-full text-[7px] font-black uppercase italic ${
                t.prioridade === 'critica' ? 'bg-red-100 text-red-600 animate-pulse' : 
                t.prioridade === 'alta' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {t.prioridade || 'Normal'}
              </div>

              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2">
                  {t.tipo === 'bug' ? <Bug size={14} className="text-red-500" /> : t.tipo === 'elogio' ? <Star size={14} className="text-amber-500 fill-amber-500" /> : <Lightbulb size={14} className="text-blue-500" />}
                  <span className="text-[11px] font-[900] uppercase text-slate-900 leading-none">{t.userName}</span>
                </div>
                <div className="flex gap-2 mt-1.5 items-center">
                  <span className="text-[7px] font-bold text-slate-400 uppercase italic">Módulo: {t.moduloContexto}</span>
                  <span className="text-[7px] font-black text-blue-600 uppercase tracking-tighter">● {calcularTempo(t.dataEnvio)}</span>
                </div>
              </div>

              {/* CONTEÚDO DO CHAMADO */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4">
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{t.mensagem}"</p>
              </div>

              {/* CAMPO DE RESPOSTA DO MASTER (DIÁLOGO COM O IRMÃO) */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-1.5 ml-2">
                  <MessageSquare size={10} className="text-slate-400" />
                  <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Sua Resposta:</span>
                </div>
                <div className="relative">
                  <textarea 
                    placeholder="Dê um retorno ao irmão justificando a solução ou a recusa..."
                    value={respostaTexto[t.id] || t.respostaMaster || ''}
                    onChange={(e) => setRespostaTexto({...respostaTexto, [t.id]: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-slate-900 min-h-[70px] resize-none shadow-inner"
                  />
                  <button 
                    onClick={() => gerenciarTicket(t.id, { respostaMaster: respostaTexto[t.id] })}
                    className="absolute bottom-2 right-2 p-2.5 bg-slate-900 text-white rounded-lg active:scale-90 transition-all shadow-md"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>

              {/* PAINEL DE AÇÕES RÁPIDAS (RODAPÉ DO CARD) */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50 justify-between items-center">
                <div className="flex gap-1.5">
                  {/* SELETOR DE PRIORIDADE */}
                  <select 
                    onChange={(e) => gerenciarTicket(t.id, { prioridade: e.target.value })}
                    className="bg-slate-100 border-none text-[8px] font-black uppercase rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                    value={t.prioridade || 'normal'}
                  >
                    <option value="critica">🔥 Crítica</option>
                    <option value="alta">⚡ Alta</option>
                    <option value="normal">✅ Normal</option>
                    <option value="baixa">💤 Baixa</option>
                  </select>

                  {/* SELETOR DE STATUS (O FUNIL PROFISSIONAL) */}
                  <select 
                    onChange={(e) => gerenciarTicket(t.id, { status: e.target.value })}
                    className={`text-white border-none text-[8px] font-black uppercase rounded-lg px-2 py-1.5 outline-none cursor-pointer ${
                      t.status === 'reprovado' ? 'bg-red-500' : 'bg-slate-900'
                    }`}
                    value={t.status}
                  >
                    <option value="pendente">Novo</option>
                    <option value="analise">Em Análise</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="resolvido">Finalizado</option>
                    <option value="reprovado">Recusar Ticket</option>
                  </select>
                </div>

                {/* BOTÃO EXCLUIR (LIXEIRA) - USADO APENAS PARA LIMPEZA DEFINITIVA */}
                <button 
                  onClick={() => excluirTicket(t.id)} 
                  className="p-2.5 bg-red-50 text-red-300 hover:text-red-500 rounded-xl active:scale-90 transition-all"
                  title="Excluir permanentemente"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GerenciamentoTickets; // Exporta o painel de suporte atualizado com fluxo de recusa.