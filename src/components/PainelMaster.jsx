import React, { useState, useEffect, useMemo } from 'react'; // Ferramenta base do React para gerenciar o estado e memória da tela.
import { db, auth } from '../firebaseConfig'; // Importa a conexão com o banco de dados e o sistema de login.
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, setDoc, addDoc,
  orderBy, limit
} from 'firebase/firestore'; // Ferramentas avançadas para gerenciar documentos e realizar operações no banco.
import { sendPasswordResetEmail } from 'firebase/auth'; // Ferramenta para enviar e-mail de recuperação de senha.
import { 
  X, AlertCircle, RefreshCw, Database, Link, Save, FileText, History, Music2
} from 'lucide-react'; // Ícones para modais, botões de salvar e identificação dos links.
import Feedback from './Feedback'; // Componente de alertas de sucesso ou erro.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes por cima do app.

// --- IMPORTAÇÕES DOS SUB-COMPONENTES (OS NOSSOS MÚSICOS) ---
import AbaPerfil from './PainelMaster/AbaPerfil'; // Importa a sala de edição do próprio perfil.
import AbaPendencias from './PainelMaster/AbaPendencias'; // Importa a triagem de novos usuários e sugestões.
import AbaGerenciarUsuarios from './PainelMaster/AbaGerenciarUsuarios'; // Importa a gestão da lista de músicos.
import AbaManutencao from './PainelMaster/AbaManutencao'; // Importa as ferramentas de backup e restauração.
import CompararCampo from './PainelMaster/CompararCampos'; // Importa a ferramenta visual de "Antes vs Depois".

// Importações de Constantes e Utilitários
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades'; // Listas oficiais de cidades e cargos da Regional.

// Importações da estrutura de backup (Mantidas para as funções de restauração)
import { EXAMINADORAS } from '../../migracao_backup/data/migrarExaminadoras'; // Dados de backup das examinadoras.
import { REGIONAIS as ENCARREGADOS_LISTA } from '../../migracao_backup/data/migrarRegionaisContatos'; // Dados de backup dos encarregados regionais.
import { NOVOS_REGIONAIS_DATA } from '../../migracao_backup/data/migrarRegionais'; // Dados de backup da agenda de regionais.
import { LOCAIS_DATA } from '../../migracao_backup/data/migrarLocais'; // Dados de backup dos ensaios locais.

const PainelMaster = ({ aoFechar, userLogado, pendenciasCount }) => { // Componente Maestro que coordena todo o painel administrativo.
  const [usuariosPendentes, setUsuariosPendentes] = useState([]); // Lista de novos cadastros aguardando aprovação.
  const [sugestoesAlteracao, setSugestoesAlteracao] = useState([]); // Lista de edições enviadas pelos colaboradores locais.
  const [todosUsuarios, setTodosUsuarios] = useState([]); // Lista de todos os usuários aprovados no sistema.
  const [rankingAtividade, setRankingAtividade] = useState([]); // Dados para o histórico de quem aprovou o quê.

  const [openAcessos, setOpenAcessos] = useState(false); // Controle da sanfona para abrir a lista de Novos Acessos.
  const [openDados, setOpenDados] = useState(false); // Controle da sanfona para abrir a lista de Sugestões de Dados.

  const isMaster = userLogado?.nivel === 'master'; // BLOQUEIO DE SEGURANÇA: Identifica se o usuário logado é o Maestro Regional.
  
  const [aba, setAba] = useState(isMaster ? 'pendentes' : 'perfil'); // Define qual aba o sistema mostra primeiro ao abrir.
  
  const [feedback, setFeedback] = useState(null); // Estado para mostrar avisos coloridos de sucesso ou erro na tela.
  const [loadingModulos, setLoadingModulos] = useState({}); // Estado que mostra o ícone de carregando nos botões de backup.
  const [confirma, setConfirma] = useState(null); // Estado que controla o modal de confirmação "Tem certeza?".
  
  // --- ESTADOS PARA GESTÃO DE LINKS (A NOVA SALA DE MÁQUINAS) ---
  const [linksEdit, setLinksEdit] = useState({ 
    lista_url: '', lista_data: '', 
    hist_url: '', hist_data: '',
    prog_mus_url: '', prog_org_url: '', prog_data: ''
  });

  const [meuNome, setMeuNome] = useState(userLogado?.nome || ''); // Nome do perfil que você pode editar.
  const [minhaCidade, setMinhaCidade] = useState(userLogado?.cidade || ''); // Cidade do seu perfil.
  const [meuCargo, setMeuCargo] = useState(userLogado?.cargo || ''); // Cargo do seu perfil.
  
  const [editandoUser, setEditandoUser] = useState(null); // Guarda qual usuário da lista você clicou para ajustar.
  const [novoCargo, setNovoCargo] = useState(''); // Guarda o novo cargo escolhido na janelinha de ajuste.
  const [novaCidade, setNovaCidade] = useState(''); // Guarda a nova cidade escolhida na janelinha de ajuste.

  useEffect(() => { // Vigia o banco de dados em tempo real enquanto este painel estiver aberto.
    if (!userLogado) return; // Se não houver ninguém logado por erro, ele não tenta conectar ao banco.

    let unsubP, unsubS, unsubC, unsubH, unsubPR, unsubR; // Variáveis de escuta do banco de dados.

    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => { // Escuta a lista de usuários no Firebase.
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })); // Transforma os dados brutos em lista legível.
      setUsuariosPendentes(lista.filter(u => u.status === 'pendente')); // Filtra quem aguarda aprovação.
      setTodosUsuarios(lista.filter(u => u.status !== 'pendente')); // Pega os aprovados.
    });

    if (isMaster) { // Se for Master, habilita funções de auditoria e links.
      unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => { // Escuta sugestões de correção de dados.
        setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
      });

      const qRanking = query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(50)); // Busca histórico de aprovações.
      unsubR = onSnapshot(qRanking, (snap) => {
        setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
      });

      // ESCUTA DOS LINKS: Sincroniza Lista Oficial, Histórico e Programa Mínimo com o que está no banco.
      unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, lista_url: snap.data().url, lista_data: snap.data().atualizacao }));
      });
      unsubH = onSnapshot(doc(db, "configuracoes", "historico_musical"), (snap) => {
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, hist_url: snap.data().url, hist_data: snap.data().atualizacao }));
      });
      unsubPR = onSnapshot(doc(db, "configuracoes", "programa_minimo"), (snap) => {
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, prog_mus_url: snap.data().urlMusicos, prog_org_url: snap.data().urlOrganistas, prog_data: snap.data().atualizacao }));
      });
    }

    return () => { // Desliga todas as conexões ao sair do painel Master.
      if (unsubP) unsubP(); if (unsubS) unsubS(); if (unsubC) unsubC(); if (unsubH) unsubH(); if (unsubPR) unsubPR(); if (unsubR) unsubR();
    };
  }, [isMaster, userLogado]);

  const dispararFeedback = (msg, tipo) => { setFeedback({ msg, tipo }); }; // Função que exibe o alerta colorido na tela.

  const salvarLinksOficiais = async () => { // Função que grava todos os novos links do Master no banco de dados.
    try {
      const batch = writeBatch(db); // Prepara um pacote de atualizações simultâneas.
      batch.set(doc(db, "configuracoes", "lista_oficial"), { url: linksEdit.lista_url, atualizacao: linksEdit.lista_data });
      batch.set(doc(db, "configuracoes", "historico_musical"), { url: linksEdit.hist_url, atualizacao: linksEdit.hist_data });
      batch.set(doc(db, "configuracoes", "programa_minimo"), { urlMusicos: linksEdit.prog_mus_url, urlOrganistas: linksEdit.prog_org_url, atualizacao: linksEdit.prog_data });
      await batch.commit(); // Executa o salvamento no Firebase em milissegundos.
      dispararFeedback("Links atualizados com sucesso!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao salvar links", 'erro'); }
  };

  const atualizarMeuPerfil = async (e) => { // Salva as mudanças no próprio cadastro do usuário.
    e.preventDefault(); 
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
        nome: meuNome, cidade: minhaCidade, cargo: meuCargo
      }); 
      dispararFeedback("Perfil atualizado!", 'sucesso'); 
    } catch (e) { dispararFeedback("Erro ao atualizar", 'erro'); } 
  };

  const gerenciarUsuario = async (uid, campos) => { // Altera nível ou status de outro usuário na lista.
    try {
      await updateDoc(doc(db, "usuarios", uid), campos); 
      dispararFeedback("Usuário atualizado!", 'sucesso');
      setEditandoUser(null); 
    } catch (e) { dispararFeedback("Erro na atualização", 'erro'); }
  };

  const resetarSenhaUsuario = async (email) => { // Dispara e-mail de recuperação de senha do Firebase.
    try {
      await sendPasswordResetEmail(auth, email); 
      dispararFeedback("E-mail de reset enviado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao enviar reset", 'erro'); }
  };

  const processarSugestao = async (sug, aprovado) => { // Aceita ou recusa sugestões de colaboradores locais.
    try {
      if (aprovado) { 
        let colecao = ""; 
        if (sug.tipo === 'local') colecao = "ensaios_locais";
        else if (sug.tipo === 'regional') colecao = "ensaios_regionais";
        else if (sug.tipo === 'contato_regional') colecao = "encarregados_regionais";
        else if (sug.tipo === 'contato_examinadora') colecao = "examinadoras";
        await updateDoc(doc(db, colecao, sug.ensaioId), sug.dadosSugeridos); 
        await addDoc(collection(db, "sugestoes_aprovadas_historico"), { ...sug, dataProcessamento: new Date(), processadoPor: userLogado.nome }); 
        dispararFeedback("Alteração aplicada!", 'sucesso');
      }
      await deleteDoc(doc(db, "sugestoes_pendentes", sug.id)); 
    } catch (e) { dispararFeedback("Erro ao processar", 'erro'); }
  };

  const syncModulo = async (tipo) => { // Restaura dados baseados nos arquivos de backup.
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
      dispararFeedback(`Backup restaurado!`, 'sucesso');
    } catch (e) { dispararFeedback(`Erro na sincronização`, 'erro'); }
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); } 
  };

  return ( // Início da parte visual do Painel administrativo.
    <div className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      <div className="bg-[#F1F5F9] w-full max-w-xl rounded-[2.5rem] flex flex-col h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 text-left">
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">{isMaster ? 'Painel Master' : 'Gestão de Usuários'}</h2>
            <button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={20}/></button>
          </div>
          {/* Menu de Abas superior do painel */}
          <div className={`grid ${isMaster ? 'grid-cols-5' : 'grid-cols-2'} gap-1 bg-slate-100 p-1.5 rounded-2xl`}>
            <button onClick={() => setAba('perfil')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Perfil</button>
            {isMaster && (
              <>
                <button onClick={() => setAba('pendentes')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'pendentes' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Fila {pendenciasCount > 0 && `(${pendenciasCount})`}</button>
                <button onClick={() => setAba('links')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'links' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Links</button>
                <button onClick={() => setAba('config')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'config' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Manut.</button>
              </>
            )}
            <button onClick={() => setAba('usuarios')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'usuarios' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Users</button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar pb-24">
          {aba === 'perfil' && <AbaPerfil masterLogado={isMaster} meuNome={meuNome} setMeuNome={setMeuNome} minhaCidade={minhaCidade} setMinhaCidade={setMinhaCidade} meuCargo={meuCargo} setMeuCargo={setMeuCargo} atualizarMeuPerfil={atualizarMeuPerfil} resetarSenhaUsuario={resetarSenhaUsuario} userEmail={userLogado.email} />}
          {isMaster && aba === 'pendentes' && <AbaPendencias openAcessos={openAcessos} setOpenAcessos={setOpenAcessos} usuariosPendentes={usuariosPendentes} gerenciarUsuario={gerenciarUsuario} deleteDoc={deleteDoc} doc={doc} db={db} openDados={openDados} setOpenDados={setOpenDados} sugestoesAlteracao={sugestoesAlteracao} processarSugestao={processarSugestao} CompararCampo={CompararCampo} />}
          
          {/* --- ABA DE GESTÃO DE LINKS (A NOVA FERRAMENTA DO MAESTRO COM QUEBRA DE TEXTO) --- */}
          {isMaster && aba === 'links' && (
            <div className="space-y-6 animate-in">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="p-2.5 bg-slate-950 text-white rounded-xl"><Link size={18}/></div><h4 className="text-[11px] font-black uppercase text-slate-950 italic">Central de Documentos PDF</h4></div>
                
                {/* SETOR DA LISTA OFICIAL (USA TEXTAREA PARA MOSTRAR LINK INTEIRO) */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-amber-500"/><span className="text-[8px] font-black uppercase text-slate-400">Lista de Batismos</span></div>
                  <textarea placeholder="URL do Google Drive" value={linksEdit.lista_url} onChange={e => setLinksEdit({...linksEdit, lista_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Ex: Março/2026" value={linksEdit.lista_data} onChange={e => setLinksEdit({...linksEdit, lista_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>

                {/* SETOR DO HISTÓRICO MUSICAL (USA TEXTAREA PARA MOSTRAR LINK INTEIRO) */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><History size={14} className="text-slate-500"/><span className="text-[8px] font-black uppercase text-slate-400">Histórico Musical</span></div>
                  <textarea placeholder="URL do Google Drive" value={linksEdit.hist_url} onChange={e => setLinksEdit({...linksEdit, hist_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Ex: Revisão 2026" value={linksEdit.hist_data} onChange={e => setLinksEdit({...linksEdit, hist_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>

                {/* SETOR DO PROGRAMA MÍNIMO (USA TEXTAREAS PARA MOSTRAR LINKS INTEIROS) */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><Music2 size={14} className="text-blue-500"/><span className="text-[8px] font-black uppercase text-slate-400">Programa Mínimo (PDFs)</span></div>
                  <span className="text-[7px] font-black text-slate-300 ml-1 uppercase italic">Link Músicos</span>
                  <textarea placeholder="URL PDF Músicos" value={linksEdit.prog_mus_url} onChange={e => setLinksEdit({...linksEdit, prog_mus_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <span className="text-[7px] font-black text-slate-300 ml-1 uppercase italic">Link Organistas</span>
                  <textarea placeholder="URL PDF Organistas" value={linksEdit.prog_org_url} onChange={e => setLinksEdit({...linksEdit, prog_org_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Ex: Edição 2023" value={linksEdit.prog_data} onChange={e => setLinksEdit({...linksEdit, prog_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>

                <button onClick={salvarLinksOficiais} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all"><Save size={16}/> Salvar Todos os Links</button>
              </div>
            </div>
          )}

          {aba === 'usuarios' && <AbaGerenciarUsuarios todosUsuarios={todosUsuarios} gerenciarUsuario={gerenciarUsuario} resetarSenhaUsuario={resetarSenhaUsuario} setEditandoUser={setEditandoUser} editandoUser={editandoUser} novoCargo={novoCargo} setNovoCargo={setNovoCargo} novaCidade={novaCidade} setNovaCidade={setNovaCidade} userLogado={userLogado} />}
          {isMaster && aba === 'config' && <AbaManutencao setConfirma={setConfirma} loadingModulos={loadingModulos} />}
        </div>
      </div>
      {/* Modais flutuantes de confirmação e ajuste fora da caixa principal */}
      {confirma && createPortal(<div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"><div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95"><div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div><h3 className="text-lg font-[900] uppercase italic text-slate-950 leading-tight tracking-tighter">Confirmar Reset?</h3><p className="text-slate-400 text-[10px] font-bold uppercase mt-4 leading-relaxed">Isso apagará os dados atuais do módulo {confirma.toUpperCase()} para restaurar o backup oficial.</p><div className="flex flex-col gap-2 mt-8"><button onClick={() => syncModulo(confirma)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg transition-all">Sim, Restaurar Backup</button><button onClick={() => setConfirma(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] transition-all">Não, Cancelar</button></div></div></div>, document.body)}
      {editandoUser && createPortal(<div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-left"><div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95"><h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none mb-6">Ajustar Usuário</h3><div className="space-y-4 text-left"><div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span><select value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span><select value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CARGOS_LISTA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}</select></div><button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, cidade: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl mt-4 transition-all">Salvar Ajustes</button><button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase transition-all text-center">Cancelar</button></div></div></div>, document.body)}
    </div>
  );
};

export default PainelMaster; // Exporta o administrador regional com a nova aba de links otimizada para links longos.