import React from 'react'; // Ferramenta base para criar o componente visual.
import { Clock, MapPin, Star, Share2, ChevronRight, CalendarDays } from 'lucide-react'; // Ícones para relógio, mapa, estrela, compartilhar, seta e agenda.
import { normalizarTexto } from '../constants/comuns'; // Função para padronizar textos (comparar cidades sem erro de acento).
import { isMaster } from '../constants/permissions'; // Motor que verifica se o usuário tem nível administrativo.

// CORREÇÃO: Importando as ferramentas centralizadas do nosso canivete suíço.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; 

const HighlightCards = ({ todosEnsaios, ensaiosRegionais, reunioesData = [], aoVerMais, cidadeUsuario, user }) => { // 👈 AGORA RECEBE 'reunioesData' e 'user' do App.jsx.

  // DICIONÁRIO: Converte siglas em nomes amigáveis para exibição rápida.
  const DICIONARIO_DIAS = { "Dom": "Domingo", "Seg": "Segunda", "Ter": "Terça", "Qua": "Quarta", "Qui": "Quinta", "Sex": "Sexta", "Sáb": "Sábado" };

  // Função interna para exibir o dia da semana por extenso nos cards pequenos.
  const formatarDiaExtensoLocal = (textoDia) => {
    if (!textoDia) return ""; // Se não houver texto, não faz nada.
    const partes = textoDia.split(' '); // Separa o número da sigla.
    if (partes.length < 2) return textoDia; // Se estiver fora do padrão, retorna o original.
    const sigla = partes[1].replace('.', ''); // Limpa pontos da sigla.
    const diaExtenso = DICIONARIO_DIAS[sigla] || sigla; // Busca o nome completo.
    return `${partes[0]} ${diaExtenso}`; // Entrega o nome bonito.
  };

  // 🛡️ NOVA LÓGICA: Encontrar a Próxima Reunião Administrativa que ainda não aconteceu.
  const getProximaReuniaoValida = () => {
    if (!reunioesData || reunioesData.length === 0 || !user) return null; // Se não houver dados ou usuário, não mostra nada.
    
    // Pega a data de hoje no formato AAAAMMDD para comparar com o banco.
    const hoje = new Date();
    const hojeTS = Number(`${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`);
    
    return [...reunioesData]
      .filter(r => {
        // Se não for Master, só pode ver se a reunião não for restrita.
        const acessoPermitido = isMaster(user) ? true : !r.restrito;
        return acessoPermitido && (r.timestamp || 0) >= hojeTS; // Apenas reuniões de hoje para frente.
      })
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))[0]; // Pega a primeira da lista (a mais próxima).
  };

  // Lógica para encontrar o Próximo Regional que ainda vai acontecer na agenda 2026.
  const getProximoRegionalValido = () => {
    if (!ensaiosRegionais || ensaiosRegionais.length === 0) return null; // Se banco estiver vazio, para aqui.
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 };
    const agora = new Date(); // Momento atual.
    const mesAtualNum = agora.getMonth() + 1; // Mês em número.
    const diaAtualNum = agora.getDate(); // Dia em número.

    return [...ensaiosRegionais] 
      .filter(e => { // Remove eventos que já passaram da data de hoje.
        const mesEnsaioNum = ordemMeses[e.mes] || 0;
        return mesEnsaioNum > mesAtualNum || (mesEnsaioNum === mesAtualNum && Number(e.dia) >= diaAtualNum);
      })
      .sort((a, b) => { // Ordena para o mais próximo ficar no topo.
        const mesA = ordemMeses[a.mes] || 99;
        const mesB = ordemMeses[b.mes] || 99;
        if (mesA !== mesB) return mesA - mesB;
        return Number(a.dia) - Number(b.dia);
      })[0]; // Pega o primeiro da fila (o mais próximo).
  };

  // Lógica para o filtro de "Hoje".
  const hojeDate = new Date();
  const filtroHoje = `${Math.ceil(hojeDate.getDate() / 7)}${ (hojeDate.getDay() === 0 || hojeDate.getDay() === 6) ? "º" : "ª" } ${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][hojeDate.getDay()]}`;

  const proximaReuniao = getProximaReuniaoValida(); // Ativa a nova busca de Reunião.
  const proximoRegional = getProximoRegionalValido(); // Ativa a busca do regional de destaque.
  const ensaiosHoje = todosEnsaios.filter(e => e.dia.includes(filtroHoje)); // Filtra locais de hoje.
  const sugestoesVisiveis = ensaiosHoje.slice(0, 2); // Exibe apenas os 2 primeiros.

  return ( // Desenho da interface.
    <div className="w-full space-y-5 animate-in px-6 py-2">
      
      {/* 🚀 CARD NOVO: PRÓXIMA REUNIÃO ADM (Destaque Azul/Branco) */}
      {proximaReuniao && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <CalendarDays size={10} className="text-blue-500" />
            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Próxima Reunião Musical</h4>
          </div>
          <div className={`bg-white p-5 rounded-[2rem] border-l-4 ${proximaReuniao.cor || 'border-l-blue-600'} border shadow-sm relative overflow-hidden h-[120px]`}>
            <div className="flex flex-col justify-between h-full text-left">
              <div>
                <span className="text-blue-600 text-[8px] font-black uppercase tracking-widest leading-none">{proximaReuniao.rotulo}</span>
                <h4 className="text-slate-950 font-[900] text-xs uppercase italic leading-tight mt-1 pr-16">{proximaReuniao.titulo}</h4>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase"><Clock size={12} className="text-blue-500"/> {proximaReuniao.hora}</div>
                <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase"><MapPin size={12} className="text-blue-500"/> {proximaReuniao.local.split(' ')[0]}</div>
              </div>
            </div>
            <div className="absolute top-5 right-5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex flex-col items-center min-w-[50px] shadow-sm">
                <span className="text-slate-950 font-black text-sm leading-none">{proximaReuniao.dia}</span>
                <span className="text-slate-400 font-bold text-[7px] uppercase mt-1">{proximaReuniao.mes.substring(0, 3)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CARD: PRÓXIMO REGIONAL (Destaque Amber/Black) */}
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
                  <span className="text-[11px] font-black mt-0.5">{proximoRegional.mes.substring(0, 3)}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => compartilharEnsaio(proximoRegional, true)} className="p-2.5 rounded-xl bg-white/10 text-emerald-500 border border-white/5"><Share2 size={16} /></button>
                  <button onClick={() => abrirGoogleMaps(proximoRegional.local, proximoRegional.sede)} className="p-2.5 rounded-xl bg-white/10 text-amber-500 border border-white/5"><MapPin size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: ENSAIOS DE HOJE (Cards Brancos) */}
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
                        <button onClick={() => compartilharEnsaio(s, false)} className="p-2.5 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100"><Share2 size={16} /></button>
                        <button onClick={() => abrirGoogleMaps(s.localidade, s.cidade)} className="p-2.5 rounded-xl bg-slate-50 text-amber-600 border border-slate-100"><MapPin size={16} /></button>
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

export default HighlightCards; // Exporta os destaques com a nova inteligência de Reuniões Administrativas.