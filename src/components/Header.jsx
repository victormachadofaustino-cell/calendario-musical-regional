import React from 'react'; // Ferramenta base para criar o componente visual do cabeçalho.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para fazer os títulos deslizarem suavemente.
import { ArrowLeft, User, Lock, LogOut, Lightbulb } from 'lucide-react'; // Importa ícones de navegação, perfil, segurança e a Lâmpada de tickets.
import { signOut } from 'firebase/auth'; // Função oficial para desconectar o usuário com segurança.
import { auth } from '../firebaseConfig'; // Importa a chave de conexão com o seu banco de dados Firebase.
import { isMaster } from '../constants/permissions'; // Motor que verifica se o usuário é o Maestro Regional (Master).

// O Header agora coordena o título dinâmico e os botões de acesso rápido ao perfil e aos tickets.
const Header = ({ modulo, setModulo, user, userData, pendenciasCount, ticketsCount, titulosModulos, setShowLoginModal, setShowPainelMaster }) => { 
  
  return ( // Início da estrutura visual do cabeçalho fixo no topo.
    <header className="sticky top-0 left-0 w-full z-[1000] bg-white pt-4 pb-5 px-6 rounded-b-[2rem] shadow-sm border-b border-slate-200 shrink-0"> 
      {/* ☝️ EXPLICAÇÃO: 'sticky top-0' mantém o cabeçalho parado no topo mesmo ao rolar a página. */}
      
      <div className="max-w-md mx-auto w-full"> 
        {/* Alinhamento que centraliza o conteúdo para telas de celular */}
        <div className="flex justify-between items-center">
          
          {/* LADO ESQUERDO: Título Dinâmico (Muda conforme a página aberta) */}
          <div className="flex flex-col text-left">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={modulo}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-lg tracking-tighter uppercase leading-none flex items-center"
              >
                {/* Mostra o nome da tela atual com estilo Negrito e Cinza (Ex: Ensaios Locais) */}
                <span className="font-[900] text-slate-950 italic">{titulosModulos[modulo]?.p1 || 'Visão'}</span>
                <span className="font-medium text-slate-400 italic ml-1.5">{titulosModulos[modulo]?.p2 || 'Geral'}</span>
              </motion.h1>
            </AnimatePresence>
            <span className="text-slate-950 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Calendário Musical</span>
          </div>

          {/* LADO DIREITO: Botões de Ação (Tickets, Perfil e Sair) */}
          <div className="flex items-center gap-1.5">
            
            {/* BOTÃO VOLTAR: Só aparece se o usuário não estiver na tela inicial (Hub) */}
            {modulo !== 'hub' && (
              <button onClick={() => setModulo('hub')} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 active:scale-90 transition-all">
                <ArrowLeft size={16} />
              </button>
            )}

            {/* 💡 NOVO BOTÃO DE TICKETS: Exclusivo para o Master gerenciar os chamados dos irmãos */}
            {isMaster(userData) && (
              <div className="relative">
                <button 
                  onClick={() => setModulo('tickets')}
                  className={`p-2.5 rounded-xl transition-all shadow-md active:scale-95 ${modulo === 'tickets' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-blue-600'}`}
                >
                  <Lightbulb size={16} fill={modulo === 'tickets' ? "currentColor" : "none"} />
                </button>
                
                {/* NOTIFICAÇÃO AZUL: Indica quantos tickets novos de suporte estão na fila */}
                {ticketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse shadow-md pointer-events-none">
                    {ticketsCount}
                  </span>
                )}
              </div>
            )}
            
            {/* BOTÃO DE PERFIL/MASTER: Abre o Painel Administrativo ou o Login */}
            <div className="relative">
              <button 
                onClick={() => !user ? setShowLoginModal(true) : setShowPainelMaster(true)}
                className={`p-2.5 rounded-xl transition-all shadow-lg ${user ? (isMaster(userData) ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-950'} text-white active:scale-95`}
              >
                {user ? <User size={16} /> : <Lock size={16} />}
              </button>
              
              {/* NOTIFICAÇÃO LARANJA: Indica quantos novos pedidos de acesso ou mudanças de ensaio existem */}
              {pendenciasCount > 0 && isMaster(userData) && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce shadow-md pointer-events-none">
                  {pendenciasCount}
                </span>
              )}
            </div>

            {/* BOTÃO DE SAIR: Encerra a sessão do colaborador logado */}
            {user && (
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

export default Header; // Exporta o cabeçalho finalizado para o Maestro principal do App.