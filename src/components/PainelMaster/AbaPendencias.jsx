import React from 'react'; // Ferramenta base para criar a interface e organizar os elementos na tela.
import { 
  Shield, ChevronUp, ChevronDown, Check, X, Database, 
  Trash2, ArrowRight 
} from 'lucide-react'; // Importa os ícones de segurança, setas, confirmação, banco de dados e exclusão.

// Este componente gerencia a fila de espera crítica: novos usuários e mudanças nos dados oficiais.
const AbaPendencias = ({
  openAcessos, // Estado que diz se a lista de novos usuários está aberta ou fechada.
  setOpenAcessos, // Função para abrir ou fechar a lista de usuários.
  usuariosPendentes, // Lista de irmãos que se cadastraram e esperam sua aprovação para entrar no app.
  gerenciarUsuario, // Função do Master para aprovar o cadastro e dar as chaves do sistema.
  deleteDoc, // Ferramenta para apagar um documento do banco (usada para recusar/deletar pedidos).
  doc, // Ferramenta para localizar um documento específico dentro das pastas do banco.
  db, // Conexão oficial com o Banco de Dados Firebase da Regional.
  openDados, // Estado que diz se a lista de sugestões de mudança nos ensaios está aberta.
  setOpenDados, // Função para abrir ou fechar a lista de mudanças de dados.
  sugestoesAlteracao, // Lista de correções e atualizações sugeridas pelos editores de cada cidade.
  processarSugestao, // Função que aplica a mudança sugerida no banco de dados oficial.
  CompararCampo // O componente visual que mostra a comparação entre o dado antigo e o novo sugerido.
}) => {
  return ( // Início da construção visual das sanfonas de triagem.
    <div className="space-y-4 animate-in text-left"> {/* Container com espaçamento vertical e animação suave de entrada. */}
      
      {/* 1. SEÇÃO DE NOVOS ACESSOS (TRIAGEM DE IRMÃOS) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"> {/* Card principal de acessos. */}
        <button 
          onClick={() => setOpenAcessos(!openAcessos)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        > {/* Botão que expande ou recolhe a lista de novos cadastros. */}
          <div className="flex items-center gap-3"> {/* Agrupa o ícone de escudo e o texto. */}
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"> {/* Fundo azul claro para o ícone. */}
              <Shield size={18}/> {/* Desenha o ícone de escudo de segurança. */}
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Novos Acessos ({usuariosPendentes.length}) {/* Exibe o total de irmãos aguardando aprovação. */}
            </span>
          </div>
          {openAcessos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {/* Mostra seta para cima se aberto, para baixo se fechado. */}
        </button>
        
        {openAcessos && ( // Se a sanfona estiver aberta, desenha o conteúdo abaixo.
          <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100"> {/* Fundo cinza claro para destacar a lista. */}
            {usuariosPendentes.length === 0 ? ( // Se não houver ninguém esperando...
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Fila de espera vazia</p> 
            ) : ( // ...caso contrário, desenha o card de cada solicitante.
              usuariosPendentes.map(u => ( // Percorre a lista de candidatos um por um.
                <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all">
                  <div className="flex flex-col text-left"> {/* Informações de quem está pedindo acesso. */}
                    <h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p>
                  </div>
                  <div className="flex gap-2"> {/* Botões de decisão do Maestro. */}
                    <button 
                      onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} 
                      className="bg-green-500 text-white p-2.5 rounded-xl shadow-md active:scale-90"
                    > {/* Botão VERDE: Aprova o irmão e libera o acesso dele imediatamente. */}
                      <Check size={16}/>
                    </button>
                    <button 
                      onClick={async () => await deleteDoc(doc(db, "usuarios", u.id))} 
                      className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 transition-all"
                    > {/* Botão VERMELHO: Recusa o pedido e apaga o cadastro da fila. */}
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. SEÇÃO DE SUGESTÕES DE DADOS (TRIAGEM DE INFORMAÇÕES) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"> {/* Card principal de sugestões. */}
        <button 
          onClick={() => setOpenDados(!openDados)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        > {/* Botão que expande ou recolhe a lista de mudanças sugeridas. */}
          <div className="flex items-center gap-3"> {/* Agrupa o ícone de banco de dados e o texto. */}
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"> {/* Fundo laranja para o ícone de dados. */}
              <Database size={18}/> {/* Desenha o ícone representativo de informações/dados. */}
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Sugestões de Mudança ({sugestoesAlteracao.length}) {/* Exibe o total de atualizações aguardando revisão. */}
            </span>
          </div>
          {openDados ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {/* Alterna o ícone da seta conforme o estado. */}
        </button>
        
        {openDados && ( // Se a sanfona de dados estiver aberta, exibe as correções.
          <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100">
            {sugestoesAlteracao.length === 0 ? ( // Se não houver sugestões pendentes...
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Sem sugestões no momento</p>
            ) : ( // ...caso contrário, mostra cada pedido de correção enviado pelos editores.
              sugestoesAlteracao.map(s => ( 
                <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  {/* CABEÇALHO DA SUGESTÃO INDIVIDUAL */}
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                    <div className="text-left">
                      <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase italic">
                        Módulo: {s.tipo?.replace('_', ' ')} {/* Mostra se a mudança é em ensaio local, regional ou contatos. */}
                      </span>
                      <h4 className="text-[11px] font-[900] uppercase text-slate-950 italic mt-1 leading-none">
                        {s.localidade || s.cidade || s.dadosSugeridos?.name} {/* Título da igreja ou pessoa afetada. */}
                      </h4>
                      <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Enviado por: {s.solicitanteNome}</p>
                    </div>
                    <div className="flex gap-2"> {/* Ações para validar ou descartar a informação. */}
                      <button 
                        onClick={() => processarSugestao(s, true)} 
                        className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg active:scale-90"
                      > {/* Botão VERDE: Aceita a sugestão e atualiza o banco oficial na hora. */}
                        <Check size={16}/>
                      </button>
                      <button 
                        onClick={() => processarSugestao(s, false)} 
                        className="bg-slate-100 text-slate-400 p-2 rounded-xl active:scale-90"
                      > {/* Botão CINZA: Descarta a sugestão e mantém o dado antigo. */}
                        <X size={16}/>
                      </button>
                    </div>
                  </div>
                  {/* QUADRO COMPARATIVO: Mostra exatamente o que mudou (Antes vs Depois) */}
                  <div className="p-4 grid grid-cols-1 gap-1.5 bg-white">
                    <CompararCampo label="Nome/Localidade" antigo={s.dadosAntigos?.localidade || s.dadosAntigos?.name} novo={s.dadosSugeridos?.localidade || s.dadosSugeridos?.name} />
                    <CompararCampo label="Dia/Semana" antigo={s.dadosAntigos?.dia || s.dadosAntigos?.weekday} novo={s.dadosSugeridos?.dia || s.dadosSugeridos?.weekday} />
                    <CompararCampo label="Horário" antigo={s.dadosAntigos?.hora} novo={s.dadosSugeridos?.hora} />
                    <CompararCampo label="Contato/Fone" antigo={s.dadosAntigos?.contato || s.dadosAntigos?.contact} novo={s.dadosSugeridos?.contato || s.dadosSugeridos?.contact} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbaPendencias; // Exporta a Aba de Pendências limpa para o PainelMaster principal.