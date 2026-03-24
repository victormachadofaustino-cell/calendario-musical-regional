// src/components/Informativos/SecaoInstrucoes.jsx // Identifica o arquivo que cuida dos textos de orientações e circulares.

import React, { useEffect } from 'react'; // Ferramenta base do React para criar a tela e disparar ações automáticas.
import { Plus, Edit3, Trash2 } from 'lucide-react'; // Importa os ícones de Adicionar, Editar e Excluir.
import { doc, deleteDoc } from 'firebase/firestore'; // Ferramentas para localizar e apagar documentos no banco de dados.
import { db } from '../../firebaseConfig'; // Importa a conexão oficial com o banco de dados da Regional.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" que grava as ações no Dashboard.

// Este componente cuida exclusivamente da lista de orientações e circulares numeradas.
// AJUSTE: Agora recebe explicitamente o 'userData' para garantir a identificação no Dashboard.
const SecaoInstrucoes = ({ instrucoes, masterLogado, setEditando, setFormAviso, setMostraAdd, userData }) => { 
  
  // LOGICA DE TELEMETRIA: Registra que o irmão está consultando as circulares oficiais.
  useEffect(() => { // Inicia uma ação automática ao abrir esta aba de texto.
    if (instrucoes && instrucoes.length > 0) { // Só registra se houver conteúdo carregado na tela.
      // Grava o evento com o nome e cargo do irmão, facilitando a auditoria do Master.
      registrarEvento('Informativos', 'Leitura de Circulares', `Consultando ${instrucoes.length} itens`, userData); 
    }
  }, [instrucoes.length, userData]); // Só repete o registro se a lista mudar ou se outro usuário logar.

  // Função para apagar um aviso (ferramenta exclusiva do Maestro Master).
  const apagarAviso = async (id) => { // Inicia o processo de remoção definitiva.
    if (!window.confirm("Deseja realmente excluir esta instrução? Isso apagará para todos da Regional.")) return; 
    try { 
      await deleteDoc(doc(db, "avisos", id)); // Comando que deleta a pasta da instrução no Google Cloud.
      alert("Instrução removida com sucesso!"); // Feedback simples de conclusão.
    } catch (err) { console.error("Erro técnico ao apagar:", err); } // Alerta o console em caso de falha de conexão.
  };

  return ( // Início da montagem visual da lista de textos.
    <div className="space-y-4 animate-in slide-in-from-right-4"> 
      
      {/* Cabeçalho da Seção: Título e Botão de Novo Item */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em]">Instruções e Circulares</h3>
        {masterLogado && ( // Se for o Master, ele ganha o botão de adicionar nova instrução.
          <button 
            onClick={() => { 
              setEditando(null); // Limpa a memória de edição para criar um novo.
              setFormAviso({titulo:'', conteudo:'', ordem: instrucoes.length + 1, prioridade:'normal', categoria:'Instrução'}); 
              setMostraAdd(true); // Abre a janela flutuante de preenchimento.
            }} 
            className="bg-slate-950 text-white p-2 rounded-full active:scale-90 shadow-md transition-transform"
          >
            <Plus size={16}/>
          </button>
        )}
      </div>

      {/* LISTAGEM DOS CARDS (CIRCULARES) */}
      <div className="space-y-4">
        {instrucoes.length === 0 ? ( // Caso o banco de dados esteja vazio ou carregando.
          <p className="text-center py-12 text-[10px] font-bold text-slate-400 uppercase italic">Nenhuma instrução ativa na Regional.</p>
        ) : (
          instrucoes.map((aviso) => ( // Desenha um card branco para cada circular encontrada.
            <div key={aviso.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
              
              {/* ALERTA VISUAL: Barra vermelha lateral para avisos de Alta Prioridade */}
              {aviso.prioridade === 'alta' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />}
              
              <div className="flex gap-4">
                {/* O Número da Ordem serve como identificador visual rápido para o músico */}
                <span className="text-2xl font-[900] italic text-slate-200 leading-none">{aviso.ordem}</span>
                
                {/* BLOCO DE TEXTO: Título e Conteúdo da Instrução */}
                <div className="flex flex-col gap-1 pr-12 text-left">
                  <h4 className="text-slate-950 font-[900] text-[11px] uppercase tracking-wider leading-tight">{aviso.titulo}</h4>
                  <p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase whitespace-pre-line mt-1">
                    {aviso.conteudo}
                  </p>
                </div>
              </div>

              {/* BOTÕES DE GESTÃO: Visíveis apenas para quem tem a "caneta" (Master) */}
              {masterLogado && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => { setEditando(aviso); setFormAviso(aviso); setMostraAdd(true); }} 
                    className="p-2.5 bg-amber-100 text-amber-600 rounded-xl active:scale-90 shadow-sm border border-amber-200/50"
                    title="Editar Instrução"
                  >
                    <Edit3 size={16}/>
                  </button>
                  <button 
                    onClick={() => apagarAviso(aviso.id)} 
                    className="p-2.5 bg-red-100 text-red-600 rounded-xl active:scale-90 shadow-sm border border-red-200/50"
                    title="Excluir Instrução"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SecaoInstrucoes; // Libera o componente monitorado para o Hub de Informativos.