import React, { useState } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isMaster } from '../../constants/permissions';
import IndicadoresTab from './IndicadoresTab';
import TelemetriaTab from './TelemetriaTab';

const Dashboard = ({ todosEnsaios, ensaiosRegionais, examinadoras, encarregados, user }) => {
  const masterLogado = isMaster(user);
  const [abaAtiva, setAbaAtiva] = useState('indicadores');

  return (
    <div className="flex flex-col w-full min-h-full pb-32 bg-[#F1F5F9] animate-in fade-in duration-500">
      
      {/* SELETOR DE NAVEGAÇÃO */}
      {masterLogado && (
        <div className="px-6 pt-4 mb-2">
          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-[1.5rem] shadow-sm border border-slate-200">
            <button 
              onClick={() => setAbaAtiva('indicadores')}
              className={`flex-1 py-3.5 rounded-[1.1rem] text-[10px] font-[900] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                abaAtiva === 'indicadores' ? 'bg-slate-950 text-white shadow-lg scale-[1.02]' : 'text-slate-400'
              }`}
            >
              <BarChart3 size={15}/> Indicadores
            </button>
            
            <button 
              onClick={() => setAbaAtiva('telemetria')}
              className={`flex-1 py-3.5 rounded-[1.1rem] text-[10px] font-[900] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                abaAtiva === 'telemetria' ? 'bg-amber-500 text-white shadow-lg scale-[1.02]' : 'text-slate-400'
              }`}
            >
              <Activity size={15}/> Telemetria
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE EXIBIÇÃO DINÂMICA */}
      <div className="flex-grow w-full">
        <AnimatePresence mode="wait">
          {abaAtiva === 'indicadores' ? (
            <motion.div 
              key="indicadores" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full px-6"
            >
              <IndicadoresTab 
                todosEnsaios={todosEnsaios} 
                ensaiosRegionais={ensaiosRegionais} 
                examinadoras={examinadoras} 
                encarregados={encarregados} 
                user={user} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="telemetria" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full px-6"
            >
              <TelemetriaTab user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;