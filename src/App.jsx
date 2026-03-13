import React, { useState, useRef, useEffect } from 'react'; // Ferramenta base do React para gerenciar estados e referências.
import { auth, db } from './firebaseConfig'; // Importa as configurações do seu banco de dados e autenticação.
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Ferramentas para buscar dados em tempo real no banco.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca que faz as transições suaves entre as telas.
import { User, BarChart3 } from 'lucide-react'; // Importa ícones necessários para o card de boas-vindas e dashboard.

// Hooks Personalizados
import { useAuth } from './hooks/useAuth'; // Hook que verifica quem está logado no sistema e traz as pendências.
import { useFirestoreData } from './hooks/useFirestoreData'; // Hook que traz as listas de ensaios e contatos do banco.

// Importação das Novas Regras de Permissões
import { isMaster, temAcessoAoDashboard } from './constants/permissions'; // Motor de regras para gerenciar acessos por cargo.

// Importação dos Componentes Componentizados (A NOVA ESTRUTURA)
import Header from './components/Header'; // O novo cabeçalho fixo com títulos deslizantes.
import HighlightCards from './components/HighlightCards'; // Os cards de destaque (Reuniões, Regional e Hoje).
import QuickCards from './components/QuickCards'; // O menu de botões de navegação rápida.
import ListaOficial from './components/ListaOficial'; // O botão da lista de batismos.

// Importação das Telas de Módulo
import EnsaiosRegionais from './components/EnsaiosRegionais'; // Tela de agenda da regional.
import EnsaiosLocais from './components/EnsaiosLocais'; // Tela de agenda das igrejas locais.
import Comissao from './components/Comissao'; // Tela de contatos e examinadoras.
import Avisos from './components/Avisos'; // Tela de regimento e avisos.
import CapaEntrada from './components/CapaEntrada'; // Tela inicial de splash (entrada).
import Login from './components/Login'; // Tela de entrada para colaboradores.
import PainelMaster from './components/PainelMaster'; // Painel de gestão administrativa do Master.
import Dashboard from './components/Dashboard'; // Tela de gráficos estatísticos.
import Tickets from './components/Tickets'; // Sistema de feedback (lâmpada).
import ReunioesRegionais from './components/ReunioesRegionais'; // Agenda de reuniões administrativas.

function App() { // Início da função principal que motoriza o aplicativo.
  const [modulo, setModulo] = useState('hub'); // Estado que controla qual página está aberta no momento.
  const [diaFiltro, setDiaFiltro] = useState(''); // Filtro para abrir ensaios de um dia específico.
  const [showSplash, setShowSplash] = useState(true); // Controla se a capa de entrada deve aparecer.
  const [showLoginModal, setShowLoginModal] = useState(false); // Abre ou fecha a telinha de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Abre ou fecha o painel administrativo.
  const [direcao, setDirecao] = useState(0); // Controla a animação de deslize das telas.
  const [ticketsCount, setTicketsCount] = useState(0); // Contador de avisos de suporte para o Master.

  const { user, userData, pendenciasCount } = useAuth(); // Pega dados do login e contagem de aprovações pendentes.
  
  // 🛡️ CARGA DE DADOS: Carrega todas as listas do Firebase de uma vez só.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData(); 

  const touchStartX = useRef(null); // Guarda a posição inicial do toque para o gesto de deslizar.
  const touchEndX = useRef(null); // Guarda a posição final do toque.

  // 🔄 NOVA ORDEM DE MÓDULOS: Segue a sequência dos botões do menu e isola o Dashboard.
  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes']; 
  // Nota: O 'dashboard' não entra aqui para não ser acessado via arrasto lateral.

  const TITULOS_MODULOS = { 
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'reunioes': { p1: 'Agenda de', p2: 'Reuniões' },
    'avisos': { p1: 'Informações', p2: 'da Orquestra' },
    'dashboard': { p1: 'Status', p2: 'Analítico' }
  };

  useEffect(() => { // Monitora novos tickets na lâmpada (suporte) para o Master.
    if (!isMaster(userData)) { setTicketsCount(0); return; } 
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); 
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); 
    return () => unsub(); 
  }, [userData]); 

  useEffect(() => { // Segurança: expulsa usuários deslogados de páginas restritas.
    if (!user) { 
      const paginasRestritas = ['dashboard', 'reunioes']; 
      if (paginasRestritas.includes(modulo) || showPainelMaster) { 
        setModulo('hub'); 
        setShowPainelMaster(false); 
      }
    }
  }, [user, modulo, showPainelMaster]); 

  const mudarModulo = (novoModulo) => { // Função central para trocar de página e definir a direção da animação.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); 
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); 
    
    // Se o usuário clicar no Dashboard, ele não está no array, então tratamos a direção manualmente.
    if (novoModulo === 'dashboard') setDirecao(1);
    else if (modulo === 'dashboard') setDirecao(-1);
    else setDirecao(indexNovo > indexAtual ? 1 : -1); 

    if (novoModulo !== 'locais') setDiaFiltro(''); 
    setModulo(novoModulo); 
  };

  const aoFinalizarToque = () => { // Lógica para navegar entre as telas arrastando o dedo na tela (swipe).
    if (!touchStartX.current || !touchEndX.current) return; 
    const distanciaX = touchStartX.current - touchEndX.current; 
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); 

    // Se estiver no Dashboard, o arrasto lateral fica desabilitado para não conflitar com os gráficos.
    if (modulo === 'dashboard') return;

    if (distanciaX > 70 && indexAtual !== -1 && indexAtual < ORDEM_MODULOS.length - 1) { 
      // Arrastou para a esquerda: AVANÇAR
      const proximo = ORDEM_MODULOS[indexAtual + 1]; 
      
      // Validação de Segurança: Só avança para Reuniões se estiver logado.
      if (proximo === 'reunioes' && !user) return; 
      
      mudarModulo(proximo); 
    } else if (distanciaX < -70 && indexAtual > 0) { 
      // Arrastou para a direita: VOLTAR
      const anterior = ORDEM_MODULOS[indexAtual - 1];
      mudarModulo(anterior); 
    }
    touchStartX.current = null; touchEndX.current = null; 
  };

  const variacoesPagina = { // Configuração das animações suaves entre telas.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />; // Capa Splash inicial.

  return ( // Estrutura visual principal.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}>
      
      <Header 
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
            {modulo === 'hub' && (
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
                      {/* BOTÃO DASHBOARD: Única porta de entrada para a sala de gráficos */}
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

            {/* Injeção dinâmica das telas de módulo */}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={userData} />}
            {modulo === 'reunioes' && <ReunioesRegionais user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
    </div>
  );
}

export default App; // Exporta o mestre do App com a nova sequência de deslize e dashboard isolado.