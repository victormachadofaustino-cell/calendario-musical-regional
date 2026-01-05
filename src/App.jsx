import React, { useState, useEffect, useRef } from 'react';
import { collection, query, doc, onSnapshot, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { LayoutGrid, Music, Users, Info, ArrowLeft, User, LogOut, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Importação das Constantes e Componentes
import { COORDENADAS_CIDADES } from './constants/cidades';
import EnsaiosRegionais from './components/EnsaiosRegionais';
import EnsaiosLocais from './components/EnsaiosLocais';
import Comissao from './components/Comissao';
import Avisos from './components/Avisos';
import CapaEntrada from './components/CapaEntrada';
import Summary from './components/Summary';
import Login from './components/Login';
import PainelMaster from './components/PainelMaster'; 
import ListaOficial from './components/ListaOficial';

function App() {
  const [modulo, setModulo] = useState('hub');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [todosEnsaios, setTodosEnsaios] = useState([]);
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]);
  const [encarregadosData, setEncarregadosData] = useState([]);
  const [examinadorasData, setExaminadorasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [cidadeUsuario, setCidadeUsuario] = useState(null);
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPainelMaster, setShowPainelMaster] = useState(false);
  const [pendenciasCount, setPendenciasCount] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const ORDEM_MODULOS = ['hub', 'locais', 'regionais', 'comissao', 'avisos'];

  const TITULOS_MODULOS = {
    'hub': { p1: 'Visão', p2: 'Geral' },
    'locais': { p1: 'Ensaios', p2: 'Locais' },
    'regionais': { p1: 'Ensaios', p2: 'Regionais' },
    'comissao': { p1: 'Contatos', p2: 'Úteis' },
    'avisos': { p1: 'Infos', p2: 'Importantes' }
  };

  const variacoesPagina = {
    initial: (direcao) => ({ opacity: 0, x: direcao > 0 ? 100 : -100 }),
    animate: { opacity: 1, x: 0 },
    exit: (direcao) => ({ opacity: 0, x: direcao > 0 ? -100 : 100 }),
  };

  const [direcao, setDirecao] = useState(0);

  const mudarModulo = (novoModulo) => {
    const indexAtual = ORDEM_MODULOS.indexOf(modulo);
    const indexNovo = ORDEM_MODULOS.indexOf(novoModulo);

    if (novoModulo !== 'locais') {
      setDiaFiltro('');
    }

    setDirecao(indexNovo > indexAtual ? 1 : -1);
    setModulo(novoModulo);
  };

  useEffect(() => {
    let unsubUserData = null;
    let unsubPendencias = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Busca dados do perfil no Firestore
        unsubUserData = onSnapshot(doc(db, "usuarios", currentUser.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().ativo) {
            const data = docSnap.data();
            setUserData(data);
            setCidadeUsuario(data.cidade);

            // Ajuste de Segurança: Só ouve pendências se for Master e o listener ainda não existir
            if (data.nivel === 'master' && !unsubPendencias) {
              const qPendentes = query(collection(db, "usuarios"), where("status", "==", "pendente"));
              unsubPendencias = onSnapshot(qPendentes, 
                (s) => setPendenciasCount(s.size),
                (error) => console.log("Permissões de Master em processamento...")
              );
            }
          } else {
            signOut(auth);
            setUserData(null);
          }
        });
      } else {
        setUserData(null);
        setPendenciasCount(0);
        if (unsubUserData) unsubUserData();
        if (unsubPendencias) unsubPendencias();
        unsubPendencias = null;
      }
    });

    // Listeners Globais
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    });
    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => {
      unsubAuth();
      unsubRegionais();
      unsubLocais();
      unsubEncarregados();
      unsubExaminadoras();
      if (unsubUserData) unsubUserData();
      if (unsubPendencias) unsubPendencias();
    };
  }, []);

  const aoFinalizarToque = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distanciaX = touchStartX.current - touchEndX.current;
    const indexAtual = ORDEM_MODULOS.indexOf(modulo);

    if (distanciaX > 70) { 
      if (indexAtual < ORDEM_MODULOS.length - 1) mudarModulo(ORDEM_MODULOS[indexAtual + 1]);
    } else if (distanciaX < -70) { 
      if (indexAtual > 0) mudarModulo(ORDEM_MODULOS[indexAtual - 1]);
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
                  cidadeUsuario={cidadeUsuario}
                  user={userData} 
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
                  <div className="col-span-2"><ListaOficial user={userData} /></div>
                </div>
              </div>
            )}

            {modulo === 'locais' && <EnsaiosLocais todosEnsaios={todosEnsaios} diaFiltro={diaFiltro} loading={loading} user={userData} />}
            {modulo === 'regionais' && <EnsaiosRegionais ensaiosRegionais={ensaiosRegionaisData} loading={loading} user={userData} />}
            {modulo === 'comissao' && <Comissao encarregados={encarregadosData} examinadoras={examinadorasData} loading={loading} user={userData} />}
            {modulo === 'avisos' && <Avisos user={userData} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mt-auto py-6 opacity-30 text-center text-[7px] font-black uppercase tracking-[0.6em]">Regional Jundiaí • 2026</footer>
    </div>
  );
}

export default App;