import React, { useState, useMemo } from 'react'; // Ferramenta fundamental para gerenciar o funcionamento e a memória da tela.
import { createPortal } from 'react-dom'; // Permite criar janelas flutuantes que aparecem por cima de tudo no aplicativo.
import { Calendar, Clock, MapPin, Star, ChevronRight, Navigation, User, BarChart3, MessageCircle, Share2 } from 'lucide-react'; // Biblioteca de ícones para data, hora, GPS e ações.

// Importação das constantes e funções de precisão geográfica
import { buscarCoordenadas, normalizarTexto } from '../constants/comuns'; // Funções para padronizar textos e localizar endereços no mapa.

const Summary = ({ todosEnsaios, ensaiosRegionais, aoVerMais, aoAbrirDashboard, cidadeUsuario, user, pendenciasCount }) => { // Início do componente que monta o resumo da tela inicial.
  const [mapaSeletor, setMapaSeletor] = useState(null); // Estado para controlar janelas de mapas ou seletor de trajetos.

  // DICIONÁRIO DE TRADUÇÃO: Converte as siglas vindas do banco de dados para nomes completos amigáveis (Ex: Sex -> Sexta).
  const DICIONARIO_DIAS = {
    "Dom": "Domingo",
    "Seg": "Segunda",
    "Ter": "Terça",
    "Qua": "Quarta",
    "Qui": "Quinta",
    "Sex": "Sexta",
    "Sáb": "Sábado"
  };

  // Função interna para formatar o dia da semana por extenso (Transforma siglas em nomes amigáveis).
  const formatarDiaExtenso = (textoDia) => {
    if (!textoDia) return ""; // Caso não haja texto, retorna vazio para não quebrar o código.
    const partes = textoDia.split(' '); // Separa, por exemplo, "2ª" de "Sex".
    if (partes.length < 2) return textoDia; // Se o texto não estiver no formato esperado, retorna como está.
    const sigla = partes[1].replace('.', ''); // Pega a sigla (ex: "Sex") e limpa possíveis pontos.
    const diaExtenso = DICIONARIO_DIAS[sigla] || sigla; // Busca o nome completo no dicionário acima.
    return `${partes[0]} ${diaExtenso}`; // Remonta o texto final (Ex: "2ª Sexta-feira").
  };

  // 1. Lógica para identificar a Ocorrência da Semana (1ª a Últ)
  const getFiltroPrecisoHoje = () => { // Função que descobre se hoje é o 1º Domingo, 2ª Segunda, etc.
    const hoje = new Date(); // Pega a data atual do sistema.
    const diaMes = hoje.getDate(); // Pega o número do dia (ex: 22).
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Lista de siglas para cálculo.
    const diaSemana = dias[hoje.getDay()]; // Identifica a sigla do dia de hoje.
    const numeroSemana = Math.ceil(diaMes / 7); // Faz o cálculo para saber qual semana do mês estamos.
    
    const isFimDeSemana = diaSemana === "Dom" || diaSemana === "Sáb"; // Verifica se é sábado ou domingo para ajustar o símbolo (º ou ª).
    const sufixo = isFimDeSemana ? "º" : "ª"; // Define a concordância gramatical do número.
    
    const semanaTexto = numeroSemana >= 5 ? "Últ." : `${numeroSemana}${sufixo}`; // Se for a quinta semana, chama de "Última".
    return `${semanaTexto} ${diaSemana}`; // Retorna o filtro pronto para ser usado na busca do banco.
  };

  const filtroPrecisoHoje = getFiltroPrecisoHoje(); // Ativa a função de identificação do dia de hoje.
  
  // 2. Lógica para identificar o PRÓXIMO regional válido
  const getProximoRegionalValido = () => { // Função que encontra na agenda o evento regional mais próximo que ainda vai acontecer.
    if (!ensaiosRegionais || ensaiosRegionais.length === 0) return null; // Se não houver dados, retorna vazio.
    const ordemMeses = { "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12 }; // Ordem cronológica.
    const agora = new Date(); // Pega o momento atual.
    const mesAtualNum = agora.getMonth() + 1; // Pega o mês atual em número.
    const diaAtualNum = agora.getDate(); // Pega o dia atual em número.

    return [...ensaiosRegionais] // Pega a lista de regionais do banco.
      .filter(e => { // Filtra para remover os eventos que já passaram da data atual.
        const mesEnsaioNum = ordemMeses[e.mes] || 0;
        return mesEnsaioNum > mesAtualNum || (mesEnsaioNum === mesAtualNum && Number(e.dia) >= diaAtualNum);
      })
      .sort((a, b) => { // Organiza do evento mais próximo para o mais distante.
        const mesA = ordemMeses[a.mes] || 99;
        const mesB = ordemMeses[b.mes] || 99;
        if (mesA !== mesB) return mesA - mesB;
        return Number(a.dia) - Number(b.dia);
      })[0]; // Seleciona apenas o primeiro item (o próximo evento da agenda).
  };

  const ensaiosHoje = todosEnsaios.filter(e => e.dia.includes(filtroPrecisoHoje)); // Filtra os ensaios locais marcados para exatamente hoje.
  const sugestoesVisiveis = ensaiosHoje.slice(0, 2); // Pega apenas os 2 primeiros resultados para exibir no resumo.
  const totalRestante = ensaiosHoje.length - 2; // Calcula quantos ensaios ficaram ocultos no resumo.
  const proximoRegional = getProximoRegionalValido(); // Guarda o regional que será o destaque do topo.

  const abrirGoogleMaps = (localidade, cidade) => { // Prepara e dispara o GPS do celular para a localidade.
    const coords = buscarCoordenadas(cidade, localidade); // Busca a latitude e longitude precisas.
    const destino = coords ? `${coords.lat},${coords.lon}` : encodeURIComponent(`CCB ${localidade} ${cidade}`); // Define o destino final.
    window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank'); // Abre o navegador ou app de mapas com o trajeto.
  };

  const compartilharEnsaio = async (e, isRegional = false) => { // Função para mandar o convite formatado por WhatsApp ou outros apps.
    const texto = isRegional // Formata a mensagem de acordo com o tipo de evento.
      ? `*CCB Regional Jundiaí - Ensaio Regional*\n📍 Sede: ${e.sede} (${e.local})\n📅 Data: ${e.dia}/${e.mes} às ${e.hora}\n🗓️ ${formatarDiaExtenso(e.weekday)}`
      : `*CCB Regional Jundiaí - Ensaio Local*\n📍 Igreja: ${e.localidade} (${e.cidade})\n🗓️ Data: ${formatarDiaExtenso(e.dia)} às ${e.hora}\n👤 Encarregado: ${e.encarregado || 'N/I'}`;

    if (navigator.share) { // Tenta usar a janelinha oficial de compartilhamento do sistema operacional.
      try { await navigator.share({ title: 'Convite Ensaio CCB', text: texto }); } catch (err) { console.log("Erro ao compartilhar", err); }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank'); // Fallback para abrir o WhatsApp diretamente.
    }
  };

  return ( // Início da renderização visual que o irmão verá na tela.
    <div className="w-full space-y-5 animate-in px-6 py-2 text-left">
      
      {/* CARD DE BOAS-VINDAS */}
      {user && ( // Exibe o perfil do colaborador logado com nome, cargo e cidade.
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
            {pendenciasCount > 0 && user?.nivel === 'master' && ( // Mostra alerta visual se houver trabalho para o administrador.
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      {/* CARD PRÓXIMO REGIONAL - ORGANIZAÇÃO DE ÍCONES E SELO (ANEXO NOVO) */}
      {proximoRegional && ( // Exibe o destaque do próximo evento da agenda regional.
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Star size={10} className="text-amber-500 fill-amber-500" />
            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Próximo Regional</h4>
          </div>
          <div className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-xl transition-all h-[140px]">
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col text-left pr-24">
                <h4 className="text-white font-[900] text-sm uppercase italic leading-tight tracking-tight">{proximoRegional.sede}</h4>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{proximoRegional.local}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white font-black text-xl uppercase italic">
                <Clock size={16} className="text-amber-500" /> {proximoRegional.hora}
              </div>
            </div>
            
            {/* BLOCO LATERAL AGRUPADO: Data em cima, botões logo abaixo (Anexo) */}
            <div className="absolute top-4 right-5 bottom-4 flex flex-col items-end justify-between">
               <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl uppercase shadow-sm italic text-center min-w-[65px] flex flex-col items-center justify-center leading-none">
                  <span className="text-base font-[900]">{proximoRegional.dia}</span>
                  <span className="text-[11px] font-black mt-0.5">{proximoRegional.mes.substring(0, 3)}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => compartilharEnsaio(proximoRegional, true)} className="p-2.5 rounded-xl active:scale-90 bg-white/10 text-emerald-500 border border-white/5 shadow-sm">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => abrirGoogleMaps(proximoRegional.local, proximoRegional.sede)} className="p-2.5 rounded-xl active:scale-90 bg-white/10 text-amber-500 border border-white/5 shadow-sm">
                    <MapPin size={16} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ENSAIOS DE HOJE - ORGANIZAÇÃO DE ÍCONES E SELO (ANEXO NOVO) */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Hoje • {formatarDiaExtenso(filtroPrecisoHoje)}</h4>
          {ensaiosHoje.length > 0 && (
            <button onClick={() => aoVerMais(filtroPrecisoHoje)} className="text-slate-950 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-full active:scale-95 shadow-sm">
              {totalRestante > 0 ? `+${totalRestante}` : `Ver Tudo`} <ChevronRight size={12} className="inline ml-1" />
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
                <div key={s.id} className={`bg-white p-5 rounded-[2rem] border relative overflow-hidden shadow-sm transition-all h-[140px] ${isDaMinhaCidade ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col text-left pr-24">
                      <h4 className="text-slate-950 font-[900] text-base uppercase italic leading-tight tracking-tight">{s.localidade}</h4>
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                        {s.cidade} • {formatarDiaExtenso(s.dia)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-950 font-black text-lg uppercase italic">
                      <Clock size={14} className="text-amber-500" /> {s.hora}
                    </div>
                  </div>

                  {/* BLOCO LATERAL AGRUPADO: Dia da semana em cima, botões abaixo (Anexo) */}
                  <div className="absolute top-4 right-5 bottom-4 flex flex-col items-end justify-between">
                     <div className="bg-slate-950 text-white text-[10px] font-black px-3 py-2 rounded-lg uppercase shadow-sm border border-slate-800">
                        {DICIONARIO_DIAS[s.dia.split(' ')[1]] || s.dia.split(' ')[1]}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => compartilharEnsaio(s, false)} className={`p-2.5 rounded-xl active:scale-90 shadow-sm border ${isDaMinhaCidade ? 'bg-amber-100 text-emerald-600 border-amber-200' : 'bg-slate-50 text-emerald-600 border-slate-100'}`}>
                          <Share2 size={16} />
                        </button>
                        <button onClick={() => abrirGoogleMaps(s.localidade, s.cidade)} className={`p-2.5 rounded-xl active:scale-90 shadow-sm border ${isDaMinhaCidade ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          <MapPin size={16} />
                        </button>
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

export default Summary; // Exporta o componente com a lateral organizada e respiro nas margens.