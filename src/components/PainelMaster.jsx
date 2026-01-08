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
  MapPin, Users, Edit3, Save, Mail, AlertCircle, User, Lock, Briefcase, Trash2, ArrowRight, Shield, TrendingDown, Clock, Activity, Trophy, Home, Star,
  MessageSquare, ChevronDown, ChevronUp,
  History as HistoryIcon 
} from 'lucide-react';
import Feedback from './Feedback';
import { createPortal } from 'react-dom';
import AbaFeedbackMaster from './AbaFeedbackMaster'; 

// Importações de Constantes e Utilitários
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades';

// Importações da estrutura de backup
import { EXAMINADORAS } from '../../migracao_backup/data/migrarExaminadoras';
import { REGIONAIS as ENCARREGADOS_LISTA } from '../../migracao_backup/data/migrarRegionaisContatos';
import { NOVOS_REGIONAIS_DATA } from '../../migracao_backup/data/migrarRegionais';
import { LOCAIS_DATA } from '../../migracao_backup/data/migrarLocais';

const PainelMaster = ({ aoFechar, userLogado }) => {
  const [usuariosPendentes, setUsuariosPendentes] = useState([]);
  const [sugestoesAlteracao, setSugestoesAlteracao] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [rankingAtividade, setRankingAtividade] = useState([]);
  const [countTickets, setCountTickets] = useState(0); 

  const [openAcessos, setOpenAcessos] = useState(false);
  const [openDados, setOpenDados] = useState(false);
  const [openApp, setOpenApp] = useState(false);

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

    let unsubP, unsubS, unsubC, unsubR, unsubT;

    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const existentes = lista.filter(u => u.id);
      setUsuariosPendentes(existentes.filter(u => u.status === 'pendente'));
      setTodosUsuarios(existentes.filter(u => u.status !== 'pendente'));
    }, (err) => console.error("Erro Usuários:", err));

    unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => {
      setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro Sugestões:", err));

    unsubT = onSnapshot(query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")), (snap) => {
      setCountTickets(snap.size);
    });

    const qRanking = query(
      collection(db, "sugestoes_aprovadas_historico"), 
      orderBy("dataProcessamento", "desc"),
      limit(50)
    );
    unsubR = onSnapshot(qRanking, (snap) => {
      setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
      if (snap.exists()) setConfigLista(snap.data());
    });

    return () => { 
      if (unsubP) unsubP(); 
      if (unsubS) unsubS(); 
      if (unsubC) unsubC(); 
      if (unsubR) unsubR();
      if (unsubT) unsubT();
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

  const resetarSenhaUsuario = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      dispararFeedback("E-mail de reset enviado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao enviar reset", 'erro'); }
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

  const syncModulo = async (tipo) => {
    setConfirma(null);
    setLoadingModulos(prev => ({ ...prev, [tipo]: true }));
    const batch = writeBatch(db);
    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    try {
      if (tipo === 'locais' || tipo === 'tudo') {
        const snapLoc = await getDocs(collection(db, "ensaios_locais"));
        snapLoc.forEach(d => batch.delete(d.ref));
        LOCAIS_DATA.forEach(item => batch.set(doc(collection(db, "ensaios_locais")), item));
      }
      if (tipo === 'regionais' || tipo === 'tudo') {
        const snapReg = await getDocs(collection(db, "ensaios_regionais"));
        snapReg.forEach(d => batch.delete(d.ref));
        NOVOS_REGIONAIS_DATA.forEach(item => {
          const [dia, mesNum] = item.date.split('/');
          batch.set(doc(collection(db, "ensaios_regionais")), { 
            dia: Number(dia), mes: MESES[parseInt(mesNum) - 1], hora: item.hour, 
            weekday: item.weekday, sede: item.city.toUpperCase(), local: item.location, tipo: "Regional" 
          });
        });
      }
      if (tipo === 'examinadoras' || tipo === 'tudo') {
        const snapExa = await getDocs(collection(db, "examinadoras"));
        snapExa.forEach(d => batch.delete(d.ref));
        EXAMINADORAS.forEach(item => batch.set(doc(collection(db, "examinadoras")), item));
      }
      if (tipo === 'encarregados' || tipo === 'tudo') {
        const snapEnc = await getDocs(collection(db, "encarregados_regionais"));
        snapEnc.forEach(d => batch.delete(d.ref));
        ENCARREGADOS_LISTA.forEach(item => batch.set(doc(collection(db, "encarregados_regionais")), item));
      }
      await batch.commit();
      dispararFeedback(`Backup restaurado!`, 'sucesso');
    } catch (e) { dispararFeedback(`Erro na sincronização`, 'erro'); }
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); }
  };

  const CompararCampo = ({ label, antigo, novo }) => {
    const mudou = String(antigo || '').trim() !== String(novo || '').trim();
    if (!antigo && !novo) return null;
    return (
      <div className={`p-3 rounded-2xl border transition-all ${mudou ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[7px] font-black uppercase text-slate-400">{label}</span>
          {mudou && <span className="bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase">Modificado</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold ${mudou ? 'text-red-400 line-through bg-red-50 px-1 rounded' : 'text-slate-600'}`}>{antigo || '---'}</span>
          {mudou && <ArrowRight size={10} className="text-amber-500 shrink-0" />}
          {mudou && <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded uppercase">{novo}</span>}
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
              {isMaster ? 'Painel Master' : 'Meu Perfil'}
            </h2>
            <button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={20}/></button>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setAba('perfil')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Perfil</button>
            {isMaster && (
              <>
                <button onClick={() => setAba('pendentes')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'pendentes' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Solicit.</button>
                <button onClick={() => setAba('usuarios')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'usuarios' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Users</button>
                <button onClick={() => setAba('config')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'config' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Manut.</button>
              </>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar pb-24">
          
          {aba === 'perfil' && (
            <div className="space-y-4 animate-in">
              <form onSubmit={atualizarMeuPerfil} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3"><div className="p-3 bg-slate-950 text-white rounded-2xl"><User size={20}/></div><h4 className="text-[11px] font-black uppercase text-slate-950 italic">Dados do Perfil</h4></div>
                  <button type="button" onClick={() => resetarSenhaUsuario(userLogado.email)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[7px] font-black uppercase border border-blue-100 active:scale-95 transition-all"><Lock size={12}/> Reset Senha</button>
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Nome</span><input required type="text" value={meuNome} onChange={e => setMeuNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" /></div>
                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span><select required value={minhaCidade} onChange={e => setMinhaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span><select required value={meuCargo} onChange={e => setMeuCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CARGOS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-lg mt-2 transition-all"><Save size={16}/> Salvar Perfil</button>
              </form>
            </div>
          )}

          {isMaster && aba === 'pendentes' && (
            <div className="space-y-4 animate-in text-left">
              
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenAcessos(!openAcessos)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Shield size={18}/></div>
                    <span className="text-[10px] font-black uppercase italic text-slate-950">Acessos Pendentes ({usuariosPendentes.length})</span>
                  </div>
                  {openAcessos ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </button>
                {openAcessos && (
                  <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100">
                    {usuariosPendentes.length === 0 ? <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Nenhum acesso</p> :
                      usuariosPendentes.map(u => (
                        <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all">
                          <div className="flex flex-col text-left"><h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} className="bg-green-500 text-white p-2.5 rounded-xl shadow-md active:scale-90"><Check size={16}/></button>
                            <button onClick={async () => await deleteDoc(doc(db, "usuarios", u.id))} className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 transition-all"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenDados(!openDados)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Database size={18}/></div>
                    <span className="text-[10px] font-black uppercase italic text-slate-950">Solicitação de Alteração ({sugestoesAlteracao.length})</span>
                  </div>
                  {openDados ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </button>
                {openDados && (
                  <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100">
                    {sugestoesAlteracao.length === 0 ? <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Nenhuma alteração</p> :
                      sugestoesAlteracao.map(s => (
                        <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                          <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                            <div className="text-left">
                              <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase italic">Modulo: {s.tipo?.replace('_', ' ')}</span>
                              <h4 className="text-[11px] font-[900] uppercase text-slate-950 italic mt-1 leading-none">{s.localidade || s.cidade || s.dadosSugeridos?.name}</h4>
                              <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Por: {s.solicitanteNome}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => processarSugestao(s, true)} className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg active:scale-90"><Check size={16}/></button>
                              <button onClick={() => processarSugestao(s, false)} className="bg-slate-100 text-slate-400 p-2 rounded-xl active:scale-90"><X size={16}/></button>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-1 gap-1.5 bg-white">
                            <CompararCampo label="Localidade" antigo={s.dadosAntigos?.localidade} novo={s.dadosSugeridos?.localidade} />
                            <CompararCampo label="Cidade" antigo={s.dadosAntigos?.cidade} novo={s.dadosSugeridos?.cidade} />
                            <CompararCampo label="Horário" antigo={s.dadosAntigos?.hora} novo={s.dadosSugeridos?.hora} />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenApp(!openApp)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><MessageSquare size={18}/></div>
                    <span className="text-[10px] font-black uppercase italic text-slate-950">Tickets ({countTickets})</span>
                  </div>
                  {openApp ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </button>
                {openApp && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                    <AbaFeedbackMaster />
                  </div>
                )}
              </div>

            </div>
          )}

          {isMaster && aba === 'usuarios' && (
            <div className="space-y-3 animate-in text-left">
              {todosUsuarios.sort((a, b) => b.nivel === 'master' ? 1 : -1).map(u => (
                <div key={u.id} className={`p-5 rounded-[2.2rem] shadow-sm border transition-all relative overflow-hidden ${!u.ativo ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                  {u.nivel === 'master' && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[6px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Master</div>}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h4 className="text-[12px] font-[900] uppercase text-slate-950 italic leading-none">{u.nome}</h4>
                      <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{u.cargo} • {u.cidade}</p>
                      {!u.ativo && <span className="text-[7px] font-black text-red-500 uppercase mt-1 underline tracking-tighter italic">Inativado</span>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => gerenciarUsuario(u.id, { nivel: u.nivel === 'master' ? 'comum' : 'master' })} className={`p-3 rounded-xl active:scale-90 transition-all ${u.nivel === 'master' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`} title="Permissões"><Shield size={14}/></button>
                      <button onClick={() => { setEditandoUser(u); setNovoCargo(u.cargo); setNovaCidade(u.cidade); }} className="p-3 bg-slate-50 text-slate-500 rounded-xl active:scale-90 transition-all"><Edit3 size={14}/></button>
                      <button onClick={() => resetarSenhaUsuario(u.email)} className="p-3 bg-blue-50 text-blue-600 rounded-xl active:scale-90 transition-all" title="Resetar Senha"><Lock size={14}/></button>
                      <button onClick={() => gerenciarUsuario(u.id, { ativo: !u.ativo })} className={`p-3 rounded-xl active:scale-90 transition-all ${u.ativo ? 'bg-green-50 text-green-600' : 'bg-red-200 text-red-800'}`}>{u.ativo ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isMaster && aba === 'config' && (
            <div className="grid grid-cols-1 gap-3 animate-in pb-10 text-left">
              <div className="bg-red-50 p-6 rounded-[2.2rem] border border-red-100 mb-2">
                <div className="flex items-center gap-2 text-red-600 mb-2"><AlertCircle size={18}/><h4 className="text-[10px] font-black uppercase italic">Zelo do Master</h4></div>
                <p className="text-[9px] font-bold text-red-900 uppercase leading-relaxed">Sincronizar apaga os dados atuais e restaura o backup oficial. Cuidado.</p>
              </div>

              <button onClick={() => setConfirma('locais')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 text-left transition-all">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><Home size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Locais</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">Restaura Comuns</p></div>
                <RefreshCw size={14} className={loadingModulos.locais ? "animate-spin text-emerald-600" : "text-slate-300"} />
              </button>

              <button onClick={() => setConfirma('regionais')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 text-left transition-all">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg"><Star size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Regionais</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">Restaura Agenda</p></div>
                <RefreshCw size={14} className={loadingModulos.regionais ? "animate-spin text-amber-500" : "text-slate-300"} />
              </button>

              <button onClick={() => setConfirma('encarregados')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 text-left transition-all">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Users size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Comissão Regional</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">Restaura Encarregados</p></div>
                <RefreshCw size={14} className={loadingModulos.encarregados ? "animate-spin text-blue-600" : "text-slate-300"} />
              </button>

              <button onClick={() => setConfirma('examinadoras')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 text-left transition-all">
                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><ShieldCheck size={20}/></div>
                <div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Examinadoras</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">Restaura Contatos</p></div>
                <RefreshCw size={14} className={loadingModulos.examinadoras ? "animate-spin text-purple-600" : "text-slate-300"} />
              </button>

              <button onClick={() => setConfirma('tudo')} className="mt-4 bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center gap-4 active:scale-95 transition-all text-left">
                <div className="p-3 bg-white/10 text-white rounded-2xl"><Database size={20}/></div>
                <div className="flex-grow"><h4 className="text-[11px] font-[900] uppercase text-white italic">Hard Reset Total</h4><p className="text-[7px] font-bold text-white/40 uppercase tracking-widest italic">Restaura Todo o Sistema</p></div>
                <RefreshCw size={16} className={loadingModulos.tudo ? "animate-spin text-white" : "text-white/20"} />
              </button>
            </div>
          )}
        </div>
      </div>

      {confirma && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95">
            <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
            <h3 className="text-lg font-[900] uppercase italic text-slate-950 leading-tight tracking-tighter">Confirmar Reset?</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-4 leading-relaxed">Isso apagará os dados atuais do módulo {confirma.toUpperCase()} para restaurar o backup oficial.</p>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={() => syncModulo(confirma)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg transition-all">Sim, Restaurar Backup</button>
              <button onClick={() => setConfirma(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] transition-all">Não, Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}

      {editandoUser && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none mb-6">Ajustar Usuário</h3>
            <div className="space-y-4 text-left">
              <div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span>
                <select value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span>
                <select value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">
                  {CARGOS_LISTA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
                </select>
              </div>
              <button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, cidade: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl mt-4 transition-all">Salvar Ajustes</button>
              <button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase transition-all text-center">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default PainelMaster;