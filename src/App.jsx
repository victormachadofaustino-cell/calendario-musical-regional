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
import Avisos from './components/Avisos'; // Página com informações, regimentos e avisos da orquestra.
import CapaEntrada from './components/CapaEntrada'; // A tela de abertura (Splash) que aparece ao abrir o app.
import Login from './components/Login'; // A janela flutuante para entrada de colaboradores.
import PainelMaster from './components/PainelMaster'; // O centro de controle administrativo para Masters e Editores.
import Dashboard from './components/Dashboard'; // A tela de estatísticas e gráficos para os encarregados.
import Tickets from './components/Tickets'; // O sistema de envio de feedback (ícone da lâmpada).
import GerenciamentoTickets from './components/GerenciamentoTickets'; // A nova tela profissional de resolução de chamados para o Master.
import ReunioesRegionais from './components/ReunioesRegionais'; // A agenda exclusiva de reuniões administrativas.

function App() { // Função principal que constrói e organiza todo o aplicativo.
  const [modulo, setModulo] = useState('hub'); // Controla qual "página" está ativa na tela do usuário.
  const [diaFiltro, setDiaFiltro] = useState(''); // Estado para filtrar ensaios por um dia específico ao clicar em "Ver Mais".
  const [showSplash, setShowSplash] = useState(true); // Decide se mostra a tela de entrada ou o conteúdo principal.
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla a visibilidade da janela de login.
  const [showPainelMaster, setShowPainelMaster] = useState(false); // Controla a visibilidade do painel administrativo Master.
  const [direcao, setDirecao] = useState(0); // Define se a animação de troca de tela vai para a esquerda ou direita.
  const [ticketsCount, setTicketsCount] = useState(0); // Conta quantos chamados de suporte estão esperando resposta do Master.

  const { user, userData, pendenciasCount } = useAuth(); // Obtém os dados do usuário logado e contagem de novos cadastros.
  
  // 🛡️ CARGA INICIAL: Carrega todas as informações do banco de dados de uma só vez para velocidade.
  const { todosEnsaios, ensaiosRegionaisData, reunioesData, encarregadosData, examinadorasData, loading } = useFirestoreData(); 

  const touchStartX = useRef(null); // Referência para guardar onde o dedo tocou na tela pela primeira vez.
  const touchEndX = useRef(null); // Referência para guardar onde o dedo saiu da tela.

  // 🔄 FILA DE NAVEGAÇÃO: Define a ordem das telas para permitir o arrasto lateral (Swipe).
  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'reunioes', 'tickets']; 
  // Nota: O 'dashboard' fica fora desta lista para evitar que apareça ao arrastar o dedo por engano.

  // Títulos que aparecem no Header para cada seção do App.
  const TITULOS_MODULOS = { 
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'reunioes': { p1: 'Agenda de', p2: 'Reuniões' },
    'avisos': { p1: 'Informações', p2: 'da Orquestra' },
    'dashboard': { p1: 'Status', p2: 'Analítico' },
    'tickets': { p1: 'Suporte e', p2: 'Melhorias' } // Título para o novo módulo de gestão de chamados.
  };

  useEffect(() => { // Monitora o banco de dados em busca de novos tickets pendentes (Apenas para o Master).
    if (!isMaster(userData)) { setTicketsCount(0); return; } // Se o usuário não for Master, zera o contador.
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")); // Busca tickets em aberto.
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size)); // Atualiza o contador toda vez que algo muda no banco.
    return () => unsub(); // Desliga o monitoramento ao fechar o app para economizar bateria.
  }, [userData]); // Monitoramento vinculado ao perfil do usuário logado.

  useEffect(() => { // Regra de Segurança: Protege as telas restritas contra acessos indevidos.
    if (!user) { // Se o usuário não estiver logado...
      const paginasRestritas = ['dashboard', 'reunioes', 'tickets']; // ...estas páginas ficam bloqueadas.
      if (paginasRestritas.includes(modulo) || showPainelMaster) { 
        setModulo('hub'); // Manda o usuário de volta para o início.
        setShowPainelMaster(false); // Fecha qualquer painel administrativo aberto.
      }
    }
    // Segurança Extra: Se estiver logado mas não for Master, não pode entrar no Gerenciamento de Tickets.
    if (user && modulo === 'tickets' && !isMaster(userData)) {
      setModulo('hub'); // Expulsa o usuário comum da tela de gestão.
    }
  }, [user, modulo, showPainelMaster, userData]); // Reavalia as regras sempre que o usuário ou a página mudar.

  const mudarModulo = (novoModulo) => { // Função principal para trocar de página no app.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); // Localiza onde estamos na fila de páginas.
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo); // Localiza para onde vamos.
    
    // Tratamento especial para o Dashboard que está fora da fila de arrasto.
    if (novoModulo === 'dashboard') setDirecao(1); 
    else if (modulo === 'dashboard') setDirecao(-1); 
    else setDirecao(indexNovo > indexAtual ? 1 : -1); // Define a direção da animação visual (deslize).

    if (novoModulo !== 'locais') setDiaFiltro(''); // Limpa buscas de datas específicas se sair da tela de locais.
    setModulo(novoModulo); // Efetiva a troca da tela visível.
  };

  const aoFinalizarToque = () => { // Lógica que detecta o arrasto do dedo na tela para trocar de página.
    if (!touchStartX.current || !touchEndX.current) return; 
    const distanciaX = touchStartX.current - touchEndX.current; // Calcula o tamanho do movimento do dedo.
    const indexAtual = ORDEM_MODULOS.indexOf(modulo); 

    if (modulo === 'dashboard') return; // Desativa o arrasto lateral no Dashboard para não bugar os gráficos.

    if (distanciaX > 70 && indexAtual !== -1 && indexAtual < ORDEM_MODULOS.length - 1) { // Arrastou para a esquerda (Avançar).
      const proximo = ORDEM_MODULOS[indexAtual + 1]; 
      if (proximo === 'reunioes' && !user) return; // Bloqueia visitantes de verem reuniões pelo arrasto.
      if (proximo === 'tickets' && !isMaster(userData)) return; // Bloqueia usuários comuns de verem a gestão de tickets.
      mudarModulo(proximo); 
    } else if (distanciaX < -70 && indexAtual > 0) { // Arrastou para a direita (Voltar).
      const anterior = ORDEM_MODULOS[indexAtual - 1]; 
      mudarModulo(anterior); 
    }
    touchStartX.current = null; touchEndX.current = null; // Limpa a memória do toque após o movimento.
  };

  const variacoesPagina = { // Configurações técnicas das animações de transição suave.
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }), // A tela nova entra deslizando.
    animate: { opacity: 1, x: 0 }, // A tela se estabiliza no centro.
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }), // A tela antiga sai de cena.
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />; // Exibe a capa de entrada antes de carregar o app.

  return ( // Montagem final da interface do aplicativo.
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative"
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}>
      
      <Header // O cabeçalho fixo com títulos e controles de usuário.
        modulo={modulo} 
        setModulo={mudarModulo} 
        user={user} 
        userData={userData} 
        pendenciasCount={pendenciasCount} 
        ticketsCount={ticketsCount} // Envia a contagem de chamados pendentes para o ícone da lâmpada no topo.
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
            {modulo === 'hub' && ( // CONTEÚDO DA TELA INICIAL (HUB)
              <div className="w-full py-2">
                {user && ( // Mostra as boas-vindas personalizadas se estiver logado.
                  <div className="px-6 mb-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-[2.2rem] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">Olá, {userData?.nome?.split(' ')[0] || "Irmão"}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{userData?.cargo || "Colaborador"} • {userData?.cidade || "Regional"}</span>
                        </div>
                      </div>
                      {/* Botão de Dashboard para cargos autorizados. */}
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

                <HighlightCards // Os cartões com resumos de reuniões e ensaios do dia.
                  todosEnsaios={todosEnsaios} 
                  ensaiosRegionais={ensaiosRegionaisData} 
                  reunioesData={reunioesData} 
                  user={userData}
                  aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} 
                  cidadeUsuario={userData?.cidade} 
                />
                
                <QuickCards mudarModulo={mudarModulo} user={user} /> {/* O menu de botões rápidos. */}

                <div className="px-6 mt-4 w-full">
                  <ListaOficial /> {/* O botão da lista externa de batismos. */}
                </div>
              </div>
            )}

            {/* Chamada dinâmica das telas de cada página conforme o módulo selecionado. */}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={user} userData={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={user} userData={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={user} userData={userData} />}
            {modulo === 'reunioes' && <ReunioesRegionais user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
            {modulo === 'tickets' && <GerenciamentoTickets user={userData} />} 
          </motion.div>
        </AnimatePresence>
      </main>

      {/* SISTEMA DE NOTIFICAÇÃO: A lâmpada de envio só aparece se não estivermos na tela de gestão de tickets. */}
      {modulo !== 'tickets' && (
        <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
      )}
    </div>
  );
}

export default App; // Exporta o componente principal finalizado.