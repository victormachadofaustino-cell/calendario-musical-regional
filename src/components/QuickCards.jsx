import React from 'react'; // Ferramenta base para criar o componente visual.
import { Music, Music2, Users, Info, BookOpen, CalendarDays } from 'lucide-react'; // Biblioteca de ícones oficiais do projeto.

const QuickCards = ({ mudarModulo, user }) => { // Componente que desenha os botões principais de navegação do Hub.

  return ( // Início da estrutura visual da grade de botões.
    <div className="px-6 space-y-3 mt-4"> 
      {/* ☝️ EXPLICAÇÃO: Define o espaçamento lateral e entre os botões. */}
      
      <div className="grid grid-cols-2 gap-3 w-full"> 
        {/* ☝️ EXPLICAÇÃO: Cria duas colunas de botões que se ajustam ao celular. */}

        {/* Botão: Ensaios Locais */}
        <button onClick={() => mudarModulo('locais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950 transition-all">
          <Music2 size={28} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Ensaios Locais</span>
        </button>

        {/* Botão: Ensaios Regionais */}
        <button onClick={() => mudarModulo('regionais')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950 transition-all">
          <Music size={28} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Regionais</span>
        </button>

        {/* Botão: Contatos (Comissão) */}
        <button onClick={() => mudarModulo('comissao')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950 transition-all">
          <Users size={28} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Contatos</span>
        </button>

        {/* Botão: Informações da Orquestra (Avisos) */}
        <button onClick={() => mudarModulo('avisos')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950 transition-all">
          <Info size={28} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center leading-tight">Informações</span>
        </button>

        {/* Botão Especial: Cultos (Com selo de 'Em Breve') */}
        <div className="bg-white/50 p-6 rounded-[2.2rem] border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden opacity-80 shadow-sm">
          <div className="absolute top-3 right-5 bg-amber-100 text-amber-600 text-[6px] font-black px-2 py-0.5 rounded-full uppercase italic tracking-tighter">Em Breve</div>
          <BookOpen size={28} className="text-slate-300" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Cultos</span>
        </div>

        {/* Botão: Reuniões (SÓ APARECE SE O IRMÃO ESTIVER LOGADO) */}
        {user && ( 
          <button onClick={() => mudarModulo('reunioes')} className="bg-white p-6 rounded-[2.2rem] shadow-md border border-slate-200 flex flex-col items-center justify-center gap-4 active:scale-95 text-slate-950 animate-in fade-in transition-all">
            <CalendarDays size={28} className="text-slate-950" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Reuniões</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickCards; // Exporta os botões para o Maestro (App.jsx) usar.