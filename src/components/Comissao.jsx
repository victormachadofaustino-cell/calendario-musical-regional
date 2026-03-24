// src/components/ContatosComissao.jsx // Localização do arquivo que gerencia a lista de contatos da Comissão Regional.

import React, { useState, useMemo } from 'react'; // Ferramenta base para criar a tela e gerenciar o que o usuário vê.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes (modais) que ficam por cima de tudo.
import { db } from '../firebaseConfig'; // Importa a conexão com o banco de dados Firebase oficial.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para ler, gravar e apagar dados.
import { Search, Phone, MessageCircle, X, Plus, Trash2, Edit3, Send, Copy, Check, Share2 } from 'lucide-react'; // Ícones modernos.
import Feedback from './Feedback'; // Componente que mostra avisos de sucesso ou erro.

// Importação das constantes, funções centrais e motor de permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de cidades da nossa regional.
import { normalizarTexto, registrarEvento } from '../constants/comuns'; // AFINAÇÃO: Importa o Olheiro de Telemetria.
import { podeVerBotoesDeGestao, isMaster } from '../constants/permissions'; // Novo motor de regras de acesso territorial.

const Comissao = ({ encarregados = [], examinadoras = [], loading, user, userData }) => { // Início do componente recebendo o crachá completo.
  const [aba, setAba] = useState('regionais'); // Controla se vemos Encarregados ou Examinadoras.
  const [busca, setBusca] = useState(''); // Guarda o texto da busca.
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade escolhida.
  const [feedback, setFeedback] = useState(null); // Mensagem de alerta flutuante.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Confirmação de remoção.
  const [mostraAdd, setMostraAdd] = useState(false); // Aparecimento do formulário de novo cadastro.
  const [editandoMembro, setEditandoMembro] = useState(null); // Edição Master.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Sugestão de Editor.
  const [enviando, setEnviando] = useState(false); // Trava contra envios duplicados.
  const [copiadoId, setCopiadoId] = useState(null); // Controle visual do ícone de check.

  const COLEC_REGIONAIS = "encarregados_regionais"; // Pasta de Encarregados no banco.
  const COLEC_EXAMINADORAS = "examinadoras"; // Pasta de Examinadoras no banco.
  const listaAtual = aba === 'regionais' ? encarregados : examinadoras; // Escolhe qual lista mostrar.

  const [formMembro, setFormMembro] = useState({ name: '', city: 'Jundiaí', contact: '' }); // Memória para formulários.

  const copiarParaClipboard = (texto, item) => { // Função para copiar telefone.
    navigator.clipboard.writeText(texto); // Comando de cópia do sistema.
    setFeedback({ msg: "Número copiado!", tipo: 'sucesso' }); // Aviso visual.
    setCopiadoId(item.id); // Muda o ícone para check.
    // TELEMETRIA IDENTIFICADA: Registra quem copiou o contato de quem.
    registrarEvento('Comissão', 'Cópia de Contato', `Membro: ${item.name}`, userData); 
    setTimeout(() => setCopiadoId(null), 2000); // Reseta o ícone.
  };

  const compartilharContato = async (item) => { // Função para enviar dados.
    const texto = `*Contato CCB Regional Jundiaí*\n👤 Nome: ${item.name}\n📍 Cidade: ${item.city || item.cidade}\n📱 Tel: ${item.contact}`; 
    // TELEMETRIA IDENTIFICADA: Registra a divulgação do contato ministerial.
    registrarEvento('Comissão', 'Clique Compartilhar', `Membro: ${item.name}`, userData); 
    if (navigator.share) { 
      try { await navigator.share({ title: 'Contato CCB', text: texto }); } catch (err) { console.log("Erro ao compartilhar", err); }
    } else {
      const limpo = item.contact.replace(/\D/g, ''); 
      window.open(`https://api.whatsapp.com/send?phone=55${limpo}&text=${encodeURIComponent("Olá irmão " + item.name + ", tudo bem?")}`, '_blank'); 
    }
  };

  const handleAddMembro = async (e) => { // Cadastro de novo membro.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS; 
      if (isMaster(userData)) { 
        await addDoc(collection(db, nomeColecao), { ...formMembro, tipo: aba === 'regionais' ? 'Encarregado Regional' : 'Examinadora' }); 
        setFeedback({ msg: "Membro adicionado com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          tipo: aba === 'regionais' ? 'contato_regional_criacao' : 'contato_examinadora_criacao', 
          cidade: formMembro.city, dadosSugeridos: formMembro, solicitanteNome: userData?.nome || user?.email, status: 'pendente', dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Sugestão de cadastro enviada!", tipo: 'sucesso' }); 
      }
      setMostraAdd(false); 
      setFormMembro({ name: '', city: userData?.cidade || 'Jundiaí', contact: '' }); 
    } catch (err) { setFeedback({ msg: "Erro ao salvar contato", tipo: 'erro' }); }
    finally { setEnviando(false); } 
  };

  const handleUpdateMembro = async (e) => { // Atualização de cadastro.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS; 
      const dadosUpdate = editandoMembro || sugestaoAberta; 
      const payload = { name: dadosUpdate.name, city: dadosUpdate.city, contact: dadosUpdate.contact }; 
      if (isMaster(userData)) { 
        await updateDoc(doc(db, nomeColecao, dadosUpdate.id), payload); 
        setFeedback({ msg: "Contato atualizado com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: dadosUpdate.id, localidade: dadosUpdate.city, cidade: dadosUpdate.city, 
          tipo: aba === 'regionais' ? 'contato_regional' : 'contato_examinadora', 
          dadosAntigos: { name: listaAtual.find(x => x.id === dadosUpdate.id)?.name, city: listaAtual.find(x => x.id === dadosUpdate.id)?.city || listaAtual.find(x => x.id === dadosUpdate.id)?.cidade, contact: listaAtual.find(x => x.id === dadosUpdate.id)?.contact }, 
          dadosSugeridos: payload, solicitanteNome: userData?.nome || user?.email, status: 'pendente', dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Alteração enviada para análise!", tipo: 'sucesso' }); 
      }
      setEditandoMembro(null); setSugestaoAberta(null); 
    } catch (err) { setFeedback({ msg: "Falha ao processar", tipo: 'erro' }); }
    finally { setEnviando(false); } 
  };

  const handleExcluirOuSugerir = async () => { // Remoção de membro.
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS; 
      if (isMaster(userData)) { 
        await deleteDoc(doc(db, nomeColecao, confirmaExclusao.id)); 
        setFeedback({ msg: "Membro removido do sistema!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: confirmaExclusao.id, tipo: aba === 'regionais' ? 'contato_regional_exclusao' : 'contato_examinadora_exclusao', 
          cidade: confirmaExclusao.city || confirmaExclusao.cidade, dadosAntigos: confirmaExclusao, solicitanteNome: userData?.nome || user?.email, status: 'pendente', dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Solicitação de remoção enviada!", tipo: 'sucesso' }); 
      }
      setConfirmaExclusao(null); 
    } catch (err) { setFeedback({ msg: "Erro na exclusão", tipo: 'erro' }); }
  };

  const filtrados = useMemo(() => { // Filtro de busca alfabético e geográfico.
    return listaAtual.filter(item => { 
      const nomeMembro = item.name || ""; 
      const cidadeMembro = item.city || item.cidade || ""; 
      const matchBusca = normalizarTexto(nomeMembro).includes(normalizarTexto(busca)); 
      const matchCidade = filtroCidade === 'Todas' || normalizarTexto(cidadeMembro) === normalizarTexto(filtroCidade); 
      return matchBusca && matchCidade; 
    }).sort((a, b) => { 
      const compNome = (a.name || "").localeCompare(b.name || ""); 
      if (compNome !== 0) return compNome; 
      return (a.city || a.cidade || "").localeCompare(b.city || b.cidade || ""); 
    });
  }, [listaAtual, busca, filtroCidade]); 

  if (loading) return <div className="p-10 text-center font-black uppercase text-[10px] text-slate-400 animate-pulse">Sintonizando Contatos...</div>; 

  return ( 
    <div className="flex flex-col animate-in relative min-h-screen bg-[#F1F5F9]">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-4">
        {podeVerBotoesDeGestao(userData, userData?.cidade) && ( 
          <button onClick={() => { setFormMembro(prev => ({...prev, city: userData.cidade})); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> {aba === 'regionais' ? 'Adicionar Regional' : 'Adicionar Examinadora'}
          </button>
        )}

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
          <button onClick={() => { setAba('regionais'); setFiltroCidade('Todas'); }} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'regionais' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Regionais</button>
          <button onClick={() => { setAba('examinadoras'); setFiltroCidade('Todas'); }} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'examinadoras' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Examinadoras</button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 text-[11px] font-bold outline-none shadow-sm" />
          </div>
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-[42px] text-[10px] font-bold outline-none appearance-none min-w-[100px] shadow-sm">
            {['Todas', ...new Set(listaAtual.map(i => i.city || i.cidade).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4 pb-32">
        {filtrados.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all">
            <div className="flex justify-between items-center mb-4 min-h-[80px]">
              <div className="flex flex-col text-left flex-1">
                <h3 className="text-slate-950 text-base font-[900] tracking-tighter uppercase italic leading-tight pr-4">{item.name}</h3>
                <span className="text-amber-500 text-[11px] font-[900] uppercase italic tracking-widest mt-1 mb-1">{item.city || item.cidade}</span>
                
                <button onClick={() => copiarParaClipboard(item.contact, item)} className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 w-fit group active:scale-95 transition-all shadow-sm">
                  <span className="text-slate-950 text-[12px] font-black tracking-widest">{item.contact}</span>
                  {copiadoId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-300" />}
                </button>
              </div>

              <div className="flex gap-1.5 items-center">
                {podeVerBotoesDeGestao(userData, item.city || item.cidade) && ( 
                  <button onClick={() => { const data = { ...item, city: item.city || item.cidade }; isMaster(userData) ? setEditandoMembro(data) : setSugestaoAberta(data); }} className="bg-amber-100 text-amber-600 p-3 rounded-xl border border-amber-200 active:scale-90 shadow-sm"><Edit3 size={16}/></button>
                )}
                {podeVerBotoesDeGestao(userData, item.city || item.cidade) && ( 
                  <button onClick={() => setConfirmaExclusao(item)} className="bg-red-50 text-red-500 p-3 rounded-xl border border-red-100 active:scale-90 shadow-sm"><Trash2 size={16}/></button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
              {/* TELEMETRIA IDENTIFICADA: Link direto do telefone também registra a ação */}
              <a 
                href={`tel:${(item.contact || "").replace(/\D/g, '')}`} 
                onClick={() => registrarEvento('Comissão', 'Clique Telefone', `Membro: ${item.name}`, userData)}
                className="bg-slate-50 text-blue-600 flex items-center justify-center py-4 rounded-2xl active:scale-95 border border-slate-100 shadow-sm"
              >
                <Phone size={20} />
              </a>
              <button onClick={() => compartilharContato(item)} className="bg-slate-50 text-emerald-600 flex items-center justify-center py-4 rounded-2xl active:scale-95 border border-slate-100 shadow-sm"><Share2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modais de Edição e Adição */}
      {(editandoMembro || sugestaoAberta) && createPortal(
        <div onClick={() => { setEditandoMembro(null); setSugestaoAberta(null); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setEditandoMembro(null); setSugestaoAberta(null); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none">{isMaster(userData) ? 'Editar Membro' : 'Sugerir Edição'}</h3>
            <form onSubmit={handleUpdateMembro} className="space-y-4 mt-8">
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Nome Completo</span><input required type="text" value={isMaster(userData) ? editandoMembro.name : sugestaoAberta.name} onChange={ev => isMaster(userData) ? setEditandoMembro({...editandoMembro, name: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none uppercase" /></div>
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Cidade</span><select value={isMaster(userData) ? editandoMembro.city : sugestaoAberta.city} onChange={ev => isMaster(userData) ? setEditandoMembro({...editandoMembro, city: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Telefone</span><input required type="text" value={isMaster(userData) ? editandoMembro.contact : sugestaoAberta.contact} onChange={ev => isMaster(userData) ? setEditandoMembro({...editandoMembro, contact: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none" /></div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all flex justify-center items-center gap-2 mt-4"><Send size={16}/> {enviando ? 'Gravando...' : (isMaster(userData) ? 'Salvar no Banco' : 'Enviar Sugestão')}</button>
            </form>
          </div>
        </div>, document.body
      )}

      {mostraAdd && createPortal(
        <div onClick={() => setMostraAdd(false)} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => setMostraAdd(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-8">Novo Cadastro</h3>
            <form onSubmit={handleAddMembro} className="space-y-3">
              <input required type="text" placeholder="Nome Completo" value={formMembro.name} onChange={ev => setFormMembro({...formMembro, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase shadow-sm" />
              <select value={formMembro.city} onChange={ev => setFormMembro({...formMembro, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none shadow-sm">{CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input required type="text" placeholder="Telefone" value={formMembro.contact} onChange={ev => setFormMembro({...formMembro, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none shadow-sm" />
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all mt-4">{enviando ? 'Enviando...' : (isMaster(userData) ? 'Cadastrar Agora' : 'Sugerir Cadastro')}</button>
            </form>
          </div>
        </div>, document.body
      )}

      {confirmaExclusao && createPortal(
        <div onClick={() => setConfirmaExclusao(null)} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32}/></div>
            <h3 className="text-lg font-black uppercase text-slate-950 tracking-tighter leading-tight">Remover Membro?</h3>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={handleExcluirOuSugerir} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg">Confirmar</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Comissao; // Exporta a lista de contatos monitorada pelo Dashboard.