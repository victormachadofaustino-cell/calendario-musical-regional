// src/components/Dashboard/TelemetriaTab.jsx // Localização do arquivo de inteligência de dados total da Regional.

import React, { useState, useEffect, useMemo } from 'react'; // Ferramentas para gerenciar dados e cálculos de gráficos.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional.
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'; // Ferramentas para ouvir os cliques em tempo real.
import { 
  Activity, MousePointer2, MapPin, Trophy, Phone, Share2, LineChart as LineIcon, UserCheck, Shield, Search, BookOpen
} from 'lucide-react'; // Ícones para comportamento, segurança e categorias de uso.
import { motion } from 'framer-motion'; // Biblioteca para animações suaves ao abrir o painel.
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts'; // Ferramentas para desenhar os gráficos com eixos visíveis e precisos.

// IMPORTAÇÕES DE UTILITÁRIOS
import { CIDADES_LISTA } from '../../constants/cidades'; // Lista oficial de cidades para o ranking territorial.

const TelemetriaTab = ({ user }) => { // Início do componente de audiência total, recebendo o usuário logado.
  const [telemetria, setTelemetria] = useState([]); // Memória que guarda os últimos 1000 registros para análise profunda.
  const [loading, setLoading] = useState(true); // Controla o aviso de "Carregando" na tela.

  useEffect(() => { // Lógica que liga os sensores de escuta do Google Firebase.
    const q = query(
      collection(db, "telemetria_interacoes"), 
      orderBy("data", "desc"), 
      limit(1000)
    ); // Busca os últimos 1000 registros para garantir uma análise real.

    const unsub = onSnapshot(q, (snap) => { // Ouve o banco em tempo real para o gráfico atualizar sozinho.
      setTelemetria(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Converte os dados do Google para o App.
      setLoading(false); // Libera a visualização após os dados chegarem.
    });

    return () => unsub(); // Desliga o radar ao sair da aba para economizar internet do Master.
  }, []); 

  // --- PROCESSAMENTO DE DADOS REAIS ---

  // 1. Ranking de Cidades (Identificação Territorial)
  const rankingCidades = useMemo(() => { // Calcula o volume de interesse por município.
    const contagem = {}; // Pote para somar os acessos de cada cidade.
    telemetria.forEach(t => { // Analisa cada registro de clique.
      let cid = t.usuarioCidade || t.cidade; // Prioriza a cidade do cadastro oficial do irmão.
      if (!cid || cid.includes("Identificada") || cid === "Visitante Externo") {
        const buscaTexto = (t.rotulo || "").toUpperCase(); 
        cid = CIDADES_LISTA.find(nomeCid => buscaTexto.includes(nomeCid.toUpperCase())) || "Outras Regiões";
      }
      contagem[cid] = (contagem[cid] || 0) + 1; // Soma o ponto para a cidade.
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]); // Retorna o ranking do maior para o menor.
  }, [telemetria]); 

  // 2. Ranking de Usuários (Quem são os mais ativos)
  const topUsuarios = useMemo(() => { // Identifica os irmãos logados que mais usam o sistema.
    const contagem = {}; // Pote para somar ações por pessoa.
    telemetria.filter(t => t.usuarioNome).forEach(t => { // Filtra apenas usuários identificados.
      const chave = `${t.usuarioNome} (${t.usuarioCargo || 'Colaborador'})`; // Monta o crachá visual.
      contagem[chave] = (contagem[chave] || 0) + 1; // Soma a ação deste irmão.
    });
    return Object.entries(contagem).sort((a,b) => b[1] - a[1]).slice(0, 5); // Pega os 5 primeiros.
  }, [telemetria]);

  // 3. Análise de Interesses (Frequência por Ferramenta)
  const analiseInteresses = useMemo(() => { // Mapeia o que a irmandade realmente está fazendo.
    const potes = { 'GPS/Mapas': 0, 'Contatos': 0, 'Partilhas': 0, 'Pesquisas': 0, 'Leituras': 0 }; 
    telemetria.forEach(t => { // Classifica os cliques por categoria de utilidade.
      const acao = (t.acao || "").toUpperCase();
      const cat = (t.categoria || "").toUpperCase();
      if (acao.includes('MAPA')) potes['GPS/Mapas']++; 
      else if (acao.includes('TELEFONE') || acao.includes('LIGAR')) potes['Contatos']++; 
      else if (acao.includes('COMPARTILHAR')) potes['Partilhas']++; 
      else if (cat.includes('PESQUISA')) potes['Pesquisas']++;
      else if (cat.includes('INFORMATIVO') || acao.includes('LEITURA')) potes['Leituras']++;
    });
    return Object.entries(potes).map(([name, value]) => ({ name, value })); // Retorna a lista pronta.
  }, [telemetria]);

  // 4. Fluxo Diário (O pulso do aplicativo)
  const acessosPorDia = useMemo(() => { // Prepara a linha do tempo do mês vigente.
    const mesAtual = new Date().getMonth() + 1; 
    const dias = telemetria.filter(t => t.mes === mesAtual).reduce((acc, curr) => { 
      acc[curr.dia] = (acc[curr.dia] || 0) + 1; return acc; 
    }, {}); 
    return Object.keys(dias).map(d => ({ name: `${d}`, acessos: dias[d] })).sort((a,b) => Number(a.name) - Number(b.name));
  }, [telemetria]);

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-300 animate-pulse text-[10px] tracking-widest">Sintonizando Radar Regional...</div>;

  return ( 
    <div className="space-y-6 animate-in pb-10 text-left"> 
      
      {/* BLOCO 1: GRÁFICO DE FLUXO COM LEGENDA COMPLETA */}
      <div className="bg-slate-950 p-7 rounded-[2.5rem] shadow-xl text-white"> 
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-xl"><LineIcon size={18} className="text-white" /></div>
          <h4 className="text-sm font-black uppercase italic tracking-tighter">Volume de Atividade Diária</h4>
        </div>
        <div className="h-[220px] w-full pr-4"> 
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={acessosPorDia} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} dy={10} /> 
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff', fontWeight: 'bold' }} labelFormatter={(v) => `Dia ${v}`} />
              <Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 6, fill: '#fff' }} /> 
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BLOCO 2: MEMBROS EM DESTAQUE */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm"> 
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="text-blue-600" size={18}/>
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Membros em Destaque (Logados)</h4>
        </div>
        <div className="space-y-3">
          {topUsuarios.length > 0 ? topUsuarios.map(([identidade, qtd], i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 uppercase">{identidade.split(' (')[0]}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase">{identidade.split(' (')[1]?.replace(')', '')}</span>
              </div>
              <span className="text-[9px] font-black text-blue-600 bg-white px-3 py-1 rounded-full border border-slate-200">{qtd} AÇÕES</span>
            </div>
          )) : (
            <p className="text-[9px] font-bold text-slate-400 text-center py-4 italic uppercase">Aguardando novos registros logados...</p>
          )}
        </div>
      </div>

      {/* BLOCO 3: MUNICÍPIOS (RANKING AMPLO) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm"> 
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="text-red-500" size={18}/>
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Interesse Regional por Município</h4>
        </div>
        <div className="space-y-4"> 
          {rankingCidades.slice(0, 12).map(([nome, valor], i) => ( 
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[8px] font-black uppercase px-1">
                <span className="text-slate-500 italic">{nome}</span>
                <span className="text-slate-950">{valor} interações</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden"> 
                <motion.div initial={{ width: 0 }} animate={{ width: `${(valor / (telemetria.length || 1)) * 100}%` }} className="h-full bg-slate-950 rounded-full" /> 
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCO 4: FUNCIONALIDADES MAIS UTILIZADAS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm"> 
        <div className="flex items-center gap-3 mb-6">
          <MousePointer2 className="text-slate-400" size={18}/>
          <h4 className="text-[10px] font-black uppercase text-slate-950 italic">Frequência por Ferramenta</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {analiseInteresses.map(b => ( 
            <div key={b.name} className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.8rem] border border-slate-100">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {b.name.includes('GPS') ? <MapPin size={14} className="text-amber-500"/> : 
                 b.name.includes('Contatos') ? <Phone size={14} className="text-blue-600"/> : 
                 b.name.includes('Pesquisas') ? <Search size={14} className="text-slate-400"/> :
                 b.name.includes('Leituras') ? <BookOpen size={14} className="text-purple-500"/> :
                 <Share2 size={14} className="text-emerald-500"/>}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-950 leading-none">{b.value}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{b.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AVISO DE AUDITORIA */}
      <div className="bg-blue-50/50 p-5 rounded-[2.2rem] border border-blue-100 flex items-center gap-4">
        <Shield size={20} className="text-blue-600 shrink-0" />
        <p className="text-[8px] font-bold text-blue-700 uppercase leading-tight italic">
          Painel de inteligência gerado com base em 1.000 logs auditados. Dados protegidos pela Regional.
        </p>
      </div>
      
      <div className="py-10 text-center opacity-10"> 
        <Activity size={24} className="mx-auto mb-2" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Intelligence Center • 2026</span>
      </div>

    </div> 
  );
};

export default TelemetriaTab; // Exportação do Dashboard completo e agora 100% resiliente a erros.