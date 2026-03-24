// src/components/Dashboard/index.jsx // Arquivo mestre que organiza as abas de controle do Maestro Regional.
import React, { useState } from 'react'; // Ferramenta base para gerenciar qual aba está aberta.
import { BarChart3, Activity, Send } from 'lucide-react'; // Ícones para Indicadores, Telemetria e agora Mensagens.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para as transições suaves entre as telas.
import { isMaster, isComissao } from '../../constants/permissions'; // AFINAÇÃO: Importa a regra da comissão para liberar o acesso ao painel.
import IndicadoresTab from './IndicadoresTab'; // Aba que mostra os números totais da Regional.
import TelemetriaTab from './TelemetriaTab'; // Aba que mostra o radar de cliques e usuários.
import MensagensTab from './MensagensTab'; // Aba para envio de notificações push para os celulares.

const Dashboard = ({ todosEnsaios, ensaiosRegionais, examinadoras, encarregados, user }) => { // Início do componente recebendo os dados do App.
  const masterLogado = isMaster(user); // Verifica se quem abriu o painel tem autoridade de Master (Maestro).
  const integranteComissao = isComissao(user); // NOVO: Verifica se o irmão possui o distintivo da Comissão Musical.
  
  // LOGICA DE ABA INICIAL: Se não for master mas for comissão, ele começa direto na aba de indicadores.
  const [abaAtiva, setAbaAtiva] = useState('indicadores'); // Memória que guarda qual aba está selecionada (Padrão: Indicadores).

  // SEGURANÇA: Só exibe o menu superior se o usuário for Master ou da Comissão.
  const podeVerMenu = masterLogado || integranteComissao;

  return (
    <div className="flex flex-col w-full min-h-full pb-32 bg-[#F1F5F9] animate-in fade-in duration-500">
      
      {/* SELETOR DE NAVEGAÇÃO (MENU DO DASHBOARD) */}
      {podeVerMenu && ( // AFINAÇÃO: Agora o menu aparece para o Master ou para a Comissão.
        <div className="px-6 pt-4 mb-2">
          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-[1.5rem] shadow-sm border border-slate-200">
            {/* BOTÃO 1: INDICADORES (Acesso: Master e Comissão) */}
            <button 
              onClick={() => setAbaAtiva('indicadores')}
              className={`flex-1 py-3.5 rounded-[1.1rem] text-[9px] font-[900] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                abaAtiva === 'indicadores' ? 'bg-slate-950 text-white shadow-lg scale-[1.02]' : 'text-slate-400'
              }`}
            >
              <BarChart3 size={14}/> Dados
            </button>
            
            {/* BOTÃO 2: TELEMETRIA (Acesso: Apenas Master) */}
            {masterLogado && (
              <button 
                onClick={() => setAbaAtiva('telemetria')}
                className={`flex-1 py-3.5 rounded-[1.1rem] text-[9px] font-[900] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  abaAtiva === 'telemetria' ? 'bg-amber-500 text-white shadow-lg scale-[1.02]' : 'text-slate-400'
                }`}
              >
                <Activity size={14}/> Radar
              </button>
            )}

            {/* BOTÃO 3: MENSAGENS (Acesso: Apenas Master) */}
            {masterLogado && (
              <button 
                onClick={() => setAbaAtiva('mensagens')}
                className={`flex-1 py-3.5 rounded-[1.1rem] text-[9px] font-[900] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  abaAtiva === 'mensagens' ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400'
                }`}
              >
                <Send size={14}/> Avisos
              </button>
            )}
          </div>
        </div>
      )}

      {/* ÁREA DE EXIBIÇÃO DINÂMICA (TROCA O CONTEÚDO AO CLICAR) */}
      <div className="flex-grow w-full">
        <AnimatePresence mode="wait">
          {abaAtiva === 'indicadores' && ( // Se a aba for Dados...
            <motion.div 
              key="indicadores" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full px-6"
            >
              <IndicadoresTab 
                todosEnsaios={todosEnsaios} ensaiosRegionais={ensaiosRegionais} 
                examinadoras={examinadoras} encarregados={encarregados} user={user} 
              />
            </motion.div>
          )}

          {/* TRAVA DE SEGURANÇA: Mesmo que forçado via código, a tela só renderiza se for Master */}
          {abaAtiva === 'telemetria' && masterLogado && ( // Se a aba for Radar...
            <motion.div 
              key="telemetria" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full px-6"
            >
              <TelemetriaTab user={user} />
            </motion.div>
          )}

          {/* TRAVA DE SEGURANÇA: A aba de envio de avisos é exclusiva do Maestro principal */}
          {abaAtiva === 'mensagens' && masterLogado && ( // Se a aba for Avisos (Notificações)...
            <motion.div 
              key="mensagens" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full px-6"
            >
              <MensagensTab user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard; // Exportação do organizador do Dashboard com acesso liberado para a Comissão Musical.