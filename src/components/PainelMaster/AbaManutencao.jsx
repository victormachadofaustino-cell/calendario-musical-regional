import React from 'react'; // Ferramenta base para construir a interface.
import { AlertCircle, Home, Star, Users, ShieldCheck, Database, RefreshCw } from 'lucide-react'; // Importa os ícones de alerta, casa, estrela, usuários e banco de dados.

// Este componente é o "Quarto de Ferramentas": serve para restaurar os dados originais se algo der errado.
const AbaManutencao = ({
  setConfirma, // Função que abre o aviso de "Tem certeza?" antes de apagar os dados.
  loadingModulos // Objeto que indica qual módulo está sendo processado no momento (mostra o ícone girando).
}) => {
  return ( // Início do desenho da tela de manutenção.
    <div className="grid grid-cols-1 gap-3 animate-in pb-10 text-left"> {/* Organiza os botões em uma coluna com animação de entrada. */}
      
      {/* QUADRO DE AVISO CRÍTICO (ZELO DO MASTER) */}
      <div className="bg-red-50 p-6 rounded-[2.2rem] border border-red-100 mb-2"> {/* Fundo vermelho claro para indicar perigo. */}
        <div className="flex items-center gap-2 text-red-600 mb-2"> {/* Alinha o ícone de alerta com o título. */}
          <AlertCircle size={18}/> {/* Desenha o triângulo de alerta. */}
          <h4 className="text-[10px] font-black uppercase italic">Área de Restauração</h4> {/* Título da seção de perigo. */}
        </div>
        <p className="text-[9px] font-bold text-red-900 uppercase leading-relaxed">
          Estas ações restauram o banco de dados oficial e apagam as mudanças manuais feitas no App. {/* Explicação clara do risco. */}
        </p>
      </div>

      {/* BOTÃO: RESTAURAR ENSAIOS LOCAIS */}
      <button 
        onClick={() => setConfirma('locais')} 
        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
      > {/* Botão branco para restaurar igrejas e horários. */}
        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"> {/* Ícone de casa com fundo verde. */}
          <Home size={20}/>
        </div>
        <div className="flex-grow"> {/* Texto explicativo do botão. */}
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Locais</h4>
          <p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura igrejas e horários</p>
        </div>
        <RefreshCw size={14} className={loadingModulos.locais ? "animate-spin text-emerald-600" : "text-slate-300"} /> {/* Ícone que gira se estiver processando. */}
      </button>

      {/* BOTÃO: RESTAURAR ENSAIOS REGIONAIS */}
      <button 
        onClick={() => setConfirma('regionais')} 
        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
      > {/* Botão branco para restaurar a agenda de regionais. */}
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg"> {/* Ícone de estrela com fundo laranja. */}
          <Star size={20}/>
        </div>
        <div className="flex-grow"> {/* Texto explicativo. */}
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Regionais</h4>
          <p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura agenda da Regional</p>
        </div>
        <RefreshCw size={14} className={loadingModulos.regionais ? "animate-spin text-amber-500" : "text-slate-300"} />
      </button>

      {/* BOTÃO: RESTAURAR ENCARREGADOS REGIONAIS */}
      <button 
        onClick={() => setConfirma('encarregados')} 
        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
      > {/* Botão para restaurar contatos dos regionais. */}
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"> {/* Ícone de usuários com fundo azul. */}
          <Users size={20}/>
        </div>
        <div className="flex-grow">
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Comissão Regional</h4>
          <p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura Encarregados</p>
        </div>
        <RefreshCw size={14} className={loadingModulos.encarregados ? "animate-spin text-blue-600" : "text-slate-300"} />
      </button>

      {/* BOTÃO: RESTAURAR EXAMINADORAS */}
      <button 
        onClick={() => setConfirma('examinadoras')} 
        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
      > {/* Botão para restaurar contatos das examinadoras. */}
        <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"> {/* Ícone de escudo com fundo roxo. */}
          <ShieldCheck size={20}/>
        </div>
        <div className="flex-grow">
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Examinadoras</h4>
          <p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura Contatos</p>
        </div>
        <RefreshCw size={14} className={loadingModulos.examinadoras ? "animate-spin text-purple-600" : "text-slate-300"} />
      </button>

      {/* BOTÃO: HARD RESET (RESTAURAR TUDO) */}
      <button 
        onClick={() => setConfirma('tudo')} 
        className="mt-4 bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center gap-4 active:scale-95 text-white transition-all"
      > {/* Botão preto de ação total. */}
        <div className="p-3 bg-white/10 text-white rounded-2xl"> {/* Ícone de banco de dados com fundo translúcido. */}
          <Database size={20}/>
        </div>
        <div className="flex-grow">
          <h4 className="text-[11px] font-[900] uppercase italic">Restaurar Tudo</h4> {/* Título da ação definitiva. */}
          <p className="text-[7px] font-bold text-white/40 uppercase italic">Zera o banco e sobe os backups</p>
        </div>
        <RefreshCw size={16} className={loadingModulos.tudo ? "animate-spin text-white" : "text-white/20"} />
      </button>
    </div>
  );
};

export default AbaManutencao; // Exporta este "naipe" para ser usado pelo PainelMaster.