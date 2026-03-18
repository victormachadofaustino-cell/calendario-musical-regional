import React, { useState, useRef, useEffect } from 'react'; // Ferramenta base do React para gerenciar memória e referências de toque do dedo.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional no Firebase, subindo dois níveis de pasta.
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore'; // Ferramentas do banco para ler, criar, editar e apagar dados.
import { Loader2, BookOpen, Clock, Plus, Trash2, Edit3, X, Send, BookText, LayoutDashboard, MapPinCheck, History, Music2, ArrowLeft, ChevronRight, Lock } from 'lucide-react'; // Ícones para os cards de menu, botões e travas de segurança.
import { createPortal } from 'react-dom'; // Ferramenta que desenha as janelas de edição por cima de todo o app (Modais).
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca que faz os cards deslizarem suavemente como páginas de um livro.
import Feedback from '../Feedback'; // Componente de avisos de sucesso ou erro localizado na pasta pai.

// IMPORTAÇÃO DOS SUB-COMPONENTES (OS INSTRUMENTOS QUE VOCÊ SEPAROU)
import SecaoInstrucoes from './SecaoInstrucoes'; // Importa o arquivo que cuida dos textos numerados.
import SecaoDiagrama from './SecaoDiagrama'; // Importa o arquivo que desenha o mapa da orquestra.
import SecaoTabelaPermissoes from './SecaoTabelaPermissoes'; // Importa o arquivo da tabela técnica.
import SecaoProgramaMinimo from './SecaoProgramaMinimo'; // Importa o novo modal de escolha de métodos para músicos e organistas.

// Importação das Novas Regras de Permissões
import { isMaster } from '../../constants/permissions'; // Importa a regra que identifica se o usuário logado tem poder de Mestre.

const InformativosHub = ({ user }) => { // Início do componente de informativos, recebendo os dados do músico logado.
  const [avisos, setAvisos] = useState([]); // Lista que guarda todos os textos de avisos vindos do banco de dados.
  const [linhasTabela, setLinhasTabela] = useState([]); // Lista que guarda as linhas da tabela de permissões musicais.
  const [loading, setLoading] = useState(true); // Controla a tela de "Carregando" enquanto as informações viajam do banco para o celular.
  const [feedback, setFeedback] = useState(null); // Controla a mensagem de confirmação colorida após salvar ou deletar algo.
  const [editando, setEditando] = useState(null); // Guarda qual aviso específico está sendo alterado no momento pelo Master.
  const [editandoLinha, setEditandoLinha] = useState(null); // Guarda qual linha da tabela está sendo alterada no momento.
  const [mostraAdd, setMostraAdd] = useState(false); // Controla se a janelinha flutuante de "Novo/Editar" deve aparecer.
  const [enviando, setEnviando] = useState(false); // Trava o botão de salvar para evitar que cliques repetidos enviem dados duplicados.
  const [subSecao, setSubSecao] = useState('hub'); // Controla se estamos no menu de cards ('hub') ou dentro de um informativo específico.
  const [showProgramaMinimo, setShowProgramaMinimo] = useState(false); // Controle específico para abrir e fechar a janelinha do Programa Mínimo.

  const touchStartX = useRef(null); // Referência para guardar onde o dedo tocou na tela para o gesto circular.
  const touchEndX = useRef(null); // Referência para guardar onde o dedo saiu da tela.

  // 🔄 FILA DE NAVEGAÇÃO INTERNA: Define os capítulos que permitem deslizar o dedo para os lados.
  const ORDEM_SUBSECOES = ['instrucoes', 'diagrama', 'tabela']; 

  const masterLogado = isMaster(user); // Usa o motor de regras para confirmar se quem está acessando é o administrador.
  const [formAviso, setFormAviso] = useState({ titulo: '', conteudo: '', ordem: 1, prioridade: 'normal', categoria: 'Instrução', tituloSecundario: '', cordas: '', madeiras: '', metais: '' }); // Campos do formulário de avisos.
  const [formLinha, setFormLinha] = useState({ s: '', o: true, n: true, rb: true, rnb: true, me: true }); // Campos do formulário da tabela.

  // 1. SINCRONIA INTELIGENTE COM O BOTÃO VOLTAR (CASCATA)
  useEffect(() => { // Gerencia o comportamento do botão "voltar" do celular Android/iPhone.
    if (subSecao !== 'hub') { 
      window.history.pushState({ subSecao }, ""); 
      const tratarBotaoVoltar = () => { setSubSecao('hub'); };
      window.addEventListener('popstate', tratarBotaoVoltar); 
      return () => window.removeEventListener('popstate', tratarBotaoVoltar); 
    } else { 
      window.history.replaceState({ subSecao: 'hub' }, ""); 
    }
  }, [subSecao]); 

  // 🧠 INTELIGÊNCIA DE NAVEGAÇÃO CIRCULAR (DEDO): Gerencia a troca de cards por deslize.
  const aoFinalizarToqueInterno = () => { 
    if (!touchStartX.current || !touchEndX.current || subSecao === 'hub') return; 

    const distanciaX = touchStartX.current - touchEndX.current; 
    const indexAtual = ORDEM_SUBSECOES.indexOf(subSecao); 

    if (Math.abs(distanciaX) > 70) { 
      if (distanciaX > 70) { 
        if (indexAtual === ORDEM_SUBSECOES.length - 1) { setSubSecao('hub'); } 
        else { setSubSecao(ORDEM_SUBSECOES[indexAtual + 1]); }
      } else if (distanciaX < -70) { 
        if (indexAtual === 0) { setSubSecao('hub'); } 
        else { setSubSecao(ORDEM_SUBSECOES[indexAtual - 1]); }
      }
    }
    touchStartX.current = null; touchEndX.current = null; 
  };

  useEffect(() => { // Busca as informações no banco de dados assim que a tela abre.
    const unsubAvisos = onSnapshot(query(collection(db, "avisos"), orderBy("ordem", "asc")), (snap) => { 
      setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
      setLoading(false); 
    });
    const unsubTabela = onSnapshot(query(collection(db, "tabela_permissoes"), orderBy("ordem", "asc")), (snap) => { 
      setLinhasTabela(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });
    return () => { unsubAvisos(); unsubTabela(); }; 
  }, []); 

  const handleSalvarAviso = async (e) => { // Função para o Mestre salvar um novo aviso.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      if (editando) await updateDoc(doc(db, "avisos", editando.id), formAviso); 
      else await addDoc(collection(db, "avisos"), { ...formAviso, data: new Date() }); 
      setFeedback({ msg: "Informação salva!", tipo: 'sucesso' }); 
      setMostraAdd(false); 
    } catch (err) { setFeedback({ msg: "Erro ao gravar", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const handleSalvarLinha = async (e) => { // Função para o Mestre salvar a tabela técnica.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      await updateDoc(doc(db, "tabela_permissoes", editandoLinha.id), formLinha); 
      setFeedback({ msg: "Tabela atualizada!", tipo: 'sucesso' }); 
      setEditandoLinha(null); 
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const fecharModal = () => { setMostraAdd(false); setEditando(null); }; 

  if (loading) return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-slate-300" size={32} /></div>; 

  const cabecalho = avisos.find(a => a.categoria === 'Cabecalho'); 
  const instrucoes = avisos.filter(a => a.categoria === 'Instrução'); 
  const diagramaMeta = avisos.find(a => a.categoria === 'Diagrama'); 

  // 🎹 DEFINIÇÃO DOS BOTÕES ATUALIZADA: Liberados os cadeados do histórico e programa mínimo.
  const CARDS_INFORMATIVOS = [ 
    { id: 'instrucoes', titulo: 'Instruções', desc: 'Orientações e circulares da regional', icone: <BookText size={20}/>, cor: 'bg-blue-600', bloqueado: false, linkExterno: null }, 
    { id: 'diagrama', titulo: 'Diagrama', desc: 'Posicionamento oficial da orquestra', icone: <LayoutDashboard size={20}/>, cor: 'bg-amber-500', bloqueado: false, linkExterno: null }, 
    { id: 'tabela', titulo: 'Onde Poderei Tocar', desc: 'Permissões por classificação de serviço', icone: <MapPinCheck size={20}/>, cor: 'bg-emerald-600', bloqueado: false, linkExterno: null }, 
    { id: 'historico', titulo: 'Histórico Musical', desc: 'Clique para abrir o arquivo oficial', icone: <History size={20}/>, cor: 'bg-slate-700', bloqueado: false, linkExterno: "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view" }, 
    { id: 'programa', titulo: 'Programa Mínimo', desc: 'Métodos para músicos e organistas', icone: <Music2 size={20}/>, cor: 'bg-purple-600', bloqueado: false, linkExterno: null }, 
  ];

  return ( 
    <div className="flex flex-col animate-in px-6 py-6 space-y-6 pb-24 text-left no-scrollbar relative min-h-[70vh]"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX} 
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX} 
         onTouchEnd={aoFinalizarToqueInterno}> 
      
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      {/* 🟢 VISÃO 1: HUB DE INFORMATIVOS (MENU DE 5 CARDS) */}
      {subSecao === 'hub' && ( 
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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
            {masterLogado && cabecalho && <button onClick={() => { setEditando(cabecalho); setFormAviso(cabecalho); setMostraAdd(true); }} className="absolute -top-2 -right-2 p-3 bg-amber-500 text-white rounded-full shadow-lg border-2 border-white active:scale-90"><Edit3 size={16}/></button>}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {CARDS_INFORMATIVOS.map((card) => ( 
              <button 
                key={card.id} 
                disabled={card.bloqueado} 
                onClick={() => {
                  // LÓGICA INTELIGENTE DE CLIQUE:
                  if (card.id === 'historico') { window.open(card.linkExterno, '_blank'); } // Atalho direto para o Histórico.
                  else if (card.id === 'programa') { setShowProgramaMinimo(true); } // Abre a janelinha de escolha do Programa Mínimo.
                  else { setSubSecao(card.id); } // Entra nas telas internas normais.
                }} 
                className={`bg-white p-5 rounded-[2.2rem] border border-slate-200 flex items-center justify-between group transition-all shadow-sm ${card.bloqueado ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${card.cor} p-3.5 rounded-2xl text-white shadow-lg ${!card.bloqueado && 'group-hover:scale-110'} transition-transform`}>
                    {card.bloqueado ? <Lock size={20}/> : card.icone}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">{card.titulo}</span>
                      {card.bloqueado && <span className="text-[6px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">Em Breve</span>}
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{card.desc}</span>
                  </div>
                </div>
                {!card.bloqueado && (
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:text-slate-950 transition-colors">
                    {card.id === 'historico' || card.id === 'programa' ? <ChevronRight size={18} className="rotate-[-45deg]"/> : <ChevronRight size={18} />}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔵 NAVEGAÇÃO DE CONTEÚDO (SUB-SEÇÕES) */}
      <AnimatePresence mode="wait">
        {subSecao === 'instrucoes' && ( 
          <motion.div key="inst" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <SecaoInstrucoes instrucoes={instrucoes} masterLogado={masterLogado} setEditando={setEditando} setFormAviso={setFormAviso} setMostraAdd={setMostraAdd} />
          </motion.div>
        )}
        {subSecao === 'diagrama' && ( 
          <motion.div key="diag" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <SecaoDiagrama diagramaMeta={diagramaMeta} masterLogado={masterLogado} setEditando={setEditando} setFormAviso={setFormAviso} setMostraAdd={setMostraAdd} />
          </motion.div>
        )}
        {subSecao === 'tabela' && ( 
          <motion.div key="tab" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <SecaoTabelaPermissoes linhasTabela={linhasTabela} masterLogado={masterLogado} setEditandoLinha={setEditandoLinha} setFormLinha={setFormLinha} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏁 CHAMADA DO MODAL PROGRAMA MÍNIMO: Aparece apenas quando acionado pelo card. */}
      {showProgramaMinimo && <SecaoProgramaMinimo aoFechar={() => setShowProgramaMinimo(false)} />}

      {/* INDICADOR DE PÁGINAS (BOLINHAS) */}
      {subSecao !== 'hub' && ( 
        <div className="flex justify-center gap-2 mt-4 opacity-20">
          {ORDEM_SUBSECOES.map((s, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${subSecao === s ? 'bg-slate-950 scale-125' : 'bg-slate-400'}`} />
          ))}
        </div>
      )}

      <div className="pt-4 flex flex-col items-center gap-2 opacity-30 pb-10">
        <BookOpen size={16} />
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-center">Regional Jundiaí • Oficial</span>
      </div>

      {/* MODAIS DE EDIÇÃO DO MASTER */}
      {editandoLinha && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setEditandoLinha(null)}></div>
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative text-left animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-950 mb-6 leading-none">Ajustar Tabela</h3>
            <form onSubmit={handleSalvarLinha} className="space-y-4">
              <input required type="text" value={formLinha.s} onChange={e => setFormLinha({...formLinha, s: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold uppercase outline-none" />
              <div className="grid grid-cols-2 gap-3">
                {['o', 'n', 'rb', 'rnb', 'me'].map(key => (
                  <button key={key} type="button" onClick={() => setFormLinha({...formLinha, [key]: typeof formLinha[key] === 'boolean' ? !formLinha[key] : (formLinha[key].includes('SIM') ? 'NÃO' : 'SIM')})} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${formLinha[key] === true || (typeof formLinha[key] === 'string' && formLinha[key].includes('SIM')) ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {key.toUpperCase()}: {formLinha[key] === true || (typeof formLinha[key] === 'string' && formLinha[key].includes('SIM')) ? 'SIM' : 'NÃO'}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] mt-4 shadow-xl">Salvar Tabela</button>
            </form>
          </div>
        </div>, document.body
      )}

      {mostraAdd && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
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
                  <textarea required rows="6" value={formAviso.conteudo} onChange={ev => setFormAviso({...formAviso, conteudo: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold uppercase resize-none outline-none" placeholder="Conteúdo informativo" />
                  {formAviso.categoria === 'Cabecalho' && <input type="text" value={formAviso.tituloSecundario} onChange={ev => setFormAviso({...formAviso, tituloSecundario: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" placeholder="Data da Reunião" />}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2"><div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 ml-2 uppercase">Ordem</span><input required type="number" value={formAviso.ordem} onChange={ev => setFormAviso({...formAviso, ordem: Number(ev.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold" /></div><div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 ml-2 uppercase">Prioridade</span><select value={formAviso.prioridade} onChange={ev => setFormAviso({...formAviso, prioridade: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase"><option value="normal">Normal</option><option value="alta">Alta</option></select></div></div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] mt-4 shadow-xl transition-all"><Send size={16} className="mr-2 inline"/> {enviando ? 'Gravando...' : 'Salvar Alterações'}</button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default InformativosHub; // Exporta o hub centralizado com navegação circular inteligente e transições suaves.