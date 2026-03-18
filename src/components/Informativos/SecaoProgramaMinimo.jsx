import React, { useState, useEffect } from 'react'; // Ferramenta base do React para gerenciar o que aparece na tela e a memória do celular.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional, subindo dois níveis de pasta para achar o arquivo.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramenta que vigia o banco de dados em tempo real em busca de novos links.
import { Music2, LayoutDashboard, X, ExternalLink, Loader2, BookOpen } from 'lucide-react'; // Biblioteca de ícones para músicos, organistas e símbolos de sistema.
import { createPortal } from 'react-dom'; // Ferramenta que projeta a janela flutuante (modal) por cima de todo o conteúdo do app.

const SecaoProgramaMinimo = ({ aoFechar }) => { // Início do componente que cria a escolha entre Músicos e Organistas.
  // Variável de memória que guardará os links e a data de atualização vindos do Painel Master.
  const [config, setConfig] = useState(null); 
  // Variável que controla se o símbolo de "carregando" deve aparecer enquanto os links viajam pela internet.
  const [carregando, setCarregando] = useState(true); 

  useEffect(() => { // Lógica de vigilância que ativa assim que o irmão clica no card no menu.
    // O Maestro (onSnapshot) observa atentamente a gaveta "programa_minimo" dentro das configurações no Firebase.
    const unsub = onSnapshot(doc(db, "configuracoes", "programa_minimo"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se o Master salvou links novos no painel, o app se atualiza aqui na hora.
      } else {
        // Plano B: Se o banco estiver vazio, usamos os links reais de 2023 que você forneceu.
        setConfig({
          urlMusicos: "https://drive.google.com/file/d/1SP1s7csB_3uvpDxpEId9yEQTUTP3io3_/view",
          urlOrganistas: "https://drive.google.com/file/d/1JT2Fj8Eb9Jyvp0tcQYwf_uF3pcCwsMm5/view",
          atualizacao: "Edição 2023"
        });
      }
      setCarregando(false); // Avisa ao sistema que os dados chegaram e pode parar de mostrar a animação de espera.
    }, (error) => {
      console.error("Erro ao carregar programas:", error); // Registra falhas técnicas de conexão para o desenvolvedor.
      setCarregando(false); // Para o carregamento mesmo em caso de erro para não travar a tela do músico.
    });

    return () => unsub(); // Desliga a vigilância ao fechar a janelinha para economizar a bateria do celular do irmão.
  }, []); 

  // Define qual será o link final dos Músicos (prioriza o banco Master, se não houver, usa o padrão).
  const LINK_MUSICOS = config?.urlMusicos || "https://drive.google.com/file/d/1SP1s7csB_3uvpDxpEId9yEQTUTP3io3_/view";
  // Define qual será o link final das Organistas.
  const LINK_ORGANISTAS = config?.urlOrganistas || "https://drive.google.com/file/d/1JT2Fj8Eb9Jyvp0tcQYwf_uF3pcCwsMm5/view";

  return createPortal( // Desenha a janela flutuante de forma isolada (Portal) para garantir que apareça sobre os menus.
    <div className="fixed inset-0 z-[5000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      {/* Camada invisível de fundo: se o músico tocar fora da caixa, a janela fecha. */}
      <div className="absolute inset-0" onClick={aoFechar}></div>

      {/* Caixa principal do Modal com o design elegante da Regional Jundiaí. */}
      <div className="bg-white w-full max-w-[360px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
        {/* Botão de fechar (X) fixado no topo direito da caixa. */}
        <button onClick={aoFechar} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all">
          <X size={20}/>
        </button>

        <div className="mb-8">
          {/* Título com fonte pesada e itálica, padrão visual do nosso aplicativo. */}
          <h3 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">Programa Mínimo</h3>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2">Selecione a categoria desejada</p>
        </div>

        {carregando ? ( // Enquanto a "partitura" não chega do banco, mostra o círculo girando.
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase">Sincronizando Links...</span>
          </div>
        ) : ( // Assim que os links carregam, mostra os dois botões de ação.
          <div className="space-y-3">
            {/* BOTÃO PARA MÚSICOS (Cor Azul oficial) */}
            <button 
              onClick={() => window.open(LINK_MUSICOS, '_blank')} // Abre o PDF de músicos no navegador.
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

            {/* BOTÃO PARA ORGANISTAS (Cor Roxa oficial) */}
            <button 
              onClick={() => window.open(LINK_ORGANISTAS, '_blank')} // Abre o PDF de organistas no navegador.
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

        {/* Rodapé do Modal com a data que o Master configurou no painel. */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 opacity-40">
          <BookOpen size={16} className="text-slate-400" />
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
            {config?.atualizacao || "Referência: 2023"} • Regional Jundiaí
          </span>
        </div>
      </div>
    </div>,
    document.body // Comando para o modal flutuar acima de todas as outras camadas do app.
  );
};

export default SecaoProgramaMinimo; // Exporta este portal pronto para ser encaixado no InformativosHub.