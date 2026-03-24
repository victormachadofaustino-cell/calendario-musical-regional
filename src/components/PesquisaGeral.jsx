// src/components/PesquisaGeral.jsx // Arquivo que cuida da barra de buscas inteligente do App.

import React, { useState, useEffect } from 'react'; // Ferramentas para criar a tela e reagir a mudanças.
import { Search, X, MapPin, Music2, Info } from 'lucide-react'; // Ícones para ilustrar os resultados.
import { registrarPesquisa } from '../constants/comuns'; // Importa o "Olheiro" que grava o que foi digitado.

const PesquisaGeral = ({ aoSelecionar, userData }) => { // Início do componente, recebendo a função de clique e o crachá do usuário.
  const [termo, setTermo] = useState(''); // Memória que guarda o texto que o irmão está digitando.

  // LOGICA DE TELEMETRIA: Registra o que foi buscado após o irmão parar de digitar.
  useEffect(() => { // Inicia um vigia que observa o que é escrito.
    const timer = setTimeout(() => { // Cria uma pequena espera para não gravar cada letra sozinha.
      if (termo.length >= 3) { // Só grava se o irmão digitar algo com sentido (3 letras ou mais).
        registrarPesquisa(termo, userData); // Envia o termo e quem buscou para o Dashboard Master.
      }
    }, 1500); // Espera 1 segundo e meio de silêncio no teclado para disparar o registro.

    return () => clearTimeout(timer); // Limpa o cronômetro se o irmão continuar digitando rápido.
  }, [termo, userData]); // Reinicia o vigia toda vez que o texto ou o usuário mudar.

  return ( // Início da parte visual da busca.
    <div className="px-6 py-4 space-y-4"> 
      {/* 1. CAMPO DE ENTRADA DE TEXTO */}
      <div className="relative group"> 
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
        <input 
          type="text" 
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar igreja, encarregado ou assunto..."
          className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-12 pr-12 text-[12px] font-bold outline-none shadow-sm focus:border-blue-500 transition-all"
        />
        {termo && ( // Botão de "Limpar" que aparece só quando tem texto.
          <button 
            onClick={() => setTermo('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded-full text-slate-500 active:scale-90"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 2. ESPAÇO PARA RESULTADOS (Placeholder visual enquanto não há busca ativa) */}
      {!termo && (
        <div className="py-10 text-center space-y-2 opacity-40">
          <Search size={32} className="mx-auto text-slate-300" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Digite para filtrar a Regional
          </p>
        </div>
      )}

      {/* DICA DE USO */}
      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-blue-600" />
          <span className="text-[8px] font-black text-blue-700 uppercase tracking-tight">
            Busca Inteligente: Encontre horários e locais em segundos.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PesquisaGeral; // Libera a barra de busca monitorada para o App principal.