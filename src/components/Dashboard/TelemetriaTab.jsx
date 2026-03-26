import React, { useState, useEffect, useMemo } from 'react'; // Ferramentas para gerenciar dados e cálculos matemáticos.
import { db } from '../../firebaseConfig'; // Conexão oficial com o banco de dados da Regional.
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'; // Ferramentas para ouvir os registros em tempo real.
import { 
  Activity, Users, Calendar, Shield, ChevronLeft, ChevronRight, BarChart3, Trophy, MapPin, 
  Music, Phone, Info, BookOpen, LayoutGrid
} from 'lucide-react'; // Ícones para indicar tempo, pessoas, estatísticas e localização.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para fazer a troca dos gráficos de forma suave.
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, LabelList, Legend 
} from 'recharts'; // Ferramentas para desenhar os gráficos de linha, barras e rankings territoriais.

const TelemetriaTab = ({ user }) => { // Início do componente de inteligência da Regional.
  const [telemetria, setTelemetria] = useState([]); // Memória que guarda os registros de acesso (entradas no app).
  const [interacoes, setInteracoes] = useState([]); // Memória para os registros de cliques em botões e mapas.
  const [loading, setLoading] = useState(true); // Controla o aviso de "Carregando" na tela.
  const [slideAtivo, setSlideAtivo] = useState(0); // Controle do carrossel de Audiência (Superior).
  const [slideOrigemAtivo, setSlideOrigemAtivo] = useState(0); // Controle do carrossel de Origem (Geográfico).
  const [slidePopAtivo, setSlidePopAtivo] = useState(0); // Controle do carrossel de Popularidade (0 a 5 - Total de 6 módulos).

  const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; // Nomes curtos dos meses.
  const CORES_PALETA = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#64748b"]; // Cores para distinguir as cidades.

  useEffect(() => { // Sensor que monitora a abertura do aplicativo e os cliques simultaneamente.
    const qAcessos = query(collection(db, "telemetria_acessos"), orderBy("data", "desc"), limit(1000)); // Busca as últimas 1.000 entradas.
    const qInteracoes = query(collection(db, "telemetria_interacoes"), orderBy("data", "desc"), limit(1000)); // Busca os últimos 1.000 cliques.

    const unsubAcessos = onSnapshot(qAcessos, (snap) => { // Ouve entradas no app em tempo real.
      setTelemetria(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Salva na lista de audiência.
    });

    const unsubInteracoes = onSnapshot(qInteracoes, (snap) => { // Ouve cliques em botões em tempo real.
      setInteracoes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Salva na lista de interações.
      setLoading(false); // Libera a visão após carregar os dados.
    });

    return () => { unsubAcessos(); unsubInteracoes(); }; // Desliga os sensores ao sair.
  }, []); 

  // --- LÓGICA DE FILTRO TEMPORAL (7 DIAS) ---
  const periodoSeteDias = useMemo(() => { // Define o intervalo de tempo da última semana.
    const hoje = new Date();
    const lista = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(hoje.getDate() - i);
      lista.push({ dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear(), label: `${d.getDate()}/${d.getMonth() + 1}` });
    }
    return lista;
  }, []);

  // --- 1. DADOS DE AUDIÊNCIA ---
  const dadosAudiencia = useMemo(() => { // Prepara os dados de entrada.
    if (slideAtivo === 0) {
      return periodoSeteDias.map(p => {
        const qtd = telemetria.filter(t => t.dia === p.dia && t.mes === p.mes && t.ano === p.ano).length;
        return { name: p.label, qtd };
      });
    } else {
      const consolidado = Array(12).fill(0).map((_, i) => ({ name: MESES_NOMES[i], qtd: 0 }));
      telemetria.forEach(t => { if (t.mes >= 1 && t.mes <= 12) consolidado[t.mes - 1].qtd++; });
      return consolidado;
    }
  }, [telemetria, slideAtivo, periodoSeteDias]);

  // --- 2. DADOS DE ORIGEM (ACUMULADO POR CIDADE) ---
  const rankingOrigem7Dias = useMemo(() => { // Ranking de cidades da última semana.
    const contagem = {};
    const filtrados = telemetria.filter(t => periodoSeteDias.some(p => t.dia === p.dia && t.mes === p.mes));
    filtrados.forEach(t => {
      let cidade = t.usuarioCidade || t.cidadeDetectada || "PRIVADO";
      if (cidade.toUpperCase().includes("EXTERNO")) cidade = "VISITANTE";
      contagem[cidade.toUpperCase()] = (contagem[cidade.toUpperCase()] || 0) + 1;
    });
    return Object.entries(contagem).map(([name, qtd]) => ({ name, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 8);
  }, [telemetria, periodoSeteDias]);

  const dadosMensaisOrigem = useMemo(() => { // Agrupa acessos do ano por mês e por cidade.
    const cidadesSet = new Set();
    const dados = MESES_NOMES.map((mes, i) => {
      const registro = { name: mes };
      telemetria.forEach(t => {
        if (t.mes === i + 1) {
          let cidade = t.usuarioCidade || t.cidadeDetectada || "PRIVADO";
          if (cidade.toUpperCase().includes("EXTERNO")) cidade = "VISITANTE";
          cidade = cidade.toUpperCase();
          cidadesSet.add(cidade);
          registro[cidade] = (registro[cidade] || 0) + 1;
        }
      });
      return registro;
    });
    return { dados, cidades: Array.from(cidadesSet) };
  }, [telemetria]);

  // --- 3. DADOS DE POPULARIDADE (6 SLIDES) ---
  const dadosPódio = useMemo(() => { // Central de processamento dos 6 gráficos de pódio.
    const categorias = [
      { titulo: 'Visão Geral', cat: 'Navegação', icon: <LayoutGrid size={18}/>, color: 'bg-slate-950' },
      { titulo: 'Ensaios Locais', cat: 'GPS', icon: <MapPin size={18}/>, color: 'bg-blue-600' },
      { titulo: 'Ensaios Regionais', cat: 'Regionais', icon: <Music size={18}/>, color: 'bg-emerald-600' },
      { titulo: 'Contatos', cat: 'Comissão', icon: <Phone size={18}/>, color: 'bg-purple-600' },
      { titulo: 'Informações', cat: 'Informativos', icon: <Info size={18}/>, color: 'bg-amber-600' },
      { titulo: 'Cultos', cat: 'Cultos', icon: <BookOpen size={18}/>, color: 'bg-red-600' }
    ];

    const configAtual = categorias[slidePopAtivo];
    const contagem = {};
    // CORREÇÃO: Alterado de i.category para i.categoria conforme o log do banco
    const filtrados = interacoes.filter(i => 
      i.categoria === configAtual.cat && 
      periodoSeteDias.some(p => i.dia === p.dia && i.mes === p.mes)
    );

    filtrados.forEach(i => {
      const nome = i.rotulo || "Outros";
      contagem[nome] = (contagem[nome] || 0) + 1;
    });

    const ranking = Object.entries(contagem).map(([name, qtd]) => ({ name, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 10);
    return { ranking, ...configAtual };
  }, [interacoes, slidePopAtivo, periodoSeteDias]);

  const alternarSlidePop = (direcao) => { // Lógica para girar o carrossel.
    if (direcao === 'next') setSlidePopAtivo(prev => (prev === 5 ? 0 : prev + 1));
    else setSlidePopAtivo(prev => (prev === 0 ? 5 : prev - 1));
  };

  if (loading) return <div className="py-20 text-center animate-pulse flex flex-col items-center gap-4"><Activity className="text-slate-300" size={32} /><span className="font-black uppercase text-slate-300 text-[10px] tracking-widest">Sintonizando Radar...</span></div>;

  return ( 
    <div className="space-y-6 animate-in pb-24 text-left"> 
      
      {/* CARD 1: AUDIÊNCIA */}
      <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden border border-white/5"> 
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl">{slideAtivo === 0 ? <Calendar size={18} /> : <BarChart3 size={18} />}</div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400">{slideAtivo === 0 ? 'Fluxo Semanal' : 'Evolução Anual'}</h4>
              <p className="text-[10px] font-bold text-slate-500 italic">Entradas no App</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button onClick={() => setSlideAtivo(0)} className={`p-2 rounded-lg transition-all ${slideAtivo === 0 ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500'}`}><ChevronLeft size={16} /></button>
            <button onClick={() => setSlideAtivo(1)} className={`p-2 rounded-lg transition-all ${slideAtivo === 1 ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500'}`}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {slideAtivo === 0 ? (
              <LineChart data={dadosAudiencia} margin={{ top: 25, right: 20, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} /> 
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="qtd" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#020617' }}>
                  <LabelList dataKey="qtd" position="top" style={{ fill: '#fff', fontSize: '10px', fontWeight: '900' }} offset={12} />
                </Line>
              </LineChart>
            ) : (
              <BarChart data={dadosAudiencia} margin={{ top: 25, right: 20, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} hide domain={[0, 'dataMax + 50']} />
                <Bar dataKey="qtd" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="qtd" position="top" style={{ fill: '#fff', fontSize: '9px', fontWeight: '900' }} offset={10} />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARD 2: ORIGEM - AGORA COM ACUMULADO POR CIDADES (BARRAS EMPILHADAS) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 text-white rounded-2xl"><MapPin size={18} /></div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-950">{slideOrigemAtivo === 0 ? 'Cidades Ativas' : 'Acessos por Cidade'}</h4>
              <p className="text-[10px] font-bold text-slate-400 italic">{slideOrigemAtivo === 0 ? 'Ranking Semanal' : 'Histórico Mensal'}</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl">
            <button onClick={() => setSlideOrigemAtivo(0)} className={`p-2 rounded-lg ${slideOrigemAtivo === 0 ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-400'}`}><ChevronLeft size={14} /></button>
            <button onClick={() => setSlideOrigemAtivo(1)} className={`p-2 rounded-lg ${slideOrigemAtivo === 1 ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-400'}`}><ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {slideOrigemAtivo === 0 ? (
              <BarChart data={rankingOrigem7Dias} layout="vertical" margin={{ top: 5, right: 45, left: 10, bottom: 5 }}>
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: '900', fill: '#64748b' }} width={80} />
                <XAxis type="number" hide domain={[0, 'dataMax + 5']} />
                <Bar dataKey="qtd" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={12}>
                  <LabelList dataKey="qtd" position="right" style={{ fill: '#1e293b', fontSize: '9px', fontWeight: '900' }} offset={12} />
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={dadosMensaisOrigem.dados} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '15px' }} />
                {dadosMensaisOrigem.cidades.map((cidade, idx) => (
                  <Bar key={cidade} dataKey={cidade} stackId="a" fill={CORES_PALETA[idx % CORES_PALETA.length]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARD 3: PÓDIO DE INTERESSE - CORREÇÃO DE CHAVE "CATEGORIA" */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${dadosPódio.color} text-white rounded-2xl shadow-lg`}>{dadosPódio.icon}</div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-950">{dadosPódio.titulo}</h4>
              <p className="text-[10px] font-bold text-slate-400 italic">Ranking Semanal</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl">
            <button onClick={() => alternarSlidePop('prev')} className="p-2 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
            <div className="flex items-center px-2 gap-1">
              {[0,1,2,3,4,5].map(i => <div key={i} className={`w-1 h-1 rounded-full ${slidePopAtivo === i ? 'bg-slate-950 w-3' : 'bg-slate-200'} transition-all`}/>)}
            </div>
            <button onClick={() => alternarSlidePop('next')} className="p-2 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="h-[380px] w-full relative">
          <AnimatePresence mode="wait">
            <motion.div key={slidePopAtivo} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                {dadosPódio.ranking.length > 0 ? (
                  <BarChart data={dadosPódio.ranking} layout="vertical" margin={{ top: 5, right: 55, left: 30, bottom: 5 }}>
                    <XAxis type="number" hide domain={[0, 'dataMax + 5']} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: '900', fill: '#0f172a' }} width={100} />
                    <Bar dataKey="qtd" fill="#0f172a" radius={[0, 6, 6, 0]} barSize={18}>
                      <LabelList dataKey="qtd" position="right" style={{ fill: '#0f172a', fontSize: '10px', fontWeight: '900' }} offset={15} />
                    </Bar>
                  </BarChart>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300 opacity-50">
                    <Trophy size={48} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sem registros nesta categoria</span>
                  </div>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER DE STATUS */}
      <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200 flex items-center justify-between mx-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Radar Online • 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={12} className="text-slate-400" />
          <span className="text-[10px] font-[900] text-slate-950 italic">{telemetria.length} SESSÕES</span>
        </div>
      </div>
    </div> 
  );
};

export default TelemetriaTab; // Exporta o radar afinado com histórico territorial e correção de chaves de busca.