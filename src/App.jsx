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
import InformativosHub from './components/Informativos/InformativosHub'; // MUDANÇA: Agora importa o novo Hub do caminho oficial da pasta Informativos.
import CapaEntrada from './components/CapaEntrada'; // A tela de abertura (Splash) que aparece ao abrir o app.
import Login from './components/Login'; // A janela flutuante para entrada de colaboradores.
import PainelMaster from './components/PainelMaster'; // O centro de controle administrativo para Masters e Editores.
import Dashboard from './components/Dashboard'; // A tela de estatísticas e gráficos para os encarregados.
import Tickets from './components/Tickets'; // O sistema de envio de feedback (ícone da lâmpada).
import GerenciamentoTickets from './components/GerenciamentoTickets'; // A nova tela profissional de resolução de chamados para o Master.
import ReunioesRegionais from './components/ReunioesRegionais'; // A agenda exclusiva de reuniões administrativas.

function App() { // Função principal que constrói e organiza todo o aplicativo.
  const [modulo, setModulo] = useState('hub'); // Estado que controla qual página está aberta no momento (começa no Hub).
  const [diaFiltro, setDiaFiltro] = useState(''); // Estado para filtrar ensaios por um dia específico ao clicar em "Ver Mais".
  const [showSplash, setShowSplash] = useState(true); // Decide se mostra a tela de entrada ou o conteúdo principal.
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla a visibilidade da janela de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Controla a visibilidade do painel administrativo Master.
  const [direcao, setDirecao] = useState(0); // Define se a animação de troca de tela vai para a esquerda ou direita.
  const [ticketsCount, setTicketsCount] = useState(0); // Conta quantos chamados de suporte estão esperando resposta do Master.

  const { user, userData, pendenciasCount } = useAuth(); // Obtém os dados do usuário logado e contagem de novos cadastros do Hook de autenticação.
  
  // 🛡️ CARGA INICIAL: Carrega todas as informações do banco de dados de uma só vez para velocidade e fluidez.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData();

  const touchStartX = useRef(null); // Referência para guardar onde o dedo tocou na tela pela primeira vez para o gesto de deslizar.
  const touchEndX = useRef(null); // Referência para guardar onde o dedo saiu da tela.

  // 🔄 FILA DE NAVEGAÇÃO: Define a ordem das telas para permitir o arrasto lateral (Swipe) entre elas.
  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes', 'tickets'];

  // Títulos que aparecem no Header para cada seção do App de forma dinâmica.
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

  useEffect(() => { // Monitora o banco de dados em busca de novos tickets pendentes (Apenas se o usuário for Master).
    if (!isMaster(userData)) { setTicketsCount(0); return; } // Se o usuário não for Master, zera o contador de suporte.
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); // Pergunta ao banco por chamados novos.
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); // Atualiza a bolinha azul no topo em tempo real.
    return () => unsub(); // Desliga o monitoramento ao sair para economizar bateria.
  }, [userData]); // Roda sempre que as informações do usuário logado forem carregadas.

  useEffect(() => { // Regra de Segurança: Protege as telas restritas e expulsa quem não tem permissão ou deslogou.
    if (!user) { // Se o usuário deslogar...
      const paginasRestritas = ['dashboard', 'reunioes', 'tickets']; // ...estas páginas tornam-se inacessíveis.
      if (paginasRestritas.includes(modulo) || showPainelMaster) { 
        setModulo('hub'); // Manda o usuário de volta para o início.
        setShowPainelMaster(false); // Garante que o painel administrativo seja fechado.
      }
    }
    if (user && modulo === 'tickets' && !isMaster(userData)) { // Segurança Extra: Impede acesso indevido à gestão de tickets.
      setModulo('hub'); // Redireciona para a tela inicial.
    }
  }, [user, modulo, showPainelMaster, userData]); // Reavalia a segurança sempre que houver mudança de login ou página.

  const mudarModulo = (novoModulo) => { // Função que efetua a troca de página e calcula a direção da animação.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Localiza onde estamos na sequência.
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); // Localiza para onde queremos ir.
    
    if (novoModulo === 'dashboard') setDirecao(1); // O dashboard sempre entra deslizando para a direita.
    else if (modulo === 'dashboard') setDirecao(-1); // Ao sair do dashboard, desliza para a esquerda.
    else setDirecao(indexNovo > indexAtual ? 1 : -1); // Define se a tela entra pela esquerda ou direita baseado na ordem da fila.

    if (novoModulo !== 'locais') setDiaFiltro(''); // Limpa filtros de locais ao navegar.
    setModulo(novoModulo); // Efetiva a mudança de tela.
  };

  const aoFinalizarToque = () => { // Detecta o movimento de arrastar o dedo para trocar de página.
    if (!touchStartX.current || !touchEndX.current) return; // Se o toque não foi completo, ignora.
    const distanciaX = touchStartX.current - touchEndX.current; // Calcula o tamanho do movimento horizontal.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Identifica a página atual.

    if (modulo === 'dashboard') return; // Trava o arrasto no Dashboard para não bugar os gráficos.

    // 🛡️ INTELIGÊNCIA CONTEXTUAL REFINADA: O Maestro só trava o arrasto se o usuário estiver 
    // lendo um card (Instruções, Diagrama, etc). Se estiver no menu principal de Avisos,
    // o dedo volta a funcionar para trocar de módulo (ir para Reuniões ou Contatos).
    if (modulo === 'avisos' && window.history.state?.subSecao && window.history.state.subSecao !== 'hub') {
        return; // Silencia o Maestro apenas quando um card estiver aberto.
    }

    if (distanciaX > 70 && indexAtual !== -1 && indexAtual < ORDEM_MODULOS.length - 1) { // Gesto para avançar (Dedo para esquerda).
      const proximo = ORDEM_MODULOS[indexAtual + 1]; 
      if (proximo === 'reunioes' && !user) return; // Bloqueia visitantes de verem reuniões por gesto.
      if (proximo === 'tickets' && !isMaster(userData)) return; // Bloqueia usuários comuns de verem gestão de tickets.
      mudarModulo(proximo); 
    } else if (distanciaX < -70 && indexAtual > 0) { // Gesto para voltar (Dedo para direita).
      const anterior = ORDEM_MODULOS[indexAtual - 1]; 
      mudarModulo(anterior); 
    }
    touchStartX.current = null; touchEndX.current = null; // Limpa a memória do toque.
  };

  const variacoesPagina = { // Configurações das animações de deslize das telas.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }), // Estado inicial da tela nova.
    animate: { opacity: 1, x: 0 }, // Estado da tela visível no centro.
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }), // Estado da tela velha ao sumir.
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />; // Exibe a Capa antes do App carregar.

  return ( // Montagem visual do Aplicativo.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX} // Marca o início do toque.
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX} // Acompanha o movimento.
         onTouchEnd={aoFinalizarToque}> {/* Decide se troca a tela ao soltar o dedo. */}
      
      <Header // O componente do topo com a inteligência do botão voltar.
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

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />} {/* Janela de Login. */}
      {showPainelMaster && <PainelMaster aoFechar={() => setShowPainelMaster(false)} userLogado={userData} pendenciasCount={pendenciasCount} />} {/* Painel do Master. */}

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
            {modulo === 'hub' && ( // CONTEÚDO DO HUB PRINCIPAL.
              <div className="w-full py-2">
                {user && ( // Cartão de Boas-Vindas para colaboradores.
                  <div className="px-6 mb-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-[2.2rem] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">Olá, {userData?.nome?.split(' ')[0] || "Irmão"}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{userData?.cargo || "Colaborador"} • {userData?.cidade || "Regional"}</span>
                        </div>
                      </div>
                      {temAcessoAoDashboard(userData) && ( // Botão do Gráfico para Cargos com permissão.
                        <button onClick={() => mudarModulo('dashboard')} className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 border border-slate-100 transition-all">
                          <BarChart3 size={20} />
                          {pendenciasCount > 0 && isMaster(userData) && ( // Alerta de novos cadastros para o Master.
                            <span className="absolute -top-1 -left-1 w-3 h-3 bg-orange-600 rounded-full border-2 border-white animate-pulse"></span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <HighlightCards // Cartões de destaque dos ensaios e reuniões do dia.
                  todosEnsaios={todosEnsaios} 
                  ensaiosRegionais={ensaiosRegionaisData} 
                  reunioesData={reunioesData} 
                  user={userData}
                  aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} 
                  cidadeUsuario={userData?.cidade} 
                />
                
                <QuickCards mudarModulo={mudarModulo} user={user} /> {/* Grade de botões principais do App. */}

                <div className="px-6 mt-4 w-full">
                  <ListaOficial /> {/* Botão de acesso à lista oficial externa. */}
                </div>
              </div>
            )}

            {/* Chamada das páginas internas baseada no estado do "Maestro" */}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={user} userData={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={user} userData={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={user} userData={userData} />}
            {modulo === 'reunioes' && <ReunioesRegionais user={userData} />}
            {modulo === 'avisos' && <InformativosHub user={userData} />} {/* Chama o novo Hub central de informativos. */}
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
            {modulo === 'tickets' && <GerenciamentoTickets user={userData} />} 
          </motion.div>
        </AnimatePresence>
      </main>

      {modulo !== 'tickets' && ( // Exibe o sistema de tickets em todas as telas, menos na gestão de tickets do Master.
        <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
      )}
    </div>
  );
}

export default App; // Libera o componente pronto para o uso.