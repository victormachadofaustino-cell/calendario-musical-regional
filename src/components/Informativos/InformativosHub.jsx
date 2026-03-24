// src/components/Informativos/InformativosHub.jsx // Identifica o arquivo mestre que organiza as instruções, diagramas e tabelas da Regional.

import React, { useState, useRef, useEffect } from 'react'; // Ferramentas base do React para gerenciar memória e referências de toque.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional no Firebase.
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para mexer nos dados do banco.
import { Loader2, BookOpen, Clock, Plus, Trash2, Edit3, X, Send, BookText, LayoutDashboard, MapPinCheck, History, Music2, ArrowLeft, ChevronRight, Lock } from 'lucide-react'; // Ícones para os botões e menus.
import { createPortal } from 'react-dom'; // Ferramenta que desenha janelas (modais) por cima de tudo.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca que faz as telas deslizarem suavemente.
import Feedback from '../Feedback'; // Componente que mostra avisos de sucesso ou erro.

// IMPORTAÇÃO DOS SUB-COMPONENTES (As telas internas de cada informativo)
import SecaoInstrucoes from './SecaoInstrucoes'; // Tela que mostra as circulares numeradas.
import SecaoDiagrama from './SecaoDiagrama'; // Tela que mostra o mapa de onde cada instrumento senta.
import SecaoTabelaPermissoes from './SecaoTabelaPermissoes'; // Tela da tabela técnica de classificação.
import SecaoProgramaMinimo from './SecaoProgramaMinimo'; // Tela que lista os métodos oficiais.

// Importação de Permissões e Telemetria
import { isMaster } from '../../constants/permissions'; // Identifica se o usuário logado tem poderes de administrador.
import { registrarEvento } from '../../constants/comuns'; // O "Olheiro" que avisa o Dashboard sobre cada clique.

const InformativosHub = ({ user }) => { // Início do componente, recebendo os dados do usuário logado.
  const [avisos, setAvisos] = useState([]); // Memória que guarda os informativos vindos do banco de dados.
  const [linhasTabela, setLinhasTabela] = useState([]); // Memória que guarda as linhas da tabela de permissões.
  const [loading, setLoading] = useState(true); // Controla se a tela mostra o símbolo de "carregando".
  const [feedback, setFeedback] = useState(null); // Controla as mensagens de "Salvo com sucesso".
  const [editando, setEditando] = useState(null); // Guarda qual aviso o Master está editando no momento.
  const [editandoLinha, setEditandoLinha] = useState(null); // Guarda qual linha da tabela está sendo alterada.
  const [mostraAdd, setMostraAdd] = useState(false); // Controla se a janela de novo cadastro está aberta.
  const [enviando, setEnviando] = useState(false); // Trava o botão de salvar para evitar cliques duplicados.
  const [subSecao, setSubSecao] = useState('hub'); // Controla se o músico está no menu principal ou dentro de um informativo.
  const [showProgramaMinimo, setShowProgramaMinimo] = useState(false); // Controla a abertura da janela de métodos.

  const touchStartX = useRef(null); // Memória para o local onde o dedo tocou a tela pela primeira vez.
  const touchEndX = useRef(null); // Memória para o local onde o dedo saiu da tela.

  const ORDEM_SUBSECOES = ['instrucoes', 'diagrama', 'tabela']; // Ordem das telas para o gesto de "arrastar o dedo" (swipe).

  const masterLogado = isMaster(user); // Atalho que confirma se quem está vendo é o Maestro Regional.
  const [formAviso, setFormAviso] = useState({ titulo: '', conteudo: '', ordem: 1, prioridade: 'normal', categoria: 'Instrução', tituloSecundario: '', cordas: '', madeiras: '', metais: '' }); // Espaço para preencher novos avisos.
  const [formLinha, setFormLinha] = useState({ s: '', o: true, n: true, rb: true, rnb: true, me: true }); // Espaço para preencher linhas da tabela.

  // 1. SINCRONIA COM O BOTÃO VOLTAR DO CELULAR
  useEffect(() => { // Vigia o histórico do navegador para permitir voltar com o botão do Android/iPhone.
    if (subSecao !== 'hub') { 
      window.history.pushState({ subSecao }, ""); // Avisa o celular que entramos em uma nova tela interna.
      const tratarBotaoVoltar = () => { setSubSecao('hub'); }; // Função que volta para o menu ao clicar em "Voltar".
      window.addEventListener('popstate', tratarBotaoVoltar); // Liga o sensor do botão físico do celular.
      return () => window.removeEventListener('popstate', tratarBotaoVoltar); // Desliga o sensor ao sair.
    } else { 
      window.history.replaceState({ subSecao: 'hub' }, ""); // Mantém o histórico limpo quando está no menu.
    }
  }, [subSecao]); 

  // 2. NAVEGAÇÃO POR DESLISE (SWIPE COM TELEMETRIA)
  const aoFinalizarToqueInterno = () => { // Lógica que troca a página quando o músico arrasta o dedo.
    if (!touchStartX.current || !touchEndX.current || subSecao === 'hub') return; 
    const distanciaX = touchStartX.current - touchEndX.current; 
    const indexAtual = ORDEM_SUBSECOES.indexOf(subSecao); 

    if (Math.abs(distanciaX) > 70) { // Se o movimento do dedo for maior que 70 pixels...
      let novaSecao = subSecao;
      if (distanciaX > 70) { // Se arrastou para a esquerda (próximo)...
        if (indexAtual === ORDEM_SUBSECOES.length - 1) { novaSecao = 'hub'; } 
        else { novaSecao = ORDEM_SUBSECOES[indexAtual + 1]; }
      } else if (distanciaX < -70) { // Se arrastou para a direita (anterior)...
        if (indexAtual === 0) { novaSecao = 'hub'; } 
        else { novaSecao = ORDEM_SUBSECOES[indexAtual - 1]; }
      }

      if (novaSecao !== subSecao) { // Se a tela realmente mudou...
        setSubSecao(novaSecao); // Atualiza a tela visualmente.
        registrarEvento('Informativos', 'Navegação por Gesto', novaSecao.toUpperCase(), user); // Registra o movimento no Dashboard.
      }
    }
    touchStartX.current = null; touchEndX.current = null; // Limpa a memória do toque.
  };

  // 3. BUSCA DE DADOS EM TEMPO REAL (ESCUTA O BANCO)
  useEffect(() => { // Conecta com o Firebase para trazer as circulares e a tabela técnica.
    const unsubAvisos = onSnapshot(query(collection(db, "avisos"), orderBy("ordem", "asc")), (snap) => { 
      setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Preenche a lista de circulares.
      setLoading(false); // Desliga o sinal de carregando.
    });
    const unsubTabela = onSnapshot(query(collection(db, "tabela_permissoes"), orderBy("ordem", "asc")), (snap) => { 
      setLinhasTabela(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Preenche a tabela de permissões.
    });
    return () => { unsubAvisos(); unsubTabela(); }; // Desliga os sensores ao sair da tela.
  }, []); 

  // 4. FUNÇÃO SALVAR AVISO (EXCLUSIVO MASTER)
  const handleSalvarAviso = async (e) => { // Lógica que grava ou atualiza uma instrução no banco.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      if (editando) await updateDoc(doc(db, "avisos", editando.id), formAviso); // Se já existia, atualiza.
      else await addDoc(collection(db, "avisos"), { ...formAviso, data: new Date() }); // Se for novo, cria.
      setFeedback({ msg: "Informação salva!", tipo: 'sucesso' }); // Mostra aviso de sucesso.
      setMostraAdd(false); 
    } catch (err) { setFeedback({ msg: "Erro ao gravar", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  // 5. FUNÇÃO SALVAR LINHA DA TABELA (EXCLUSIVO MASTER)
  const handleSalvarLinha = async (e) => { // Lógica que altera as regras de "onde pode tocar" no banco.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      await updateDoc(doc(db, "tabela_permissoes", editandoLinha.id), formLinha); // Salva a mudança técnica.
      setFeedback({ msg: "Tabela atualizada!", tipo: 'sucesso' }); 
      setEditandoLinha(null); 
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const fecharModal = () => { setMostraAdd(false); setEditando(null); }; // Limpa a tela de edição.

  if (loading) return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-slate-300" size={32} /></div>; // Tela de espera.

  const cabecalho = avisos.find(a => a.categoria === 'Cabecalho'); // Localiza o texto de boas-vindas do topo.
  const instrucoes = avisos.filter(a => a.categoria === 'Instrução'); // Filtra apenas as circulares ministeriais.
  const diagramaMeta = avisos.find(a => a.categoria === 'Diagrama'); // Localiza os dados do mapa da orquestra.

  // DEFINIÇÃO DOS CARDS DO MENU PRINCIPAL
  const CARDS_INFORMATIVOS = [ 
    { id: 'instrucoes', titulo: 'Instruções', desc: 'Orientações e circulares da regional', icone: <BookText size={20}/>, cor: 'bg-blue-600' }, 
    { id: 'diagrama', titulo: 'Diagrama', desc: 'Posicionamento oficial da orquestra', icone: <LayoutDashboard size={20}/>, cor: 'bg-amber-500' }, 
    { id: 'tabela', titulo: 'Onde Poderei Tocar', desc: 'Permissões por classificação de serviço', icone: <MapPinCheck size={20}/>, cor: 'bg-emerald-600' }, 
    { id: 'historico', titulo: 'Histórico Musical', desc: 'Clique para abrir o arquivo oficial', icone: <History size={20}/>, cor: 'bg-slate-700', linkExterno: "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view" }, 
    { id: 'programa', titulo: 'Programa Mínimo', desc: 'Métodos para músicos e organistas', icone: <Music2 size={20}/>, cor: 'bg-purple-600' }, 
  ];

  return ( 
    <div className="flex flex-col animate-in px-6 py-6 space-y-6 pb-24 text-left no-scrollbar relative min-h-[70vh]"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX} 
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX} 
         onTouchEnd={aoFinalizarToqueInterno}> 
      
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      {/* 🟢 VISÃO 1: HUB DE INFORMATIVOS (O MENU DE ENTRADA) */}
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
                onClick={() => {
                  // DISPARA O OLHEIRO: Registra qual informativo específico está sendo consultado.
                  registrarEvento('Informativos', 'Consulta', card.titulo, user);

                  if (card.id === 'historico') { window.open(card.linkExterno, '_blank'); } 
                  else if (card.id === 'programa') { setShowProgramaMinimo(true); } 
                  else { setSubSecao(card.id); } 
                }} 
                className="bg-white p-5 rounded-[2.2rem] border border-slate-200 flex items-center justify-between group transition-all shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={`${card.cor} p-3.5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {card.icone}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">{card.titulo}</span>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{card.desc}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:text-slate-950 transition-colors">
                  {card.id === 'historico' || card.id === 'programa' ? <ChevronRight size={18} className="rotate-[-45deg]"/> : <ChevronRight size={18} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔵 VISÃO 2: TELAS INTERNAS DE CONTEÚDO (NAVEGAÇÃO POR ABAS) */}
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

      {/* MODAL DO PROGRAMA MÍNIMO (MÉTODOS) */}
      {showProgramaMinimo && <SecaoProgramaMinimo aoFechar={() => setShowProgramaMinimo(false)} />}

      {/* INDICADOR VISUAL DE PÁGINAS (BOLINHAS NO RODAPÉ) */}
      {subSecao !== 'hub' && ( 
        <div className="flex justify-center gap-2 mt-4 opacity-20">
          {ORDEM_SUBSECOES.map((s, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${subSecao === s ? 'bg-slate-950 scale-125' : 'bg-slate-400'}`} />
          ))}
        </div>
      )}

      {/* SELO DE AUTENTICIDADE REGIONAL */}
      <div className="pt-4 flex flex-col items-center gap-2 opacity-30 pb-10">
        <BookOpen size={16} />
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-center">Regional Jundiaí • Oficial</span>
      </div>

      {/* MODAL: AJUSTAR LINHA DA TABELA (MASTER) */}
      {editandoLinha && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setEditandoLinha(null)}></div>
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative text-left animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-950 mb-6 leading-none">Ajustar Tabela Técnica</h3>
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

      {/* MODAL: ADICIONAR OU EDITAR AVISO/DIAGRAMA (MASTER) */}
      {mostraAdd && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={fecharModal}></div>
          <div className="bg-white w-full max-w-[360px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left overflow-y-auto max-h-[90vh]">
            <button onClick={fecharModal} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-6 leading-none">{editando ? 'Editar' : 'Novo'} {formAviso.categoria}</h3>
            <form onSubmit={handleSalvarAviso} className="space-y-4">
              {formAviso.categoria === 'Diagrama' ? ( // Se for edição do Diagrama, mostra campos de instrumentos.
                <div className="space-y-4">
                  {['cordas', 'madeiras', 'metais'].map(sec => <div key={sec} className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">{sec}</span><textarea rows="3" value={formAviso[sec]} onChange={ev => setFormAviso({...formAviso, [sec]: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none resize-none" /></div>)}
                </div>
              ) : ( // Se for edição de Aviso comum ou Cabeçalho.
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

export default InformativosHub; // Exporta o hub central 100% monitorado e funcional.