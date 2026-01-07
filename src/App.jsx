import React, { useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { LayoutGrid, Music, Users, Info, ArrowLeft, User, LogOut, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks Personalizados
import { useAuth } from './hooks/useAuth';
import { useFirestoreData } from './hooks/useFirestoreData';

// Importação dos Componentes
import EnsaiosRegionais from './components/EnsaiosRegionais';
import EnsaiosLocais from './components/EnsaiosLocais';
import Comissao from './components/Comissao';
import Avisos from './components/Avisos';
import CapaEntrada from './components/CapaEntrada';
import Summary from './components/Summary';
import Login from './components/Login';
import PainelMaster from './components/PainelMaster'; 
import ListaOficial from './components/ListaOficial';
import Dashboard from './components/Dashboard';

function App() {
  const [modulo, setModulo] = useState('hub');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPainelMaster, setShowPainelMaster] = useState(false);
  const [direcao, setDirecao] = useState(0);

  // Consumo dos Hooks - pendenciasCount monitora o banco em tempo real através do useAuth
  const { user, userData, pendenciasCount } = useAuth();
  const { todosEnsaios, ensaiosRegionaisData, encarregadosData, examinadorasData, loading } = useFirestoreData();

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Módulos disponíveis para navegação
  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'dashboard'];

  const TITULOS_MODULOS = {
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'avisos': { p1: 'Infos', p2: 'Importantes' },
    'dashboard': { p1: 'Status', p2: 'Analítico' }
  };

  const variacoesPagina = {
    initial: (direcao) => ({ opacity: 0, x: direcao > 0 ? 100 : -100 }),
    animate: { opacity: 1, x: 0 },
    exit: (direcao) => ({ opacity: 0, x: direcao > 0 ? -100 : 100 }),
  };

  const mudarModulo = (novoModulo) => {
    const indexAtual = ORDEM_MODULOS.indexOf(modulo);
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo);
    if (novoModulo !== 'locais') setDiaFiltro('');
    setDirecao(indexNovo > indexAtual ? 1 : -1);
    setModulo(novoModulo);
  };

  const aoFinalizarToque = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distanciaX = touchStartX.current - touchEndX.current;
    const indexAtual = ORDEM_MODULOS.indexOf(modulo);
    
    // Swipe logic - Ignora se estiver no dashboard ou avisos por causa de tabelas/scroll
    if (modulo === 'dashboard' || modulo === 'avisos') return;

    if (distanciaX > 70 && indexAtual < ORDEM_MODULOS.indexOf('dashboard') - 1) {
      mudarModulo(ORDEM_MODULOS[indexAtual + 1]);
    } else if (distanciaX < -70 && indexAtual > 0) {
      mudarModulo(ORDEM_MODULOS[indexAtual - 1]);
    }
    touchStartX.current = null; touchEndX.current = null;
  };

  if (showSplash) return <CapaEntrada aoEntrar={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative overflow-x-hidden" 
         onTouchStart={(e) => touchStartX.current = e.targetTouches[0].clientX}
         onTouchMove={(e) => touchEndX.current = e.targetTouches[0].clientX}
         onTouchEnd={aoFinalizarToque}>
      
      <header className="bg-white pt-8 pb-8 px-8 rounded-b-[3rem] shadow-sm border-b border-slate-200 shrink-0 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto w-full">
          <div className="flex flex-col text-left">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={modulo}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xl tracking-tighter uppercase leading-none flex items-center"
              >
                <span className="font-[900] text-slate-950 italic">{TITULOS_MODULOS[modulo].p1}</span>
                <span className="font-medium text-slate-400 italic ml-1.5">{TITULOS_MODULOS[modulo].p2}</span>
              </motion.h1>
            </AnimatePresence>
            <span className="text-slate-950 text-[8px] font-black uppercase tracking-[0.4em] mt-2">
              Calendário Musical
            </span>
          </div>
          <div className="flex items-center gap-2">
            {modulo !== 'hub' && (
              <button onClick={() => mudarModulo('hub')} className="bg-slate-100 p-3 rounded-2xl text-slate-400 active:scale-90 transition-all"><ArrowLeft size={18} /></button>
            )}
            <div className="relative">
              <button onClick={() => !user ? setShowLoginModal(true) : setShowPainelMaster(true)} 
                      className={`p-3 rounded-2xl transition-all shadow-lg ${user ? (userData?.nivel === 'master' ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-950'} text-white`}>
                {user ? <User size={18} /> : <Lock size={18} />}
              </button>

              {pendenciasCount > 0 && userData?.nivel === 'master' && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white animate-bounce shadow-md">
                  {pendenciasCount}
                </span>
              )}
            </div>
            {user && <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 p-3 rounded-2xl active:scale-90 ml-1"><LogOut size={18} /></button>}
          </div>
        </div>
      </header>

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />}
      
      {showPainelMaster && (
        <PainelMaster 
          aoFechar={() => setShowPainelMaster(false)} 
          userLogado={userData || { nome: 'Carregando...', nivel: 'comum' }} 
        />
      )}

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
                <Summary 
                  todosEnsaios={todosEnsaios} 
                  ensaiosRegionais={ensaiosRegionaisData} 
                  aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} 
                  aoAbrirDashboard={() => mudarModulo('dashboard')}
                  cidadeUsuario={userData?.cidade}
                  user={userData} 
                  pendenciasCount={pendenciasCount}
                />
                
                <div className="px-6 grid grid-cols-2 gap-3 w-full mt-4">
                  <button onClick={() => mudarModulo('locais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                    <LayoutGrid size={28} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Locais</span>
                  </button>
                  <button onClick={() => mudarModulo('regionais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                    <Music size={28} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Regionais</span>
                  </button>
                  <button onClick={() => mudarModulo('comissao')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                    <Users size={28} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Contatos</span>
                  </button>
                  <button onClick={() => mudarModulo('avisos')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                    <Info size={28} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Infos</span>
                  </button>
                  <div className="col-span-2"><ListaOficial /></div>
                </div>
              </div>
            )}

            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
            
            {modulo === 'dashboard' && (
              <Dashboard 
                todosEnsaios={todosEnsaios}
                ensaiosRegionais={ensaiosRegionaisData}
                examinadoras={examinadorasData}
                encarregados={encarregadosData}
                user={userData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mt-auto py-6 opacity-30 text-center text-[7px] font-black uppercase tracking-[0.6em]">Regional Jundiaí • 2026</footer>
    </div>
  );
}

export default App;