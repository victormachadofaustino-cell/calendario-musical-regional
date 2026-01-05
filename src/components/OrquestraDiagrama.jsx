import React from 'react';

const OrquestraDiagrama = ({ dados }) => {
  // Função para processar o texto respeitando as quebras de linha do Master
  const formatarLinhas = (textoPadrao, textoBanco) => {
    const raw = textoBanco || textoPadrao;
    return raw.split('\n').filter(linha => linha.trim() !== "");
  };

  const secoes = [
    { 
      titulo: "Cordas", 
      linhas: formatarLinhas("Violinos\nViolas / Violoncelos", dados?.cordas) 
    },
    { 
      titulo: "Madeiras", 
      linhas: formatarLinhas(
        "Flautas Transversal / Acordeões\nOboés / Oboés D'Amore / Corne Inglês / Fagotes\nClarinetes Soprano / Altos / Baixo (Clarone)\nSaxofones Sopranos / Altos / Tenores / Barítonos", 
        dados?.madeiras
      ) 
    },
    { 
      titulo: "Metais", 
      linhas: formatarLinhas(
        "Trompetes / Cornet / Flugelhorn\nTrompas\nTrombonitos / Trombones\nBarítonos / Eufônios / Tubas", 
        dados?.metais
      ) 
    }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
      {/* PÚLPITO CENTRALIZADO */}
      <div className="w-full flex justify-center">
        <div className="border-2 border-slate-950 px-8 py-2.5 rounded-xl font-[900] uppercase text-[11px] tracking-[0.2em] bg-white z-10 shadow-sm">
          Púlpito
        </div>
      </div>

      {/* ÁREA DA ORQUESTRA COM DIVISÕES POR SEÇÃO */}
      <div className="w-full space-y-6 pr-12">
        {secoes.map((secao) => (
          <div key={secao.titulo} className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="h-[1px] flex-grow bg-slate-100"></div>
              <h5 className="text-[9px] font-[900] uppercase text-slate-400 tracking-widest px-2">
                {secao.titulo}
              </h5>
              <div className="h-[1px] flex-grow bg-slate-100"></div>
            </div>
            
            <div className="flex flex-col items-center gap-2 w-full">
              {secao.linhas.map((linha, idx) => (
                <div key={idx} className="flex flex-wrap justify-center text-center">
                  <span className="text-[9px] font-black text-slate-700 uppercase leading-tight tracking-tight">
                    {linha}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RÓTULO DO ÓRGÃO - AGORA NA HORIZONTAL */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 border-2 border-slate-200 bg-slate-50/50 px-3 py-2 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-[8px] font-[900] uppercase text-slate-300 tracking-[0.4em]">
          Órgão
        </span>
      </div>
    </div>
  );
};

export default OrquestraDiagrama;