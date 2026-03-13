import React, { useState, useEffect, useMemo } from 'react'; // Ferramentas base do React para gerenciar o estado da tela e cálculos.
import { db } from '../firebaseConfig'; // Conexão oficial com o seu banco de dados no Google Firebase.
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'; // Ferramentas para ler dados em tempo real com limites de segurança.
import { 
  MapPin, TrendingUp, UserCheck, ShieldCheck, 
  Activity, AlertTriangle, LineChart as LineIcon,
  ArrowRight, ChevronRight, BarChart3, Info, Trophy, Users, X
} from 'lucide-react'; // Biblioteca correta de ícones para a interface visual.
import { createPortal } from 'react-dom'; // Permite que janelas de detalhes flutuem sobre a tela principal.
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para criar animações suaves na troca de gráficos.
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend 
} from 'recharts'; // Ferramenta estatística para desenhar os gráficos de desempenho.

// IMPORTAÇÕES DE CONSTANTES E MOTOR DE PERMISSÕES
import { normalizarTexto } from '../constants/comuns'; // Função que remove acentos e padroniza nomes para busca.
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de cidades da Regional Jundiaí.
import { isMaster, temAcessoAoDashboard } from '../constants/permissions'; // Regras de quem pode acessar esta tela.

const Dashboard = ({ todosEnsaios, ensaiosRegionais, examinadoras, encarregados, user }) => { // Início do componente de análise.
  const masterLogado = isMaster(user); // Verifica se o usuário tem nível administrativo total (Secretário Regional).
  
  // Define se o usuário começa vendo a regional inteira ou apenas sua cidade de cadastro.
  const [cidadeSelecionada, setCidadeSelecionada] = useState(masterLogado ? 'REGIONAL' : user?.cidade); 
  
  const [detalheModal, setDetalheModal] = useState(null); // Guarda os dados para mostrar quando o usuário clica em uma barra do gráfico.
  const [semanaFiltro, setSemanaFiltro] = useState('Todas'); // Filtro opcional para analisar semanas específicas.
  const [showSaudeInfo, setShowSaudeInfo] = useState(false); // Controla a janelinha que explica a "Saúde dos Dados".
  
  const [indexEnsaios, setIndexEnsaios] = useState(0); // Controla a alternância entre ensaios Locais e Regionais.
  const [indexComissao, setIndexComissao] = useState(0); // Controla a alternância entre Encarregados e Examinadoras.
  const [indexGraficoRegional, setIndexGraficoRegional] = useState(0); // Controla a visão mensal ou por sede.
  const [historicoAlteracoes, setHistoricoAlteracoes] = useState([]); // Lista das últimas aprovações feitas.
  const [telemetria, setTelemetria] = useState([]); // Estatísticas de quantos irmãos abriram o App.

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]; // Calendário de referência.
  const CORES_PALETA = ["#0F172A", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#64748B", "#F43F5E", "#82ca9d", "#ffc658"]; // Paleta de cores oficial.

  // --- 1. LISTENERS DE DADOS REAIS (SÓ PARA LIDERANÇA AUTORIZADA) ---
  useEffect(() => { // Lógica que busca dados analíticos extras no banco de dados.
    if (!temAcessoAoDashboard(user)) return; // Se não for um cargo autorizado, o banco nem é consultado.
    
    const unsubAlt = onSnapshot( // Ouve o histórico de quem está trabalhando na manutenção do App.
      query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(100)),
      (snap) => setHistoricoAlteracoes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.log("Acesso restrito.")
    );

    const unsubTele = onSnapshot( // Ouve os registros de acessos diários para o gráfico de fluxo.
      collection(db, "telemetria_acessos"), 
      (snap) => setTelemetria(snap.docs.map(d => d.data())),
      (err) => console.log("Acesso restrito.")
    );

    return () => { unsubAlt(); unsubTele(); }; // Desliga as consultas ao sair da tela para economizar dados.
  }, [user]); // Reinicia se o usuário mudar.

  // --- 2. PROCESSAMENTO ANALÍTICO (CÁLCULOS AUTOMATIZADOS) ---
  const dadosFiltrados = useMemo(() => { // Filtra as listas com base na cidade selecionada pelo usuário.
    const escopoRegional = cidadeSelecionada === 'REGIONAL'; // Define se a visão é ampla ou local.
    const cidadeAlvo = normalizarTexto(cidadeSelecionada); // Limpa o nome da cidade para evitar erros.
    let locais = todosEnsaios.filter(e => escopoRegional || normalizarTexto(e.cidade) === cidadeAlvo); // Filtra os ensaios.
    if (semanaFiltro !== 'Todas') locais = locais.filter(e => e.dia.includes(semanaFiltro)); // Aplica filtro de semana.
    return {
      locais,
      regionais: ensaiosRegionais.filter(e => escopoRegional || normalizarTexto(e.sede) === cidadeAlvo), // Regionais.
      examinadoras: examinadoras.filter(e => escopoRegional || normalizarTexto(e.city) === cidadeAlvo), // Examinadoras.
      encarregados: encarregados.filter(e => escopoRegional || normalizarTexto(e.city) === cidadeAlvo) // Encarregados.
    };
  }, [todosEnsaios, ensaiosRegionais, examinadoras, encarregados, cidadeSelecionada, semanaFiltro]); // Recalcula apenas se algo mudar.

  const totalEncarregadosLocais = useMemo(() => { // Conta quantos encarregados únicos cuidam das orquestras.
    const listaNomes = dadosFiltrados.locais
      .map(e => e.encarregado)
      .filter(n => n && n !== "-" && n !== "N/I"); // Ignora nomes padrão ou vazios.
    return new Set(listaNomes).size; // Retorna o número total sem nomes repetidos.
  }, [dadosFiltrados.locais]);

  const dadosGraficoRegionais = useMemo(() => { // Prepara as informações para o gráfico de barras dos regionais.
    return MESES.map(mes => {
      const regionaisNoMes = dadosFiltrados.regionais.filter(e => e.mes === mes); // Separa eventos por mês.
      const row = { name: mes.substring(0, 3), total: regionaisNoMes.length }; // Define a base da barra.
      const cidadesParaLegenda = masterLogado ? CIDADES_LISTA : [user?.cidade]; // Decide quem aparece na legenda.
      cidadesParaLegenda.forEach(cidade => {
        const qtd = regionaisNoMes.filter(e => normalizarTexto(e.sede) === normalizarTexto(cidade)).length;
        if (qtd > 0) row[cidade] = qtd; // Soma eventos de cada cidade.
      });
      return row;
    });
  }, [dadosFiltrados.regionais, masterLogado, user]);

  const stats = useMemo(() => { // Calcula a % de "Saúde" do App (campos preenchidos vs vazios).
    const escopoRegional = cidadeSelecionada === 'REGIONAL';
    const listaCidades = escopoRegional ? CIDADES_LISTA : [cidadeSelecionada];
    const pendencias = listaCidades.map(c => { // Varre as cidades buscando endereços ou nomes faltando.
      const itens = todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c) && (!e.encarregado || e.encarregado === "-" || !e.contato || e.contato === "-"));
      return { cidade: c, qtd: itens.length, itens };
    }).filter(p => p.qtd > 0).sort((a,b) => b.qtd - a.qtd); // Coloca quem tem mais erro no topo.
    const totalNoEscopo = todosEnsaios.filter(e => escopoRegional || normalizarTexto(e.cidade) === normalizarTexto(cidadeSelecionada)).length;
    return { pendencias, saudeTotal: totalNoEscopo > 0 ? Math.round(((totalNoEscopo - pendencias.reduce((acc, curr) => acc + curr.qtd, 0)) / totalNoEscopo) * 100) : 100 }; // Retorna a nota final de 0 a 100.
  }, [todosEnsaios, cidadeSelecionada]);

  const matrizes = useMemo(() => { // Cria as tabelas de cruzamento entre Cidades e Dias/Horários.
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horas = [...Array.from(new Set(dadosFiltrados.locais.map(e => e.hora).filter(h => h && h !== "-"))).sort(), "-"];
    let linhas = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : Array.from(new Set(dadosFiltrados.locais.map(e => e.localidade))).sort();

    const gerarGrade = (tipo) => { // Monta a lógica de contagem para cada célula da tabela.
      const colunasBase = tipo === 'dia' ? dias : horas;
      const grade = linhas.map(linha => {
        const itensDaLinha = dadosFiltrados.locais.filter(e => (cidadeSelecionada === 'REGIONAL' ? normalizarTexto(e.cidade) === normalizarTexto(linha) : e.localidade === linha));
        const colunas = colunasBase.map(col => ({
          label: col, 
          qtd: itensDaLinha.filter(e => tipo === 'dia' ? e.dia.includes(col) : (e.hora === col || (!e.hora && col === "-"))).length,
          itens: itensDaLinha.filter(e => tipo === 'dia' ? e.dia.includes(col) : (e.hora === col || (!e.hora && col === "-")))
        }));
        return { nome: linha, colunas, totalLinha: colunas.reduce((acc, curr) => acc + curr.qtd, 0), totalLinhaItens: colunas.flatMap(c => c.itens) };
      });
      const totalizadoresColunas = colunasBase.map((col, idx) => ({
        label: col,
        qtd: grade.reduce((acc, curr) => acc + curr.colunas[idx].qtd, 0),
        itens: grade.flatMap(g => g.colunas[idx].itens)
      }));
      return { grade, totalizadoresColunas, totalGeral: totalizadoresColunas.reduce((acc, curr) => acc + curr.qtd, 0), totalGeralItens: totalizadoresColunas.flatMap(t => t.itens) };
    };
    return { mDia: gerarGrade('dia'), mHora: gerarGrade('hora'), dias, horas };
  }, [dadosFiltrados.locais, cidadeSelecionada]);

  const maxEnsaios = useMemo(() => { // Calcula a escala para que as barras do gráfico não estourem a tela.
    const escopo = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada];
    const valores = escopo.map(c => indexEnsaios === 0 ? todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).length : ensaiosRegionais.filter(e => normalizarTexto(e.sede) === normalizarTexto(c)).length);
    return Math.max(...valores, 1);
  }, [todosEnsaios, ensaiosRegionais, indexEnsaios, cidadeSelecionada]);

  const maxComissao = useMemo(() => { // Calcula a escala para o gráfico de pessoas da comissão.
    const escopo = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada];
    const valores = escopo.map(c => {
        if(indexComissao === 0) return encarregados.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length;
        if(indexComissao === 1) {
            const nomes = todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).map(e => e.encarregado).filter(n => n && n !== "-" && n !== "N/I");
            return new Set(nomes).size;
        }
        return examinadoras.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length;
    });
    return Math.max(...valores, 1);
  }, [encarregados, examinadoras, todosEnsaios, indexComissao, cidadeSelecionada]);

  const analiseUsoData = useMemo(() => { // Organiza o gráfico de acessos diários para a liderança analisar o tráfego.
    const filtrado = telemetria.filter(t => cidadeSelecionada === 'REGIONAL' || normalizarTexto(t.cidade) === normalizarTexto(cidadeSelecionada));
    const mesAtual = new Date().getMonth() + 1;
    const porDia = filtrado.filter(d => d.mes === mesAtual).reduce((acc, curr) => { acc[curr.dia] = (acc[curr.dia] || 0) + 1; return acc; }, {});
    return { chartLinha: Object.keys(porDia).map(dia => ({ name: `Dia ${dia}`, acessos: porDia[dia] })) };
  }, [telemetria, cidadeSelecionada]);

  const rankingAtividade = useMemo(() => { // Ranking de contribuição: Quem mais colabora com as correções no App.
    const usuarios = {};
    const base = masterLogado ? historicoAlteracoes : historicoAlteracoes.filter(h => normalizarTexto(h.cidade) === normalizarTexto(user?.cidade));
    base.forEach(log => {
      usuarios[log.solicitanteNome] = (usuarios[log.solicitanteNome] || 0) + 1;
    });
    return Object.entries(usuarios).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [historicoAlteracoes, masterLogado, user]);

  const ChartBarItem = ({ label, valor, max, color }) => ( // Componente visual das barras dos gráficos.
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase px-1"><span className="text-slate-500 italic">{label}</span><span className="text-slate-950">{valor}</span></div>
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(valor / max) * 100}%` }} className={`h-full ${color} rounded-full`} /></div>
    </div>
  );

  return ( // Início da estrutura da página que o usuário verá.
    <div className="flex flex-col px-6 py-4 space-y-8 pb-32 text-left bg-[#F1F5F9]">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-[10px] font-black uppercase italic text-slate-950 tracking-tighter">Indicadores: {cidadeSelecionada}</h2>
        {masterLogado && ( // Seletor de cidades: Exclusivo para o Secretário Regional (Master).
          <select value={cidadeSelecionada} onChange={(e) => setCidadeSelecionada(e.target.value)} className="bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none">
            <option value="REGIONAL">Toda Regional</option>
            {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* BLOCO DE RESUMO RÁPIDO (CARDS) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><MapPin className="text-blue-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Ensaios Locais</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.locais.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><TrendingUp className="text-slate-950 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Ensaios Regionais</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.regionais.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><ShieldCheck className="text-purple-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Enc. Regionais</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.encarregados.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><UserCheck className="text-pink-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Examinadoras</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.examinadoras.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
           <div className="flex flex-col"><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Encarregados Locais (Total)</span><h3 className="text-xl font-[900] text-emerald-600 italic leading-none">{totalEncarregadosLocais}</h3></div>
           <Users className="text-emerald-600" size={28} />
        </div>
      </div>

      {/* GRÁFICO DE BARRAS: DISTRIBUIÇÃO MENSAL E POR SEDE */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            {indexGraficoRegional === 0 ? 'Frequência Mensal (Agenda)' : 'Ocorrências por Sede'}
          </h4>
          <div className="flex gap-1">
            <button onClick={() => setIndexGraficoRegional(0)} className={`w-1.5 h-1.5 rounded-full ${indexGraficoRegional === 0 ? 'bg-amber-500' : 'bg-slate-200'}`} />
            <button onClick={() => setIndexGraficoRegional(1)} className={`w-1.5 h-1.5 rounded-full ${indexGraficoRegional === 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[340px] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div key={indexGraficoRegional} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-[260px] w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoRegionais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900' }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                    {indexGraficoRegional === 0 ? (
                      <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={20} />
                    ) : (
                      <>
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
                        {(masterLogado ? CIDADES_LISTA : [user?.cidade]).map((cidade, idx) => (
                          <Bar key={cidade} dataKey={cidade} stackId="a" fill={CORES_PALETA[idx % CORES_PALETA.length]} radius={idx === 0 ? [0,0,0,0] : [4, 4, 0, 0]} />
                        ))}
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* GRÁFICOS DE VOLUME POR LOCALIDADE */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2"><h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{indexEnsaios === 0 ? 'Volume de Ensaios Locais' : 'Volume de Ensaios Regionais'}</h4><div className="flex gap-1"><button onClick={() => setIndexEnsaios(0)} className={`w-1.5 h-1.5 rounded-full ${indexEnsaios === 0 ? 'bg-blue-600' : 'bg-slate-200'}`} /><button onClick={() => setIndexEnsaios(1)} className={`w-1.5 h-1.5 rounded-full ${indexEnsaios === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} /></div></div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative"><AnimatePresence mode="wait"><motion.div key={indexEnsaios} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 h-auto overflow-y-auto no-scrollbar">{(cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada]).map(c => ({ c, val: indexEnsaios === 0 ? todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).length : ensaiosRegionais.filter(e => normalizarTexto(e.sede) === normalizarTexto(c)).length })).filter(item => item.val > 0).sort((a, b) => b.val - a.val).map(item => (<ChartBarItem key={item.c} label={item.c} valor={item.val} max={maxEnsaios} color={indexEnsaios === 0 ? "bg-blue-600" : "bg-slate-950"} />))}</motion.div></AnimatePresence></div>
      </div>

      {/* GRÁFICOS DA COMISSÃO POR CIDADE */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
          <h4>{indexComissao === 0 ? 'Encarregados Regionais' : indexComissao === 1 ? 'Encarregados Locais' : 'Examinadoras'}</h4>
          <div className="flex gap-1">
            <button onClick={() => setIndexComissao(0)} className={`w-1.5 h-1.5 rounded-full ${indexComissao === 0 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            <button onClick={() => setIndexComissao(1)} className={`w-1.5 h-1.5 rounded-full ${indexComissao === 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            <button onClick={() => setIndexComissao(2)} className={`w-1.5 h-1.5 rounded-full ${indexComissao === 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative"><AnimatePresence mode="wait"><motion.div key={indexComissao} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 h-auto overflow-y-auto no-scrollbar">{(cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada]).map(c => {
                let val = 0;
                if(indexComissao === 0) val = encarregados.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length;
                else if(indexComissao === 1) val = new Set(todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).map(e => e.encarregado).filter(n => n && n !== "-" && n !== "N/I")).size;
                else val = examinadoras.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length;
                return { c, val };
            }).filter(item => item.val > 0).sort((a, b) => b.val - a.val).map(item => (<ChartBarItem key={item.c} label={item.c} valor={item.val} max={maxComissao} color={indexComissao === 0 ? "bg-purple-600" : indexComissao === 1 ? "bg-emerald-600" : "bg-pink-600"} />))}</motion.div></AnimatePresence></div>
      </div>

      {/* MATRIZ DE OCUPAÇÃO (TABELAS) */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-950 italic px-2">Mapa Semanal de Ensaios</h4>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><div className="overflow-x-auto no-scrollbar"><table className="w-full border-collapse"><thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400"><tr><th className="p-4 text-left sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Localidade</th>{matrizes.dias.map(d => <th key={d} className="p-4 text-slate-950">{d}</th>)}<th className="p-4 text-blue-600 bg-blue-50/30">Tot</th></tr></thead><tbody className="divide-y divide-slate-50 text-[9px] font-black uppercase">{matrizes.mDia.grade.map(linha => (<tr key={linha.nome}><td className="p-4 text-slate-600 truncate max-w-[110px] sticky left-0 bg-white z-10 border-r border-slate-100">{linha.nome}</td>{linha.colunas.map((col, idx) => (<td key={idx} className="p-2 text-center">{col.qtd > 0 ? <button onClick={() => setDetalheModal({ titulo: `${linha.nome} (${col.label})`, itens: col.itens })} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto active:scale-90 border border-blue-100">{col.qtd}</button> : <span className="text-slate-100">-</span>}</td>))}<td className="p-2 text-center text-blue-700 bg-blue-50/10"><button onClick={() => setDetalheModal({ titulo: `Consolidado: ${linha.nome}`, itens: linha.totalLinhaItens })} className="w-full font-black py-2 active:scale-90">{linha.totalLinha}</button></td></tr>))}<tr className="bg-blue-50/10 text-blue-700 font-black"><td className="p-4 sticky left-0 bg-blue-50/30 z-10 border-r border-slate-100">Total Dia</td>{matrizes.mDia.totalizadoresColunas.map((total, i) => (<td key={i} className="p-2 text-center"><button onClick={() => setDetalheModal({ titulo: `Ensaios em: ${matrizes.dias[i]}s`, itens: total.itens })} className="w-full font-black py-2 active:scale-90">{total.qtd}</button></td>))}<td className="p-2 text-center text-blue-900 bg-blue-100"><button onClick={() => setDetalheModal({ titulo: 'Regional Jundiaí - Geral', itens: matrizes.mDia.totalGeralItens })} className="w-full font-black py-2 active:scale-90">{matrizes.mDia.totalGeral}</button></td></tr></tbody></table></div></div>
      </div>

      {/* BLOCO EXCLUSIVO MASTER: QUALIDADE E TELEMETRIA */}
      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 space-y-12 shadow-sm">
        {masterLogado && ( // Só mostra para o Secretário Regional (Master).
            <div className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-amber-500 rounded-xl"><AlertTriangle size={18} className="text-white" /></div><h4 className="text-sm font-black uppercase italic tracking-tighter leading-none">Saúde da Base de Dados</h4></div><button onClick={() => setShowSaudeInfo(!showSaudeInfo)} className={`px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 ${stats.saudeTotal < 100 ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-emerald-500 text-emerald-600 bg-emerald-50'} text-[9px] font-black active:scale-95`}>{stats.saudeTotal}% OK <Info size={12}/></button></div>
                <AnimatePresence>{showSaudeInfo && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[9px] font-bold text-slate-500 uppercase leading-relaxed overflow-hidden">Análise de preenchimento completo de nomes e contatos nos ensaios oficiais.</motion.div>)}</AnimatePresence>
                <div className="space-y-2">{stats.pendencias.map(p => (<button key={p.cidade} onClick={() => setDetalheModal({ titulo: `Faltando em: ${p.cidade}`, itens: p.itens })} className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 active:scale-95 transition-all"><span className="text-[10px] font-black uppercase text-slate-600 italic">{p.cidade}</span><div className="flex items-center gap-2"><span className="text-[10px] font-black text-amber-500 uppercase">{p.qtd} pendentes</span><ChevronRight size={12} className="text-slate-300"/></div></button>))}</div>
            </div>
        )}

        <div className="space-y-4 border-t border-slate-100 pt-8"><div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-600 rounded-xl"><LineIcon size={18} className="text-white" /></div><h4 className="text-sm font-black uppercase italic tracking-tighter">Acessos Públicos (Fluxo)</h4></div><div className="h-[160px] w-full" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={analiseUsoData.chartLinha}><XAxis dataKey="name" hide /><Tooltip contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px' }} /><Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} /></LineChart>
          </ResponsiveContainer>
        </div></div>

        <div className="space-y-6 border-t border-slate-100 pt-8"><div className="space-y-4"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1 flex items-center gap-2"><Trophy size={12}/> Ranking de Zelo Regional</span><div className="space-y-3">{rankingAtividade.map(([u, q], i) => (<div key={u} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100"><span className="text-slate-600 text-[10px] font-black uppercase italic">{i+1}º {u}</span><span className="text-emerald-500 text-[10px] font-black">{q} Aprovadas</span></div>))}</div></div></div>
      </div>

      {/* JANELA DE DETALHES (MODAL) */}
      {detalheModal && createPortal(
        <div onClick={() => setDetalheModal(null)} className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
                <button onClick={() => setDetalheModal(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
                <h3 className="text-lg font-[900] uppercase italic text-slate-950 mb-6 pr-8 leading-tight">{detalheModal.titulo}</h3>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                    {detalheModal.itens.length === 0 ? <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-10">Dados completos!</p> : detalheModal.itens.map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[11px] font-[900] uppercase text-slate-950">{item.localidade}</h4>
                            <div className="flex flex-col mt-2 text-[9px] font-bold uppercase gap-1">
                                <span className={item.encarregado === "-" ? "text-amber-600" : "text-slate-400"}>👤 {item.encarregado}</span>
                                <span className={item.contato === "-" ? "text-amber-600" : "text-slate-400"}>📱 {item.contato}</span>
                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200/50">
                                    <span className="text-slate-400">📅 {item.dia}</span>
                                    <span className="text-blue-600 font-black">{item.hora || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Dashboard; // Exporta a tela oficial de estatísticas da Regional Jundiaí.