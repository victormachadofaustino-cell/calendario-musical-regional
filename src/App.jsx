import React, { useState, useRef, useEffect } from 'react'; // Ferramenta base do React para gerenciar estados e referências de memória.
import { auth, db } from './firebaseConfig'; // Importa as configurações de conexão com o seu banco de dados e autenticação Firebase.
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Ferramentas para realizar buscas e monitorar dados em tempo real no banco.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca responsável pelas transições e animações suaves entre as telas do app.
import { User, BarChart3 } from 'lucide-react'; // Importa os ícones de usuário e gráfico usados no cabeçalho e menu.

// Hooks Personalizados (Nossas ferramentas auxiliares de busca)
import { useAuth } from './hooks/useAuth'; // Verifica quem está logado e traz informações de perfil e pendências de acesso.
import { useFirestoreData } from './hooks/useFirestoreData'; // Carrega as listas de ensaios, reuniões e contatos oficiais.

// Importação das Regras de Permissões (O "Porteiro" do sistema)
import { isMaster, temAcessoAoDashboard } from './constants/permissions'; // Define quem pode ver o quê baseado no cargo ministerial.

// Importação dos Componentes da Estrutura Visual
import Header from './components/Header'; // O cabeçalho fixo que contém os títulos e botões de navegação.
import HighlightCards from './components/HighlightCards'; // Os cartões de destaque que mostram o que acontece hoje e as reuniões.
import QuickCards from './components/QuickCards'; // O menu principal de botões quadrados para navegação rápida.
import ListaOficial from './components/ListaOficial'; // O botão que leva para a lista externa de batismos.

// Importação das Telas de cada Módulo (As páginas do App)
import EnsaiosRegionais from './components/EnsaiosRegionais'; // Página que lista a agenda de ensaios regionais.
import EnsaiosLocais from './components/EnsaiosLocais'; // Página que lista a agenda de ensaios nas igrejas comuns.
import Comissao from './components/Comissao'; // Página de contatos úteis, encarregados e examinadoras.
import InformativosHub from './components/Informativos/InformativosHub'; // Importa o novo Hub central de informativos e avisos.
import CapaEntrada from './components/CapaEntrada'; // A tela de abertura (Splash) que aparece ao abrir o app.
import Login from './components/Login'; // A janela flutuante para entrada de colaboradores.
import PainelMaster from './components/PainelMaster'; // O centro de controle administrativo para Masters e Editores.
import Dashboard from './components/Dashboard'; // A tela de estatísticas e gráficos para os encarregados.
import Tickets from './components/Tickets'; // O sistema de envio de feedback (ícone da lâmpada).
import GerenciamentoTickets from './components/GerenciamentoTickets'; // Tela profissional de resolução de chamados para o Master.
import ReunioesRegionais from './components/ReunioesRegionais'; // A agenda exclusiva de reuniões administrativas.

function App() { // Função principal que constrói e organiza todo o aplicativo.
  const [modulo, setModulo] = useState('hub'); // Estado que controla qual página está aberta no momento.
  const [diaFiltro, setDiaFiltro] = useState(''); // Filtra ensaios por um dia específico ao clicar em "Ver Mais".
  const [showSplash, setShowSplash] = useState(true); // Decide se mostra a tela de entrada ou o conteúdo principal.
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla a visibilidade da janela de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Controla a visibilidade do painel administrativo Master.
  const [direcao, setDirecao] = useState(0); // Define se a animação de troca de tela vai para a esquerda ou direita.
  const [ticketsCount, setTicketsCount] = useState(0); // Conta chamados pendentes para o Master.

  const { user, userData, pendenciasCount } = useAuth(); // Obtém dados do usuário e contagem de pendências.
  
  // 🛡️ CARGA INICIAL: Sincroniza todas as listas do banco de dados em tempo real.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData();

  const touchStartX = useRef(null); // Local onde o dedo tocou na tela pela primeira vez.
  const touchEndX = useRef(null); // Local onde o dedo saiu da tela.

  // 🔄 FILA DE NAVEGAÇÃO: Define a ordem das telas para o gesto de arrastar o dedo.
  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes', 'tickets'];

  // Títulos dinâmicos para o cabeçalho do App.
  const TITULOS_MODULOS = { 
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'reunioes': { p1: 'Agenda de', p2: 'Reuniões' },
    'avisos': { p1: 'Central de', p2: 'Informativos' }, 
    'dashboard': { p1: 'Status', p2: 'Analítico' },
    'tickets': { p1: 'Suporte e', p2: 'Melhorias' } 
  };

  useEffect(() => { // Monitora novos tickets pendentes apenas para o Master.
    if (!isMaster(userData)) { setTicketsCount(0); return; } 
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); 
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); 
    return () => unsub(); 
  }, [userData]); 

  useEffect(() => { // Segurança: Redireciona usuários deslogados de áreas restritas.
    if (!user) { 
      const paginasRestritas = ['dashboard', 'reunioes', 'tickets']; 
      if (paginasRestritas.includes(modulo) || showPainelMaster) { 
        setModulo('hub'); 
        setShowPainelMaster(false); 
      }
    }
    if (user && modulo === 'tickets' && !isMaster(userData)) { 
      setModulo('hub'); 
    }
  }, [user, modulo, showPainelMaster, userData]); 

  const mudarModulo = (novoModulo) => { // Função para trocar de página com animação.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); 
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); 
    
    if (novoModulo === 'dashboard') setDirecao(1); 
    else if (modulo === 'dashboard') setDirecao(-1); 
    else setDirecao(indexNovo > indexAtual ? 1 : -1); 

    if (novoModulo !== 'locais') setDiaFiltro(''); 
    setModulo(novoModulo); 
  };

  const aoFinalizarToque = () => { // Lógica para troca de tela por gesto de deslizar.
    if (!touchStartX.current || !touchEndX.current) return; 
    const distanciaX = touchStartX.current - touchEndX.current; 
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); 

    if (modulo === 'dashboard') return; // Bloqueia swipe no Dashboard.

    // Trava o arrasto se o usuário estiver dentro de um informativo detalhado.
    if (modulo === 'avisos' && window.history.state?.subSecao && window.history.state.subSecao !== 'hub') {
        return; 
    }

    if (distanciaX > 70 && indexAtual !== -1 && indexAtual < ORDEM_MODULOS.length - 1) { 
      const proximo = ORDEM_MODULOS[indexAtual + 1]; 
      if (proximo === 'reunioes' && !user) return; 
      if (proximo === 'tickets' && !isMaster(userData)) return; 
      mudarModulo(proximo); 
    } else if (distanciaX < -70 && indexAtual > 0) { 
      mudarModulo(ORDEM_MODULOS[indexAtual - 1]); 
    }
    touchStartX.current = null; touchEndX.current = null; 
  };

  const variacoesPagina = { // Definição visual do movimento das telas.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }), 
    animate: { opacity: 1, x: 0 }, 
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }), 
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />; // Exibe a tela de abertura.

  return ( // Montagem do esqueleto visual do app.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX} 
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX} 
         onTouchEnd={aoFinalizarToque}> 
      
      <Header // Cabeçalho com inteligência de botões.
        modulo={modulo} 
        setModulo={mudarModulo} 
        user={user} 
        userData={userData} 
        pendenciasCount={pendenciasCount} 
        ticketsCount={ticketsCount} 
        titulosModulos={TITULOS_MODULOS}
        setShowLoginModal={setShowLoginModal} 
        setShowPainelMaster={setShowPainelMaster}
      />

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />} 
      {showPainelMaster && <PainelMaster aoFechar={() => setShowPainelMaster(false)} userLogado={userData} pendenciasCount={pendenciasCount} />} 

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full relative pb-12 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direcao}>
          <motion.div 
            key={modulo} 
            custom={direcao}
            variants={variacoesPagina}
            initial="initial" 
            animate="animate" 
            exit="exit" 
            transition={{ duration: 0.3 }}
            className="w-full h-full pt-2"
          >
            {modulo === 'hub' && ( // Página Inicial (Hub).
              <div className="w-full py-2">
                {user && ( 
                  <div className="px-6 mb-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-[2.2rem] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">Olá, {userData?.nome?.split(' ')[0] || "Irmão"}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{userData?.cargo || "Colaborador"} • {userData?.cidade || "Regional"}</span>
                        </div>
                      </div>
                      {temAcessoAoDashboard(userData) && ( 
                        <button onClick={() => mudarModulo('dashboard')} className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 border border-slate-100 transition-all">
                          <BarChart3 size={20} />
                          {pendenciasCount > 0 && isMaster(userData) && ( 
                            <span className="absolute -top-1 -left-1 w-3 h-3 bg-orange-600 rounded-full border-2 border-white animate-pulse"></span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <HighlightCards 
                  todosEnsaios={todosEnsaios} 
                  ensaiosRegionais={ensaiosRegionaisData} 
                  reunioesData={reunioesData} 
                  user={userData}
                  aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} 
                  cidadeUsuario={userData?.cidade} 
                />
                
                <QuickCards mudarModulo={mudarModulo} user={user} /> 

                <div className="px-6 mt-4 w-full">
                  <ListaOficial /> 
                </div>
              </div>
            )}

            {/* Módulos de conteúdo */}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={user} userData={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={user} userData={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={user} userData={userData} />}
            {modulo === 'reunioes' && <ReunioesRegionais user={userData} />}
            {modulo === 'avisos' && <InformativosHub user={userData} />} 
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
            {modulo === 'tickets' && <GerenciamentoTickets user={userData} />} 
          </motion.div>
        </AnimatePresence>
      </main>

      {modulo !== 'tickets' && ( 
        <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
      )}
    </div>
  );
}

export default App;