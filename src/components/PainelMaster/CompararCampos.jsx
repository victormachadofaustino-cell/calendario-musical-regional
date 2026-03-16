import React from 'react'; // Ferramenta base para construir a interface visual.
import { ArrowRight } from 'lucide-react'; // Importa o ícone de setinha para a direita.

// Este componente é o "Olho Clínico": ele mostra o dado antigo vs o dado sugerido.
const CompararCampo = ({ 
  label, // O nome do que estamos olhando (ex: "Horário" ou "Localidade").
  antigo, // Como a informação está gravada hoje no banco de dados.
  novo // A nova sugestão que o colaborador enviou.
}) => {
  // Lógica para saber se houve mudança: remove espaços e compara os textos.
  const mudou = String(antigo || '').trim() !== String(novo || '').trim(); // Verifica se o que era antes é diferente do que sugeriram agora.

  // Se não existe dado antigo nem novo (campo vazio), o componente não desenha nada na tela.
  if (!antigo && !novo) return null; // Retorna vazio para não sujar a interface.

  return ( // Início da parte visual.
    <div className={`p-3 rounded-2xl border transition-all ${mudou ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}> 
      {/* O fundo fica levemente laranja se houver uma mudança para chamar a atenção do Master. */}
      
      <div className="flex justify-between items-center mb-1"> {/* Linha do título do campo. */}
        <span className="text-[7px] font-black uppercase text-slate-400">{label}</span> {/* Mostra o nome do campo (ex: CONTATO). */}
        {mudou && ( // Se mudou, mostra um selinho vermelho piscando.
          <span className="bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase">
            Alterado {/* Aviso visual de que houve mexida aqui. */}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap"> {/* Linha onde os valores aparecem. */}
        {/* VALOR ANTIGO */}
        <span className={`text-[10px] font-bold ${mudou ? 'text-red-400 line-through bg-red-50 px-1 rounded' : 'text-slate-600'}`}>
          {antigo || '---'} {/* Se mudou, o texto antigo aparece riscado em vermelho. */}
        </span>

        {mudou && ( // Se houve mudança, coloca a setinha e o valor novo ao lado.
          <>
            <ArrowRight size={10} className="text-amber-500 shrink-0" /> {/* Setinha indicando a direção da mudança. */}
            
            {/* VALOR NOVO (SUGESTÃO) */}
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded uppercase">
              {novo} {/* O valor sugerido aparece em verde destaque. */}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default CompararCampo; // Exporta a ferramenta para ser usada pelo naipe de Pendências.