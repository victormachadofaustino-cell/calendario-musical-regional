import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Feedback = ({ mensagem, tipo = 'sucesso', aoFechar }) => {
  useEffect(() => {
    const timer = setTimeout(aoFechar, 4000);
    return () => clearTimeout(timer);
  }, [aoFechar]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-in slide-in-from-top-4">
      <div className={`flex items-center gap-3 p-4 rounded-[1.5rem] shadow-2xl border ${
        tipo === 'sucesso' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-red-600 border-red-500 text-white'
      }`}>
        {tipo === 'sucesso' ? <CheckCircle size={20} className="text-amber-500" /> : <AlertCircle size={20} />}
        <span className="flex-1 text-[11px] font-black uppercase tracking-tight leading-tight">{mensagem}</span>
        <button onClick={aoFechar} className="p-1 opacity-50 hover:opacity-100"><X size={16}/></button>
      </div>
    </div>
  );
};

export default Feedback;