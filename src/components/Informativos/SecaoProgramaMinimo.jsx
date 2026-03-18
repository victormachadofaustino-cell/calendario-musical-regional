import React, { useState, useEffect } from 'react'; // Ferramenta base do React para gerenciar o que aparece na tela e a memória.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional no Firebase.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramenta que vigia o banco de dados em tempo real.
import { Music2, LayoutDashboard, X, ExternalLink, Loader2, BookOpen } from 'lucide-react'; // Ícones para Músicos, Organistas, Fechar e Links.
import { createPortal } from 'react-dom'; // Ferramenta que desenha o Modal por cima de todo o conteúdo do App.

const SecaoProgramaMinimo = ({ aoFechar }) => { // Início do componente que cria a janela de escolha do Programa Mínimo.
  const [config, setConfig] = useState(null); // Memória para guardar os links e datas vindos do banco de dados.
  const [carregando, setCarregando] = useState(true); // Controla o símbolo de carregamento enquanto busca os links.

  useEffect(() => { // Lógica de vigilância que ativa assim que o músico clica no card.
    // O Maestro (onSnapshot) observa a gaveta "programa_minimo" nas configurações.
    const unsub = onSnapshot(doc(db, "configuracoes", "programa_minimo"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se houver links novos no banco, o app se atualiza aqui.
      } else {
        // Fallback: Se não houver nada no banco, usamos os links reais que você passou.
        setConfig({
          urlMusicos: "https://drive.google.com/file/d/1SP1s7csB_3uvpDxpEId9yEQTUTP3io3_/view",
          urlOrganistas: "https://drive.google.com/file/d/1JT2Fj8Eb9Jyvp0tcQYwf_uF3pcCwsMm5/view",
          atualizacao: "Edição 2023"
        });
      }
      setCarregando(false); // Avisa que os dados chegaram e para de girar o ícone.
    }, (error) => {
      console.error("Erro ao carregar programas:", error); // Registra falhas técnicas no console.
      setCarregando(false); // Para o carregamento mesmo com erro para não travar a tela.
    });

    return () => unsub(); // Desliga a vigilância ao fechar o modal para economizar dados.
  }, []);

  // Define os links finais (Banco ou Padrão).
  const LINK_MUSICOS = config?.urlMusicos || "https://drive.google.com/file/d/1SP1s7csB_3uvpDxpEId9yEQTUTP3io3_/view";
  const LINK_ORGANISTAS = config?.urlOrganistas || "https://drive.google.com/file/d/1JT2Fj8Eb9Jyvp0tcQYwf_uF3pcCwsMm5/view";

  return createPortal( // Desenha a janela flutuante fora da hierarquia comum (por cima de tudo).
    <div className="fixed inset-0 z-[5000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      {/* Clique no fundo escuro também fecha a janela */}
      <div className="absolute inset-0" onClick={aoFechar}></div>

      {/* Caixa do Modal com design padrão da Regional */}
      <div className="bg-white w-full max-w-[360px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
        {/* Botão de fechar (X) no topo direito */}
        <button onClick={aoFechar} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all">
          <X size={20}/>
        </button>

        <div className="mb-8">
          <h3 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">Programa Mínimo</h3>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2">Selecione a categoria desejada</p>
        </div>

        {carregando ? ( // Se estiver carregando, mostra o círculo girando.
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase">Sincronizando Links...</span>
          </div>
        ) : ( // Se carregou, mostra as duas opções de botões.
          <div className="space-y-3">
            {/* BOTÃO PARA MÚSICOS */}
            <button 
              onClick={() => window.open(LINK_MUSICOS, '_blank')}
              className="w-full bg-blue-600 p-6 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-lg shadow-blue-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl text-white">
                  <Music2 size={24} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white text-[12px] font-[900] uppercase italic tracking-wider">Músicos</span>
                  <span className="text-blue-100 text-[8px] font-bold uppercase mt-1">Métodos e Hinos</span>
                </div>
              </div>
              <ExternalLink size={18} className="text-blue-200" />
            </button>

            {/* BOTÃO PARA ORGANISTAS */}
            <button 
              onClick={() => window.open(LINK_ORGANISTAS, '_blank')}
              className="w-full bg-purple-600 p-6 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-lg shadow-purple-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl text-white">
                  <LayoutDashboard size={24} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white text-[12px] font-[900] uppercase italic tracking-wider">Organistas</span>
                  <span className="text-purple-100 text-[8px] font-bold uppercase mt-1">Pedaleira e Registros</span>
                </div>
              </div>
              <ExternalLink size={18} className="text-purple-200" />
            </button>
          </div>
        )}

        {/* Rodapé informativo do Modal */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 opacity-40">
          <BookOpen size={16} className="text-slate-400" />
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
            {config?.atualizacao || "Referência: 2023"} • Regional Jundiaí
          </span>
        </div>
      </div>
    </div>,
    document.body // Garante que o modal seja "teletransportado" para o topo do HTML.
  );
};

export default SecaoProgramaMinimo; // Exporta o componente para ser usado no InformativosHub.