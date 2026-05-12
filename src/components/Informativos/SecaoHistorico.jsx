// src/components/Informativos/SecaoHistorico.jsx // Identifica o local exato do arquivo na estrutura de pastas.
import React, { useState, useEffect } from 'react'; // Ferramenta fundamental para criar a interface e gerenciar a memória.
import { db } from '../../firebaseConfig'; // Conecta com a central de dados subindo dois níveis de pasta.
import { doc, onSnapshot } from 'firebase/firestore'; // Ferramenta que vigia o banco de dados em tempo real.
import { History, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'; // Biblioteca de ícones para o visual e alertas.
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" para registrar acessos no Dashboard.

const SecaoHistorico = ({ userData }) => { // Início do componente, agora recebendo os dados do usuário para a telemetria.
  const [config, setConfig] = useState(null); // Memória que guarda o link e a data vindos do banco de dados.
  const [carregando, setCarregando] = useState(true); // Controla se o ícone de "carregando" aparece na tela.
  const [erroConexao, setErroConexao] = useState(false); // Nova fleg de segurança para avisar se o banco falhou.

  // Link de segurança absoluto caso o banco esteja vazio ou o Master apague sem querer.
  const LINK_SEGURANCA = "https://drive.google.com/file/d/1a9KtkE2Y9yz8IH-8iPS469q12BEUDqpx/view";

  useEffect(() => { // Lógica que liga o "ouvido" do app assim que o componente entra em cena.
    // O Maestro (onSnapshot) vigia a gaveta "historico_musical" dentro da pasta "configuracoes".
    const unsub = onSnapshot(doc(db, "configuracoes", "historico_musical"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data()); // Se o Master trocou o link no painel, o app atualiza aqui na hora.
        setErroConexao(false); // Garante que o sinal de erro suma se a conexão voltar.
      } else {
        // Se a gaveta não existir no banco, ele prepara o link de segurança.
        setConfig({ url: LINK_SEGURANCA, atualizacao: "Link de Emergência" });
      }
      setCarregando(false); // Avisa ao sistema que a busca terminou.
    }, (error) => {
      console.error("Erro ao sincronizar histórico:", error); // Registra falhas técnicas no console para o Dev.
      setErroConexao(true); // Ativa o aviso visual de erro para o irmão.
      setCarregando(false); // Para o carregamento para não travar a tela.
    });

    return () => unsub(); // Desliga a vigilância ao sair da tela para poupar bateria.
  }, []); 

  // Função disparada ao tocar no botão para abrir o arquivo e avisar o sistema de telemetria.
  const acaoAbrirDocumento = () => {
    // Escolhe o link do banco ou o de segurança, removendo espaços em branco acidentais (.trim()).
    const urlFinal = (config?.url || LINK_SEGURANCA).trim();
    
    // Registra no Dashboard do Master que o Histórico foi consultado.
    registrarEvento('Documentos', 'Abrir PDF', 'Histórico Musical', userData);
    
    // Abre o documento em uma nova aba com segurança.
    window.open(urlFinal, '_blank');
  };

  if (carregando) { // Enquanto os dados viajam, mostra uma animação discreta.
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <Loader2 className="animate-spin text-slate-300" size={20} />
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sincronizando...</span>
      </div>
    );
  }

  return ( // Início da parte visual que o irmão verá no celular.
    <div className="w-full animate-in slide-in-from-right-4">
      {/* Botão principal com efeito de clique e bordas arredondadas padrão Jundiaí. */}
      <button 
        onClick={acaoAbrirDocumento} // Chama a função que abre o arquivo e registra o evento.
        className={`w-full p-6 rounded-[2.2rem] shadow-xl flex items-center justify-between group active:scale-95 transition-all border ${erroConexao ? 'bg-red-900/10 border-red-500' : 'bg-slate-950 border-slate-800'}`}
      >
        <div className="flex items-center gap-5">
          {/* Ícone que muda para alerta se houver erro de conexão com o Firebase. */}
          <div className={`p-3.5 rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${erroConexao ? 'bg-red-500 text-white' : 'bg-white/10 text-amber-500'}`}>
            {erroConexao ? <AlertTriangle size={26} /> : <History size={26} />}
          </div>
          <div className="flex flex-col items-start text-left">
            {/* Título principal do botão. */}
            <span className="text-white text-[11px] font-[900] uppercase tracking-[0.2em] leading-none">
              {erroConexao ? "Erro na Nuvem" : "Histórico Musical"}
            </span>
            {/* Exibe a data de atualização cadastrada pelo Master. */}
            <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-2">
              {config?.atualizacao || "2026"}
            </span>
          </div>
        </div>
        
        {/* Ícone de seta indicando abertura de link externo. */}
        <div className="bg-white/5 p-2 rounded-xl text-slate-600 group-hover:text-white transition-colors">
          <ExternalLink size={18} />
        </div>
      </button>
    </div>
  );
};

export default SecaoHistorico; // Disponibiliza o componente para o palco principal.