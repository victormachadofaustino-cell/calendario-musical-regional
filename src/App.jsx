import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  LayoutGrid, Music, Users, Info, ArrowLeft, User, LogOut, Lock,
  BookOpen, CalendarDays
} from 'lucide-react';
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
import Tickets from './components/Tickets';

function App() {
  const [modulo, setModulo] = useState('hub');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPainelMaster, setShowPainelMaster] = useState(false);
  const [direcao, setDirecao] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);

  const { user, userData, pendenciasCount } = useAuth();
  const { todosEnsaios, ensaiosRegionaisData, encarregadosData, examinadorasData, loading } = useFirestoreData();

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos', 'dashboard'];

  const TITULOS_MODULOS = {
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'avisos': { p1: 'Infos', p2: 'Importantes' },
    'dashboard': { p1: 'Status', p2: 'Analítico' }
  };

  useEffect(() => {
    if (userData?.nivel !== 'master') { setTicketsCount(0); return; }
    const q = query(collection(db, "feedback_usuarios"), where("status", "==", "pendente"));
    const unsub = onSnapshot(q, (snap) => setTicketsCount(snap.size));
    return () => unsub();
  }, [userData]);

  useEffect(() => {
    if (!user) {
      const paginasRestritas = ['dashboard'];
      if (paginasRestritas.includes(modulo) || showPainelMaster) {
        setModulo('hub');
        setShowPainelMaster(false);
      }
    }
  }, [user, modulo, showPainelMaster]);

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
    
    // Desativa swipe em telas de scroll longo ou mapa
    if (modulo === 'dashboard' || modulo === 'avisos') return;

    if (distanciaX > 70 && indexAtual < ORDEM_MODULOS.length - 1) {
      const proximo = ORDEM_MODULOS[indexAtual + 1];
      if (proximo === 'dashboard' && !user) return;
      mudarModulo(proximo);
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
            <span className="text-slate-950 text-[8px] font-black uppercase tracking-[0.4em] mt-2">Calendário Musical</span>
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
              {(pendenciasCount + ticketsCount > 0) && userData?.nivel === 'master' && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white animate-bounce shadow-md">
                  {pendenciasCount + ticketsCount}
                </span>
              )}
            </div>
            {user && <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 p-3 rounded-2xl active:scale-90 ml-1"><LogOut size={18} /></button>}
          </div>
        </div>
      </header>

      {showLoginModal && <Login aoFechar={() => setShowLoginModal(false)} />}
      {showPainelMaster && <PainelMaster aoFechar={() => setShowPainelMaster(false)} userLogado={userData} />}

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
                <Summary todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} aoVerMais={(d) => {setDiaFiltro(d); mudarModulo('locais');}} aoAbrirDashboard={() => mudarModulo('dashboard')} cidadeUsuario={userData?.cidade} user={userData} pendenciasCount={pendenciasCount} />
                
                <div className="px-6 space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={() => mudarModulo('locais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <LayoutGrid size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Ensaios Locais</span>
                    </button>
                    <button onClick={() => mudarModulo('regionais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Music size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Regionais</span>
                    </button>
                    <button onClick={() => mudarModulo('comissao')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Users size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Contatos</span>
                    </button>
                    <button onClick={() => mudarModulo('avisos')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950">
                      <Info size={28} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Infos</span>
                    </button>

                    <div className="bg-white/50 p-6 rounded-[2.2rem] border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden opacity-80">
                      <div className="absolute top-3 right-5 bg-amber-100 text-amber-600 text-[6px] font-black px-2 py-0.5 rounded-full uppercase italic">Em Breve</div>
                      <BookOpen size={28} className="text-slate-300" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Dias de Culto</span>
                    </div>

                    {user && (
                      <div className="bg-white/50 p-6 rounded-[2.2rem] border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden opacity-80">
                        <div className="absolute top-3 right-5 bg-blue-100 text-blue-600 text-[6px] font-black px-2 py-0.5 rounded-full uppercase italic">Em Breve</div>
                        <CalendarDays size={28} className="text-slate-300" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Reuniões</span>
                      </div>
                    )}
                  </div>
                  <div className="px-0 mt-4 w-full"><ListaOficial /></div>
                </div>
              </div>
            )}
            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
            {modulo === 'dashboard' && <Dashboard todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionaisData} examinadoras={examinadorasData} encarregados={encarregadosData} user={userData} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Tickets user={user} userData={userData} moduloAtual={modulo} titulosModulos={TITULOS_MODULOS} />
    </div>
  );
}

export default App;