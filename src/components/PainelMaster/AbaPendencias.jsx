// src/components/PainelMaster/AbaPendencias.jsx // Identifica o arquivo que gerencia a fila de novos irmãos e sugestões de dados.

import React from 'react'; // Ferramenta base para criar a interface e organizar os elementos na tela.
import { 
  Shield, ChevronUp, ChevronDown, Check, X, Database, 
  Trash2, ArrowRight 
} from 'lucide-react'; // Importa os ícones de segurança, setas, confirmação e exclusão.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // AFINAÇÃO: Importa o "Olheiro" para registrar as recusas e limpezas.

// Este componente gerencia a fila de espera crítica: novos usuários e mudanças nos dados oficiais.
const AbaPendencias = ({
  openAcessos, // Estado que diz se a lista de novos usuários está aberta.
  setOpenAcessos, // Função para abrir ou fechar a lista de usuários.
  usuariosPendentes, // Lista de irmãos aguardando aprovação.
  gerenciarUsuario, // Função para aprovar o cadastro e liberar o acesso.
  deleteDoc, // Ferramenta para apagar um documento do banco.
  doc, // Ferramenta para localizar um documento específico.
  db, // Conexão oficial com o Banco de Dados.
  openDados, // Estado que diz se a lista de sugestões está aberta.
  setOpenDados, // Função para abrir ou fechar a lista de sugestões.
  sugestoesAlteracao, // Lista de correções enviadas pelos editores.
  processarSugestao, // Função que aplica ou recusa a mudança sugerida.
  CompararCampo, // O componente visual que mostra "Antes vs Depois".
  userData // 👈 NOVO: Recebe os dados do Master logado para a telemetria.
}) => {
  return ( 
    <div className="space-y-4 animate-in text-left"> 
      
      {/* 1. SEÇÃO DE NOVOS ACESSOS (TRIAGEM DE IRMÃOS) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"> 
        <button 
          onClick={() => setOpenAcessos(!openAcessos)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        > 
          <div className="flex items-center gap-3"> 
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"> 
              <Shield size={18}/> 
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Novos Acessos ({usuariosPendentes.length}) 
            </span>
          </div>
          {openAcessos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
        </button>
        
        {openAcessos && ( 
          <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100"> 
            {usuariosPendentes.length === 0 ? ( 
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Fila de espera vazia</p> 
            ) : ( 
              usuariosPendentes.map(u => ( 
                <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all">
                  <div className="flex flex-col text-left"> 
                    <h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p>
                  </div>
                  <div className="flex gap-2"> 
                    <button 
                      onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} 
                      className="bg-green-500 text-white p-2.5 rounded-xl shadow-md active:scale-90"
                      title="Aprovar Irmão"
                    > 
                      <Check size={16}/>
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm(`Recusar acesso de ${u.nome}?`)) {
                          await deleteDoc(doc(db, "usuarios", u.id)); 
                          registrarEvento('Gestão', 'Recusa de Acesso', `Usuário: ${u.nome}`, userData); // Grava a recusa no Dashboard.
                        }
                      }} 
                      className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 transition-all"
                      title="Recusar e Apagar"
                    > 
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
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"> 
        <button 
          onClick={() => setOpenDados(!openDados)} 
          className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"
        > 
          <div className="flex items-center gap-3"> 
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"> 
              <Database size={18}/> 
            </div>
            <span className="text-[10px] font-black uppercase italic text-slate-950">
              Sugestões de Mudança ({sugestoesAlteracao.length}) 
            </span>
          </div>
          {openDados ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
        </button>
        
        {openDados && ( 
          <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100">
            {sugestoesAlteracao.length === 0 ? ( 
              <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Sem sugestões no momento</p>
            ) : ( 
              sugestoesAlteracao.map(s => ( 
                <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                    <div className="text-left">
                      <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase italic">
                        Módulo: {s.tipo?.replace('_', ' ')} 
                      </span>
                      <h4 className="text-[11px] font-[900] uppercase text-slate-950 italic mt-1 leading-none">
                        {s.localidade || s.cidade || s.dadosSugeridos?.name} 
                      </h4>
                      <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Enviado por: {s.solicitanteNome}</p>
                    </div>
                    <div className="flex gap-2"> 
                      <button 
                        onClick={() => processarSugestao(s, true)} 
                        className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg active:scale-90"
                        title="Aplicar Mudança"
                      > 
                        <Check size={16}/>
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm("Descartar esta sugestão de alteração?")) {
                            processarSugestao(s, false);
                            registrarEvento('Gestão', 'Descarte de Sugestão', `De: ${s.solicitanteNome}`, userData); // Grava o descarte no Dashboard.
                          }
                        }} 
                        className="bg-slate-100 text-slate-400 p-2 rounded-xl active:scale-90"
                        title="Ignorar Sugestão"
                      > 
                        <X size={16}/>
                      </button>
                    </div>
                  </div>
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

export default AbaPendencias; // Exporta a Aba de Pendências agora 100% auditada para o Master.