import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, MapPin, Star, ChevronRight, Navigation, User, BarChart3, MessageCircle, Share2 } from 'lucide-react';

// Importação das constantes e funções de precisão geográfica
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

  const ensaiosHoje = todosEnsaios.filter(e => e.dia.includes(filtroPrecisoHoje));
  const sugestoesVisiveis = ensaiosHoje.slice(0, 2);
  const totalRestante = ensaiosHoje.length - 2;
  const proximoRegional = getProximoRegionalValido();

  // Função simplificada para Google Maps direto
  const abrirGoogleMaps = (localidade, cidade) => {
    const coords = buscarCoordenadas(cidade, localidade);
    const destino = coords ? `${coords.lat},${coords.lon}` : encodeURIComponent(`CCB ${localidade} ${cidade}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank');
  };

  // Função que usa a API de compartilhamento nativa do celular (Resolve conflito Wapp Business)
  const compartilharEnsaio = async (e, isRegional = false) => {
    const texto = isRegional 
      ? `*CCB Jundiaí - Ensaio Regional*\n📍 ${e.sede} (${e.local})\n📅 ${e.dia}/${e.mes} às ${e.hora}\n🗓️ ${e.weekday}`
      : `*CCB Jundiaí - Ensaio Local*\n📍 ${e.localidade} (${e.cidade})\n🗓️ ${e.dia} às ${e.hora}\n👤 ${e.encarregado || 'N/I'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite Ensaio CCB',
          text: texto
        });
      } catch (err) {
        console.log("Erro ao compartilhar:", err);
      }
    } else {
      // Fallback para WhatsApp padrão caso o navegador não suporte Web Share
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  return (
    <div className="w-full space-y-5 animate-in px-6 py-2 text-left">
      
      {/* CARD DE BOAS-VINDAS */}
      {user && (
        <div className="bg-white border border-slate-200 p-5 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-lg"><User size={18} /></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-[900] uppercase text-slate-950 tracking-tight leading-none">Olá, {user.nome?.split(' ')[0]}</span>
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-1.5">{user.cargo} • {user.cidade}</span>
            </div>
          </div>
          <button onClick={aoAbrirDashboard} className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 border border-slate-100">
            <BarChart3 size={20} />
            {pendenciasCount > 0 && user?.nivel === 'master' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      {/* CARD PRÓXIMO REGIONAL */}
      {proximoRegional && (
        <div className="bg-slate-950 rounded-[2.2rem] p-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <Star size={10} className="text-amber-500 fill-amber-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500">Próximo Regional</span>
              </div>
              <h3 className="text-white text-xl font-[900] uppercase italic leading-tight tracking-tighter pr-16">{proximoRegional.sede}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{proximoRegional.local}</p>
            </div>
            <div className="bg-amber-500 text-slate-950 text-[10px] font-[900] px-3 py-3 rounded-xl uppercase shrink-0 italic shadow-md">
              {proximoRegional.dia} {proximoRegional.mes.substring(0, 3)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white italic"><Clock size={14} className="text-amber-500" /> {proximoRegional.hora}</div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => compartilharEnsaio(proximoRegional, true)} className="bg-white/10 text-emerald-500 p-3 rounded-xl border border-white/5 active:scale-90">
                <Share2 size={18} />
              </button>
              <button onClick={() => abrirGoogleMaps(proximoRegional.local, proximoRegional.sede)} className="bg-white/10 text-amber-500 p-3 rounded-xl border border-white/5 active:scale-90">
                <MapPin size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENSAIOS DE HOJE */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Hoje • {filtroPrecisoHoje}</h4>
          {ensaiosHoje.length > 0 && (
            <button onClick={() => aoVerMais(filtroPrecisoHoje)} className="text-slate-950 text-[8px] font-black uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-full active:scale-95">
              {totalRestante > 0 ? `+${totalRestante}` : `Ver Tudo`} <ChevronRight size={10} className="inline ml-1" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ensaiosHoje.length === 0 ? (
            <div className="bg-white/50 border border-dashed border-slate-200 rounded-[2rem] py-8 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nenhum ensaio hoje</span>
            </div>
          ) : (
            sugestoesVisiveis.map(s => {
              const isDaMinhaCidade = normalizarTexto(s.cidade) === normalizarTexto(cidadeUsuario);
              return (
                <div key={s.id} className={`bg-white p-5 rounded-[2rem] border relative overflow-hidden shadow-sm transition-all ${isDaMinhaCidade ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col text-left">
                      <h4 className="text-slate-950 font-[900] text-sm uppercase italic leading-tight tracking-tight pr-24">{s.localidade}</h4>
                      <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1">{s.cidade} • {s.dia}</span>
                      <div className="flex items-center gap-1.5 mt-3 text-slate-950 font-black text-[10px] uppercase italic">
                        <Clock size={12} className="text-amber-500" /> {s.hora}
                      </div>
                    </div>
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                       <div className="bg-slate-950 text-white text-[8px] font-black px-2.5 py-2.5 rounded-lg uppercase shadow-sm">{s.dia.split(' ')[1]}</div>
                       <div className="flex gap-2">
                          <button onClick={() => compartilharEnsaio(s, false)} className={`p-2.5 rounded-xl active:scale-90 ${isDaMinhaCidade ? 'bg-amber-100 text-emerald-600' : 'bg-slate-50 text-emerald-600'}`}>
                            <Share2 size={16} />
                          </button>
                          <button onClick={() => abrirGoogleMaps(s.localidade, s.cidade)} className={`p-2.5 rounded-xl active:scale-90 ${isDaMinhaCidade ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                            <MapPin size={16} />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;