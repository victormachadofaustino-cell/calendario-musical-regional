// src/components/PainelMaster.jsx // Identifica o arquivo maestro que coordena todo o painel administrativo da Regional.

import React, { useState, useEffect, useMemo } from 'react'; // Ferramenta base do React para gerenciar o estado e memória da tela.
import { db, auth } from '../firebaseConfig'; // Importa a conexão com o banco de dados e o sistema de login.
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, setDoc, addDoc,
  orderBy, limit
} from 'firebase/firestore'; // Ferramentas avançadas para gerenciar documentos no Firebase.
import { sendPasswordResetEmail } from 'firebase/auth'; // Ferramenta para enviar e-mail de recuperação de senha.
import { 
  X, AlertCircle, RefreshCw, Database, Link, Save, FileText, History, Music2
} from 'lucide-react'; // Ícones para modais e identificação visual.
import Feedback from './Feedback'; // Componente de alertas de sucesso ou erro.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes por cima do app.

// --- IMPORTAÇÕES DOS SUB-COMPONENTES ---
import AbaPerfil from './PainelMaster/AbaPerfil'; // Sala de edição do próprio perfil.
import AbaPendencias from './PainelMaster/AbaPendencias'; // Triagem de novos usuários e sugestões.
import AbaGerenciarUsuarios from './PainelMaster/AbaGerenciarUsuarios'; // Gestão da lista de músicos aprovados.
import AbaManutencao from './PainelMaster/AbaManutencao'; // Ferramentas de backup e restauração.
import CompararCampo from './PainelMaster/CompararCampos'; // Ferramenta visual de "Antes vs Depois".

// Importações de Constantes, Permissões e Telemetria
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades'; // Listas oficiais da Regional.
import { registrarEvento } from '../constants/comuns'; // AFINAÇÃO: O Olheiro que grava as ações administrativas no Dashboard.

// Importações da estrutura de backup
import { EXAMINADORAS } from '../../migracao_backup/data/migrarExaminadoras'; // Importa dados de backup das irmãs examinadoras.
import { REGIONAIS as ENCARREGADOS_LISTA } from '../../migracao_backup/data/migrarRegionaisContatos'; // Importa dados de backup dos encarregados.
import { NOVOS_REGIONAIS_DATA } from '../../migracao_backup/data/migrarRegionais'; // Importa a agenda de ensaios regionais.
import { LOCAIS_DATA } from '../../migracao_backup/data/migrarLocais'; // Importa a lista de ensaios das igrejas locais.

const PainelMaster = ({ aoFechar, userLogado, pendenciasCount }) => { // Componente Maestro do painel administrativo.
  const [usuariosPendentes, setUsuariosPendentes] = useState([]); // Lista de novos cadastros aguardando aprovação.
  const [sugestoesAlteracao, setSugestoesAlteracao] = useState([]); // Lista de edições enviadas por colaboradores.
  const [todosUsuarios, setTodosUsuarios] = useState([]); // Lista de todos os usuários aprovados.
  const [rankingAtividade, setRankingAtividade] = useState([]); // Histórico de auditoria de quem mais colabora.

  const [openAcessos, setOpenAcessos] = useState(false); // Controle da "sanfona" (abrir/fechar) de Novos Acessos.
  const [openDados, setOpenDados] = useState(false); // Controle da "sanfona" (abrir/fechar) de Sugestões de dados.

  const isMaster = userLogado?.nivel === 'master'; // BLOQUEIO DE SEGURANÇA: Identifica se o usuário logado tem a batuta de Master.
  
  const [aba, setAba] = useState(isMaster ? 'pendentes' : 'perfil'); // Define qual aba aparecerá primeiro para o usuário.
  const [feedback, setFeedback] = useState(null); // Estado para mostrar as mensagens de sucesso ou erro no topo.
  const [loadingModulos, setLoadingModulos] = useState({}); // Controla o ícone de rodinha girando durante os backups.
  const [confirma, setConfirma] = useState(null); // Controla o balão de "Tem certeza que deseja apagar?".
  
  const [linksEdit, setLinksEdit] = useState({ // Guarda temporariamente os endereços de PDF antes de salvar.
    lista_url: '', lista_data: '', hist_url: '', hist_data: '', prog_mus_url: '', prog_org_url: '', prog_data: ''
  });

  const [meuNome, setMeuNome] = useState(userLogado?.nome || ''); // Nome editável do Master no formulário de perfil.
  const [minhaCidade, setMinhaCidade] = useState(userLogado?.cidade || ''); // Cidade do Master no formulário de perfil.
  const [meuCargo, setMeuCargo] = useState(userLogado?.cargo || ''); // Cargo do Master no formulário de perfil.
  
  const [editandoUser, setEditandoUser] = useState(null); // Guarda qual usuário o Master clicou para ajustar os dados.
  const [novoCargo, setNovoCargo] = useState(''); // Armazena o novo cargo escolhido durante o ajuste.
  const [novaCidade, setNovaCidade] = useState(''); // Armazena a nova cidade escolhida durante o ajuste.

  useEffect(() => { // Vigia o banco de dados em tempo real para atualizar as listas automaticamente.
    if (!userLogado) return; // Se não houver ninguém logado, cancela a vigilância.
    let unsubP, unsubS, unsubC, unsubH, unsubPR, unsubR; // Variáveis para desligar os ouvintes quando sair da tela.

    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => { // Ouve a coleção de usuários no Firebase.
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })); // Transforma os documentos do banco em uma lista legível.
      setUsuariosPendentes(lista.filter(u => u.status === 'pendente')); // Separa apenas quem ainda não foi aprovado.
      setTodosUsuarios(lista.filter(u => u.status !== 'pendente')); // Separa quem já faz parte do sistema.
    });

    if (isMaster) { // Se for Master, liga os ouvintes de áreas administrativas sensíveis.
      unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => { // Ouve as sugestões de alteração de ensaios.
        setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Atualiza a lista de sugestões na tela.
      });
      const qRanking = query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(50)); // Busca os últimos 50 registros de auditoria.
      unsubR = onSnapshot(qRanking, (snap) => { setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }); // Atualiza o histórico de auditoria.

      unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => { // Ouve as configurações da Lista de Batismos.
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, lista_url: snap.data().url, lista_data: snap.data().atualizacao })); // Carrega os dados da lista nos campos de edição.
      });
      unsubH = onSnapshot(doc(db, "configuracoes", "historico_musical"), (snap) => { // Ouve as configurações do Histórico Musical.
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, hist_url: snap.data().url, hist_data: snap.data().atualizacao })); // Carrega os dados do histórico nos campos de edição.
      });
      unsubPR = onSnapshot(doc(db, "configuracoes", "programa_minimo"), (snap) => { // Ouve as configurações dos Programas Mínimos.
        if (snap.exists()) setLinksEdit(prev => ({ ...prev, prog_mus_url: snap.data().urlMusicos, prog_org_url: snap.data().urlOrganistas, prog_data: snap.data().atualizacao })); // Carrega os links dos programas mínimos.
      });
    }

    return () => { // Função de limpeza: desliga todos os ouvintes ao fechar o painel para não gastar internet/processamento.
      if (unsubP) unsubP(); if (unsubS) unsubS(); if (unsubC) unsubC(); if (unsubH) unsubH(); if (unsubPR) unsubPR(); if (unsubR) unsubR();
    };
  }, [isMaster, userLogado]);

  const dispararFeedback = (msg, tipo) => { setFeedback({ msg, tipo }); }; // Função auxiliar para mostrar alertas rápidos na tela.

  const salvarLinksOficiais = async () => { // Função que grava os novos endereços de PDF no banco de dados.
    try {
      const batch = writeBatch(db); // Cria um "pacote" de gravações para salvar tudo de uma vez só.
      batch.set(doc(db, "configuracoes", "lista_oficial"), { url: linksEdit.lista_url, atualizacao: linksEdit.lista_data }); // Adiciona a atualização da lista oficial ao pacote.
      batch.set(doc(db, "configuracoes", "historico_musical"), { url: linksEdit.hist_url, atualizacao: linksEdit.hist_data }); // Adiciona a atualização do histórico ao pacote.
      batch.set(doc(db, "configuracoes", "programa_minimo"), { urlMusicos: linksEdit.prog_mus_url, urlOrganistas: linksEdit.prog_org_url, atualizacao: linksEdit.prog_data }); // Adiciona os programas mínimos ao pacote.
      await batch.commit(); // Executa o pacote inteiro no Firebase.
      registrarEvento('Gestão', 'Atualização de Links', 'Documentos PDF Alterados', userLogado); // TELEMETRIA: Grava quem alterou os documentos oficiais.
      dispararFeedback("Links atualizados com sucesso!", 'sucesso'); // Mostra aviso de sucesso.
    } catch (e) { dispararFeedback("Erro ao salvar links", 'erro'); } // Mostra aviso de erro em caso de falha.
  };

  const atualizarMeuPerfil = async (e) => { // Função para o usuário salvar mudanças no seu próprio cadastro.
    e.preventDefault(); // Impede a página de recarregar sozinha.
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { nome: meuNome, cidade: minhaCidade, cargo: meuCargo }); // Atualiza os campos no Firebase.
      registrarEvento('Perfil', 'Auto-Atualização', 'Dados de cadastro alterados', userLogado); // TELEMETRIA: Grava que o usuário mexeu no próprio perfil.
      dispararFeedback("Perfil atualizado!", 'sucesso'); // Mostra o alerta de sucesso.
    } catch (e) { dispararFeedback("Erro ao atualizar", 'erro'); } // Mostra o alerta de erro.
  };

  const gerenciarUsuario = async (uid, campos) => { // Função mestre para aprovar ou alterar qualquer dado de outro usuário (INCLUI O FLEG DA COMISSÃO).
    try {
      await updateDoc(doc(db, "usuarios", uid), campos); // Grava as alterações enviadas (pode ser nível, ativo, cargo ou isComissao).
      const acao = campos.status === 'aprovado' ? 'Aprovação de Usuário' : 'Ajuste de Cadastro'; // Define o nome da ação para o relatório.
      registrarEvento('Gestão', acao, `UID: ${uid}`, userLogado); // TELEMETRIA: Grava qual Master fez a alteração.
      dispararFeedback("Usuário atualizado!", 'sucesso'); // Alerta de sucesso.
      setEditandoUser(null); // Fecha qualquer modal de edição aberto.
    } catch (e) { dispararFeedback("Erro na atualização", 'erro'); } // Alerta de erro.
  };

  const resetarSenhaUsuario = async (email) => { // Função para enviar o link oficial do Google para troca de senha.
    try {
      await sendPasswordResetEmail(auth, email); // Dispara o e-mail de recuperação.
      registrarEvento('Segurança', 'Reset de Senha', `E-mail: ${email}`, userLogado); // TELEMETRIA: Grava o pedido de reset.
      dispararFeedback("E-mail de reset enviado!", 'sucesso'); // Sucesso.
    } catch (e) { dispararFeedback("Erro ao enviar reset", 'erro'); } // Erro.
  };

  const processarSugestao = async (sug, aprovado) => { // Função que decide se uma sugestão de ensaio vira dado oficial ou é descartada.
    try {
      if (aprovado) { // Se o Master clicar no "Check" verde.
        let colecao = ""; // Define em qual "gaveta" do banco o dado será guardado.
        if (sug.tipo === 'local') colecao = "ensaios_locais";
        else if (sug.tipo === 'regional') colecao = "ensaios_regionais";
        else if (sug.tipo === 'contato_regional') colecao = "encarregados_regionais";
        else if (sug.tipo === 'contato_examinadora') colecao = "examinadoras";
        await updateDoc(doc(db, colecao, sug.ensaioId), sug.dadosSugeridos); // Substitui o dado antigo pelo novo sugerido.
        await addDoc(collection(db, "sugestoes_aprovadas_historico"), { ...sug, dataProcessamento: new Date(), processadoPor: userLogado.nome }); // Grava no histórico de auditoria.
        registrarEvento('Gestão', 'Sugestão Aprovada', `Módulo: ${sug.tipo}`, userLogado); // TELEMETRIA: Registra a aprovação.
        dispararFeedback("Alteração aplicada!", 'sucesso'); // Sucesso.
      } else {
        registrarEvento('Gestão', 'Sugestão Recusada', `Módulo: ${sug.tipo}`, userLogado); // TELEMETRIA: Registra a recusa.
      }
      await deleteDoc(doc(db, "sugestoes_pendentes", sug.id)); // Remove a sugestão da fila de pendências (seja aprovada ou recusada).
    } catch (e) { dispararFeedback("Erro ao processar", 'erro'); } // Erro.
  };

  const syncModulo = async (tipo) => { // FERRAMENTA CRÍTICA: Apaga os dados atuais e puxa o backup original dos arquivos JS.
    setConfirma(null); // Fecha o balão de confirmação.
    setLoadingModulos(prev => ({ ...prev, [tipo]: true })); // Inicia o ícone de carregamento para este módulo específico.
    const batch = writeBatch(db); // Prepara um pacote de grandes alterações.
    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    try {
      if (tipo === 'locais' || tipo === 'tudo') { // Se for restaurar ensaios das igrejas.
        const snapLoc = await getDocs(collection(db, "ensaios_locais")); // Pega todos os atuais.
        snapLoc.forEach(d => batch.delete(d.ref)); // Marca todos para serem excluídos.
        LOCAIS_DATA.forEach(item => batch.set(doc(collection(db, "ensaios_locais")), item)); // Adiciona os dados do backup ao pacote.
      }
      if (tipo === 'regionais' || tipo === 'tudo') { // Se for restaurar a agenda regional.
        const snapReg = await getDocs(collection(db, "ensaios_regionais")); // Pega os atuais.
        snapReg.forEach(d => batch.delete(d.ref)); // Marca para exclusão.
        NOVOS_REGIONAIS_DATA.forEach(item => { // Converte as datas do backup para o formato do sistema e adiciona ao pacote.
          const [dia, mesNum] = item.date.split('/');
          batch.set(doc(collection(db, "ensaios_regionais")), { dia: Number(dia), mes: MESES[parseInt(mesNum) - 1], hora: item.hour, weekday: item.weekday, sede: item.city.toUpperCase(), local: item.location, tipo: "Regional" }); 
        });
      }
      if (tipo === 'examinadoras' || tipo === 'tudo') { // Restaura contatos das irmãs examinadoras.
        const snapExa = await getDocs(collection(db, "examinadoras"));
        snapExa.forEach(d => batch.delete(d.ref));
        EXAMINADORAS.forEach(item => batch.set(doc(collection(db, "examinadoras")), item));
      }
      if (tipo === 'encarregados' || tipo === 'tudo') { // Restaura contatos da banca regional.
        const snapEnc = await getDocs(collection(db, "encarregados_regionais"));
        snapEnc.forEach(d => batch.delete(d.ref));
        ENCARREGADOS_LISTA.forEach(item => batch.set(doc(collection(db, "encarregados_regionais")), item));
      }
      await batch.commit(); // Executa a limpeza e a restauração total no Firebase.
      registrarEvento('Manutenção', 'Restauração de Backup', `Módulo: ${tipo}`, userLogado); // TELEMETRIA: Registra o uso da "bomba atômica" administrativa.
      dispararFeedback(`Backup restaurado!`, 'sucesso'); // Sucesso.
    } catch (e) { dispararFeedback(`Erro na sincronização`, 'erro'); } // Erro.
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); } // Desliga o ícone de carregamento.
  };

  return ( // Montagem visual do Painel.
    <div className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      <div className="bg-[#F1F5F9] w-full max-w-xl rounded-[2.5rem] flex flex-col h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 text-left">
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">{isMaster ? 'Painel Master' : 'Gestão de Usuários'}</h2>
            <button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={20}/></button>
          </div>
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
          
          {isMaster && aba === 'links' && (
            <div className="space-y-6 animate-in">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="p-2.5 bg-slate-950 text-white rounded-xl"><Link size={18}/></div><h4 className="text-[11px] font-black uppercase text-slate-950 italic">Central de Documentos PDF</h4></div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-amber-500"/><span className="text-[8px] font-black uppercase text-slate-400">Lista de Batismos</span></div>
                  <textarea placeholder="URL do Google Drive" value={linksEdit.lista_url} onChange={e => setLinksEdit({...linksEdit, lista_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Data de Atualização" value={linksEdit.lista_data} onChange={e => setLinksEdit({...linksEdit, lista_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><History size={14} className="text-slate-500"/><span className="text-[8px] font-black uppercase text-slate-400">Histórico Musical</span></div>
                  <textarea placeholder="URL do Google Drive" value={linksEdit.hist_url} onChange={e => setLinksEdit({...linksEdit, hist_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Data de Atualização" value={linksEdit.hist_data} onChange={e => setLinksEdit({...linksEdit, hist_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1"><Music2 size={14} className="text-blue-500"/><span className="text-[8px] font-black uppercase text-slate-400">Programa Mínimo (PDFs)</span></div>
                  <textarea placeholder="URL PDF Músicos" value={linksEdit.prog_mus_url} onChange={e => setLinksEdit({...linksEdit, prog_mus_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <textarea placeholder="URL PDF Organistas" value={linksEdit.prog_org_url} onChange={e => setLinksEdit({...linksEdit, prog_org_url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none resize-none min-h-[60px]" />
                  <input type="text" placeholder="Data de Atualização" value={linksEdit.prog_data} onChange={e => setLinksEdit({...linksEdit, prog_data: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" />
                </div>
                <button onClick={salvarLinksOficiais} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all"><Save size={16}/> Salvar Todos os Links</button>
              </div>
            </div>
          )}

          {aba === 'usuarios' && <AbaGerenciarUsuarios todosUsuarios={todosUsuarios} gerenciarUsuario={gerenciarUsuario} resetarSenhaUsuario={resetarSenhaUsuario} setEditandoUser={setEditandoUser} editandoUser={editandoUser} novoCargo={novoCargo} setNovoCargo={setNovoCargo} novaCidade={novaCidade} setNovaCidade={setNovaCidade} userLogado={userLogado} />}
          {isMaster && aba === 'config' && <AbaManutencao setConfirma={setConfirma} loadingModulos={loadingModulos} />}
        </div>
      </div>
      {confirma && createPortal(<div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"><div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95"><div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div><h3 className="text-lg font-[900] uppercase italic text-slate-950 leading-tight tracking-tighter">Confirmar Reset?</h3><p className="text-slate-400 text-[10px] font-bold uppercase mt-4 leading-relaxed">Isso apagará os dados atuais de {confirma.toUpperCase()} para restaurar o backup oficial.</p><div className="flex flex-col gap-2 mt-8"><button onClick={() => syncModulo(confirma)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg transition-all">Sim, Restaurar Backup</button><button onClick={() => setConfirma(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] transition-all">Não, Cancelar</button></div></div></div>, document.body)}
      {editandoUser && createPortal(<div className="fixed inset-0 z-[1600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-left"><div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95"><h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none mb-6">Ajustar Usuário</h3><div className="space-y-4 text-left"><div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span><select value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="flex flex-col gap-1 text-left"><span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span><select value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none">{CARGOS_LISTA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}</select></div><button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, cidade: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl mt-4 transition-all">Salvar Ajustes</button><button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase transition-all text-center">Cancelar</button></div></div></div>, document.body)}
    </div>
  );
};

export default PainelMaster; // Exporta o painel master agora 100% auditado pela telemetria.