// src/components/Informativos/SecaoHistorico.jsx
import React, { useState, useEffect } from 'react'; // Ferramenta base do React para criar os elementos visuais e gerenciar a memória.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional no Firebase.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramenta que vigia o banco de dados em busca de atualizações no link.
import { History, ExternalLink, Loader2 } from 'lucide-react'; // Ícones de Relógio (Histórico), Seta de Link e Círculo de Carregamento.

const SecaoHistorico = () => { // Início do componente que cria o botão de acesso à memória musical.
  const [config, setConfig] = useState(null); // Variável de memória que guardará o link do arquivo e a data vindos do banco.
  const [carregando, setCarregando] = useState(true); // Controla a exibição da animação de "espera" enquanto os dados viajam pela internet.

  useEffect(() => { // Lógica de "vigilância" que entra em ação assim que o músico abre esta tela.
    // O Maestro (onSnapshot) fica ouvindo a gaveta "historico_musical" dentro das configurações do banco.
    const unsub = onSnapshot(doc(db, "configuracoes", "historico_musical"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se o Master mudar o link no banco, o app se atualiza sozinho aqui.
      } else {
        // Fallback: Caso o banco falhe, usamos o link do arquivo real que você forneceu.
        setConfig({ 
          url: "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view", 
          atualizacao: "Sincronizado" 
        });
      }
      setCarregando(false); // Avisa ao sistema que os dados chegaram e pode parar de girar o ícone de carga.
    }, (error) => {
      console.error("Erro ao sincronizar histórico:", error); // Registra falhas técnicas ocultas para o desenvolvedor.
      setCarregando(false); // Para o carregamento mesmo em caso de erro para não travar a tela do usuário.
    });

    return () => unsub(); // Desliga a vigilância ao sair da tela para economizar a bateria do celular do irmão.
  }, []); 

  if (carregando) { // Enquanto o app busca a "partitura" no banco, mostra um aviso discreto.
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <Loader2 className="animate-spin text-slate-300" size={20} />
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Acessando Arquivo...</span>
      </div>
    );
  }

  // Define qual link o botão vai abrir (prioriza o banco, se não houver, usa o link direto).
  const URL_FINAL = config?.url || "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view";
  const DATA_ATT = config?.atualizacao || "2026";

  return ( // Início da construção visual do botão que o irmão verá.
    <div className="w-full animate-in slide-in-from-right-4">
      {/* O CARD INTEIRO É UM BOTÃO: Ao tocar em qualquer lugar dele, abre o PDF direto. */}
      <button 
        onClick={() => window.open(URL_FINAL, '_blank')} // Comando que abre o arquivo do Drive em uma nova aba do navegador.
        className="w-full bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center justify-between group active:scale-95 transition-all border border-slate-800"
      >
        <div className="flex items-center gap-5">
          {/* Ícone de histórico (Relógio) com cor Amarela (Amber) para destacar sobre o fundo preto. */}
          <div className="bg-white/10 p-3.5 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
            <History size={26} />
          </div>
          <div className="flex flex-col items-start text-left">
            {/* Título principal do card em letras garrafais brancas. */}
            <span className="text-white text-[11px] font-[900] uppercase tracking-[0.2em] leading-none">Histórico Musical</span>
            {/* Data de referência do arquivo vinda do banco de dados. */}
            <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-2">Atualizado: {DATA_ATT}</span>
          </div>
        </div>
        
        {/* Ícone de seta indicando que é um arquivo externo que será aberto. */}
        <div className="bg-white/5 p-2 rounded-xl text-slate-600 group-hover:text-white transition-colors">
          <ExternalLink size={18} />
        </div>
      </button>
    </div>
  );
};

export default SecaoHistorico; // Exporta o botão pronto para ser encaixado no menu de informativos.