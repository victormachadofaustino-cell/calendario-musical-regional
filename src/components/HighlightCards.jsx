// src/components/HighlightCards.jsx // Identifica o arquivo que gera os cartões de destaque na página inicial.
import React, { useMemo } from 'react'; // Ferramentas base para criar a tela e memorizar cálculos pesados.
import { Clock, MapPin, Star, Share2, ChevronRight, CalendarDays } from 'lucide-react'; // Ícones para a interface.
import { normalizarTexto } from '../constants/comuns'; // Função para comparar textos sem erro de acentos.
import { isMaster, isComissao } from '../constants/permissions'; // Motor de verificação de nível administrativo e comissão.

// IMPORTAÇÃO DE UTILITÁRIOS: Ferramentas para abrir mapas e compartilhar dados.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; 

const HighlightCards = ({ todosEnsaios, ensaiosRegionais, reunioesData = [], aoVerMais, cidadeUsuario, user }) => { // Recebe dados e perfil do usuário logado.

  // DICIONÁRIO: Converte siglas em nomes amigáveis para exibição (Ex: Seg vira Segunda).
  const DICIONARIO_DIAS = { "Dom": "Domingo", "Seg": "Segunda", "Ter": "Terça", "Qua": "Quarta", "Qui": "Quinta", "Sex": "Sexta", "Sáb": "Sábado" };

  // Função interna para exibir o dia da semana por extenso no card.
  const formatarDiaExtensoLocal = (textoDia) => {
    if (!textoDia) return ""; // Se não houver dia, retorna vazio.
    const partes = textoDia.split(' '); // Divide o texto (Ex: 1ª e Seg).
    if (partes.length < 2) return textoDia; // Se não estiver no formato esperado, mantém o original.
    const sigla = partes[1].replace('.', ''); // Remove pontos da sigla.
    const diaExtenso = DICIONARIO_DIAS[sigla] || sigla; // Busca o nome no dicionário.
    return `${partes[0]} ${diaExtenso}`; // Retorna formatado (Ex: 1ª Segunda).
  };

  // 🛡️ LÓGICA: Encontrar a Próxima Reunião Administrativa válida respeitando o novo distintivo.
  const getProximaReuniaoValida = () => {
    if (!reunioesData || reunioesData.length === 0 || !user) return null; // Se não houver dados ou login, não exibe nada.
    const hoje = new Date(); // Pega a data de hoje.
    const hojeTS = Number(`${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`); // Cria um número para comparar datas.
    
    return [...reunioesData]
      .filter(r => {
        // A reunião aparece se for Pública OU se o usuário for Master OU se tiver a Estrela da Comissão.
        const acessoPermitido = !r.restrito || isMaster(user) || isComissao(user);
        return acessoPermitido && (r.timestamp || 0) >= hojeTS; // Só mostra reuniões que ainda não aconteceram.
      })
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))[0]; // Entrega apenas a primeira da lista (a mais próxima).
  };

  // Lógica para encontrar o Próximo Regional válido na agenda oficial.
  const getProximoRegionalValido = () => {
    if (!ensaiosRegionais || ensaiosRegionais.length === 0) return null; // Se a agenda estiver vazia, ignora.
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 };
    const agora = new Date(); // Hora atual.
    const mesAtualNum = agora.getMonth() + 1; // Mês atual em número.
    const diaAtualNum = agora.getDate(); // Dia do mês atual.

    return [...ensaiosRegionais] 
      .filter(e => { 
        const mesEnsaioNum = ordemMeses[e.mes] || 0; // Converte o mês do ensaio para número.
        return mesEnsaioNum > mesAtualNum || (mesEnsaioNum === mesAtualNum && Number(e.dia) >= diaAtualNum); // Filtra datas futuras.
      })
      .sort((a, b) => { 
        const mesA = ordemMeses[a.mes] || 99; // Prioriza o mês.
        const mesB = ordemMeses[b.mes] || 99;
        if (mesA !== mesB) return mesA - mesB; // Ordena por mês diferente.
        return Number(a.dia) - Number(b.dia); // Ordena por dia no mesmo mês.
      })[0]; // Pega o regional mais próximo.
  };

  // Lógica do Calendário para o filtro de "Hoje".
  const hojeDate = new Date(); // Pega a data atual.
  const filtroHoje = `${Math.ceil(hojeDate.getDate() / 7)}${ (hojeDate.getDay() === 0 || hojeDate.getDay() === 6) ? "º" : "ª" } ${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][hojeDate.getDay()]}`;

  const proximaReuniao = getProximaReuniaoValida(); // Ativa a busca da reunião.
  const proximoRegional = getProximoRegionalValido(); // Ativa a busca do regional.
  const ensaiosHoje = todosEnsaios.filter(e => e.dia.includes(filtroHoje)); // Filtra ensaios locais de hoje.

  // 🧠 MOTOR DE SUGESTÃO INTELIGENTE: Prioriza a cidade do irmão e sorteia o resto.
  const sugestoesVisiveis = useMemo(() => { // Calcula a melhor sugestão para o irmão logado.
    if (ensaiosHoje.length === 0) return []; // Se não houver nada hoje, retorna vazio.
    const daMinhaCidade = ensaiosHoje.filter(e => normalizarTexto(e.cidade) === normalizarTexto(cidadeUsuario)); // Filtra cidade do irmão.
    const outrosEnsaios = ensaiosHoje.filter(e => normalizarTexto(e.cidade) !== normalizarTexto(cidadeUsuario)).sort(() => Math.random() - 0.5); // Embaralha outros.
    const listaFinal = [...daMinhaCidade, ...outrosEnsaios]; // Monta a lista final.
    return listaFinal.slice(0, 2); // Exibe os 2 primeiros.
  }, [ensaiosHoje, cidadeUsuario]); // Recalcula se os dados mudarem.

  return ( 
    <div className="w-full space-y-5 animate-in px-6 py-2">
      
      {/* CARD: PRÓXIMA REUNIÃO ADMINISTRATIVA (DESIGN PADRONIZADO) */}
      {proximaReuniao && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <CalendarDays size={10} className="text-blue-500" />
            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Próxima Reunião Musical</h4>
          </div>
          {/* AFINAÇÃO: Padronizei a altura e a borda colorida para combinar com o layout geral */}
          <div className={`bg-white p-5 rounded-[2rem] border-l-4 ${proximaReuniao.cor || 'border-l-blue-600'} border shadow-sm relative overflow-hidden h-[140px]`}>
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col text-left pr-24">
                <span className="text-blue-600 text-[12px] font-black uppercase tracking-widest leading-none">{proximaReuniao.rotulo}</span>
                <h4 className="text-slate-950 font-[900] text-sm uppercase italic leading-tight tracking-tight mt-1">{proximaReuniao.titulo}</h4>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80 truncate">{proximaReuniao.local}</p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-950 font-black text-lg uppercase italic">
                <Clock size={14} className="text-blue-500" /> {proximaReuniao.hora}
              </div>
            </div>
            {/* Bloco de Ações lateral (Data + Botões) compatível com o card de Regional */}
            <div className="absolute top-4 right-5 bottom-4 flex flex-col items-end justify-between">
               <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl uppercase italic text-center min-w-[65px] flex flex-col items-center justify-center leading-none shadow-sm">
                  <span className="text-base font-[900] text-slate-950">{proximaReuniao.dia}</span>
                  <span className="text-[11px] font-black text-slate-400 mt-0.5">{proximaReuniao.mes?.substring(0, 3)}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => compartilharEnsaio(proximaReuniao, false)} className="p-2.5 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100 active:scale-90 transition-all"><Share2 size={16} /></button>
                  <button onClick={() => abrirGoogleMaps(proximaReuniao.local, "Regional Jundiaí")} className="p-2.5 rounded-xl bg-slate-50 text-blue-500 border border-slate-100 active:scale-90 transition-all"><MapPin size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* CARD: PRÓXIMO REGIONAL (Destaque principal) */}
      {proximoRegional && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Star size={10} className="text-amber-500 fill-amber-500" />
            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Próximo Regional</h4>
          </div>
          <div className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-xl h-[140px]">
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col text-left pr-24">
                <h4 className="text-white font-[900] text-sm uppercase italic leading-tight tracking-tight">{proximoRegional.sede}</h4>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{proximoRegional.local}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white font-black text-xl uppercase italic">
                <Clock size={16} className="text-amber-500" /> {proximoRegional.hora}
              </div>
            </div>
            <div className="absolute top-4 right-5 bottom-4 flex flex-col items-end justify-between">
               <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl uppercase italic text-center min-w-[65px] flex flex-col items-center justify-center leading-none">
                  <span className="text-base font-[900]">{proximoRegional.dia}</span>
                  <span className="text-[11px] font-black mt-0.5">{proximoRegional.mes?.substring(0, 3)}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => compartilharEnsaio(proximoRegional, true)} className="p-2.5 rounded-xl bg-white/10 text-emerald-500 border border-white/5 active:scale-90 transition-all"><Share2 size={16} /></button>
                  <button onClick={() => abrirGoogleMaps(proximoRegional.local, proximoRegional.sede)} className="p-2.5 rounded-xl bg-white/10 text-amber-500 border border-white/5 active:scale-90 transition-all"><MapPin size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: ENSAIOS DE HOJE */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Hoje • {formatarDiaExtensoLocal(filtroHoje)}</h4>
          {ensaiosHoje.length > 0 && (
            <button onClick={() => aoVerMais(filtroHoje)} className="text-slate-950 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-full active:scale-95 shadow-sm">
              {ensaiosHoje.length > 2 ? `+${ensaiosHoje.length - 2}` : `Ver Tudo`} <ChevronRight size={12} className="inline ml-1" />
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
                <div key={s.id} className={`bg-white p-5 rounded-[2rem] border relative overflow-hidden shadow-sm h-[140px] ${isDaMinhaCidade ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col text-left pr-24">
                      <h4 className="text-slate-950 font-[900] text-base uppercase italic leading-tight tracking-tight">{s.localidade}</h4>
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{s.cidade} • {formatarDiaExtensoLocal(s.dia)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-950 font-black text-lg uppercase italic">
                      <Clock size={14} className="text-amber-500" /> {s.hora}
                    </div>
                  </div>
                  <div className="absolute top-4 right-5 bottom-4 flex flex-col items-end justify-between">
                     <div className="bg-slate-950 text-white text-[10px] font-black px-3 py-2 rounded-lg uppercase border border-slate-800">
                        {DICIONARIO_DIAS[s.dia.split(' ')[1]] || s.dia.split(' ')[1]}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => compartilharEnsaio(s, false)} className="p-2.5 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100 active:scale-90 transition-all"><Share2 size={16} /></button>
                        <button onClick={() => abrirGoogleMaps(s.localidade, s.cidade)} className="p-2.5 rounded-xl bg-slate-50 text-amber-600 border border-slate-100 active:scale-90 transition-all"><MapPin size={16} /></button>
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

export default HighlightCards; // Exporta os cartões de destaque com o novo tapinha visual padronizado.