// src/components/ListaOficial.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { FileText, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

const ListaOficial = () => {
  const [config, setConfig] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Escuta em tempo real as configurações salvas pelo Master no Painel Master
    const unsub = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        // Fallback caso o documento ainda não exista
        setConfig({ url: "https://drive.google.com", atualizacao: "Aguardando Master..." });
      }
      setCarregando(false);
    }, (error) => {
      console.error("Erro ao sincronizar documento:", error);
      setCarregando(false);
    });

    return () => unsub();
  }, []);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <Loader2 className="animate-spin text-slate-300" size={32} />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Sincronizando Lista...</span>
      </div>
    );
  }

  const URL_FINAL = config?.url || "#";
  const DATA_FINAL = config?.atualizacao || "N/A";

  return (
    <div className="px-6 w-full">
      <button 
        onClick={() => window.open(URL_FINAL, '_blank')} 
        className="w-full bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center justify-center gap-6 text-white active:scale-95 border border-slate-800"
      >
        <FileText size={28} className="text-amber-500" />
        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Lista Oficial</span>
          <span className="text-slate-500 text-[7px] font-bold uppercase tracking-widest">Atualizada em {DATA_FINAL}</span>
        </div>
      </button>
    </div>
  );
};

export default ListaOficial;