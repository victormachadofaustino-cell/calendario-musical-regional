import React, { useState, useRef, useEffect } from 'react'; // Ferramenta base para gerenciar estados e referências.
import { auth, db } from './firebaseConfig'; // Configurações de conexão com o banco de dados e login.
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Ferramentas para busca de dados em tempo real.
import { motion, AnimatePresence } from 'framer-motion'; // Responsável pelas transições suaves entre as telas do app.
import { User, BarChart3 } from 'lucide-react'; // Ícones modernos para o cabeçalho e menus laterais.

// Hooks Personalizados (Nossas ferramentas auxiliares de busca de dados)
import { useAuth } from './hooks/useAuth'; // Verifica quem está logado e traz o perfil do irmão.
import { useFirestoreData } from './hooks/useFirestoreData'; // Carrega as listas de ensaios e contatos oficiais.

// Importação das Regras de Permissões e Telemetria
import { isMaster, temAcessoAoDashboard, isComissao } from './constants/permissions'; // Define quem pode acessar áreas restritas.
import { registrarEvento, registrarAcesso } from './constants/comuns'; // Olheiro que grava os passos e a entrada da irmandade.

// Importação dos Componentes da Estrutura Visual
import Header from './components/Header'; // Cabeçalho fixo com títulos e botões de controle.
import HighlightCards from './components/HighlightCards'; // Cartões de destaque que mostram os ensaios de hoje.
import QuickCards from './components/QuickCards'; // Menu principal de botões quadrados para navegação rápida.
import ListaOficial from './components/ListaOficial'; // Atalho para a lista externa de batismos.

// Importação das Telas de cada Módulo (As páginas do Aplicativo)
import EnsaiosRegionais from './components/EnsaiosRegionais'; // Página que lista a agenda de ensaios regionais.
import EnsaiosLocais from './components/EnsaiosLocais'; // Página que lista a agenda de ensaios locais.
import Comissao from './components/Comissao'; // Página de contatos úteis da comissão e examinadoras.
import InformativosHub from './components/Informativos/InformativosHub'; // Central de avisos, circulares e diagramas.
import CapaEntrada from './components/CapaEntrada'; // Splash Screen de abertura que aparece ao carregar.
import PesquisaGeral from './components/PesquisaGeral'; // Mantido nas importações para segurança do sistema.
import Login from './components/Login'; // Janela flutuante para entrada de colaboradores autorizados.
import PainelMaster from './components/PainelMaster'; // Centro de controle para aprovações de sugestões.
import Dashboard from './components/Dashboard'; // Tela de estatísticas e gráficos para a liderança ministerial.
import Tickets from './components/Tickets'; // Sistema de envio de melhorias e bugs (ícone da lâmpada).
import GerenciamentoTickets from './components/GerenciamentoTickets'; // Tela de resolução de chamados para o administrador.
import ReunioesRegionais from './components/ReunioesRegionais'; // Agenda exclusiva para reuniões de conselho e técnica.
import CentralPermissoes from './components/CentralPermissoes'; // Central de configurações de privacidade e notificações.

function App() { // Função principal que constrói e organiza toda a orquestra do código.
  const [modulo, setModulo] = useState('hub'); // Controla qual página está ativa no momento.
  const [diaFiltro, setDiaFiltro] = useState(''); // Filtro automático para dias específicos.
  const [showSplash, setShowSplash] = useState(true); // Decide se exibe a tela de abertura.
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla a janela de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Controla o painel do administrador.
  const [showPermissoes, setShowPermissoes] = useState(false); // Controla a Central de Privacidade.
  const [direcao, setDirecao] = useState(0); // Define a direção da animação lateral.
  const [ticketsCount, setTicketsCount] = useState(0); // Contador de novos chamados.

  const { user, userData, pendenciasCount } = useAuth(); // Obtém dados de login do irmão.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData(); // Sincroniza o banco.

  const touchStartX = useRef(null); // Registra o início do toque para o gesto Swipe.
  const touchEndX = useRef(null); // Registra o fim do toque.

  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes', 'tickets']; // Fila para navegação lateral.

  const TITULOS_MODULOS = { // Títulos que aparecem no topo de cada tela.
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: "." },
    'reunioes': { p1: 'Agenda', p2: 'Reuniões' },
    'avisos': { p1: 'Central', p2: 'Informativos' }, 
    'dashboard': { p1: 'Status', p2: 'Analítico' },
    'tickets': { p1: 'Suporte e', p2: 'Melhorias' } 
  };

  useEffect(() => { // Monitora novos chamados exclusivamente para o Master.
    if (!isMaster(userData)) { setTicketsCount(0); return; } // Segurança: zero para não-Masters.
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); // Busca tickets abertos.
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); // Atualiza o contador visual.
    return () => unsub(); // Limpa o sensor ao fechar.
  }, [userData]); // Age apenas se o perfil do usuário mudar.

  useEffect(() => { // Segurança: Trava áreas restritas para visitantes ou sem cargo.
    if (!user) { // Se não estiver logado...
      const paginasRestritas = ['dashboard', 'reunioes', 'tickets']; // Lista de páginas bloqueadas.
      if (paginasRestritas.includes(modulo) || showPainelMaster) { // Se tentar entrar nelas...
        setModulo('hub'); // Volta para o início.
        setShowPainelMaster(false); // Fecha o painel administrativo.
      }
    } else { // Se logado, checa permissões de liderança.
      const podeAcessarDash = temAcessoAoDashboard(userData); // Checa permissão do Dashboard.
      if (!podeAcessarDash && modulo === 'dashboard') { // Se não puder ver estatísticas...
        setModulo('hub'); // É redirecionado para a Home.
      }
    }
  }, [user, userData, modulo, showPainelMaster]); // Vigia constante da segurança de acesso.

  const mudarModulo = (novoModulo) => { // Função de troca de tela com registro de cliques.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Localiza onde estamos na fila.
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); // Localiza para onde vamos.
    setDirecao(indexNovo > indexAtual ? 1 : -1); // Define o lado da animação.
    if (novoModulo !== 'locais') setDiaFiltro(''); // Limpa filtros de data ao navegar.
    const nomeAmigavel = TITULOS_MODULOS[novoModulo] ? `${TITULOS_MODULOS[novoModulo].p1} ${TITULOS_MODULOS[novoModulo].p2}` : novoModulo;
    registrarEvento('Navegação', 'Acesso ao Módulo', nomeAmigavel, userData); // Grava a navegação interna.
    setModulo(novoModulo); // Efetiva a troca visual.
  };

  const aoFinalizarToque = () => { // Lógica de navegação via deslize de dedo (Swipe).
    if (!touchStartX.current || !touchEndX.current) return; // Ignora se o toque foi incompleto.
    const distanciaX = touchStartX.current - touchEndX.current; // Mede o arrasto.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Checa a página atual.
    if (modulo === 'dashboard') return; // Bloqueia swipe no Dashboard para não travar os gráficos.
    if (distanciaX > 70 && indexAtual < ORDEM_MODULOS.length - 1) { // Gesto para avançar.
      const proximo = ORDEM_MODULOS[indexAtual + 1];
      if (proximo === 'reunioes' && !user) return; // Visitantes não "deslizam" para reuniões.
      if (proximo === 'tickets' && !isMaster(userData)) return; // Apenas Masters deslizam para suporte.
      mudarModulo(proximo); // Avança página.
    } else if (distanciaX < -70 && indexAtual > 0) { // Gesto para voltar.
      mudarModulo(ORDEM_MODULOS[indexAtual - 1]); // Volta página.
    }
    touchStartX.current = null; touchEndX.current = null; // Reseta as coordenadas de toque.
  };

  const lidarComEntradaNoApp = async () => { // Função disparada no botão "Toque para Entrar".
    let cidadeDetectada = "Visitante Externo"; // Padrão caso a localização falhe.
    try {
      const response = await fetch('https://ipapi.co/json/'); // Identifica a cidade pelo IP.
      if (response.ok) {
        const data = await response.json();
        if (data?.city) cidadeDetectada = data.city; // Salva a cidade encontrada.
      }
    } catch (e) { console.log("Localização via IP indisponível."); }
    setShowSplash(false); // Fecha a Splash Screen.
    // AQUI INSTALAMOS O REGISTRO DE ACESSO (O PORTEIRO DO GRÁFICO):
    registrarAcesso(userData, cidadeDetectada); // Grava a entrada na gaveta telemetria_acessos.
    registrarEvento('App', 'Entrada', `Sessão iniciada em ${cidadeDetectada}`, { ...userData, cidadeDetectada }); // Log de evento.
  };

  const variacoesPagina = { // Configuração das animações de entrada e saída.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
  };

  if (showSplash) return <CapaEntrada aoEntrar={lidarComEntradaNoApp} />; // Exibe a capa de entrada primeiro.

  return ( // Renderização principal do aplicativo.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}> 
      
      <Header // Cabeçalho coordenador do sistema.
        modulo={modulo} 
        setModulo={mudarModulo} 
        user={user} 
        userData={userData} 
        pendenciasCount={pendenciasCount} 
        ticketsCount={ticketsCount} 
        titulosModulos={TITULOS_MODULOS}
        setShowLoginModal={setShowLoginModal} 
        setShowPainelMaster={setShowPainelMaster}
        setShowPermissoes={setShowPermissoes} 
      />

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />}
      {showPainelMaster && <PainelMaster aoFechar={() => setShowPainelMaster(false)} userLogado={userData} pendenciasCount={pendenciasCount} />}

      <AnimatePresence>
        {showPermissoes && ( // Central de Privacidade.
          <CentralPermissoes aoFechar={() => setShowPermissoes(false)} user={userData} />
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full relative pb-12 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direcao}>
          <motion.div key={modulo} custom={direcao} variants={variacoesPagina} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full h-full pt-2">
            
            {modulo === 'hub' && ( // Conteúdo da TELA INICIAL.
              <div className="w-full py-2">
                {user && ( // Saudação para o irmão logado.
                  <div className="px-6 mb-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-[2.2rem] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4 text-left">
                        <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-[900] uppercase text-slate-950 leading-none">Olá, {userData?.nome?.split(' ')[0] || "Irmão"}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{userData?.cargo || "Colaborador"}</span>
                        </div>
                      </div>
                      {temAcessoAoDashboard(userData) && ( // Botão restrito para liderança regional.
                        <button onClick={() => mudarModulo('dashboard')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 active:scale-95 transition-all"><BarChart3 size={20} /></button>
                      )}
                    </div>
                  </div>
                )}

                <HighlightCards todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} reunioesData={reunioesData} user={userData} aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} cidadeUsuario={userData?.cidade} />
                <QuickCards mudarModulo={mudarModulo} user={user} />
                <div className="px-6 mt-4 w-full"><ListaOficial userData={userData} /></div>
              </div>
            )}

            {/* Carregamento dinâmico das telas internas */}
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

      {modulo !== 'tickets' && ( // O ícone de Tickets fica disponível em quase todas as telas.
        <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
      )}
    </div>
  );
}

export default App; // Exporta o mestre da aplicação com o sensor de audiência instalado.