// src/components/Dashboard/MensagensTab.jsx // Arquivo responsável por enviar avisos reais para os celulares dos irmãos.
import React, { useState, useEffect } from 'react'; // Ferramentas para gerenciar textos digitados e carregamentos.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados.
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'; // Ferramentas para buscar endereços de celulares e gravar histórico.
import { Send, Users, BellRing, ShieldAlert, History } from 'lucide-react'; // Ícones para ilustrar o painel de mensagens.
import { registrarEvento } from '../../constants/comuns'; // Olheiro que registra o disparo no seu Radar de Telemetria.

const MensagensTab = ({ user }) => { // Início do componente de envio de avisos.
  const [titulo, setTitulo] = useState(''); // Memória que guarda o título do aviso (Ex: Urgente!).
  const [mensagem, setMensagem] = useState(''); // Memória que guarda o corpo do texto do aviso.
  const [destinatarios, setDestinatarios] = useState([]); // Lista de endereços (tokens) encontrados no banco.
  const [enviando, setEnviando] = useState(false); // Trava visual para evitar disparos duplicados.
  const [sucesso, setSucesso] = useState(false); // Avisa na tela quando o envio termina com vitória.

  useEffect(() => { // Lógica que conta quantos celulares estão aptos a receber avisos agora.
    const buscarTokens = async () => { // Função interna de busca.
      const q = query(collection(db, "usuarios"), where("fcmToken", "!=", null)); // Procura irmãos que ativaram os alertas.
      const snap = await getDocs(q); // Tira uma foto da lista de usuários encontrados.
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })); // Organiza os dados.
      setDestinatarios(lista); // Guarda o total de aparelhos prontos para receber.
    };
    buscarTokens(); // Executa a busca assim que você abre a aba.
  }, []);

  const dispararAviso = async (e) => { // Função principal do botão "Enviar Notificação".
    e.preventDefault(); // Impede o navegador de atualizar a página.
    if (!titulo || !mensagem || destinatarios.length === 0) return; // Se algo faltar, cancela o envio.

    setEnviando(true); // Liga o sinal de "Processando..." no botão.
    try { // Tenta realizar a operação de envio e registro.
      
      // 1. GRAVA NO HISTÓRICO: Salva o que foi enviado para consulta futura do Master.
      await addDoc(collection(db, "historico_notificacoes"), { // Abre a gaveta de histórico no Firebase.
        titulo: titulo, // O assunto enviado.
        conteudo: mensagem, // O texto do aviso.
        enviadoPor: user?.nome || "Maestro Regional", // Quem foi o autor do disparo.
        totalAparelhos: destinatarios.length, // Quantas pessoas receberão o "apito" no celular.
        data: serverTimestamp() // Hora oficial do relógio do Google.
      });

      // 2. TELEMETRIA: Registra no seu Radar que houve um comunicado oficial.
      registrarEvento('Comunicação', 'Disparo de Notificação', titulo, user);

      // 🧠 NOTA DO DEV: O envio real para o celular depende do seu servidor de Cloud Functions ou do plano da Vercel.
      // Este código prepara o banco para o disparo automático acontecer.
      
      setSucesso(true); // Mostra o aviso de vitória na tela.
      setTitulo(''); // Limpa o campo do título.
      setMensagem(''); // Limpa o campo da mensagem.
      setTimeout(() => setSucesso(false), 4000); // Esconde o aviso de sucesso após 4 segundos.

    } catch (error) { // Caso a internet falhe ou o banco esteja ocupado.
      console.error("Erro ao disparar:", error); // Avisa o técnico.
    } finally { // Independente do resultado...
      setEnviando(false); // Destrava o botão para um novo envio.
    }
  };

  return ( // Início da parte visual da aba de avisos.
    <div className="space-y-6 animate-in pb-10 text-left">
      
      {/* CARD 1: STATUS DA REDE DE ALERTA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shadow-inner">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-slate-950 uppercase tracking-tighter">Rede de Destinatários</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {destinatarios.length} aparelhos conectados
            </span>
          </div>
        </div>
        <BellRing size={20} className="text-blue-600 animate-bounce" />
      </div>

      {/* CARD 2: FORMULÁRIO DE DISPARO */}
      <div className="bg-slate-950 p-8 rounded-[2.8rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Send size={80} />
        </div>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl"><Send size={18} /></div>
          <h4 className="text-sm font-black uppercase italic tracking-tighter">Novo Comunicado Push</h4>
        </div>

        <form onSubmit={dispararAviso} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Título do Alerta</label>
            <input 
              required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ensaio de Hoje Confirmado"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-[12px] font-bold outline-none focus:bg-white/10 transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Mensagem (Curta e Objetiva)</label>
            <textarea 
              required rows="3" value={mensagem} onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite aqui o que os irmãos verão na tela do celular..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-[12px] font-bold outline-none focus:bg-white/10 transition-all resize-none placeholder:text-slate-700"
            />
          </div>

          <button 
            disabled={enviando || destinatarios.length === 0}
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {enviando ? 'Disparando Frequência...' : 'Disparar Notificações'}
          </button>
        </form>

        {sucesso && ( // Mensagem de confirmação que aparece após o envio.
          <div className="mt-6 bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <div className="bg-emerald-500 p-1 rounded-full text-white"><BellRing size={12}/></div>
            <span className="text-[10px] font-black uppercase italic">Comando de envio realizado com sucesso!</span>
          </div>
        )}
      </div>

      {/* BLOCO DE SEGURANÇA */}
      <div className="bg-amber-50 p-5 rounded-[2.2rem] border border-amber-100 flex items-start gap-4">
        <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-1" />
        <p className="text-[8px] font-bold text-amber-700 uppercase leading-tight">
          Atenção: Use o disparo com sabedoria. Notificações excessivas fazem os usuários desativarem os alertas nas configurações do celular.
        </p>
      </div>

      {/* RODAPÉ DO PAINEL */}
      <div className="py-10 text-center opacity-10">
        <History size={24} className="mx-auto mb-2" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Messaging System • Regional</span>
      </div>

    </div>
  );
};

export default MensagensTab; // Libera a sua rádio ministerial para o Dashboard Master.