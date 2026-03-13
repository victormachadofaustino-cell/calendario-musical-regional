import React, { useState, useRef, useEffect } from 'react'; // Ferramenta base do React para criar componentes e gerenciar estados.
import { signOut } from 'firebase/auth'; // Ferramenta para deslogar o usuário do sistema com segurança.
import { auth, db } from './firebaseConfig'; // Importa as configurações do seu banco de dados e autenticação.
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Ferramentas para buscar dados em tempo real no banco.
import { 
  LayoutGrid, Music, Music2, Users, Info, ArrowLeft, User, LogOut, Lock,
  BookOpen, CalendarDays, BarChart3
} from 'lucide-react'; // Biblioteca de ícones oficiais para o projeto.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca que faz as transições suaves entre as telas.

// Hooks Personalizados
import { useAuth } from './hooks/useAuth'; // Hook que verifica quem está logado no sistema e traz as pendências.
import { useFirestoreData } from './hooks/useFirestoreData'; // Hook que traz as listas de ensaios e contatos do banco.

// Importação das Novas Regras de Permissões
import { isMaster, temAcessoAoDashboard } from './constants/permissions'; // Motor de regras para gerenciar acessos por cargo.

// Importação dos Componentes
import EnsaiosRegionais from './components/EnsaiosRegionais'; // Tela de eventos da regional.
import EnsaiosLocais from './components/EnsaiosLocais'; // Tela de eventos das igrejas comuns.
import Comissao from './components/Comissao'; // Tela de contatos e examinadoras.
import Avisos from './components/Avisos'; // Tela de instruções e avisos da orquestra.
import CapaEntrada from './components/CapaEntrada'; // Tela inicial de splash (entrada).
import Summary from './components/Summary'; // Resumo (Hub) que gerencia o card de boas-vindas e dashboard.
import Login from './components/Login'; // Tela de entrada para colaboradores.
import PainelMaster from './components/PainelMaster'; // Painel de gestão exclusivo do Master.
import ListaOficial from './components/ListaOficial'; // Botão de acesso à lista de batismos.
import Dashboard from './components/Dashboard'; // Tela de gráficos estatísticos da regional.
import Tickets from './components/Tickets'; // Sistema de feedback (ícone da lâmpada).

function App() { // Início da função principal que desenha o aplicativo.
  const [modulo, setModulo] = useState('hub'); // Estado que controla qual página está aberta no momento.
  const [diaFiltro, setDiaFiltro] = useState(''); // Filtro para abrir ensaios de um dia específico clicado no resumo.
  const [showSplash, setShowSplash] = useState(true); // Controla se a capa de entrada deve aparecer ao abrir o app.
  const [showLoginModal, setShowLoginModal] = useState(false); // Abre ou fecha a telinha de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Abre ou fecha o painel administrativo.
  const [direcao, setDirecao] = useState(0); // Controla a animação (se a tela desliza para esquerda ou direita).
  const [ticketsCount, setTicketsCount] = useState(0); // Contador de avisos de suporte para o Master.

  const { user, userData, pendenciasCount } = useAuth(); // Pega os dados do usuário logado e contagem de pendências de aprovação.
  const { todosEnsaios, ensaiosRegionaisData, encarregadosData, examinadorasData, loading } = useFirestoreData(); // Carrega os dados das listas do banco.

  const touchStartX = useRef(null); // Guarda a posição onde o dedo tocou na tela para o gesto de deslizar.
  const touchEndX = useRef(null); // Guarda a posição onde o dedo saiu da tela.

  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'dashboard']; // Sequência das telas para a navegação por deslize lateral.

  const TITULOS_MODULOS = { // Lista de nomes que aparecem no topo de cada tela do sistema.
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'avisos': { p1: 'Informações', p2: 'da Orquestra' },
    'dashboard': { p1: 'Status', p2: 'Analítico' }
  };

  useEffect(() => { // Monitora se existem novas mensagens enviadas pelos usuários na lâmpada.
    if (!isMaster(userData)) { setTicketsCount(0); return; } // Se não for Master, o contador não aparece.
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); // Busca tickets em aberto.
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); // Atualiza a contagem em tempo real.
    return () => unsub(); // Para de observar o banco ao fechar o app.
  }, [userData]); // Recalcula se o cargo do usuário mudar.

  useEffect(() => { // Segurança: expulsa o usuário de telas restritas caso ele faça logout.
    if (!user) { // Se o usuário não estiver logado...
      const paginasRestritas = ['dashboard']; // ...esta tela é bloqueada.
      if (paginasRestritas.includes(modulo) || showPainelMaster) { 
        setModulo('hub'); // Volta para a tela pública.
        setShowPainelMaster(false); // Fecha o painel de gestão.
      }
    }
  }, [user, modulo, showPainelMaster]); // Vigia o status do login.

  const variacoesPagina = { // Define as configurações visuais da animação de troca de tela.
    initial: (direcao) => ({ opacity: 0, x: direcao > 0 ? 100 : -100 }),
    animate: { opacity: 1, x: 0 },
    exit: (direcao) => ({ opacity: 0, x: direcao > 0 ? -100 : 100 }),
  };

  const mudarModulo = (novoModulo) => { // Função central para trocar de página manualmente.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Vê a posição atual.
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); // Vê a posição de destino.
    if (novoModulo !== 'locais') setDiaFiltro(''); // Limpa filtros de data ao sair dos ensaios locais.
    setDirecao(indexNovo > indexAtual ? 1 : -1); // Define se a animação vai para frente ou trás.
    setModulo(novoModulo); // Efetiva a mudança de tela.
  };

  const aoFinalizarToque = () => { // Lógica para o gesto de deslizar o dedo (Swipe).
    if (!touchStartX.current || !touchEndX.current) return; 
    const distanciaX = touchStartX.current - touchEndX.current; // Calcula o tamanho do arrasto.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Identifica a página ativa.
    
    if (modulo === 'dashboard' || modulo === 'avisos') return; // Desativa o gesto em telas complexas.

    if (distanciaX > 70 && indexAtual < ORDEM_MODULOS.length - 1) { // Deslizou para avançar.
      const proximo = ORDEM_MODULOS[indexAtual + 1]; 
      if (proximo === 'dashboard' && !temAcessoAoDashboard(userData)) return; 
      mudarModulo(proximo); 
    } else if (distanciaX < -70 && indexAtual > 0) { // Deslizou para voltar.
      mudarModulo(ORDEM_MODULOS[indexAtual - 1]); 
    }
    touchStartX.current = null; touchEndX.current = null; // Reseta as coordenadas.
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />; // Exibe a capa de entrada se for o primeiro carregamento.

  return ( // Início da estrutura visual do aplicativo.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative overflow-x-hidden"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}>
      
      {/* HEADER COMPACTO: Cabeçalho com títulos e botões de acesso rápido */}
      <header className="bg-white pt-4 pb-5 px-6 rounded-b-[2rem] shadow-sm border-b border-slate-200 shrink-0 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto w-full">
          <div className="flex flex-col text-left">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={modulo}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-lg tracking-tighter uppercase leading-none flex items-center"
              >
                <span className="font-[900] text-slate-950 italic">{TITULOS_MODULOS[modulo].p1}</span>
                <span className="font-medium text-slate-400 italic ml-1.5">{TITULOS_MODULOS[modulo].p2}</span>
              </motion.h1>
            </AnimatePresence>
            <span className="text-slate-950 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Calendário Musical</span>
          </div>
          <div className="flex items-center gap-1.5">
            {modulo !== 'hub' && ( // Botão de voltar ao Hub.
              <button onClick={() => mudarModulo('hub')} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 active:scale-90 transition-all"><ArrowLeft size={16} /></button>
            )}
            <div className="relative">
              <button onClick={() => !user ? setShowLoginModal(true) : setShowPainelMaster(true)} 
                      className={`p-2.5 rounded-xl transition-all shadow-lg ${user ? (isMaster(userData) ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-950'} text-white`}>
                {user ? <User size={16} /> : <Lock size={16} />}
              </button>
              {(pendenciasCount + ticketsCount > 0) && isMaster(userData) && ( // Alerta de trabalho pendente (Aprovações + Suporte).
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce shadow-md">
                  {pendenciasCount + ticketsCount}
                </span>
              )}
            </div>
            {user && <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 ml-0.5"><LogOut size={16} /></button>}
          </div>
        </div>
      </header>

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />}
      {/* CORREÇÃO: Enviando o pendenciasCount para o PainelMaster para resolver o erro de referência */}
      {showPainelMaster && <PainelMaster aoFechar={() => setShowPainelMaster(false)} userLogado={userData} pendenciasCount={pendenciasCount} />}

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full relative pb-12 overflow-hidden">
        <AnimatePresence mode="wait" custom={direcao}>
          <motion.div 
            key={modulo} 
            custom={direcao}
            variants={variacoesPagina}
            initial="initial" 
            animate="animate" 
            exit="exit" 
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="w-full h-full"
          >
            {modulo === 'hub' && (
              <div className="w-full py-2">
                {/* SUMMARY: Gerencia o card de boas-vindas e o botão do Dashboard no topo */}
                <Summary 
                  todosEnsaios={todosEnsaios} 
                  ensaiosRegionais={ensaiosRegionaisData} 
                  aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} 
                  aoAbrirDashboard={() => mudarModulo('dashboard')} 
                  cidadeUsuario={userData?.cidade} 
                  user={userData} 
                  pendenciasCount={pendenciasCount} 
                />
                
                <div className="px-6 space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {/* Botão Ensaios Locais */}
                    <button onClick={() => mudarModulo('locais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Music2 size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Ensaios Locais</span>
                    </button>
                    {/* Botão Ensaios Regionais */}
                    <button onClick={() => mudarModulo('regionais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Music size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Ensaios Regionais</span>
                    </button>
                    {/* Botão de Contatos */}
                    <button onClick={() => mudarModulo('comissao')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Users size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Contatos</span>
                    </button>
                    {/* Botão de Informações da Orquestra */}
                    <button onClick={() => mudarModulo('avisos')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Info size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-center leading-tight">Informações da Orquestra</span>
                    </button>

                    {/* Botão de Cultos (Badge Em Breve) */}
                    <div className="bg-white/50 p-6 rounded-[2.2rem] border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden opacity-80 shadow-sm">
                      <div className="absolute top-3 right-5 bg-amber-100 text-amber-600 text-[6px] font-black px-2 py-0.5 rounded-full uppercase italic">Em Breve</div>
                      <BookOpen size={28} className="text-slate-300" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Cultos</span>
                    </div>

                    {/* BOTÃO DE REUNIÕES: Devolvido para o menu principal conforme solicitado (Badge Em Breve) */}
                    <div className="bg-white/50 p-6 rounded-[2.2rem] border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden opacity-80 shadow-sm">
                      <div className="absolute top-3 right-5 bg-blue-100 text-blue-600 text-[6px] font-black px-2 py-0.5 rounded-full uppercase italic">Em Breve</div>
                      <CalendarDays size={28} className="text-slate-300" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Reuniões</span>
                    </div>
                  </div>
                  {/* Botão da Lista Oficial de Batismos */}
                  <div className="px-0 mt-4 w-full"><ListaOficial /></div>
                </div>
              </div>
            )}
            {/* Renderização condicional das telas baseada no estado 'modulo' */}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tickets: Sistema de comunicação via ícone de lâmpada */}
      <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
    </div>
  );
}

export default App; // Exporta o componente App para o navegador.