import React from 'react'; // Ferramenta base para criar o componente visual do cabeçalho.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para fazer os títulos deslizarem suavemente.
import { ArrowLeft, User, Lock, LogOut, Lightbulb } from 'lucide-react'; // Importa ícones de navegação, perfil, segurança e a Lâmpada de tickets.
import { signOut } from 'firebase/auth'; // Função oficial para desconectar o usuário com segurança.
import { auth } from '../firebaseConfig'; // Importa a chave de conexão com o seu banco de dados Firebase.
import { isMaster } from '../constants/permissions'; // Motor que verifica se o usuário é o Maestro Regional (Master).

// O Header agora coordena o título dinâmico e os botões de acesso rápido ao perfil e aos tickets.
const Header = ({ modulo, setModulo, user, userData, pendenciasCount, ticketsCount, titulosModulos, setShowLoginModal, setShowPainelMaster }) => { 
  
  // 🧠 FUNÇÃO INTELIGENTE DE VOLTAR: Decide se fecha um "capítulo" (card) ou o "livro" (módulo).
  const lidarComVoltar = () => {
    // 1. Caso Especial: Módulo de Informativos
    if (modulo === 'avisos') {
      // Se houver um card aberto (detectado pelo histórico salvo no InformativosHub)...
      if (window.history.state?.subSecao && window.history.state.subSecao !== 'hub') {
        window.history.back(); // ...ele apenas "desfaz" a entrada no card, voltando ao menu interno.
        return; // Interrompe para não fechar a tela de informativos ainda.
      }
    }
    
    // 2. Comportamento Padrão ou quando já está no Menu de um módulo:
    // Retorna o Maestro (App.jsx) para o palco principal (Visão Geral).
    setModulo('hub');
  };

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
            {/* Rótulo fixo que identifica o App */}
            <span className="text-slate-950 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Calendário Musical</span>
          </div>

          {/* LADO DIREITO: Botões de Ação (Tickets, Perfil e Sair) */}
          <div className="flex items-center gap-1.5">
            
            {/* BOTÃO VOLTAR: Agora usa a inteligência de 'lidarComVoltar' para não travar no menu de cards */}
            {modulo !== 'hub' && (
              <button 
                onClick={lidarComVoltar} 
                className="bg-slate-950 p-2.5 rounded-xl text-white active:scale-90 transition-all shadow-md"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            {/* 💡 BOTÃO DE TICKETS: Exclusivo para o Master gerenciar chamados */}
            {isMaster(userData) && (
              <div className="relative">
                <button 
                  onClick={() => setModulo('tickets')}
                  className={`p-2.5 rounded-xl transition-all shadow-md active:scale-95 ${modulo === 'tickets' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-blue-600'}`}
                >
                  <Lightbulb size={16} fill={modulo === 'tickets' ? "currentColor" : "none"} />
                </button>
                
                {/* NOTIFICAÇÃO AZUL: Contador de suporte pendente */}
                {ticketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse shadow-md pointer-events-none">
                    {ticketsCount}
                  </span>
                )}
              </div>
            )}
            
            {/* BOTÃO DE PERFIL: Abre Login ou Gestão Master */}
            <div className="relative">
              <button 
                onClick={() => !user ? setShowLoginModal(true) : setShowPainelMaster(true)}
                className={`p-2.5 rounded-xl transition-all shadow-lg ${user ? (isMaster(userData) ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-950'} text-white active:scale-95`}
              >
                {user ? <User size={16} /> : <Lock size={16} />}
              </button>
              
              {/* NOTIFICAÇÃO LARANJA: Alerta de novos cadastros/sugestões */}
              {pendenciasCount > 0 && isMaster(userData) && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce shadow-md pointer-events-none">
                  {pendenciasCount}
                </span>
              )}
            </div>

            {/* BOTÃO DE SAIR: Encerra a sessão */}
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