import React, { useState, useEffect, useMemo } from 'react'; // Ferramenta base do React para gerenciar o estado e memória da tela.
import { db, auth } from '../firebaseConfig'; // Importa a conexão com o banco de dados e o sistema de login.
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, setDoc, addDoc,
  orderBy, limit
} from 'firebase/firestore'; // Ferramentas avançadas para gerenciar documentos e realizar operações no banco.
import { sendPasswordResetEmail } from 'firebase/auth'; // Ferramenta para enviar e-mail de recuperação de senha.
import { 
  X, AlertCircle, RefreshCw, Database
} from 'lucide-react'; // Ícones básicos para modais de confirmação e fechamento.
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
  
  // MUDANÇA ESTRATÉGICA: A aba inicial agora depende se o usuário tem pendências para olhar ou só o próprio perfil.
  const [aba, setAba] = useState(isMaster ? 'pendentes' : 'perfil'); // Define qual aba o sistema mostra primeiro ao abrir.
  
  const [feedback, setFeedback] = useState(null); // Estado para mostrar avisos coloridos de sucesso ou erro na tela.
  const [loadingModulos, setLoadingModulos] = useState({}); // Estado que mostra o ícone de carregando nos botões de backup.
  const [confirma, setConfirma] = useState(null); // Estado que controla o modal de confirmação "Tem certeza?".
  const [configLista, setConfigLista] = useState({ url: '', dataReferencia: '', atualizacao: '' }); // Configurações da URL da Lista Oficial.
  
  const [meuNome, setMeuNome] = useState(userLogado?.nome || ''); // Nome do perfil que você pode editar.
  const [minhaCidade, setMinhaCidade] = useState(userLogado?.cidade || ''); // Cidade do seu perfil.
  const [meuCargo, setMeuCargo] = useState(userLogado?.cargo || ''); // Cargo do seu perfil.
  
  const [editandoUser, setEditandoUser] = useState(null); // Guarda qual usuário da lista você clicou para ajustar.
  const [novoCargo, setNovoCargo] = useState(''); // Guarda o novo cargo escolhido na janelinha de ajuste.
  const [novaCidade, setNovaCidade] = useState(''); // Guarda a nova cidade escolhida na janelinha de ajuste.

  useEffect(() => { // Vigia o banco de dados em tempo real enquanto este painel estiver aberto.
    if (!userLogado) return; // Se não houver ninguém logado por erro, ele não tenta conectar ao banco.

    let unsubP, unsubS, unsubC, unsubR; // Variáveis que guardam a "escuta" do banco para podermos desligar depois.

    // ESCUTA DE USUÁRIOS: Vigia quem está na fila e quem já está aprovado.
    unsubP = onSnapshot(collection(db, "usuarios"), (snap) => { 
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })); // Transforma os dados brutos do Google em uma lista legível.
      setUsuariosPendentes(lista.filter(u => u.status === 'pendente')); // Filtra apenas quem está na sala de espera.
      setTodosUsuarios(lista.filter(u => u.status !== 'pendente')); // Pega todos os que já tocam na orquestra (aprovados).
    });

    // Se você for Master, o sistema abre as conexões de administração pesada.
    if (isMaster) {
      unsubS = onSnapshot(collection(db, "sugestoes_pendentes"), (snap) => { 
        setSugestoesAlteracao(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Vigia sugestões de mudança nos ensaios.
      });

      // ESCUTA DE HISTÓRICO: Pega os últimos 50 registros de quem aprovou mudanças no sistema.
      const qRanking = query(collection(db, "sugestoes_aprovadas_historico"), orderBy("dataProcessamento", "desc"), limit(50));
      unsubR = onSnapshot(qRanking, (snap) => {
        setRankingAtividade(snap.docs.map(d => ({ id: d.id, ...d.data() }))); // Atualiza o histórico de auditoria.
      });
    }

    // Vigia a configuração da Lista de Batismos (URL e data).
    unsubC = onSnapshot(doc(db, "configuracoes", "lista_oficial"), (snap) => {
      if (snap.exists()) setConfigLista(snap.data()); // Se a configuração existir no banco, traz para a tela.
    });

    return () => { // Função de limpeza: desliga todas as escutas ao fechar o painel para economizar internet.
      if (unsubP) unsubP(); if (unsubS) unsubS(); if (unsubC) unsubC(); if (unsubR) unsubR();
    };
  }, [isMaster, userLogado]);

  const dispararFeedback = (msg, tipo) => { setFeedback({ msg, tipo }); }; // Atalho para fazer o aviso de sucesso ou erro aparecer.

  const atualizarMeuPerfil = async (e) => { // Salva as mudanças que você fez no seu próprio nome, cargo ou cidade.
    e.preventDefault(); // Evita que a página recarregue ao clicar em salvar.
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
        nome: meuNome, cidade: minhaCidade, cargo: meuCargo
      }); // Grava no banco de dados apenas os seus dados atualizados.
      dispararFeedback("Perfil atualizado!", 'sucesso'); // Mostra o aviso verde de sucesso.
    } catch (e) { dispararFeedback("Erro ao atualizar", 'erro'); } // Mostra o aviso vermelho de erro.
  };

  const gerenciarUsuario = async (uid, campos) => { // Função para o Master aprovar acesso ou mudar nível de outros irmãos.
    try {
      await updateDoc(doc(db, "usuarios", uid), campos); // Aplica as novas informações no cadastro do irmão selecionado.
      dispararFeedback("Usuário atualizado!", 'sucesso');
      setEditandoUser(null); // Fecha a janelinha de ajuste após salvar.
    } catch (e) { dispararFeedback("Erro na atualização", 'erro'); }
  };

  const resetarSenhaUsuario = async (email) => { // Envia o e-mail oficial do Google para o irmão trocar a senha.
    try {
      await sendPasswordResetEmail(auth, email); // Dispara o gatilho de segurança do Firebase.
      dispararFeedback("E-mail de reset enviado!", 'sucesso');
    } catch (e) { dispararFeedback("Erro ao enviar reset", 'erro'); }
  };

  const processarSugestao = async (sug, aprovado) => { // Aceita ou recusa uma correção de ensaio enviada por um editor.
    try {
      if (aprovado) { // Se você clicou no Check verde...
        let colecao = ""; // Define em qual pasta do banco a mudança deve ser gravada.
        if (sug.tipo === 'local') colecao = "ensaios_locais";
        else if (sug.tipo === 'regional') colecao = "ensaios_regionais";
        else if (sug.tipo === 'contato_regional') colecao = "encarregados_regionais";
        else if (sug.tipo === 'contato_examinadora') colecao = "examinadoras";

        await updateDoc(doc(db, colecao, sug.ensaioId), sug.dadosSugeridos); // Grava a nova informação no lugar da antiga.
        await addDoc(collection(db, "sugestoes_aprovadas_historico"), {
          ...sug, dataProcessamento: new Date(), processadoPor: userLogado.nome
        }); // Guarda quem foi o Master que autorizou essa mudança para auditoria.
        dispararFeedback("Alteração aplicada!", 'sucesso');
      }
      await deleteDoc(doc(db, "sugestoes_pendentes", sug.id)); // Tira o pedido da fila de espera, seja aprovado ou recusado.
    } catch (e) { dispararFeedback("Erro ao processar", 'erro'); }
  };

  const syncModulo = async (tipo) => { // Pega os arquivos de backup e restaura o banco de dados oficial.
    setConfirma(null); // Fecha o modal de confirmação.
    setLoadingModulos(prev => ({ ...prev, [tipo]: true })); // Liga o ícone de carregando no botão do backup.
    const batch = writeBatch(db); // Prepara um pacote de ordens para o banco processar tudo de uma vez.
    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    try {
      if (tipo === 'locais' || tipo === 'tudo') {
        const snapLoc = await getDocs(collection(db, "ensaios_locais"));
        snapLoc.forEach(d => batch.delete(d.ref)); // Apaga todos os ensaios locais atuais para não duplicar.
        LOCAIS_DATA.forEach(item => batch.set(doc(collection(db, "ensaios_locais")), item)); // Escreve o backup oficial.
      }
      if (tipo === 'regionais' || tipo === 'tudo') {
        const snapReg = await getDocs(collection(db, "ensaios_regionais"));
        snapReg.forEach(d => batch.delete(d.ref)); // Apaga a agenda regional atual.
        NOVOS_REGIONAIS_DATA.forEach(item => {
          const [dia, mesNum] = item.date.split('/');
          batch.set(doc(collection(db, "ensaios_regionais")), { 
            dia: Number(dia), mes: MESES[parseInt(mesNum) - 1], hora: item.hour, 
            weekday: item.weekday, sede: item.city.toUpperCase(), local: item.location, tipo: "Regional" 
          }); // Sobe a nova agenda regional do backup.
        });
      }
      if (tipo === 'examinadoras' || tipo === 'tudo') {
        const snapExa = await getDocs(collection(db, "examinadoras"));
        snapExa.forEach(d => batch.delete(d.ref)); // Limpa contatos das examinadoras.
        EXAMINADORAS.forEach(item => batch.set(doc(collection(db, "examinadoras")), item)); // Sobe os contatos do backup.
      }
      if (tipo === 'encarregados' || tipo === 'tudo') {
        const snapEnc = await getDocs(collection(db, "encarregados_regionais"));
        snapEnc.forEach(d => batch.delete(d.ref)); // Limpa contatos dos encarregados regionais.
        ENCARREGADOS_LISTA.forEach(item => batch.set(doc(collection(db, "encarregados_regionais")), item)); // Sobe do backup.
      }
      await batch.commit(); // Executa todas as trocas de uma vez só no banco de dados.
      dispararFeedback(`Backup restaurado!`, 'sucesso');
    } catch (e) { dispararFeedback(`Erro na sincronização`, 'erro'); }
    finally { setLoadingModulos(prev => ({ ...prev, [tipo]: false })); } // Desliga o ícone de carregando.
  };

  return ( // Início da montagem visual do Painel Master.
    <div className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      <div className="bg-[#F1F5F9] w-full max-w-xl rounded-[2.5rem] flex flex-col h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 text-left">
        
        {/* CABEÇALHO DO PAINEL */}
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-[900] uppercase italic text-slate-950 tracking-tighter leading-none">
              {isMaster ? 'Painel Master' : 'Gestão de Usuários'}
            </h2>
            <button onClick={aoFechar} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90">
              <X size={20}/>
            </button>
          </div>

          {/* MENUS DE NAVEGAÇÃO POR ABAS */}
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setAba('perfil')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'perfil' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Perfil</button>
            
            {/* Se for Master, mostra a fila de aprovação de novos irmãos. */}
            {isMaster && (
              <button onClick={() => setAba('pendentes')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'pendentes' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Fila {pendenciasCount > 0 && `(${pendenciasCount})`}</button>
            )}

            {/* Aberto para todos verem quem são os músicos da sua própria cidade. */}
            <button onClick={() => setAba('usuarios')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'usuarios' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Users</button>
            
            {/* Se for Master, mostra o menu de restauração de backups. */}
            {isMaster && (
              <button onClick={() => setAba('config')} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all ${aba === 'config' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}>Manut.</button>
            )}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar pb-24">
          
          {/* MOSTRA O PERFIL (Sempre acessível) */}
          {aba === 'perfil' && (
            <AbaPerfil 
              masterLogado={isMaster} meuNome={meuNome} setMeuNome={setMeuNome} 
              minhaCidade={minhaCidade} setMinhaCidade={setMinhaCidade}
              meuCargo={meuCargo} setMeuCargo={setMeuCargo}
              atualizarMeuPerfil={atualizarMeuPerfil} resetarSenhaUsuario={resetarSenhaUsuario}
              userEmail={userLogado.email}
            />
          )}

          {/* MOSTRA A FILA DE ESPERA (Apenas para Master) */}
          {isMaster && aba === 'pendentes' && (
            <AbaPendencias 
              openAcessos={openAcessos} setOpenAcessos={setOpenAcessos}
              usuariosPendentes={usuariosPendentes} gerenciarUsuario={gerenciarUsuario}
              deleteDoc={deleteDoc} doc={doc} db={db}
              openDados={openDados} setOpenDados={setOpenDados}
              sugestoesAlteracao={sugestoesAlteracao} processarSugestao={processarSugestao}
              CompararCampo={CompararCampo}
            />
          )}

          {/* MOSTRA A LISTA DE USUÁRIOS ATIVOS */}
          {aba === 'usuarios' && (
            <AbaGerenciarUsuarios 
              todosUsuarios={todosUsuarios} gerenciarUsuario={gerenciarUsuario}
              resetarSenhaUsuario={resetarSenhaUsuario} setEditandoUser={setEditandoUser}
              editandoUser={editandoUser} novoCargo={novoCargo} setNovoCargo={setNovoCargo}
              novaCidade={novaCidade} setNovaCidade={setNovaCidade}
              userLogado={userLogado}
            />
          )}

          {/* MOSTRA FERRAMENTAS DE BACKUP (Apenas para Master) */}
          {isMaster && aba === 'config' && (
            <AbaManutencao setConfirma={setConfirma} loadingModulos={loadingModulos} />
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE BACKUP (Proteção contra cliques acidentais) */}
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

      {/* MODAL DE AJUSTE DE DADOS DE TERCEIROS */}
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
              <button onClick={() => gerenciarUsuario(editandoUser.id, { cargo: novoCargo, city: novaCidade })} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl mt-4 transition-all">Salvar Ajustes</button>
              <button onClick={() => setEditandoUser(null)} className="w-full text-slate-400 py-2 text-[8px] font-black uppercase transition-all text-center">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default PainelMaster; // Exporta o mestre da administração regional atualizado.