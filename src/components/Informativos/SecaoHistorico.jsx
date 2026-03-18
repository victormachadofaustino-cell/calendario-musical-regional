// src/components/Informativos/SecaoHistorico.jsx
import React, { useState, useEffect } from 'react'; // Ferramenta base do React para gerenciar o que aparece na tela e a memória do celular.
import { db } from '../../firebaseConfig'; // Conecta com a central de dados do Firebase subindo dois níveis de pasta.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramenta que vigia o banco de dados em tempo real em busca de atualizações.
import { History, ExternalLink, Loader2 } from 'lucide-react'; // Biblioteca de ícones para o desenho do botão e animações.

const SecaoHistorico = () => { // Início do componente que cria o botão de acesso direto ao arquivo do Histórico.
  const [config, setConfig] = useState(null); // Variável de memória que guardará o link do PDF e a data vindos do banco.
  const [carregando, setCarregando] = useState(true); // Controla o ícone de "girar" enquanto os dados viajam pela internet.

  useEffect(() => { // Lógica de "ouvido atento" que ativa assim que o músico abre esta parte do menu.
    // O Maestro (onSnapshot) fica vigiando a gaveta "historico_musical" dentro das configurações.
    const unsub = onSnapshot(doc(db, "configuracoes", "historico_musical"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se o Master mudar o link no painel, o app se atualiza sozinho aqui.
      } else {
        // Fallback: Link padrão de segurança com o arquivo real que você forneceu.
        setConfig({ 
          url: "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view", 
          atualizacao: "Sincronizado" 
        });
      }
      setCarregando(false); // Avisa ao sistema que os dados chegaram e pode parar de mostrar o carregamento.
    }, (error) => {
      console.error("Erro ao sincronizar histórico:", error); // Registra falhas técnicas ocultas para o desenvolvedor.
      setCarregando(false); // Para o carregamento mesmo com erro para não travar a tela do irmão.
    });

    return () => unsub(); // Desliga a vigilância ao sair da tela para economizar a bateria do celular.
  }, []); 

  if (carregando) { // Enquanto o app busca a informação no banco, mostra um aviso discreto.
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <Loader2 className="animate-spin text-slate-300" size={20} />
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Acessando Arquivo...</span>
      </div>
    );
  }

  // Define qual será o link final que o botão vai abrir (Banco ou Padrão).
  const URL_FINAL = config?.url || "https://drive.google.com/file/d/1w94EOUALaisb_MdUV6H7jqbI7MKSncKZ/view";
  const DATA_ATT = config?.atualizacao || "2026";

  return ( // Início da parte visual que o irmão verá no celular.
    <div className="w-full animate-in slide-in-from-right-4">
      {/* O CARD INTEIRO É UM BOTÃO: Ao tocar em qualquer lugar dele, abre o PDF imediatamente. */}
      <button 
        onClick={() => window.open(URL_FINAL, '_blank')} // Comando para abrir o Google Drive em uma nova aba do navegador.
        className="w-full bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center justify-between group active:scale-95 transition-all border border-slate-800"
      >
        <div className="flex items-center gap-5">
          {/* Ícone de histórico com cor Amarela (Amber) para destacar no fundo preto. */}
          <div className="bg-white/10 p-3.5 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
            <History size={26} />
          </div>
          <div className="flex flex-col items-start text-left">
            {/* Título principal com fonte grossa e itálica, padrão do app. */}
            <span className="text-white text-[11px] font-[900] uppercase tracking-[0.2em] leading-none">Histórico Musical</span>
            {/* Data vinda do Painel Master indicando a versão do documento. */}
            <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-2">Atualizado: {DATA_ATT}</span>
          </div>
        </div>
        
        {/* Ícone de seta indicando que um arquivo externo será aberto. */}
        <div className="bg-white/5 p-2 rounded-xl text-slate-600 group-hover:text-white transition-colors">
          <ExternalLink size={18} />
        </div>
      </button>
    </div>
  );
};

export default SecaoHistorico; // Exporta este instrumento para ser usado no Hub de Informativos.