import React, { useState, useMemo, useEffect, useRef } from 'react'; // Ferramentas base do React para gerenciar memória e referências.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco de dados.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para o Master gerenciar as reuniões no banco.
import { 
  MapPin, Info, Plus, Trash2, Edit3, X, Send, Clock, CheckCircle2 
} from 'lucide-react'; // Biblioteca de ícones oficiais para o projeto.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca que faz as expansões de card serem suaves.
import { createPortal } from 'react-dom'; // Permite criar janelas de edição que flutuam sobre o app.
import Feedback from './Feedback'; // Componente de alertas de sucesso ou erro.
import { isMaster, isComissao, LISTA_CARGOS_OFICIAL } from '../constants/permissions'; // Importa as regras de Master, Comissão e cargos oficiais.
import { useFirestoreData } from '../hooks/useFirestoreData'; // Caminhão de carga que traz as reuniões do banco.

const ReunioesRegionais = ({ user }) => { // Início do componente de Agenda de Reuniões.
  const { reunioesData, loading } = useFirestoreData(); // Puxa os dados reais das reuniões e o status de carregamento.
  const [expandidoId, setExpandidoId] = useState(null); // Memória para saber qual card está "aberto" no momento.
  const [feedback, setFeedback] = useState(null); // Controla as mensagens de confirmação na tela.
  const [mostraAdd, setMostraAdd] = useState(false); // Abre o formulário de nova reunião.
  const [editando, setEditando] = useState(null); // Guarda os dados da reunião que o Master está alterando.
  const [enviando, setEnviando] = useState(false); // Trava os botões durante o salvamento para evitar duplicidade.

  const [cargosAlvo, setCargosAlvo] = useState([]); // Estado que guarda quais cargos (e a comissão) foram flegados no formulário.

  const refsMeses = useRef({}); // Referências físicas para o sistema saber onde cada mês começa na tela.
  const masterLogado = isMaster(user); // BLOQUEIO DE SEGURANÇA: Identifica se o usuário logado é o Maestro.
  const integranteComissao = isComissao(user); // Verifica se o irmão possui o distintivo da Comissão Musical (Estrela).

  const MESES_LISTA = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]; // Lista padrão para ordenação visual.

  // 1. Organiza as reuniões e aplica o filtro de visibilidade baseado em Cargo ou Comissão.
  const reunioesOrdenadas = useMemo(() => {
    const filtradas = reunioesData.filter(r => {
      if (masterLogado) return true; // Master (Maestro) sempre enxerga todas as reuniões.
      if (!r.restrito) return true; // Reuniões marcadas como "Públicas" aparecem para todos os músicos.
      
      // REGRA DE ACESSO: Aparece se o irmão for da COMISSÃO (Estrela) ou se o cargo dele estiver nos destinatários.
      return integranteComissao || r.destinatarios?.includes(user?.cargo); 
    });
    return [...filtradas].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); // Coloca na ordem cronológica.
  }, [reunioesData, masterLogado, integranteComissao, user]);

  const toggleCargo = (cargo) => { // Função para flegar ou desflegar um item na lista de destinatários.
    setCargosAlvo(prev => prev.includes(cargo) ? prev.filter(c => c !== cargo) : [...prev, cargo]);
  };

  const prepararEdicao = (reuniao) => { // Prepara os dados para o modal de edição carregando o que já existe.
    setEditando(reuniao);
    setCargosAlvo(reuniao.destinatarios || []); // Carrega os flegs (destinatários) já salvos anteriormente.
    setMostraAdd(false);
  };

  // 🛡️ LÓGICA DE MIRA CENTRALIZADA: Pula para o mês vigente ao entrar na tela.
  useEffect(() => {
    if (!loading && reunioesOrdenadas.length > 0) {
      const mesAtual = MESES_LISTA[new Date().getMonth()]; // Descobre o mês atual no relógio do celular.
      const elementoAlvo = refsMeses.current[mesAtual]; // Procura esse mês na lista visual.
      if (elementoAlvo) {
        elementoAlvo.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Desliza a tela suavemente até o mês atual.
      }
    }
  }, [loading, reunioesOrdenadas]); 

  const dispararFeedback = (msg, tipo) => { setFeedback({ msg, tipo }); }; // Atalho para mostrar avisos de sucesso/erro.

  const handleExcluir = async (id) => { // Função exclusiva do Master para apagar uma reunião permanentemente.
    if (!window.confirm("Deseja realmente excluir esta reunião?")) return; // Pergunta de segurança antes de apagar.
    try {
      await deleteDoc(doc(db, "reunioes_regionais", id)); // Remove o documento da gaveta do Firebase.
      dispararFeedback("Reunião removida!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao excluir", 'erro'); }
  };

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse text-[10px]">Sincronizando Agenda...</div>;

  return ( // Início da construção visual da interface.
    <div className="flex flex-col animate-in pb-32 text-left bg-[#F1F5F9] min-h-screen">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {/* Botão de Adicionar: Visível apenas para o Maestro (Master) */}
      {masterLogado && (
        <div className="px-6 pt-4">
          <button onClick={() => { setCargosAlvo([]); setMostraAdd(true); setEditando(null); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Nova Reunião Administrativa
          </button>
        </div>
      )}

      <div className="px-6 py-6 space-y-8">
        {MESES_LISTA.map(mes => { // Percorre os 12 meses do ano.
          const eventosMes = reunioesOrdenadas.filter(r => r.mes === mes); // Filtra as reuniões que pertencem a este mês específico.
          if (eventosMes.length === 0) return null; // Se o mês não tem reunião, ele nem aparece no título.

          return (
            <div key={mes} ref={el => refsMeses.current[mes] = el} className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] italic">{mes}</h3>
                <div className="h-[1px] flex-grow bg-slate-200"></div>
              </div>

              {eventosMes.map(reuniao => ( // Cria o card para cada reunião encontrada no mês.
                <div key={reuniao.id} 
                     onClick={() => setExpandidoId(expandidoId === reuniao.id ? null : reuniao.id)}
                     // CORREÇÃO: Apliquei a variável reuniao.cor na classe de borda lateral (border-l-4)
                     className={`bg-white rounded-[2rem] border border-slate-100 border-l-4 ${reuniao.cor || 'border-l-slate-200'} shadow-sm overflow-hidden transition-all active:scale-[0.98] cursor-pointer`}>
                  
                  <div className="p-5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {/* A cor do rótulo também pode seguir a lógica da borda para harmonia visual */}
                        <span className={`text-[12px] font-black uppercase tracking-widest ${reuniao.cor?.replace('border-l-', 'text-') || 'text-slate-400'}`}>
                          {reuniao.rotulo}
                        </span>
                        {reuniao.restrito && <span className="bg-slate-100 text-slate-400 text-[12px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Privado</span>}
                      </div>
                      <h4 className="text-slate-950 font-[900] text-xs uppercase italic leading-tight tracking-tighter">{reuniao.titulo}</h4>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex flex-col items-center min-w-[45px]">
                      <span className="text-slate-950 font-black text-sm">{reuniao.dia}</span>
                      <span className="text-slate-400 font-bold text-[7px] uppercase">{reuniao.hora}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandidoId === reuniao.id && ( // Só mostra os detalhes se o usuário clicar no card.
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                        <div className="p-5 pt-0 space-y-4 border-t border-slate-100/50">
                          <div className="grid grid-cols-1 gap-3 mt-4">
                            <div className="flex items-center gap-3 text-slate-500"><MapPin size={14}/><span className="text-[10px] font-bold uppercase">{reuniao.local}</span></div>
                            <div className="flex items-center gap-3 text-slate-500"><Info size={14}/><span className="text-[10px] font-bold uppercase leading-relaxed">{reuniao.desc}</span></div>
                          </div>

                          {masterLogado && ( // Mostra botões de Editar/Excluir apenas para o Master.
                            <div className="flex gap-2 pt-4 border-t border-slate-100">
                              <button onClick={(e) => { e.stopPropagation(); prepararEdicao(reuniao); }} className="flex-1 bg-white border border-slate-200 text-amber-600 py-3 rounded-xl font-black text-[9px] uppercase flex justify-center items-center gap-2"><Edit3 size={14}/> Editar</button>
                              <button onClick={(e) => { e.stopPropagation(); handleExcluir(reuniao.id); }} className="p-3 bg-red-50 text-red-500 rounded-xl active:scale-90"><Trash2 size={16}/></button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* MODAL DE GESTÃO (CRUD) */}
      {(mostraAdd || editando) && createPortal(
        <div className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={() => { setMostraAdd(false); setEditando(null); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-lg font-black uppercase italic text-slate-950 mb-6">{editando ? 'Ajustar Reunião' : 'Nova Reunião'}</h3>
            
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault(); setEnviando(true);
              const form = e.target;
              const mesIndex = MESES_LISTA.indexOf(form.mes.value) + 1;
              const diaF = form.dia.value.padStart(2, '0');
              const mesF = String(mesIndex).padStart(2, '0');
              
              const dados = {
                titulo: form.titulo.value, rotulo: form.rotulo.value, mes: form.mes.value,
                dia: diaF, hora: form.hora.value, local: form.local.value, desc: form.desc.value,
                cor: form.cor.value, restrito: form.restrito.value === "true",
                destinatarios: cargosAlvo, 
                ano: 2026, timestamp: Number(`2026${mesF}${diaF}`) 
              };

              try {
                if (editando) await updateDoc(doc(db, "reunioes_regionais", editando.id), dados);
                else await addDoc(collection(db, "reunioes_regionais"), dados);
                dispararFeedback("Agenda atualizada!", 'sucesso');
                setMostraAdd(false); setEditando(null);
              } catch (e) { dispararFeedback("Falha ao salvar", 'erro'); }
              finally { setEnviando(false); }
            }}>
              
              <div className="space-y-3">
                <input name="titulo" defaultValue={editando?.titulo} required placeholder="Título (Ex: Reunião Ministerial)" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none uppercase" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="rotulo" defaultValue={editando?.rotulo} required placeholder="Sigla (RMA)" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none uppercase" />
                  <select name="mes" defaultValue={editando?.mes || MESES_LISTA[new Date().getMonth()]} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none">{MESES_LISTA.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Público Alvo:</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleCargo("Comissão Musical")} 
                      className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center gap-1.5 border shadow-sm ${cargosAlvo.includes("Comissão Musical") ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100'}`}>
                      {cargosAlvo.includes("Comissão Musical") && <CheckCircle2 size={12} />}
                      ⭐ Comissão Musical
                    </button>
                    {LISTA_CARGOS_OFICIAL.map(cargo => (
                      <button key={cargo} type="button" onClick={() => toggleCargo(cargo)} 
                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center gap-1.5 border ${cargosAlvo.includes(cargo) ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-200'}`}>
                        {cargosAlvo.includes(cargo) && <CheckCircle2 size={12} />}
                        {cargo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input name="dia" defaultValue={editando?.dia} required type="number" placeholder="Dia" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none" />
                  <input name="hora" defaultValue={editando?.hora} required placeholder="Hora (19h30)" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none" />
                </div>
                <input name="local" defaultValue={editando?.local} required placeholder="Local" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none uppercase" />
                <textarea name="desc" defaultValue={editando?.desc} placeholder="Informações adicionais" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none h-20 resize-none uppercase" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="cor" defaultValue={editando?.cor || "border-l-amber-500"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none">
                    <option value="border-l-amber-500">Amarelo (ADM)</option>
                    <option value="border-l-blue-600">Azul (Reg)</option>
                    <option value="border-l-emerald-600">Verde (Min)</option>
                    <option value="border-l-red-600">Vermelho (Anual)</option>
                    <option value="border-l-slate-950">Preto (Especial)</option>
                  </select>
                  <select name="restrito" defaultValue={editando?.restrito ? "true" : "false"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none">
                    <option value="false">Público (Todos)</option>
                    <option value="true">Privado (Flegados)</option>
                  </select>
                </div>
              </div>

              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] mt-2 shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all">
                <Send size={14}/> {enviando ? 'Gravando...' : 'Confirmar Agenda'}
              </button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default ReunioesRegionais;