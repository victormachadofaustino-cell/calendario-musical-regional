import React, { useState, useEffect, useMemo } from 'react'; // Ferramenta base do React para gerenciar o estado e memória da tela.
import { db, auth } from '../firebaseConfig'; // Importa a conexão com o banco de dados e o sistema de login.
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, setDoc, addDoc,
  orderBy, limit
} from 'firebase/firestore'; // Ferramentas avançadas para gerenciar documentos e realizar operações em lote (Batch).
import { sendPasswordResetEmail } from 'firebase/auth'; // Ferramenta para enviar e-mail de recuperação de senha.
import { 
  Check, X, Database, RefreshCw, ShieldCheck, ShieldAlert,
  MapPin, Users, Edit3, Save, Mail, AlertCircle, User, Lock, Briefcase, Trash2, ArrowRight, Shield, TrendingDown, Clock, Activity, Trophy, Home, Star,
  MessageSquare, ChevronDown, ChevronUp,
  History as HistoryIcon 
} from 'lucide-react'; // Ícones para a interface do painel.
import Feedback from './Feedback'; // Componente de alertas de sucesso ou erro.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes por cima do app.
import AbaFeedbackMaster from './AbaFeedbackMaster'; // Sub-componente para gerenciar os tickets da lâmpada.

// Importações de Constantes, Utilitários e Permissões
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades'; // Listas oficiais de cidades e cargos.
import { isMaster, obterNivelAcesso } from '../constants/permissions'; // Motor de regras de acesso que criamos.

// Importações da estrutura de backup (Arquivos locais para restauração de emergência)
import { EXAMINADORAS } from '../../migracao_backup/data/migrarExaminadoras';
import { REGIONAIS as ENCARREGADOS_LISTA } from '../../migracao_backup/data/migrarRegionaisContatos';
import { NOVOS_REGIONAIS_DATA } from '../../migracao_backup/data/migrarRegionais';
import { LOCAIS_DATA } from '../../migracao_backup/data/migrarLocais';

const PainelMaster = ({ aoFechar, userLogado, pendenciasCount }) => { // Componente que exibe o painel de perfil e administrativo.
  const [usuariosPendentes, setUsuariosPendentes] = useState([]); // Lista de novos cadastros aguardando aprovação.
  const [sugestoesAlteracao, setSugestoesAlteracao] = useState([]); // Lista de edições enviadas pelos colaboradores.
  const [todosUsuarios, setTodosUsuarios] = useState([]); // Lista de todos os usuários ativos no sistema.
  const [rankingAtividade, setRankingAtividade] = useState([]); // Dados para o ranking de atividades.
  const [countTickets, setCountTickets] = useState(0); // Quantidade de mensagens de suporte em aberto.

  const [openAcessos, setOpenAcessos] = useState(false); // Controla se a lista de acessos novos está aberta.
  const [openDados, setOpenDados] = useState(false); // Controla se a lista de sugestões de dados está aberta.
  const [openApp, setOpenApp] = useState(false); // Controla se a lista de tickets está aberta.

  const masterLogado = isMaster(userLogado); // BLOQUEIO DE SEGURANÇA: Identifica se quem está usando é o Maestro (Master).
  const [aba, setAba] = useState(masterLogado ? 'pendentes' : 'perfil'); // Define qual aba aparece primeiro baseada no cargo.
  
  const [feedback, setFeedback] = useState(null); // Mostra avisos de sucesso ou erro no topo da tela.
  const [loadingModulos, setLoadingModulos] = useState({}); // Ícone de "girando" enquanto o sistema trabalha.
  const [confirma, setConfirma] = useState(null); // Janela de "Tem certeza?" antes de apagar algo.
  const [configLista, setConfigLista] = useState({ url: '', dataReferencia: '', atualizacao: '' }); // Dados da Lista de Batismos.
  
  const [meuNome, setMeuNome] = useState(userLogado?.nome || ''); // Campo onde o usuário digita o próprio nome.
  const [minhaCidade, setMinhaCidade] = useState(userLogado?.cidade || ''); // Guarda a cidade atual do perfil.
  const [meuCargo, setMeuCargo] = useState(userLogado?.cargo || ''); // Guarda o cargo atual do perfil.
  
  const [editandoUser, setEditandoUser] = useState(null); // Identifica qual usuário o Master clicou para editar.
  const [novoCargo, setNovoCargo] = useState(''); // Novo cargo escolhido pelo Master para outro usuário.
  const [novaCidade, setNovaCidade] = useState(''); // Nova cidade escolhida pelo Master para outro usuário.

  useEffect(() => { // Vigia o banco de dados em tempo real (onSnapshot).
    if (!userLogado || !masterLogado) return; // Se não for Master, o sistema não abre os ouvidos para dados sensíveis de outros.

    let unsubP, unsubS, unsubC, unsubR, unsubT;

    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => { // Escuta a lista de usuários.
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuariosPendentes(lista.filter(u => u.status === 'pendente'));
      setTodosUsuarios(lista.filter(u => u.status !== 'pendente'));
    });

    unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => { // Escuta sugestões de alteração de dados.
      setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    unsubT = onSnapshot(query(collection(db, "feedback_usuarios"), where("status", "==", "pendente")), (snap) => { // Escuta mensagens da lâmpada.
      setCountTickets(snap.size);
    });

    const qRanking = query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(50));
    unsubR = onSnapshot(qRanking, (snap) => { // Escuta o histórico para montar o ranking.
      setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => { // Escuta a URL da lista oficial.
      if (snap.exists()) setConfigLista(snap.data());
    });

    return () => { // Função de limpeza para não sobrecarregar o celular.
      if (unsubP) unsubP(); if (unsubS) unsubS(); if (unsubC) unsubC(); if (unsubR) unsubR(); if (unsubT) unsubT();
    };
  }, [masterLogado, userLogado]);

  const dispararFeedback = (msg, tipo) => { setFeedback({ msg, tipo }); }; // Faz o alerta colorido aparecer.

  const atualizarMeuPerfil = async (e) => { // Salva a mudança apenas do Nome do usuário logado.
    e.preventDefault();
    try {
      // TRAVA DE SEGURANÇA: Só enviamos o nome. O cargo e cidade ficam protegidos no banco.
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { nome: meuNome });
      dispararFeedback("Nome atualizado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao atualizar perfil", 'erro'); }
  };

  const gerenciarUsuario = async (uid, campos) => { // Função do Master para mudar dados de qualquer pessoa.
    try {
      await updateDoc(doc(db, "usuarios", uid), campos);
      dispararFeedback("Usuário atualizado!", 'sucesso');
      setEditandoUser(null);
    } catch (e) { dispararFeedback("Falha na atualização", 'erro'); }
  };

  const resetarSenhaUsuario = async (email) => { // Envia o e-mail de "Esqueci minha senha".
    try {
      await sendPasswordResetEmail(auth, email);
      dispararFeedback("E-mail de redefinição enviado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao solicitar reset", 'erro'); }
  };

  const processarSugestao = async (sug, aprovado) => { // Aceita ou recusa uma sugestão de mudança de ensaio.
    const batch = writeBatch(db); // Prepara um pacote de ordens para o banco.
    try {
      if (aprovado) {
        let colecao = sug.tipo.includes('local') ? "ensaios_locais" : 
                      sug.tipo.includes('regional') ? "ensaios_regionais" : 
                      sug.tipo.includes('examinadora') ? "examinadoras" : "encarregados_regionais";

        const refDocOficial = doc(db, colecao, sug.ensaioId);
        batch.update(refDocOficial, sug.dadosSugeridos); // Ordena a atualização.
        
        const refHistorico = doc(collection(db, "sugestoes_aprovadas_historico"));
        batch.set(refHistorico, { ...sug, dataProcessamento: new Date(), processadoPor: userLogado.nome }); // Grava quem autorizou.
        dispararFeedback("Alteração aprovada!", 'sucesso');
      }
      batch.delete(doc(db, "sugestoes_pendentes", sug.id)); // Remove da fila.
      await batch.commit(); // Executa o pacote.
    } catch (e) { dispararFeedback("Erro no processamento", 'erro'); }
  };

  const syncModulo = async (tipo) => { // Restaura os dados originais (Backup).
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
          batch.set(doc(collection(db, "ensaios_regionais")), { dia: Number(dia), mes: MESES[parseInt(mesNum) - 1], hora: item.hour, weekday: item.weekday, sede: item.city.toUpperCase(), local: item.location, tipo: "Regional" });
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
      dispararFeedback(`Sincronização concluída!`, 'sucesso');
    } catch (e) { dispararFeedback(`Falha na sincronização`, 'erro'); }
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); }
  };

  const CompararCampo = ({ label, antigo, novo }) => { // Desenha o quadro de comparação entre dado velho e novo.
    const mudou = String(antigo || '').trim() !== String(novo || '').trim();
    if (!antigo && !novo) return null;
    return (
      <div className={`p-3 rounded-2xl border transition-all ${mudou ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-black uppercase text-slate-400">{label}</span>{mudou && <span className="bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase">Alterado</span>}</div>
        <div className="flex items-center gap-2 flex-wrap"><span className={`text-[10px] font-bold ${mudou ? 'text-red-400 line-through bg-red-50 px-1 rounded' : 'text-slate-600'}`}>{antigo || '---'}</span>{mudou && <><ArrowRight size={10} className="text-amber-500 shrink-0" /><span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded uppercase">{novo}</span></>}</div>
      </div>
    );
  };

  return ( // Estrutura visual do painel flutuante.
    <div className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      <div className="bg-[#F1F5F9] w-full max-w-xl rounded-[2.5rem] flex flex-col h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 text-left">
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">{masterLogado ? 'Gestão Regional' : 'Meu Perfil'}</h2><button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={20}/></button></div>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setAba('perfil')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Perfil</button>
            {masterLogado && (
              <><button onClick={() => setAba('pendentes')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'pendentes' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Fila {pendenciasCount > 0 && `(${pendenciasCount})`}</button>
                <button onClick={() => setAba('usuarios')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'usuarios' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Users</button>
                <button onClick={() => setAba('config')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'config' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Manut.</button></>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar pb-24">
          {aba === 'perfil' && (
            <div className="space-y-4 animate-in">
              <form onSubmit={atualizarMeuPerfil} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><div className="p-3 bg-slate-950 text-white rounded-2xl"><User size={20}/></div><h4 className="text-[11px] font-black uppercase text-slate-950 italic">Meus Dados</h4></div><button type="button" onClick={() => resetarSenhaUsuario(userLogado.email)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[7px] font-black uppercase border border-blue-100 active:scale-95 transition-all"><Lock size={12}/> Reset Senha</button></div>
                <div className="space-y-4 text-left">
                  {/* Nome continua editável para todos */}
                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Nome</span><input required type="text" value={meuNome} onChange={e => setMeuNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" /></div>
                  
                  {/* TRAVA DE SEGURANÇA: Se não for Master, exibe apenas texto. Se for Master, exibe o Dropdown. */}
                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span>
                    {masterLogado ? (
                      <select required value={minhaCidade} onChange={e => setMinhaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    ) : (
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-black text-slate-400 uppercase italic cursor-not-allowed select-none">{minhaCidade} </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span>
                    {masterLogado ? (
                      <select required value={meuCargo} onChange={e => setMeuCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CARGOS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    ) : (
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-black text-slate-400 uppercase italic cursor-not-allowed select-none">{meuCargo} </div>
                    )}
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-lg mt-2 transition-all"><Save size={16}/> Salvar Alterações</button>
              </form>
            </div>
          )}

          {masterLogado && aba === 'pendentes' && (
            <div className="space-y-4 animate-in text-left">
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenAcessos(!openAcessos)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Shield size={18}/></div><span className="text-[10px] font-black uppercase italic text-slate-950">Novos Acessos ({usuariosPendentes.length})</span></div>{openAcessos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                {openAcessos && (
                  <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100">
                    {usuariosPendentes.length === 0 ? <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Fila vazia</p> :
                      usuariosPendentes.map(u => (
                        <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all"><div className="flex flex-col text-left"><h4 className="text-[11px] font-black uppercase text-slate-950 italic">{u.nome}</h4><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{u.cargo} • {u.cidade}</p></div><div className="flex gap-2"><button onClick={() => gerenciarUsuario(u.id, { status: 'aprovado', ativo: true })} className="bg-green-500 text-white p-2.5 rounded-xl shadow-md active:scale-90"><Check size={16}/></button><button onClick={async () => await deleteDoc(doc(db, "usuarios", u.id))} className="bg-red-50 text-red-500 p-2.5 rounded-xl active:scale-90 transition-all"><Trash2 size={16}/></button></div></div>
                      ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenDados(!openDados)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Database size={18}/></div><span className="text-[10px] font-black uppercase italic text-slate-950">Sugestões de Mudança ({sugestoesAlteracao.length})</span></div>{openDados ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                {openDados && (
                  <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100">
                    {sugestoesAlteracao.length === 0 ? <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase">Sem sugestões</p> :
                      sugestoesAlteracao.map(s => (
                        <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                          <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start"><div className="text-left"><span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase italic">Módulo: {s.tipo?.replace('_', ' ')}</span><h4 className="text-[11px] font-[900] uppercase text-slate-950 italic mt-1 leading-none">{s.localidade || s.cidade || s.dadosSugeridos?.name}</h4><p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Sugerido por: {s.solicitanteNome}</p></div><div className="flex gap-2"><button onClick={() => processarSugestao(s, true)} className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg active:scale-90"><Check size={16}/></button><button onClick={() => processarSugestao(s, false)} className="bg-slate-100 text-slate-400 p-2 rounded-xl active:scale-90"><X size={16}/></button></div></div>
                          <div className="p-4 grid grid-cols-1 gap-1.5 bg-white"><CompararCampo label="Nome/Local" antigo={s.dadosAntigos?.localidade || s.dadosAntigos?.name} novo={s.dadosSugeridos?.localidade || s.dadosSugeridos?.name} /><CompararCampo label="Dia/Semana" antigo={s.dadosAntigos?.dia || s.dadosAntigos?.weekday} novo={s.dadosSugeridos?.dia || s.dadosSugeridos?.weekday} /><CompararCampo label="Horário" antigo={s.dadosAntigos?.hora} novo={s.dadosSugeridos?.hora} /><CompararCampo label="Contato" antigo={s.dadosAntigos?.contato || s.dadosAntigos?.contact} novo={s.dadosSugeridos?.contato || s.dadosSugeridos?.contact} /></div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenApp(!openApp)} className="w-full p-5 flex justify-between items-center bg-white active:bg-slate-50 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><MessageSquare size={18}/></div><span className="text-[10px] font-black uppercase italic text-slate-950">Feedback da Lâmpada ({countTickets})</span></div>{openApp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                {openApp && (<div className="p-4 bg-slate-50/50 border-t border-slate-100"><AbaFeedbackMaster /></div>)}
              </div>
            </div>
          )}

          {masterLogado && aba === 'usuarios' && (
            <div className="space-y-3 animate-in text-left">
              {todosUsuarios.sort((a, b) => b.nivel === 'master' ? 1 : -1).map(u => (
                <div key={u.id} className={`p-5 rounded-[2.2rem] shadow-sm border transition-all relative overflow-hidden ${!u.ativo ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>{u.nivel === 'master' && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[6px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Master</div>}<div className="flex justify-between items-start"><div className="flex flex-col"><h4 className="text-[12px] font-[900] uppercase text-slate-950 italic leading-none">{u.nome}</h4><p className="text-[9px] font-black text-blue-600 uppercase mt-1">{u.cargo} • {u.cidade}</p></div><div className="flex gap-1.5 shrink-0"><button onClick={() => gerenciarUsuario(u.id, { nivel: u.nivel === 'master' ? 'editor' : 'master' })} className={`p-3 rounded-xl active:scale-90 transition-all ${u.nivel === 'master' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}><Shield size={14}/></button><button onClick={() => { setEditandoUser(u); setNovoCargo(u.cargo); setNovaCidade(u.cidade); }} className="p-3 bg-slate-50 text-slate-500 rounded-xl active:scale-90 transition-all"><Edit3 size={14}/></button><button onClick={() => gerenciarUsuario(u.id, { ativo: !u.ativo })} className={`p-3 rounded-xl active:scale-90 transition-all ${u.ativo ? 'bg-green-50 text-green-600' : 'bg-red-200 text-red-800'}`}>{u.ativo ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}</button></div></div></div>
              ))}
            </div>
          )}

          {masterLogado && aba === 'config' && (
            <div className="grid grid-cols-1 gap-3 animate-in pb-10 text-left">
              <div className="bg-red-50 p-6 rounded-[2.2rem] border border-red-100 mb-2"><div className="flex items-center gap-2 text-red-600 mb-2"><AlertCircle size={18}/><h4 className="text-[10px] font-black uppercase italic">Área de Restauração</h4></div><p className="text-[9px] font-bold text-red-900 uppercase leading-relaxed">Estas ações restauram o banco de dados oficial e apagam as mudanças manuais feitas no App.</p></div>
              <button onClick={() => setConfirma('locais')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"><div className="p-3 bg-emerald-600 text-white rounded-2xl"><Home size={20}/></div><div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Locais</h4><p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura igrejas e horários</p></div><RefreshCw size={14} className={loadingModulos.locais ? "animate-spin" : "text-slate-300"} /></button>
              <button onClick={() => setConfirma('regionais')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"><div className="p-3 bg-amber-500 text-white rounded-2xl"><Star size={20}/></div><div className="flex-grow"><h4 className="text-[10px] font-black uppercase text-slate-950 italic">Ensaios Regionais</h4><p className="text-[7px] font-bold text-slate-400 uppercase italic">Restaura agenda da Regional</p></div><RefreshCw size={14} className={loadingModulos.regionais ? "animate-spin" : "text-slate-300"} /></button>
              <button onClick={() => setConfirma('tudo')} className="mt-4 bg-slate-950 p-6 rounded-[2.2rem] shadow-xl flex items-center gap-4 active:scale-95 text-white transition-all"><div className="p-3 bg-white/10 text-white rounded-2xl"><Database size={20}/></div><div className="flex-grow"><h4 className="text-[11px] font-[900] uppercase italic">Restaurar Tudo</h4><p className="text-[7px] font-bold text-white/40 uppercase italic">Zera o banco e sobe os backups</p></div><RefreshCw size={16} className={loadingModulos.tudo ? "animate-spin" : "text-white/20"} /></button>
            </div>
          )}
        </div>
      </div>

      {confirma && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95">
            <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
            <h3 className="text-lg font-[900] uppercase italic text-slate-950 leading-tight">Confirmar Reset?</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-4">Esta ação substituirá os dados atuais do módulo {confirma.toUpperCase()} pelo backup oficial.</p>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={() => syncModulo(confirma)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg">Confirmar Restauração</button>
              <button onClick={() => setConfirma(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}

      {editandoUser && createPortal(
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-6">Ajustar Colaborador</h3>
            <div className="space-y-4 text-left">
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span><select value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span><select value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CARGOS_LISTA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}</select></div>
              <button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, cidade: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl mt-4">Salvar Ajustes</button>
              <button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase text-center mt-2">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default PainelMaster;