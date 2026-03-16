import React from 'react'; // Ferramenta base para criar a interface.
import { 
  Shield, ChevronUp, ChevronDown, Check, X, Database, 
  MessageSquare, Trash2, ArrowRight 
} from 'lucide-react'; // Importa os ícones de escudo, setas, check, banco de dados, balão de fala e lixeira.
import AbaFeedbackMaster from '../AbaFeedbackMaster'; // Importa a lista de tickets da lâmpada que já criamos.

// Este componente gerencia a fila de espera: novos usuários, mudanças nos dados e feedbacks.
const AbaPendencias = ({
  openAcessos, // Estado que diz se a lista de novos usuários está aberta.
  setOpenAcessos, // Função para abrir ou fechar a lista de usuários.
  usuariosPendentes, // Lista de pessoas que se cadastraram e esperam aprovação.
  gerenciarUsuario, // Função do Master para aprovar o cadastro.
  deleteDoc, // Ferramenta para apagar um documento do banco (recusar acesso).
  doc, // Ferramenta para localizar um documento específico no banco.
  db, // Conexão com o Banco de Dados Firebase.
  openDados, // Estado que diz se a lista de sugestões de mudança está aberta.
  setOpenDados, // Função para abrir ou fechar a lista de mudanças de ensaios.
  sugestoesAlteracao, // Lista de correções sugeridas pelos editores locais.
  processarSugestao, // Função que aplica a mudança no banco oficial.
  openApp, // Estado que diz se a lista de tickets (lâmpada) está aberta.
  setOpenApp, // Função para abrir ou fechar a lista de feedbacks.
  countTickets, // Quantidade de tickets esperando resposta.
  CompararCampo // O componente visual que mostra o "Antes vs Depois" dos dados.
}) => {
  return ( // Início da estrutura visual.
    <div className="space-y-4 animate-in text-left"> {/* Container com espaço entre os blocos e animação suave. */}
      
      {/* 1. SEÇÃO DE NOVOS ACESSOS (QUEM QUER ENTRAR) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"> {/* Card branco com bordas arredondadas. */}
        <button 
          onClick={() => setOpenAcessos(!openAcessos)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        > {/* Botão que abre/fecha a lista de novos músicos. */}
          <div className="flex items-center gap-3"> {/* Alinha ícone e texto. */}
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"> {/* Ícone de escudo azul. */}
              <Shield size={18}/> {/* Desenha o escudo. */}
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Novos Acessos ({usuariosPendentes.length}) {/* Mostra quantos estão na fila. */}
            </span>
          </div>
          {openAcessos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {/* Muda a seta se estiver aberto ou fechado. */}
        </button>
        
        {openAcessos && ( // Se a lista estiver aberta, mostra o conteúdo abaixo.
          <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100"> {/* Fundo levemente cinza para destacar a lista. */}
            {usuariosPendentes.length === 0 ? ( // Se não tiver ninguém na fila...
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Fila vazia</p> 
            ) : ( // ...caso contrário, mostra cada pedido.
              usuariosPendentes.map(u => ( // Percorre a lista de candidatos.
                <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all">
                  <div className="flex flex-col text-left"> {/* Dados do candidato. */}
                    <h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p>
                  </div>
                  <div className="flex gap-2"> {/* Botões de Ação. */}
                    <button 
                      onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} 
                      className="bg-green-500 text-white p-2.5 rounded-xl shadow-md active:scale-90"
                    > {/* Botão verde para Aprovar. */}
                      <Check size={16}/>
                    </button>
                    <button 
                      onClick={async () => await deleteDoc(doc(db, "usuarios", u.id))} 
                      className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 transition-all"
                    > {/* Botão vermelho para Apagar pedido. */}
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. SEÇÃO DE SUGESTÕES DE DADOS (MUDANÇA DE ENSAIOS/CONTATOS) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <button 
          onClick={() => setOpenDados(!openDados)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"> {/* Ícone de banco de dados laranja. */}
              <Database size={18}/>
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Sugestões de Mudança ({sugestoesAlteracao.length}) {/* Mostra total de mudanças sugeridas. */}
            </span>
          </div>
          {openDados ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        
        {openDados && (
          <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100">
            {sugestoesAlteracao.length === 0 ? (
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Sem sugestões</p>
            ) : (
              sugestoesAlteracao.map(s => ( // Para cada sugestão enviada pelos irmãos.
                <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  {/* CABEÇALHO DA SUGESTÃO */}
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                    <div className="text-left">
                      <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase italic">
                        Módulo: {s.tipo?.replace('_', ' ')} {/* Identifica se é Ensaio Local, Regional, etc. */}
                      </span>
                      <h4 className="text-[11px] font-[900] uppercase text-slate-950 italic mt-1 leading-none">
                        {s.localidade || s.cidade || s.dadosSugeridos?.name} {/* Nome da Igreja ou da Pessoa. */}
                      </h4>
                      <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Sugerido por: {s.solicitanteNome}</p>
                    </div>
                    <div className="flex gap-2"> {/* Botões para Aceitar ou Recusar a mudança. */}
                      <button 
                        onClick={() => processarSugestao(s, true)} 
                        className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg active:scale-90"
                      >
                        <Check size={16}/>
                      </button>
                      <button 
                        onClick={() => processarSugestao(s, false)} 
                        className="bg-slate-100 text-slate-400 p-2 rounded-xl active:scale-90"
                      >
                        <X size={16}/>
                      </button>
                    </div>
                  </div>
                  {/* QUADRO DE COMPARAÇÃO (O QUE MUDOU) */}
                  <div className="p-4 grid grid-cols-1 gap-1.5 bg-white">
                    <CompararCampo label="Nome/Local" antigo={s.dadosAntigos?.localidade || s.dadosAntigos?.name} novo={s.dadosSugeridos?.localidade || s.dadosSugeridos?.name} />
                    <CompararCampo label="Dia/Semana" antigo={s.dadosAntigos?.dia || s.dadosAntigos?.weekday} novo={s.dadosSugeridos?.dia || s.dadosSugeridos?.weekday} />
                    <CompararCampo label="Horário" antigo={s.dadosAntigos?.hora} novo={s.dadosSugeridos?.hora} />
                    <CompararCampo label="Contato" antigo={s.dadosAntigos?.contato || s.dadosAntigos?.contact} novo={s.dadosSugeridos?.contato || s.dadosSugeridos?.contact} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. SEÇÃO DE TICKETS E FEEDBACK (A LÂMPADA) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <button 
          onClick={() => setOpenApp(!openApp)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"> {/* Ícone de balão de conversa verde. */}
              <MessageSquare size={18}/>
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Feedback da Lâmpada ({countTickets}) {/* Quantos feedbacks pendentes. */}
            </span>
          </div>
          {openApp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        {openApp && ( // Se aberto, chama o componente AbaFeedbackMaster que já centraliza essa lógica.
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <AbaFeedbackMaster />
          </div>
        )}
      </div>
    </div>
  );
};

export default AbaPendencias; // Exporta para o PainelMaster principal.