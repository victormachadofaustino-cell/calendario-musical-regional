import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  MapPin, TrendingUp, UserCheck, ShieldCheck, 
  Activity, AlertTriangle, LineChart as LineIcon,
  ArrowRight, ChevronRight, BarChart3, Info, Trophy
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend 
} from 'recharts';

// IMPORTAÇÕES DE CONSTANTES
import { normalizarTexto } from '../constants/comuns';
import { CIDADES_LISTA } from '../constants/cidades';

const Dashboard = ({ todosEnsaios, ensaiosRegionais, examinadoras, encarregados, user }) => {
  const isMaster = user?.nivel === 'master';
  const [cidadeSelecionada, setCidadeSelecionada] = useState(isMaster ? 'REGIONAL' : user?.cidade);
  const [detalheModal, setDetalheModal] = useState(null);
  const [semanaFiltro, setSemanaFiltro] = useState('Todas');
  const [showSaudeInfo, setShowSaudeInfo] = useState(false);
  
  const [indexEnsaios, setIndexEnsaios] = useState(0); 
  const [indexComissao, setIndexComissao] = useState(0); 
  const [indexGraficoRegional, setIndexGraficoRegional] = useState(0); 
  const [historicoAlteracoes, setHistoricoAlteracoes] = useState([]);
  const [telemetria, setTelemetria] = useState([]);

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const CORES_PALETA = ["#0F172A", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#64748B", "#F43F5E", "#82ca9d", "#ffc658"];

  // --- 1. LISTENERS DE DADOS REAIS ---
  useEffect(() => {
    if (!isMaster) return;
    
    const unsubAlt = onSnapshot(
      query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(100)),
      (snap) => setHistoricoAlteracoes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.log("Permissão negada para histórico (Auditoria).")
    );

    const unsubTele = onSnapshot(
      collection(db, "telemetria_acessos"), 
      (snap) => setTelemetria(snap.docs.map(d => d.data())),
      (err) => console.log("Permissão negada para telemetria.")
    );

    return () => { unsubAlt(); unsubTele(); };
  }, [isMaster]);

  // --- 2. PROCESSAMENTO ANALÍTICO ---
  const dadosFiltrados = useMemo(() => {
    const escopoRegional = cidadeSelecionada === 'REGIONAL';
    const cidadeAlvo = normalizarTexto(cidadeSelecionada);
    let locais = todosEnsaios.filter(e => escopoRegional || normalizarTexto(e.cidade) === cidadeAlvo);
    if (semanaFiltro !== 'Todas') locais = locais.filter(e => e.dia.includes(semanaFiltro));
    return {
      locais,
      regionais: ensaiosRegionais.filter(e => escopoRegional || normalizarTexto(e.sede) === cidadeAlvo),
      examinadoras: examinadoras.filter(e => escopoRegional || normalizarTexto(e.city) === cidadeAlvo),
      encarregados: encarregados.filter(e => escopoRegional || normalizarTexto(e.city) === cidadeAlvo)
    };
  }, [todosEnsaios, ensaiosRegionais, examinadoras, encarregados, cidadeSelecionada, semanaFiltro]);

  const dadosGraficoRegionais = useMemo(() => {
    return MESES.map(mes => {
      const regionaisNoMes = dadosFiltrados.regionais.filter(e => e.mes === mes);
      const row = { name: mes.substring(0, 3), total: regionaisNoMes.length };
      CIDADES_LISTA.forEach(cidade => {
        const qtd = regionaisNoMes.filter(e => normalizarTexto(e.sede) === normalizarTexto(cidade)).length;
        if (qtd > 0) row[cidade] = qtd;
      });
      return row;
    });
  }, [dadosFiltrados.regionais]);

  const stats = useMemo(() => {
    const escopoRegional = cidadeSelecionada === 'REGIONAL';
    const listaCidades = escopoRegional ? CIDADES_LISTA : [cidadeSelecionada];
    const pendencias = listaCidades.map(c => {
      const itens = todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c) && (!e.encarregado || e.encarregado === "-" || !e.contato || e.contato === "-"));
      return { cidade: c, qtd: itens.length, itens };
    }).filter(p => p.qtd > 0).sort((a,b) => b.qtd - a.qtd);
    const totalNoEscopo = todosEnsaios.filter(e => escopoRegional || normalizarTexto(e.cidade) === normalizarTexto(cidadeSelecionada)).length;
    return { pendencias, saudeTotal: totalNoEscopo > 0 ? Math.round(((totalNoEscopo - pendencias.reduce((acc, curr) => acc + curr.qtd, 0)) / totalNoEscopo) * 100) : 100 };
  }, [todosEnsaios, cidadeSelecionada]);

  const matrizes = useMemo(() => {
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horas = [...Array.from(new Set(dadosFiltrados.locais.map(e => e.hora).filter(h => h && h !== "-"))).sort(), "-"];
    let linhas = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : Array.from(new Set(dadosFiltrados.locais.map(e => e.localidade))).sort();

    const gerarGrade = (tipo) => {
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

  const maxEnsaios = useMemo(() => {
    const escopo = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada];
    const valores = escopo.map(c => indexEnsaios === 0 ? todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).length : ensaiosRegionais.filter(e => normalizarTexto(e.sede) === normalizarTexto(c)).length);
    return Math.max(...valores, 1);
  }, [todosEnsaios, ensaiosRegionais, indexEnsaios, cidadeSelecionada]);

  const maxComissao = useMemo(() => {
    const escopo = cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada];
    const valores = escopo.map(c => indexComissao === 0 ? encarregados.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length : examinadoras.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length);
    return Math.max(...valores, 1);
  }, [encarregados, examinadoras, indexComissao, cidadeSelecionada]);

  const analiseUsoData = useMemo(() => {
    const filtrado = telemetria.filter(t => cidadeSelecionada === 'REGIONAL' || normalizarTexto(t.cidade) === normalizarTexto(cidadeSelecionada));
    const mesAtual = new Date().getMonth() + 1;
    const porDia = filtrado.filter(d => d.mes === mesAtual).reduce((acc, curr) => { acc[curr.dia] = (acc[curr.dia] || 0) + 1; return acc; }, {});
    return { chartLinha: Object.keys(porDia).map(dia => ({ name: `Dia ${dia}`, acessos: porDia[dia] })) };
  }, [telemetria, cidadeSelecionada]);

  const rankingAtividade = useMemo(() => {
    const cidades = {}; const usuarios = {};
    historicoAlteracoes.filter(h => cidadeSelecionada === 'REGIONAL' || normalizarTexto(h.cidade) === normalizarTexto(cidadeSelecionada)).forEach(log => {
      cidades[log.cidade] = (cidades[log.cidade] || 0) + 1;
      usuarios[log.solicitanteNome] = (usuarios[log.solicitanteNome] || 0) + 1;
    });
    return { 
      cidades: Object.entries(cidades).sort((a,b) => b[1] - a[1]).slice(0, 3), 
      usuarios: Object.entries(usuarios).sort((a,b) => b[1] - a[1]).slice(0, 3) 
    };
  }, [historicoAlteracoes, cidadeSelecionada]);

  const ChartBarItem = ({ label, valor, max, color }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase px-1"><span className="text-slate-500 italic">{label}</span><span className="text-slate-950">{valor}</span></div>
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(valor / max) * 100}%` }} className={`h-full ${color} rounded-full`} /></div>
    </div>
  );

  return (
    <div className="flex flex-col px-6 py-4 space-y-8 pb-32 text-left bg-[#F1F5F9]">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-[10px] font-black uppercase italic text-slate-950 tracking-tighter">Visão {cidadeSelecionada}</h2>
        {isMaster && (
          <select value={cidadeSelecionada} onChange={(e) => setCidadeSelecionada(e.target.value)} className="bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none">
            <option value="REGIONAL">Toda Regional</option>
            {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><MapPin className="text-blue-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Ensaios Locais</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.locais.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><TrendingUp className="text-slate-950 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Ensaios Regionais</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.regionais.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><ShieldCheck className="text-purple-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Comissão</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.encarregados.length}</h3></div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><UserCheck className="text-pink-600 mb-2" size={18} /><span className="text-[7px] font-black uppercase text-slate-400 block tracking-tighter">Examinadoras</span><h3 className="text-xl font-[900] text-slate-950 italic leading-none">{dadosFiltrados.examinadoras.length}</h3></div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            {indexGraficoRegional === 0 ? 'Ensaios Regionais por Mês' : 'Ensaios Regionais por cidade'}
          </h4>
          <div className="flex gap-1">
            <button onClick={() => setIndexGraficoRegional(0)} className={`w-1.5 h-1.5 rounded-full ${indexGraficoRegional === 0 ? 'bg-amber-500' : 'bg-slate-200'}`} />
            <button onClick={() => setIndexGraficoRegional(1)} className={`w-1.5 h-1.5 rounded-full ${indexGraficoRegional === 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[300px] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div key={indexGraficoRegional} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(e, info) => { if (info.offset.x < -40 && indexGraficoRegional < 1) setIndexGraficoRegional(1); if (info.offset.x > 40 && indexGraficoRegional > 0) setIndexGraficoRegional(0); }} className="cursor-grab active:cursor-grabbing">
              <div className="h-[240px] w-full min-h-[240px]" style={{ minWidth: '0px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={dadosGraficoRegionais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900' }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                    {indexGraficoRegional === 0 ? (
                      <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={20}>
                        {dadosGraficoRegionais.map((entry, index) => <Cell key={index} fill="#3B82F6" />)}
                      </Bar>
                    ) : (
                      <>
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '10px', bottom: -10 }} />
                        {CIDADES_LISTA.map((cidade, idx) => (
                          <Bar key={cidade} dataKey={cidade} stackId="a" fill={CORES_PALETA[idx % CORES_PALETA.length]} radius={idx === 0 ? [0,0,0,0] : [4, 4, 0, 0]} />
                        ))}
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-2"><h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{indexEnsaios === 0 ? 'Ensaios Locais por Cidade' : 'Ensaios Regionais por Cidade'}</h4><div className="flex gap-1"><button onClick={() => setIndexEnsaios(0)} className={`w-1.5 h-1.5 rounded-full ${indexEnsaios === 0 ? 'bg-blue-600' : 'bg-slate-200'}`} /><button onClick={() => setIndexEnsaios(1)} className={`w-1.5 h-1.5 rounded-full ${indexEnsaios === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} /></div></div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative min-h-[220px]"><AnimatePresence mode="wait"><motion.div key={indexEnsaios} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(e, info) => { if (info.offset.x < -40 && indexEnsaios < 1) setIndexEnsaios(1); if (info.offset.x > 40 && indexEnsaios > 0) setIndexEnsaios(0); }} className="space-y-3 cursor-grab h-[180px] overflow-y-auto no-scrollbar">{(cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada]).map(c => ({ c, val: indexEnsaios === 0 ? todosEnsaios.filter(e => normalizarTexto(e.cidade) === normalizarTexto(c)).length : ensaiosRegionais.filter(e => normalizarTexto(e.sede) === normalizarTexto(c)).length })).sort((a, b) => b.val - a.val).map(item => item.val > 0 ? (<ChartBarItem key={item.c} label={item.c} valor={item.val} max={maxEnsaios} color={indexEnsaios === 0 ? "bg-blue-600" : "bg-slate-950"} />) : null)}</motion.div></AnimatePresence></div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
          <h4>{indexComissao === 0 ? 'Encarregados Regionais' : 'Examinadoras'}</h4>
          <div className="flex gap-1">
            <button onClick={() => setIndexComissao(0)} className={`w-1.5 h-1.5 rounded-full ${indexComissao === 0 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            <button onClick={() => setIndexComissao(1)} className={`w-1.5 h-1.5 rounded-full ${indexComissao === 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[220px]"><AnimatePresence mode="wait"><motion.div key={indexComissao} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(e, info) => { if (info.offset.x < -40 && indexComissao < 1) setIndexComissao(1); if (info.offset.x > 40 && indexComissao > 0) setIndexComissao(0); }} className="space-y-3 cursor-grab h-[180px] overflow-y-auto no-scrollbar">{(cidadeSelecionada === 'REGIONAL' ? CIDADES_LISTA : [cidadeSelecionada]).map(c => ({ c, val: indexComissao === 0 ? encarregados.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length : examinadoras.filter(e => normalizarTexto(e.city) === normalizarTexto(c)).length })).sort((a, b) => b.val - a.val).map(item => item.val > 0 ? (<ChartBarItem key={item.c} label={item.c} valor={item.val} max={maxComissao} color={indexComissao === 0 ? "bg-purple-600" : "bg-pink-600"} />) : null)}</motion.div></AnimatePresence></div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-950 italic px-2">Matriz por Dia da Semana</h4>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><div className="overflow-x-auto no-scrollbar"><table className="w-full border-collapse"><thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400"><tr><th className="p-4 text-left sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Local</th>{matrizes.dias.map(d => <th key={d} className="p-4 text-slate-950">{d}</th>)}<th className="p-4 text-blue-600 bg-blue-50/30">Total</th></tr></thead><tbody className="divide-y divide-slate-50 text-[9px] font-black uppercase">{matrizes.mDia.grade.map(linha => (<tr key={linha.nome}><td className="p-4 text-slate-600 truncate max-w-[110px] sticky left-0 bg-white z-10 border-r border-slate-100">{linha.nome}</td>{linha.colunas.map((col, idx) => (<td key={idx} className="p-2 text-center">{col.qtd > 0 ? <button onClick={() => setDetalheModal({ titulo: `${linha.nome} - ${col.label}`, itens: col.itens })} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto active:scale-90 border border-blue-100">{col.qtd}</button> : <span className="text-slate-100">-</span>}</td>))}<td className="p-2 text-center text-blue-700 bg-blue-50/10"><button onClick={() => setDetalheModal({ titulo: `Acumulado: ${linha.nome}`, itens: linha.totalLinhaItens })} className="w-full font-black py-2 active:scale-90">{linha.totalLinha}</button></td></tr>))}<tr className="bg-blue-50/10 text-blue-700 font-black"><td className="p-4 sticky left-0 bg-blue-50/30 z-10 border-r border-slate-100">Total Dia</td>{matrizes.mDia.totalizadoresColunas.map((total, i) => (<td key={i} className="p-2 text-center"><button onClick={() => setDetalheModal({ titulo: `Ensaios: ${matrizes.dias[i]}`, itens: total.itens })} className="w-full font-black py-2 active:scale-90">{total.qtd}</button></td>))}<td className="p-2 text-center text-blue-900 bg-blue-100"><button onClick={() => setDetalheModal({ titulo: 'Regional Jundiaí - Total Geral', itens: matrizes.mDia.totalGeralItens })} className="w-full font-black py-2 active:scale-90">{matrizes.mDia.totalGeral}</button></td></tr></tbody></table></div></div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-950 italic px-2">Matriz por Horário</h4>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><div className="overflow-x-auto no-scrollbar"><table className="w-full border-collapse"><thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400"><tr><th className="p-4 text-left sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Local</th>{matrizes.horas.map(h => <th key={h} className="p-4 text-slate-950 whitespace-nowrap">{h}</th>)}<th className="p-4 text-purple-600 bg-purple-50/30">Total</th></tr></thead><tbody className="divide-y divide-slate-50 text-[9px] font-black uppercase">{matrizes.mHora.grade.map(linha => (<tr key={linha.nome}><td className="p-4 text-slate-600 truncate max-w-[110px] sticky left-0 bg-white z-10 border-r border-slate-100">{linha.nome}</td>{linha.colunas.map((col, idx) => (<td key={idx} className="p-2 text-center">{col.qtd > 0 ? <button onClick={() => setDetalheModal({ titulo: `${linha.nome} às ${col.label}`, itens: col.itens })} className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto active:scale-90 border border-purple-100">{col.qtd}</button> : <span className="text-slate-100">-</span>}</td>))}<td className="p-2 text-center text-purple-700 bg-purple-50/10"><button onClick={() => setDetalheModal({ titulo: `Acumulado: ${linha.nome}`, itens: linha.totalLinhaItens })} className="w-full font-black py-2 active:scale-90">{linha.totalLinha}</button></td></tr>))}<tr className="bg-purple-50/10 text-purple-700 font-black"><td className="p-4 sticky left-0 bg-purple-50/30 z-10 border-r border-slate-100">Total Hora</td>{matrizes.mHora.totalizadoresColunas.map((total, i) => (<td key={i} className="p-2 text-center"><button onClick={() => setDetalheModal({ titulo: `Ensaios às ${matrizes.horas[i]}`, itens: total.itens })} className="w-full font-black py-2 active:scale-90">{total.qtd}</button></td>))}<td className="p-2 text-center text-purple-900 bg-purple-100"><button onClick={() => setDetalheModal({ titulo: 'Total Geral Horário', itens: matrizes.mHora.totalGeralItens })} className="w-full font-black py-2 active:scale-90">{matrizes.mHora.totalGeral}</button></td></tr></tbody></table></div></div>
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 space-y-12 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-amber-500 rounded-xl"><AlertTriangle size={18} className="text-white" /></div><h4 className="text-sm font-black uppercase italic tracking-tighter leading-none">Pendências Informativas</h4></div><button onClick={() => setShowSaudeInfo(!showSaudeInfo)} className={`px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 ${stats.saudeTotal < 100 ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-emerald-500 text-emerald-600 bg-emerald-50'} text-[9px] font-black active:scale-95`}>{stats.saudeTotal}% OK <Info size={12}/></button></div>
          <AnimatePresence>{showSaudeInfo && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[9px] font-bold text-slate-500 uppercase leading-relaxed overflow-hidden">DADOS SAUDÁVEIS = Campos preenchidos sem "-". Toque na cidade abaixo para ver detalhes.</motion.div>)}</AnimatePresence>
          <div className="space-y-2">{stats.pendencias.map(p => (<button key={p.cidade} onClick={() => setDetalheModal({ titulo: `Pendências: ${p.cidade}`, itens: p.itens })} className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 active:scale-95 transition-all"><span className="text-[10px] font-black uppercase text-slate-600 italic">{p.cidade}</span><div className="flex items-center gap-2"><span className="text-[10px] font-black text-amber-500 uppercase">{p.qtd} campos faltando</span><ChevronRight size={12} className="text-slate-300"/></div></button>))}</div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-8"><div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-600 rounded-xl"><LineIcon size={18} className="text-white" /></div><h4 className="text-sm font-black uppercase italic tracking-tighter">Fluxo Público (Visão {cidadeSelecionada})</h4></div><div className="h-[160px] w-full" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={analiseUsoData.chartLinha}><XAxis dataKey="name" hide /><Tooltip contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px' }} /><Line type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} /></LineChart>
          </ResponsiveContainer>
        </div></div>

        <div className="space-y-6 border-t border-slate-100 pt-8"><div className="space-y-4"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1 flex items-center gap-2"><Trophy size={12}/> Ranking de Zelo (Aprovadas por Visão)</span><div className="space-y-3">{rankingAtividade.usuarios.map(([u, q], i) => (<div key={u} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100"><span className="text-slate-600 text-[10px] font-black uppercase italic">{i+1}º {u}</span><span className="text-emerald-500 text-[10px] font-black">{q} Aprovadas</span></div>))}</div></div></div>
      </div>

      {detalheModal && createPortal(
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md"><div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left"><button onClick={() => setDetalheModal(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><ChevronRight size={18}/></button><h3 className="text-lg font-[900] uppercase italic text-slate-950 mb-6 pr-8 leading-tight">{detalheModal.titulo}</h3><div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">{detalheModal.itens.length === 0 ? <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-10">Nenhum dado pendente.</p> : detalheModal.itens.map((item, i) => (<div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="text-[11px] font-[900] uppercase text-slate-950">{item.localidade}</h4><div className="flex flex-col mt-2 text-[9px] font-bold uppercase gap-1"><span className={item.encarregado === "-" ? "text-amber-600" : "text-slate-400"}>👤 {item.encarregado}</span><span className={item.contato === "-" ? "text-amber-600" : "text-slate-400"}>📱 {item.contato}</span><div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200/50"><span className="text-slate-400">📅 {item.dia}</span><span className="text-blue-600 font-black">{item.hora || '-'}</span></div></div></div>))}</div></div></div>, document.body
      )}
    </div>
  );
};

export default Dashboard;