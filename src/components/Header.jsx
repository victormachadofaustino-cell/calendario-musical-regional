import React from 'react'; // Ferramenta base para criar o componente visual.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para fazer os títulos deslizarem suavemente.
import { ArrowLeft, User, Lock, LogOut } from 'lucide-react'; // Ícones oficiais para navegação, perfil e segurança.
import { signOut } from 'firebase/auth'; // Função oficial para desconectar o usuário com segurança.
import { auth } from '../firebaseConfig'; // Importa a chave de conexão com o seu banco de dados.
import { isMaster } from '../constants/permissions'; // Motor que verifica se o usuário é o Maestro (Master).

// 🛠️ AJUSTE: Agora o Header recebe as funções 'setShowLoginModal' e 'setShowPainelMaster' do App.jsx para poder abri-los.
const Header = ({ modulo, setModulo, user, userData, pendenciasCount, ticketsCount, titulosModulos, setShowLoginModal, setShowPainelMaster }) => { 
  
  return ( // Início da estrutura visual do cabeçalho fixo.
    <header className="sticky top-0 left-0 w-full z-[1000] bg-white pt-4 pb-5 px-6 rounded-b-[2rem] shadow-sm border-b border-slate-200 shrink-0"> 
      {/* ☝️ EXPLICAÇÃO: 'sticky top-0' fixa no teto. 'z-[1000]' garante que fique na frente de todos os cards de ensaio. */}
      
      <div className="max-w-md mx-auto w-full"> 
        {/* Alinhamento centralizado para o corpo do Header */}
        <div className="flex justify-between items-center">
          
          {/* Lado Esquerdo: Título Dinâmico da Página */}
          <div className="flex flex-col text-left">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={modulo}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-lg tracking-tighter uppercase leading-none flex items-center"
              >
                {/* Mostra o título da tela atual (Ex: Visão Geral ou Ensaios Locais) */}
                <span className="font-[900] text-slate-950 italic">{titulosModulos[modulo]?.p1 || 'Visão'}</span>
                <span className="font-medium text-slate-400 italic ml-1.5">{titulosModulos[modulo]?.p2 || 'Geral'}</span>
              </motion.h1>
            </AnimatePresence>
            <span className="text-slate-950 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Calendário Musical</span>
          </div>

          {/* Lado Direito: Botões de Navegação e Perfil */}
          <div className="flex items-center gap-1.5">
            {modulo !== 'hub' && ( // Se não estiver na tela inicial, mostra o botão de voltar.
              <button onClick={() => setModulo('hub')} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 active:scale-90 transition-all">
                <ArrowLeft size={16} />
              </button>
            )}
            
            <div className="relative">
              {/* 🛡️ BOTÃO DE PERFIL: Agora ele volta a funcionar chamando o Painel Master ou o Login */}
              <button 
                onClick={() => !user ? setShowLoginModal(true) : setShowPainelMaster(true)}
                className={`p-2.5 rounded-xl transition-all shadow-lg ${user ? (isMaster(userData) ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-950'} text-white active:scale-95`}
              >
                {user ? <User size={16} /> : <Lock size={16} />}
              </button>
              
              {/* Notificação Laranja: Avisa o Master se houver sugestões de outros irmãos para aprovar */}
              {(pendenciasCount + ticketsCount > 0) && isMaster(userData) && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce shadow-md pointer-events-none">
                  {pendenciasCount + ticketsCount}
                </span>
              )}
            </div>

            {user && ( // Botão de Sair: Só aparece se houver alguém logado no sistema.
              <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 ml-0.5">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; // Exporta o componente de cabeçalho corrigido e funcional.