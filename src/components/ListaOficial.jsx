// src/components/ListaOficial.jsx // Identifica que este é o arquivo do botão da Lista Oficial.
import React, { useState, useEffect } from 'react'; // Ferramenta base do React para criar elementos visuais e gerenciar a memória do app.
import { db } from '../firebaseConfig'; // Conecta com a central de dados do Firebase que configuramos na pasta raiz.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramentas do banco para localizar um documento específico e ouvi-lo em tempo real.
import { FileText, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'; // Biblioteca de ícones para desenhar o botão e o símbolo de carregamento.
import { registrarEvento } from '../constants/comuns'; // Importa o "Olheiro" para registrar quando alguém abre o documento.

const ListaOficial = ({ userData }) => { // Início do componente, agora preparado para saber quem está clicando (userData).
  const [config, setConfig] = useState(null); // Variável de memória que guardará o link e a data vindos do banco de dados.
  const [carregando, setCarregando] = useState(true); // Variável que controla se o ícone de "carregando" deve aparecer na tela.

  useEffect(() => { // Lógica que entra em ação assim que o músico abre o aplicativo.
    // O Maestro (onSnapshot) fica vigiando a gaveta "lista_oficial" dentro da pasta "configuracoes" no banco de dados.
    const unsub = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se você salvou um link novo no Painel Master, o app se atualiza aqui instantaneamente.
      } else {
        // Fallback: Caso o banco de dados esteja vazio, ele usa um link padrão do Google para não dar erro.
        setConfig({ url: "https://drive.google.com", atualizacao: "Aguardando Master..." });
      }
      setCarregando(false); // Avisa ao sistema que os dados chegaram e pode parar de mostrar a animação de carga.
    }, (error) => {
      console.error("Erro ao sincronizar documento:", error); // Registra no console se houver falha técnica de conexão.
      setCarregando(false); // Para o carregamento mesmo com erro para não travar a tela do irmão.
    });

    return () => unsub(); // Quando o músico fecha o app, desliga a vigilância para economizar bateria e internet.
  }, []); 

  // Função disparada ao tocar no botão para abrir o arquivo e avisar o sistema de telemetria.
  const acaoAbrirDocumento = () => { // Lógica de clique.
    const url = config?.url || "https://drive.google.com"; // Define o endereço do arquivo.
    registrarEvento('Documentos', 'Abrir PDF', 'Lista Oficial', userData); // Registra no Dashboard que este documento foi aberto.
    window.open(url, '_blank'); // Abre o PDF oficial em uma nova aba do navegador.
  };

  // Se o sistema ainda estiver buscando a "partitura" no banco, mostra um aviso de carregamento elegante.
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <Loader2 className="animate-spin text-slate-300" size={32} />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Sincronizando Lista...</span>
      </div>
    );
  }

  // Define qual data aparecerá no botão após o carregamento dos dados do banco.
  const DATA_FINAL = config?.atualizacao || "N/A";

  return ( // Início da parte visual que o músico verá no celular.
    <div className="px-6 w-full">
      {/* Botão com design oficial: fundo preto, bordas muito arredondadas e efeito de clique (active:scale-95). */}
      <button 
        onClick={acaoAbrirDocumento} // Agora chama a função que abre o arquivo e também registra o acesso.
        className="w-full bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center justify-center gap-6 text-white active:scale-95 border border-slate-800"
      >
        {/* Ícone de papel em cor Amarela (Amber) para destacar que é um documento oficial. */}
        <FileText size={28} className="text-amber-500" />
        <div className="flex flex-col items-start text-left">
          {/* Título do botão em letras garrafais e espaçadas. */}
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Lista Oficial</span>
          {/* Mostra a data que você digitou lá no Painel Master. */}
          <span className="text-slate-500 text-[7px] font-bold uppercase tracking-widest">Atualizada em {DATA_FINAL}</span>
        </div>
      </button>
    </div>
  );
};

export default ListaOficial; // Exporta este componente para ser usado no palco principal (App.jsx).