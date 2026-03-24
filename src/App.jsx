// src/App.jsx // Arquivo mestre que coordena todas as telas, animações e segurança do sistema.

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
import { registrarEvento } from './constants/comuns'; // Olheiro que grava os passos da irmandade no Dashboard.

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
  const [diaFiltro, setDiaFiltro] = useState(''); // Filtro automático para quando o usuário quer ver ensaios de um dia específico.
  const [showSplash, setShowSplash] = useState(true); // Decide se exibe a tela de abertura ou o conteúdo do App.
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla a abertura da janela de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Controla a visibilidade do painel de aprovações.
  const [showPermissoes, setShowPermissoes] = useState(false); // Controla se a Central de Privacidade está aberta.
  const [direcao, setDirecao] = useState(0); // Define para qual lado a tela desliza na animação (esquerda ou direita).
  const [ticketsCount, setTicketsCount] = useState(0); // Contador de avisos de novos chamados para o Master.

  const { user, userData, pendenciasCount } = useAuth(); // Obtém os dados de login e contagem de pedidos pendentes.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData(); // Sincroniza o banco de dados.

  const touchStartX = useRef(null); // Registra onde o dedo tocou na tela para o gesto de deslizar.
  const touchEndX = useRef(null); // Registra onde o dedo saiu da tela.

  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes', 'tickets']; // Fila de páginas para o movimento lateral.

  const TITULOS_MODULOS = { // Define os nomes que aparecem no topo do App para cada tela.
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: "." },
    'reunioes': { p1: 'Agenda', p2: 'Reuniões' },
    'avisos': { p1: 'Central', p2: 'Informativos' }, 
    'dashboard': { p1: 'Status', p2: 'Analítico' },
    'tickets': { p1: 'Suporte e', p2: 'Melhorias' } 
  };

  useEffect(() => { // Monitora novos chamados de suporte em tempo real apenas para o Master.
    if (!isMaster(userData)) { setTicketsCount(0); return; } // Se não for Master, zera o contador por segurança.
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); // Busca tickets aguardando resposta.
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); // Atualiza o número de notificações no ícone.
    return () => unsub(); // Limpa o vigia ao fechar o App.
  }, [userData]); // VIGIA: Só age se os dados do usuário logado mudarem.

  useEffect(() => { // Segurança: Redireciona o usuário para a Home se ele tentar acessar áreas restritas sem as permissões necessárias.
    if (!user) { // Se não houver login efetuado...
      const paginasRestritas = ['dashboard', 'reunioes', 'tickets']; // Lista de salas proibidas para visitantes.
      if (paginasRestritas.includes(modulo) || showPainelMaster) { // Se tentar entrar em uma dessas salas...
        setModulo('hub'); // É mandado de volta para a entrada.
        setShowPainelMaster(false); // Fecha o painel administrativo.
      }
    } else { // Se o usuário estiver logado, checa permissões de Comissão e Master.
      // AFINAÇÃO: Permitimos a entrada em 'reunioes' para qualquer logado. A trava agora é só para o Dashboard.
      const podeAcessarDash = temAcessoAoDashboard(userData); // Verifica se o irmão pode ver estatísticas.
      if (!podeAcessarDash && modulo === 'dashboard') { // Se tentar entrar no Dash sem permissão...
        setModulo('hub'); // Volta para a Visão Geral.
      }
    }
  }, [user, userData, modulo, showPainelMaster]); // VIGIA: Mantive a lista constante para evitar erros de renderização.

  const mudarModulo = (novoModulo) => { // Função responsável por trocar de tela e gravar a telemetria.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Localiza a página atual na fila.
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); // Localiza a nova página.
    setDirecao(indexNovo > indexAtual ? 1 : -1); // Define a direção do deslize visual (frente ou trás).
    if (novoModulo !== 'locais') setDiaFiltro(''); // Limpa filtros de data ao trocar de seção para não travar a lista.
    const nomeAmigavel = TITULOS_MODULOS[novoModulo] ? `${TITULOS_MODULOS[novoModulo].p1} ${TITULOS_MODULOS[novoModulo].p2}` : novoModulo;
    registrarEvento('Navegação', 'Acesso ao Módulo', nomeAmigavel, userData); // Grava quem entrou na tela para o Dashboard.
    setModulo(novoModulo); // Efetiva a mudança de tela.
  };

  const aoFinalizarToque = () => { // Lógica para trocar de página usando o gesto de arrastar o dedo (Swipe).
    if (!touchStartX.current || !touchEndX.current) return; // Se não houve movimento completo, ignora.
    const distanciaX = touchStartX.current - touchEndX.current; // Calcula o tamanho do arrasto.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Verifica onde estamos.
    if (modulo === 'dashboard') return; // Bloqueia o gesto no Dashboard para não interferir no movimento dos gráficos.
    if (distanciaX > 70 && indexAtual < ORDEM_MODULOS.length - 1) { // Gesto para a esquerda (Avançar).
      const proximo = ORDEM_MODULOS[indexAtual + 1];
      // AFINAÇÃO: Permite que qualquer irmão logado deslize para a agenda de reuniões.
      if (proximo === 'reunioes' && !user) return; 
      if (proximo === 'tickets' && !isMaster(userData)) return; // Mantém a trava de suporte apenas para o Master.
      mudarModulo(proximo); // Muda para a próxima página.
    } else if (distanciaX < -70 && indexAtual > 0) { // Gesto para a direita (Voltar).
      mudarModulo(ORDEM_MODULOS[indexAtual - 1]); // Volta uma página.
    }
    touchStartX.current = null; touchEndX.current = null; // Reseta os pontos de toque.
  };

  const lidarComEntradaNoApp = async () => { // Função disparada ao clicar no botão de entrada da tela inicial.
    let cidadeDetectada = "Visitante Externo"; // Padrão de segurança caso a localização falhe.
    try {
      const response = await fetch('https://ipapi.co/json/'); // Tenta identificar a cidade pelo IP do usuário para telemetria.
      if (response.ok) {
        const data = await response.json();
        if (data?.city) cidadeDetectada = data.city;
      }
    } catch (e) { console.log("Localização via IP indisponível."); }
    setShowSplash(false); // Fecha a tela de abertura.
    registrarEvento('App', 'Entrada', `Acesso vindo de ${cidadeDetectada}`, { ...userData, cidadeDetectada }); // Grava o início da sessão.
  };

  const variacoesPagina = { // Configurações técnicas das animações de entrada e saída das telas usando o Framer Motion.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
  };

  if (showSplash) return <CapaEntrada aoEntrar={lidarComEntradaNoApp} />; // Exibe a capa de entrada antes de carregar o sistema.

  return ( // Início da renderização visual do corpo do aplicativo.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}> 
      
      <Header // Componente que desenha o topo fixo do aplicativo.
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
        {showPermissoes && ( // Janela de privacidade e notificações.
          <CentralPermissoes aoFechar={() => setShowPermissoes(false)} user={userData} />
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full relative pb-12 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direcao}>
          <motion.div key={modulo} custom={direcao} variants={variacoesPagina} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full h-full pt-2">
            
            {modulo === 'hub' && ( // Conteúdo da TELA INICIAL (HUB).
              <div className="w-full py-2">
                {user && ( // Exibe card de boas-vindas personalizado se o irmão estiver logado.
                  <div className="px-6 mb-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-[2.2rem] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4 text-left">
                        <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-[900] uppercase text-slate-950 leading-none">Olá, {userData?.nome?.split(' ')[0] || "Irmão"}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{userData?.cargo || "Colaborador"}</span>
                        </div>
                      </div>
                      {/* O botão do Dashboard aparece apenas para quem tem permissão regional. */}
                      {temAcessoAoDashboard(userData) && (
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

            {/* Telas carregadas dinamicamente conforme a navegação */}
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

      {modulo !== 'tickets' && ( // Botão de suporte, escondido apenas na tela de tickets.
        <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
      )}
    </div>
  );
}

export default App; // Exporta o mestre da aplicação com a entrada de reuniões liberada para todos os logados.