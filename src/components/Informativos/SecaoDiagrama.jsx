// src/components/Informativos/SecaoDiagrama.jsx // Identifica o arquivo que cuida do mapa visual da orquestra.

import React, { useEffect } from 'react'; // Ferramenta base do React para construir a interface e disparar ações automáticas.
import { Edit3 } from 'lucide-react'; // Importa o ícone de edição (lápis) para o administrador.
import OrquestraDiagrama from '../OrquestraDiagrama'; // Importa o componente que desenha o mapa dos instrumentos.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" que grava as ações no Dashboard.

// Este componente cuida exclusivamente da exibição do Diagrama de Posicionamento da Orquestra.
const SecaoDiagrama = ({ diagramaMeta, masterLogado, setEditando, setFormAviso, setMostraAdd, userData }) => {
  
  // LOGICA DE TELEMETRIA: Dispara um registro assim que o irmão visualiza o mapa da orquestra.
  useEffect(() => { // Inicia uma ação automática ao carregar este componente.
    if (diagramaMeta) { // Se as informações do diagrama estiverem presentes na tela...
      registrarEvento('Informativos', 'Visualização de Diagrama', 'Mapa Oficial da Regional', userData); // Grava o acesso identificado no banco.
    }
  }, [diagramaMeta, userData]); // Só repete se o diagrama mudar ou o usuário for outro.

  return ( // Início da parte visual que o músico verá.
    <div className="space-y-4 animate-in slide-in-from-right-4"> 
      {/* 1. TÍTULO DA SEÇÃO */}
      <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em]">
        Diagrama de Posicionamento
      </h3>

      {/* 2. ÁREA DO DESENHO TÉCNICO */}
      <div className="relative">
        {/* Chama o desenho oficial passando as informações de texto vindas do banco de dados */}
        <OrquestraDiagrama dados={diagramaMeta} />

        {/* BOTÃO DE EDIÇÃO MASTER: Aparece flutuando sobre o diagrama apenas para o administrador */}
        {masterLogado && (
          <button 
            onClick={() => { 
              setEditando(diagramaMeta); // Avisa ao sistema qual documento vamos mudar.
              setFormAviso(diagramaMeta); // Preenche o formulário com os textos atuais.
              setMostraAdd(true); // Abre a janela de edição.
            }} 
            className="absolute top-4 right-4 p-2.5 bg-amber-500 text-white rounded-full border-2 border-white shadow-lg active:scale-90 transition-all"
          >
            <Edit3 size={16}/> {/* Ícone de lápis para editar */}
          </button>
        )}
      </div>

      {/* 3. NOTA DE RODAPÉ DO DIAGRAMA */}
      <p className="text-[7px] font-bold text-slate-400 uppercase text-center italic mt-2">
        Siga rigorosamente o posicionamento definido pela Regional
      </p>
    </div>
  );
};

export default SecaoDiagrama; // Exporta este módulo para ser usado dentro do Hub de Informativos.