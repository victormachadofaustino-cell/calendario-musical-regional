// src/components/Informativos/SecaoInstrucoes.jsx // Identifica o arquivo que cuida dos textos de orientações.

import React, { useEffect } from 'react'; // Ferramenta base do React para criar a tela e disparar ações automáticas.
import { Plus, Edit3, Trash2 } from 'lucide-react'; // Importa os ícones de Adicionar, Editar e Excluir.
import { doc, deleteDoc } from 'firebase/firestore'; // Ferramentas para localizar e apagar documentos no banco de dados.
import { db } from '../../firebaseConfig'; // Importa a conexão oficial com o banco de dados da Regional.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" que grava as ações no Dashboard.

// Este componente cuida exclusivamente da lista de orientações e circulares numeradas.
const SecaoInstrucoes = ({ instrucoes, masterLogado, setEditando, setFormAviso, setMostraAdd, userData }) => { 
  
  // LOGICA DE TELEMETRIA: Dispara um aviso ao Dashboard assim que o irmão entra nesta seção.
  useEffect(() => { // Inicia uma ação automática ao abrir a tela.
    if (instrucoes.length > 0) { // Se existirem instruções para serem lidas...
      registrarEvento('Informativos', 'Leitura de Instruções', `Total: ${instrucoes.length} itens`, userData); // Grava o acesso identificado.
    }
  }, [instrucoes.length, userData]); // Só repete se a quantidade de avisos mudar ou o usuário trocar.

  // Função para apagar um aviso (apenas para o Master).
  const apagarAviso = async (id) => { // Inicia o processo de exclusão.
    if (!window.confirm("Deseja realmente excluir esta instrução?")) return; // Pergunta antes de apagar por segurança.
    try { // Tenta realizar a exclusão no Google.
      await deleteDoc(doc(db, "avisos", id)); // Remove o aviso definitivamente do banco de dados.
    } catch (err) { console.error("Erro ao apagar:", err); } // Registra no console se houver falha técnica.
  };

  return ( // Início da parte visual das instruções.
    <div className="space-y-4 animate-in slide-in-from-right-4"> 
      {/* Cabeçalho da Seção com botão de Adicionar para o Master */}
      <div className="flex items-center justify-between">
        <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em]">Instruções e Circulares</h3>
        {masterLogado && ( // Só mostra o botão de "Mais" se for o Maestro logado.
          <button 
            onClick={() => { setEditando(null); setFormAviso({titulo:'', conteudo:'', ordem: instrucoes.length + 1, prioridade:'normal', categoria:'Instrução'}); setMostraAdd(true); }} 
            className="bg-slate-950 text-white p-2 rounded-full active:scale-90 shadow-md"
          >
            <Plus size={16}/>
          </button>
        )}
      </div>

      {/* Lista de Cards de Instrução */}
      <div className="space-y-4">
        {instrucoes.length === 0 ? ( // Se não houver avisos no banco, mostra uma mensagem simples.
          <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase italic">Nenhuma instrução cadastrada.</p>
        ) : (
          instrucoes.map((aviso) => ( // Percorre a lista de avisos e desenha cada um na tela.
            <div key={aviso.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
              {/* Barra lateral de prioridade (só aparece se for Alta) */}
              {aviso.prioridade === 'alta' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
              
              <div className="flex gap-4">
                {/* Número da Ordem em destaque */}
                <span className="text-2xl font-[900] italic text-slate-200 leading-none">{aviso.ordem}</span>
                
                {/* Título e Texto do Informativo */}
                <div className="flex flex-col gap-1 pr-16">
                  <h4 className="text-slate-950 font-[900] text-[11px] uppercase tracking-wider">{aviso.titulo}</h4>
                  <p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase whitespace-pre-line">
                    {aviso.conteudo}
                  </p>
                </div>
              </div>

              {/* Botões de Gestão (Apenas para o Master) */}
              {masterLogado && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => { setEditando(aviso); setFormAviso(aviso); setMostraAdd(true); }} 
                    className="p-2.5 bg-amber-100 text-amber-600 rounded-xl active:scale-90 transition-all"
                  >
                    <Edit3 size={16}/>
                  </button>
                  <button 
                    onClick={() => apagarAviso(aviso.id)} 
                    className="p-2.5 bg-red-100 text-red-600 rounded-xl active:scale-90 transition-all"
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

export default SecaoInstrucoes; // Exporta esta parte para ser usada dentro do Hub de Informativos.