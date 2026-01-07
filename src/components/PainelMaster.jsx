import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebaseConfig';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, setDoc, addDoc,
  orderBy, limit
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  Check, X, Database, RefreshCw, ShieldCheck, ShieldAlert,
  MapPin, Users, Info, Edit3, Save, Mail, AlertCircle, User, Lock, Briefcase, Trash2, ArrowRight, Shield, TrendingDown, Clock, Activity, Trophy
} from 'lucide-react';
import Feedback from './Feedback';
import { createPortal } from 'react-dom';

// Importações de Constantes e Utilitários
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades';

// Importações da estrutura de backup (subindo dois níveis para sair de src)
import { EXAMINADORAS } from '../../migracao_backup/data/migrarExaminadoras';
import { REGIONAIS as ENCARREGADOS_LISTA } from '../../migracao_backup/data/migrarRegionaisContatos';
import { NOVOS_REGIONAIS_DATA } from '../../migracao_backup/data/migrarRegionais';

const PainelMaster = ({ aoFechar, userLogado }) => {
  const [usuariosPendentes, setUsuariosPendentes] = useState([]);
  const [sugestoesAlteracao, setSugestoesAlteracao] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [rankingAtividade, setRankingAtividade] = useState([]);
  const [aba, setAba] = useState(userLogado?.nivel === 'master' ? 'pendentes' : 'perfil');
  const [feedback, setFeedback] = useState(null);
  const [loadingModulos, setLoadingModulos] = useState({});
  const [confirma, setConfirma] = useState(null);
  const [configLista, setConfigLista] = useState({ url: '', dataReferencia: '', atualizacao: '' });
  
  const [meuNome, setMeuNome] = useState(userLogado?.nome || '');
  const [minhaCidade, setMinhaCidade] = useState(userLogado?.cidade || '');
  const [meuCargo, setMeuCargo] = useState(userLogado?.cargo || '');
  
  const [editandoUser, setEditandoUser] = useState(null);
  const [novoCargo, setNovoCargo] = useState('');
  const [novaCidade, setNovaCidade] = useState('');

  const isMaster = userLogado?.nivel === 'master';

  useEffect(() => {
    if (!userLogado || !isMaster) return;

    let unsubP, unsubS, unsubC, unsubR;

    // 1. Listener de Usuários (Aguardando Aprovação e Ativos)
    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuariosPendentes(lista.filter(u => u.status === 'pendente'));
      setTodosUsuarios(lista.filter(u => u.status !== 'pendente'));
    }, (err) => console.error("Erro Usuários:", err));

    // 2. Listener de Sugestões Pendentes
    unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => {
      setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro Sugestões:", err));

    // 3. Listener de Histórico de Auditoria (Ranking)
    const qRanking = query(
      collection(db, "sugestoes_aprovadas_historico"), 
      orderBy("dataProcessamento", "desc"),
      limit(20)
    );
    unsubR = onSnapshot(qRanking, (snap) => {
      setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Listener Configurações da Lista Oficial
    unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
      if (snap.exists()) setConfigLista(snap.data());
    });

    return () => { 
      if (unsubP) unsubP(); 
      if (unsubS) unsubS(); 
      if (unsubC) unsubC(); 
      if (unsubR) unsubR();
    };
  }, [isMaster, userLogado]);

  const dispararFeedback = (msg, tipo) => {
    setFeedback({ msg, tipo });
  };

  const atualizarMeuPerfil = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
        nome: meuNome, cidade: minhaCidade, cargo: meuCargo
      });
      dispararFeedback("Perfil atualizado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao atualizar", 'erro'); }
  };

  const gerenciarUsuario = async (uid, campos) => {
    try {
      await updateDoc(doc(db, "usuarios", uid), campos);
      dispararFeedback("Usuário atualizado!", 'sucesso');
      setEditandoUser(null);
    } catch (e) { dispararFeedback("Erro na atualização", 'erro'); }
  };

  const processarSugestao = async (sug, aprovado) => {
    try {
      if (aprovado) {
        let colecao = "";
        if (sug.tipo === 'local') colecao = "ensaios_locais";
        else if (sug.tipo === 'regional') colecao = "ensaios_regionais";
        else if (sug.tipo === 'contato_regional') colecao = "encarregados_regionais";
        else if (sug.tipo === 'contato_examinadora') colecao = "examinadoras";

        await updateDoc(doc(db, colecao, sug.ensaioId), sug.dadosSugeridos);
        
        await addDoc(collection(db, "sugestoes_aprovadas_historico"), {
          ...sug,
          dataProcessamento: new Date(),
          processadoPor: userLogado.nome
        });

        dispararFeedback("Alteração aplicada!", 'sucesso');
      }
      await deleteDoc(doc(db, "sugestoes_pendentes", sug.id));
    } catch (e) { dispararFeedback("Erro ao processar", 'erro'); }
  };

  const atualizarListaOficial = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "configuracoes", "lista_oficial"), {
        url: configLista.url,
        dataReferencia: configLista.dataReferencia,
        atualizacao: new Date().toLocaleDateString('pt-BR')
      });
      dispararFeedback("Configurações salvas!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao salvar", 'erro'); }
  };

  const syncModulo = async (tipo) => {
    setConfirma(null);
    setLoadingModulos(prev => ({ ...prev, [tipo]: true }));
    const batch = writeBatch(db);
    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    try {
      if (tipo === 'regionais' || tipo === 'tudo') {
        const snap = await getDocs(collection(db, "ensaios_regionais"));
        snap.forEach(d => batch.delete(d.ref));
        NOVOS_REGIONAIS_DATA.forEach(item => {
          const [dia, mesNum] = item.date.split('/');
          batch.set(doc(collection(db, "ensaios_regionais")), { 
            dia: Number(dia), mes: MESES[parseInt(mesNum) - 1], hora: item.hour, 
            weekday: item.weekday, sede: item.city.toUpperCase(), local: item.location, tipo: "Regional" 
          });
        });
      }
      if (tipo === 'comissao' || tipo === 'tudo') {
        const snapExa = await getDocs(collection(db, "examinadoras"));
        snapExa.forEach(d => batch.delete(d.ref));
        EXAMINADORAS.forEach(item => batch.set(doc(collection(db, "examinadoras")), item));
        const snapEnc = await getDocs(collection(db, "encarregados_regionais"));
        snapEnc.forEach(d => batch.delete(d.ref));
        ENCARREGADOS_LISTA.forEach(item => batch.set(doc(collection(db, "encarregados_regionais")), item));
      }
      await batch.commit();
      dispararFeedback(`Módulo ${tipo} sincronizado!`, 'sucesso');
    } catch (e) { dispararFeedback(`Erro na sincronização`, 'erro'); }
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); }
  };

  const rankingAgrupado = useMemo(() => {
    const counts = {};
    rankingAtividade.forEach(item => {
      const nome = item.solicitanteNome || "Sistema";
      counts[nome] = (counts[nome] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [rankingAtividade]);

  const CompararCampo = ({ label, antigo, novo }) => {
    const mudou = String(antigo || '').trim() !== String(novo || '').trim();
    if (!antigo && !novo) return null;
    return (
      <div className={`p-3 rounded-2xl border ${mudou ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[7px] font-black uppercase text-slate-400">{label}</span>
          {mudou && <span className="bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full animate-pulse">ALTERADO</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold ${mudou ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{antigo || '---'}</span>
          {mudou && <ArrowRight size={10} className="text-amber-500" />}
          {mudou && <span className="text-[10px] font-black text-slate-950 uppercase">{novo}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      <div className="bg-[#F1F5F9] w-full max-w-xl rounded-[2.5rem] flex flex-col h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 text-left">
        
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">
              {isMaster ? 'Painel Administrativo' : 'Meu Perfil'}
            </h2>
            <button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={20}/></button>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
            <button onClick={() => setAba('perfil')} className={`flex-shrink-0 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Meu Perfil</button>
            {isMaster && (
              <>
                <button onClick={() => setAba('pendentes')} className={`flex-shrink-0 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'pendentes' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Pendências ({usuariosPendentes.length + sugestoesAlteracao.length})</button>
                <button onClick={() => setAba('usuarios')} className={`flex-shrink-0 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'usuarios' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Usuários ({todosUsuarios.length})</button>
                <button onClick={() => setAba('auditoria')} className={`flex-shrink-0 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'auditoria' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Atividade</button>
                <button onClick={() => setAba('config')} className={`flex-shrink-0 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'config' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Manutenção</button>
              </>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar pb-20">
          
          {aba === 'perfil' && (
            <div className="space-y-4 animate-in">
              <form onSubmit={atualizarMeuPerfil} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-slate-950 text-white rounded-2xl"><User size={20}/></div><h4 className="text-[11px] font-black uppercase text-slate-950 italic">Informações Cadastrais</h4></div>
                <div className="space-y-3 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Nome Completo</span>
                    <input required type="text" value={meuNome} onChange={e => setMeuNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade de Atuação</span>
                    <select required value={minhaCidade} onChange={e => setMinhaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">
                      {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span>
                    <select required value={meuCargo} onChange={e => setMeuCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">
                      {CARGOS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-lg"><Save size={16}/> Salvar Alterações</button>
              </form>
            </div>
          )}

          {isMaster && aba === 'pendentes' && (
            <div className="space-y-6 animate-in">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-blue-600 ml-2 tracking-widest italic">Acessos Pendentes ({usuariosPendentes.length})</h4>
                {usuariosPendentes.length === 0 ? <p className="text-[9px] text-slate-300 ml-2 uppercase font-bold italic">Sem cadastros na fila.</p> :
                  usuariosPendentes.map(u => (
                    <div key={u.id} className="bg-white p-5 rounded-[2.2rem] shadow-sm border border-slate-100 flex justify-between items-center transition-all">
                      <div className="flex flex-col text-left"><h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} className="bg-green-500 text-white p-3 rounded-xl shadow-md active:scale-90 transition-all"><Check size={16}/></button>
                        <button onClick={async () => await deleteDoc(doc(db, "usuarios", u.id))} className="bg-red-50 text-red-500 p-3 rounded-xl active:scale-90 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black uppercase text-amber-600 ml-2 tracking-widest italic">Sugestões de Alteração ({sugestoesAlteracao.length})</h4>
                {sugestoesAlteracao.length === 0 ? <p className="text-[9px] text-slate-300 ml-2 uppercase font-bold italic">Sem sugestões no momento.</p> :
                  sugestoesAlteracao.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-100 space-y-4 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col text-left">
                          <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full w-fit mb-2 uppercase tracking-tighter">Módulo: {s.tipo?.replace('_', ' ')}</span>
                          <h4 className="text-[13px] font-[900] uppercase text-slate-950 italic leading-none">{s.localidade || s.cidade || s.dadosSugeridos?.name}</h4>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5 flex items-center gap-1"><User size={10}/> Enviado por: {s.solicitanteNome}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => processarSugestao(s, true)} className="bg-green-500 text-white p-3 rounded-xl shadow-md active:scale-90 transition-all"><Check size={18}/></button>
                          <button onClick={() => processarSugestao(s, false)} className="bg-slate-100 text-slate-400 p-3 rounded-xl active:scale-90 transition-all"><X size={18}/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <CompararCampo label="Localidade / Nome" antigo={s.dadosAntigos?.localidade || s.dadosAntigos?.name} novo={s.dadosSugeridos?.localidade || s.dadosSugeridos?.name} />
                        <CompararCampo label="Dia / Contato" antigo={s.dadosAntigos?.dia || s.dadosAntigos?.contact} novo={s.dadosSugeridos?.dia || s.dadosSugeridos?.contact} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {isMaster && aba === 'usuarios' && (
            <div className="space-y-3 animate-in">
              <h4 className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 italic">Gerenciamento da Regional</h4>
              {todosUsuarios.sort((a, b) => b.nivel === 'master' ? 1 : -1).map(u => (
                <div key={u.id} className={`bg-white p-5 rounded-[2.5rem] shadow-sm border ${u.nivel === 'master' ? 'border-amber-200' : 'border-slate-100'} flex flex-col gap-4 relative overflow-hidden text-left`}>
                  {u.nivel === 'master' && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[6px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Master</div>}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h4 className="text-[12px] font-[900] uppercase text-slate-950 italic leading-none">{u.nome}</h4>
                      <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{u.cargo} • {u.cidade}</p>
                      {!u.ativo && <span className="text-[7px] font-black text-red-500 uppercase mt-1 underline tracking-tighter">Acesso Inativado</span>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {u.nivel === 'master' ? (
                        <button onClick={() => gerenciarUsuario(u.id, { nivel: 'comum' })} className="p-3 bg-amber-100 text-amber-600 rounded-xl active:scale-90 transition-all" title="Rebaixar"><TrendingDown size={14}/></button>
                      ) : (
                        <button onClick={() => gerenciarUsuario(u.id, { nivel: 'master' })} className="p-3 bg-amber-500 text-white rounded-xl active:scale-90 shadow-md transition-all" title="Promover"><Shield size={14}/></button>
                      )}
                      <button onClick={() => { setEditandoUser(u); setNovoCargo(u.cargo); setNovaCidade(u.cidade); }} className="p-3 bg-slate-50 text-slate-500 rounded-xl active:scale-90 transition-all"><Edit3 size={14}/></button>
                      <button onClick={() => gerenciarUsuario(u.id, { ativo: !u.ativo })} className={`p-3 rounded-xl active:scale-90 transition-all ${u.ativo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {u.ativo ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isMaster && aba === 'auditoria' && (
            <div className="space-y-6 animate-in">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-amber-600 ml-2 tracking-widest italic flex items-center gap-2"><Trophy size={14}/> Ranking de Zelo</h4>
                <div className="bg-white rounded-[2.2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {rankingAgrupado.length === 0 ? <p className="p-8 text-[9px] text-slate-300 uppercase font-bold italic text-center">Nenhuma atividade registrada.</p> :
                    rankingAgrupado.map((rank, i) => (
                      <div key={rank.nome} className="p-5 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{i + 1}º</span>
                          <span className="text-[11px] font-black uppercase text-slate-950 italic">{rank.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <span className="text-[10px] font-black text-slate-950">{rank.qtd}</span>
                          <span className="text-[7px] font-black text-slate-400 uppercase">Sugestões</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest italic flex items-center gap-2"><Activity size={14}/> Histórico Recente</h4>
                <div className="space-y-2">
                  {rankingAtividade.map(log => (
                    <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-950 italic">{log.localidade || log.cidade}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase">Aprovado por: {log.processadoPor}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase italic">{log.dataProcessamento?.toDate().toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isMaster && aba === 'config' && (
            <div className="grid grid-cols-1 gap-3 animate-in pb-10">
              <div className="bg-red-50 p-6 rounded-[2.2rem] border border-red-100 mb-2">
                <div className="flex items-center gap-2 text-red-600 mb-2"><AlertCircle size={18}/><h4 className="text-[10px] font-black uppercase italic">Atenção Master</h4></div>
                <p className="text-[9px] font-bold text-red-900 uppercase leading-relaxed text-left">
                  A sincronização apaga os dados atuais e restaura as informações dos arquivos de migração. <br/>
                  <span className="underline italic">Use apenas para atualizações anuais ou erro crítico de dados.</span>
                </p>
              </div>
              
              <button onClick={() => setConfirma('regionais')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all text-left">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><MapPin size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Agenda Regionais</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Limpa e restaura agenda 2026</p></div>
                <RefreshCw size={14} className={loadingModulos.regionais ? "animate-spin text-blue-600" : "text-slate-300"} />
              </button>
              <button onClick={() => setConfirma('comissao')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all text-left">
                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><Users size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Contatos Comissão</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Restaura Examinadoras e Regionais</p></div>
                <RefreshCw size={14} className={loadingModulos.comissao ? "animate-spin text-purple-600" : "text-slate-300"} />
              </button>
              <button onClick={() => setConfirma('tudo')} className="mt-4 bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center gap-4 active:scale-95 transition-all text-left">
                <div className="p-3 bg-white/10 text-white rounded-2xl"><Database size={20}/></div>
                <div className="flex-grow"><h4 className="text-[11px] font-black uppercase text-white italic">Hard Reset Total</h4><p className="text-[7px] font-bold text-white/40 uppercase tracking-widest text-left">Restaura todo o banco de dados</p></div>
                <RefreshCw size={16} className={loadingModulos.tudo ? "animate-spin text-white" : "text-white/20"} />
              </button>
            </div>
          )}
        </div>
      </div>

      {editandoUser && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 transition-all">
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-1 leading-none">Editar Usuário</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-6">{editandoUser.nome}</p>
            <div className="space-y-4">
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade</span>
                <select value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold uppercase outline-none">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo</span>
                <select value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold uppercase outline-none">
                  {CARGOS_LISTA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
                </select>
              </div>
              <button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, cidade: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all">Salvar</button>
              <button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}

      {confirma && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 transition-all">
            <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
            <h3 className="text-lg font-[900] uppercase italic text-slate-950">Sincronizar?</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-4 text-center leading-relaxed">Você resetará o módulo {confirma.toUpperCase()}.</p>
            <p className="text-red-500 text-[8px] font-black uppercase mt-2">DADOS ATUAIS SERÃO PERDIDOS.</p>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={() => syncModulo(confirma)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all">Sim, Confirmar</button>
              <button onClick={() => setConfirma(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] transition-all">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default PainelMaster;