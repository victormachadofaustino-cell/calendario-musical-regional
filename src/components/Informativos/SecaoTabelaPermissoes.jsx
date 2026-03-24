// src/components/Informativos/SecaoTabelaPermissoes.jsx // Identifica o arquivo da tabela técnica de permissões de serviço.

import React, { useEffect } from 'react'; // Ferramenta base do React para criar a interface e disparar ações automáticas.
import { CheckCircle2, XCircle, Edit3 } from 'lucide-react'; // Importa os ícones de Check, Erro e Editar.

// IMPORTAÇÃO DE TELEMETRIA
import { registrarEvento } from '../../constants/comuns'; // Importa o "Olheiro" que grava as ações identificadas no Dashboard.

// Este componente cuida exclusivamente da exibição da Tabela Técnica "Onde Poderei Tocar".
const SecaoTabelaPermissoes = ({ linhasTabela, masterLogado, setEditandoLinha, setFormLinha, userData }) => {
  
  // LOGICA DE TELEMETRIA: Registra o acesso identificado assim que a irmandade abre a tabela técnica.
  useEffect(() => { // Inicia uma ação automática ao carregar esta seção na tela.
    if (linhasTabela && linhasTabela.length > 0 && linhasTabela[0].id) { // AFINAÇÃO: Só registra se os dados reais já chegaram do banco.
      // Grava quem está consultando as regras de serviço musical (Nome e Cargo).
      registrarEvento('Informativos', 'Consulta Técnica', 'Tabela de Permissões Regional', userData); 
    }
  }, [linhasTabela.length, userData]); // Só repete o registro se a tabela mudar ou se outro usuário logar.

  return ( // Início da construção visual da tabela que o músico verá.
    <div className="space-y-4 animate-in slide-in-from-right-4">
      
      {/* 1. TÍTULO DA SEÇÃO */}
      <h3 className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] px-1">
        Onde Poderei Tocar
      </h3>
      
      {/* 2. CONTAINER DA TABELA COM DESIGN UI OTIMIZADO */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative mt-12">
        
        {/* INTELIGÊNCIA DE DESLIZE: Permite que o músico arraste a tabela para o lado no celular sem travar. */}
        <div 
          className="overflow-x-auto no-scrollbar pt-20"
          style={{ 
            WebkitOverflowScrolling: 'touch', // Deixa o deslize suave no iPhone (efeito mola).
            touchAction: 'pan-x pan-y' // Melhora a resposta do toque para movimentos laterais.
          }}
        >
          <table className="w-full text-[8px] font-black uppercase border-collapse">
            <thead>
              <tr className="bg-white">
                {/* Coluna fixa à esquerda: Nome do Serviço Musical */}
                <th className="p-4 text-left border-b-2 border-slate-950 leading-tight bg-slate-950 text-white min-w-[140px] sticky left-0 z-20 rounded-tr-[2rem]">
                  Classificação do Serviço
                </th>
                
                {/* Cabeçalhos inclinados para melhor leitura em telas estreitas de celular */}
                {["Oficializado", "Não Oficial.", "RJM (Bat.)", "RJM (Ñ Bat.)", "Ensaios"].map((tit, idx) => (
                  <th key={idx} className="border-b-2 border-slate-950 relative h-16 min-w-[50px] px-0">
                    <div className="absolute -top-16 left-0 right-0 bottom-0 flex items-end justify-center pb-2">
                      <span className="inline-block transform -rotate-[45deg] whitespace-nowrap text-slate-950 text-[7px] font-black tracking-tighter w-full text-center origin-bottom-left ml-6">
                        {tit}
                      </span>
                    </div>
                  </th>
                ))}
                
                {/* Coluna de ação: Visível apenas para o Maestro Master */}
                {masterLogado && <th className="border-b-2 border-slate-950 p-2 bg-slate-950 text-white">#</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {/* Mapeia cada linha vinda do banco de dados (Ex: Culto Oficial, Batismo, etc) */}
              {linhasTabela.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  
                  {/* Nome do Serviço: Fica fixo à esquerda enquanto o resto da linha desliza */}
                  <td className="p-4 text-slate-950 font-black border-r border-slate-100 leading-tight sticky left-0 bg-inherit z-10 shadow-sm">
                    {row.s}
                  </td>
                  
                  {/* Colunas de Permissão: Renderiza os ícones de Check ou X */}
                  {[row.o, row.n, row.rb, row.rnb, row.me].map((val, idx) => (
                    <td key={idx} className={`p-2 text-center border-slate-100 ${idx < 4 ? 'border-r' : ''}`}>
                      <div className="flex flex-col items-center justify-center">
                        {/* Lógica inteligente: Aceita tanto "SIM/NÃO" quanto Verdadeiro/Falso do banco */}
                        {val === true || (typeof val === 'string' && val.toUpperCase().includes('SIM')) ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                      </div>
                    </td>
                  ))}
                  
                  {/* Botão de Edição Rápida: Exclusivo para correções do Master */}
                  {masterLogado && (
                    <td className="p-2 text-center bg-inherit">
                      <button 
                        onClick={() => { setEditandoLinha(row); setFormLinha(row); }} 
                        className="text-amber-500 active:scale-90 transition-all p-1"
                        title="Ajustar Regra"
                      >
                        <Edit3 size={14}/>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 3. LEGENDA TÉCNICA (O RODAPÉ DA TABELA) */}
        <div className="bg-slate-950 p-5 space-y-2">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            <span className="text-amber-500 mr-1 italic">1 -</span> Somente na Região do seu Município
          </p>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            <span className="text-amber-500 mr-1 italic">2 -</span> Conforme orientação da circular 145/2022
          </p>
        </div>

      </div>
    </div>
  );
};

export default SecaoTabelaPermissoes; // Exporta a tabela técnica agora 100% monitorada pelo Dashboard Master.