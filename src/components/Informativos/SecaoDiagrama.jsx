// src/components/Informativos/SecaoDiagrama.jsx // Identifica o arquivo que cuida do mapa visual da orquestra regional.

import React, { useEffect } from 'react'; // Ferramenta base do React para construir a interface e disparar ações automáticas.
import { Edit3 } from 'lucide-react'; // Importa o ícone de edição (lápis) para o administrador principal.
import OrquestraDiagrama from '../OrquestraDiagrama'; // Importa o componente técnico que desenha o mapa dos instrumentos.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" que grava as ações identificadas no Dashboard.

// Este componente cuida exclusivamente da exibição do Diagrama de Posicionamento da Orquestra.
const SecaoDiagrama = ({ diagramaMeta, masterLogado, setEditando, setFormAviso, setMostraAdd, userData }) => {
  
  // LOGICA DE TELEMETRIA: Dispara um registro assim que o irmão visualiza o mapa oficial da orquestra.
  useEffect(() => { // Inicia uma ação automática ao carregar este componente na tela do músico.
    if (diagramaMeta && diagramaMeta.id) { // AFINAÇÃO: Só registra se os dados reais do diagrama já chegaram do banco.
      // Grava o acesso com o nome e cargo do irmão para controle da Regional.
      registrarEvento('Informativos', 'Visualização de Diagrama', 'Mapa de Posicionamento Oficial', userData); 
    }
  }, [diagramaMeta?.id, userData]); // Só repete o registro se o conteúdo mudar ou se outro usuário logar.

  return ( // Início da montagem visual do mapa que o músico verá no celular.
    <div className="space-y-4 animate-in slide-in-from-right-4"> 
      
      {/* 1. TÍTULO DA SEÇÃO EM ESTILO MINIMALISTA */}
      <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] px-1">
        Diagrama de Posicionamento
      </h3>

      {/* 2. ÁREA DO DESENHO TÉCNICO (MÓDULO DE MAPA) */}
      <div className="relative">
        {/* Chama o desenho oficial passando as informações (cordas, metais, madeiras) vindas do banco de dados */}
        <OrquestraDiagrama dados={diagramaMeta} />

        {/* BOTÃO DE EDIÇÃO MASTER: Visível apenas para o Maestro Master logado */}
        {masterLogado && (
          <button 
            onClick={() => { 
              setEditando(diagramaMeta); // Avisa ao sistema qual documento de diagrama vamos alterar.
              setFormAviso(diagramaMeta); // Preenche o formulário de edição com os textos que já estão lá.
              setMostraAdd(true); // Abre a janela flutuante para o Master digitar as mudanças.
            }} 
            className="absolute top-4 right-4 p-2.5 bg-amber-500 text-white rounded-full border-2 border-white shadow-lg active:scale-90 transition-all"
            title="Editar Mapa da Orquestra"
          >
            <Edit3 size={16}/> {/* Ícone de lápis para sinalizar ferramenta de edição */}
          </button>
        )}
      </div>

      {/* 3. NOTA DE ORIENTAÇÃO REGIONAL */}
      <p className="text-[7px] font-bold text-slate-400 uppercase text-center italic mt-2 leading-relaxed">
        Siga rigorosamente o posicionamento definido pela Regional para o equilíbrio do som.
      </p>

    </div>
  );
};

export default SecaoDiagrama; // Exporta este módulo monitorado para ser usado dentro do Hub de Informativos.