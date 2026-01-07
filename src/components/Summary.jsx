import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, MapPin, Star, ChevronRight, Navigation, User, X, BarChart3 } from 'lucide-react';

// Importação das constantes e funções de precisão geográfica
import { CIDADES_LISTA } from '../constants/cidades';
import { buscarCoordenadas, normalizarTexto } from '../constants/comuns';

const Summary = ({ todosEnsaios, ensaiosRegionais, aoVerMais, aoAbrirDashboard, cidadeUsuario, user, pendenciasCount }) => {
  const [mapaSeletor, setMapaSeletor] = useState(null);

  // 1. Lógica para identificar a Ocorrência da Semana (1ª a Últ)
  const getFiltroPrecisoHoje = () => {
    const hoje = new Date();
    const diaMes = hoje.getDate();
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const diaSemana = dias[hoje.getDay()];
    const numeroSemana = Math.ceil(diaMes / 7);
    
    // Regra gramatical: Sábado e Domingo usam sufixo masculino (º)
    const isFimDeSemana = diaSemana === "Dom" || diaSemana === "Sáb";
    const sufixo = isFimDeSemana ? "º" : "ª";
    
    const semanaTexto = numeroSemana >= 5 ? "Últ." : `${numeroSemana}${sufixo}`;
    return `${semanaTexto} ${diaSemana}`;
  };

  const filtroPrecisoHoje = getFiltroPrecisoHoje();
  
  // 2. Lógica para identificar o PRÓXIMO regional válido
  const getProximoRegionalValido = () => {
    if (!ensaiosRegionais || ensaiosRegionais.length === 0) return null;
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 };
    const agora = new Date();
    const mesAtualNum = agora.getMonth() + 1;
    const diaAtualNum = agora.getDate();

    return [...ensaiosRegionais]
      .filter(e => {
        const mesEnsaioNum = ordemMeses[e.mes] || 0;
        return mesEnsaioNum > mesAtualNum || (mesEnsaioNum === mesAtualNum && Number(e.dia) >= diaAtualNum);
      })
      .sort((a, b) => {
        const mesA = ordemMeses[a.mes] || 99;
        const mesB = ordemMeses[b.mes] || 99;
        if (mesA !== mesB) return mesA - mesB;
        return Number(a.dia) - Number(b.dia);
      })[0];
  };

  // 3. Filtro e Limite de Visualização
  const ensaiosHoje = todosEnsaios.filter(e => e.dia.includes(filtroPrecisoHoje));
  const sugestoesVisiveis = ensaiosHoje.slice(0, 2);
  const totalRestante = ensaiosHoje.length - 2;
  
  const proximoRegional = getProximoRegionalValido();

  const abrirMapaInteligente = (app, localidade, cidade) => {
    const coords = buscarCoordenadas(cidade, localidade);
    let destino = coords ? `${coords.lat},${coords.lon}` : encodeURIComponent(`CCB ${localidade} ${cidade}`);
    
    const links = { 
      google: `https://www.google.com/maps/search/?api=1&query=${destino}`, 
      waze: coords ? `https://waze.com/ul?ll=${destino}&navigate=yes` : `https://waze.com/ul?q=${destino}&navigate=yes` 
    };
    
    window.open(links[app], '_blank');
    setMapaSeletor(null);
  };

  return (
    <div className="w-full space-y-5 animate-in px-6 py-2 text-left">
      
      {/* CARD DE BOAS-VINDAS COM ATALHO PARA DASHBOARD */}
      {user && (
        <div className="bg-white border border-slate-200 p-5 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">Olá, {user.nome?.split(' ')[0]}</span>
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-1.5">{user.cargo} • {user.cidade}</span>
            </div>
          </div>
          
          {/* BOTÃO DASHBOARD */}
          <button 
            onClick={aoAbrirDashboard}
            className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 transition-all border border-slate-100 hover:text-slate-950"
          >
            <BarChart3 size={20} />
            {pendenciasCount > 0 && user?.nivel === 'master' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      {/* CARD PRÓXIMO REGIONAL */}
      {proximoRegional && (
        <div className="bg-slate-950 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500">Próximo Regional</span>
                </div>
                <h3 className="text-white text-2xl font-[900] tracking-tighter leading-none uppercase italic">{proximoRegional.mes}</h3>
              </div>
              <button onClick={() => setMapaSeletor({local: proximoRegional.local, sede: proximoRegional.sede})} className="bg-white/10 p-2.5 rounded-xl text-white border border-white/10 active:scale-90"><MapPin size={18} /></button>
            </div>
            <div className="space-y-0.5">
              <span className="text-white text-sm font-black uppercase tracking-widest block">{proximoRegional.sede}</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none block">{proximoRegional.local}</span>
            </div>
            <div className="flex items-center gap-5 pt-3 border-t border-white/5 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200"><Calendar size={14} className="text-amber-500" /> Dia {proximoRegional.dia}</div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200"><Clock size={14} className="text-amber-500" /> {proximoRegional.hora}</div>
            </div>
          </div>
        </div>
      )}

      {/* ENSAIOS DE HOJE */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Hoje • {filtroPrecisoHoje}</h4>
          </div>

          {ensaiosHoje.length > 0 && (
            <button onClick={() => aoVerMais(filtroPrecisoHoje)} className="text-slate-950 text-[8px] font-black uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm active:scale-95">
              {totalRestante > 0 ? `+${totalRestante} ensaios` : `Somente ${ensaiosHoje.length}`} <ChevronRight size={10} className="inline ml-1" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {ensaiosHoje.length === 0 ? (
            <div className="bg-white/50 border border-dashed border-slate-200 rounded-[1.8rem] py-8 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nenhum ensaio hoje</span>
            </div>
          ) : (
            sugestoesVisiveis.map(s => {
              const isDaMinhaCidade = normalizarTexto(s.cidade) === normalizarTexto(cidadeUsuario);
              return (
                <div key={s.id} className={`bg-white px-5 py-4 rounded-[1.8rem] border flex items-center justify-between shadow-sm transition-all ${isDaMinhaCidade ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                  <div className="flex flex-col text-left">
                    <h4 className="text-slate-950 font-[900] text-xs tracking-tight uppercase leading-none">{s.localidade}</h4>
                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1.5">{s.cidade} • {s.hora}</span>
                  </div>
                  <button onClick={() => setMapaSeletor({local: s.localidade, sede: s.cidade})} className={`p-2.5 rounded-xl active:scale-90 ${isDaMinhaCidade ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}><MapPin size={16} /></button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* SELETOR DE MAPA (PORTAL) */}
      {mapaSeletor && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6 text-left">Ir para...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirMapaInteligente('google', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100 text-left">
                <Navigation size={20} className="text-blue-500" /><span className="text-[12px] font-black uppercase text-slate-950">Google Maps</span>
              </button>
              <button onClick={() => abrirMapaInteligente('waze', mapaSeletor.local, mapaSeletor.sede)} className="w-full bg-slate-50 p-5 rounded-2xl flex items-center gap-4 active:scale-95 border border-slate-100 text-left">
                <Navigation size={20} className="text-teal-500" /><span className="text-[12px] font-black uppercase text-slate-950">Waze</span>
              </button>
            </div>
            <button onClick={() => setMapaSeletor(null)} className="w-full mt-6 py-4 text-slate-400 text-[10px] font-black uppercase">Cancelar</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Summary;