import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Search, Phone, MessageCircle, X, Plus, Trash2, Edit3, Send, Copy, Check } from 'lucide-react';
import Feedback from './Feedback';

// Importação das constantes e funções centralizadas
import { CIDADES_LISTA } from '../constants/cidades';
import { normalizarTexto } from '../constants/comuns';

const Comissao = ({ encarregados = [], examinadoras = [], loading, user }) => {
  const [aba, setAba] = useState('regionais');
  const [busca, setBusca] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('Todas');
  const [feedback, setFeedback] = useState(null);
  const [confirmaExclusao, setConfirmaExclusao] = useState(null);
  const [mostraAdd, setMostraAdd] = useState(false);
  const [editandoMembro, setEditandoMembro] = useState(null);
  const [sugestaoAberta, setSugestaoAberta] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);
  const [wappSeletor, setWappSeletor] = useState(null);

  const isMaster = user?.nivel === 'master';
  const COLEC_REGIONAIS = "encarregados_regionais"; 
  const COLEC_EXAMINADORAS = "examinadoras";
  const listaAtual = aba === 'regionais' ? encarregados : examinadoras;

  const podeSugerirContato = (item) => {
    if (isMaster) return true;
    const cidadeUser = normalizarTexto(user?.cidade || "");
    const cidadeContato = normalizarTexto(item.city || item.cidade || "");
    return cidadeUser !== "" && (cidadeUser.includes(cidadeContato) || cidadeContato.includes(cidadeUser));
  };

  const [formMembro, setFormMembro] = useState({ name: '', city: 'Jundiaí', contact: '' });

  const copiarParaClipboard = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleAddMembro = async (e) => {
    e.preventDefault();
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS;
      await addDoc(collection(db, nomeColecao), { 
        ...formMembro, 
        tipo: aba === 'regionais' ? 'Encarregado Regional' : 'Examinadora' 
      });
      setFeedback({ msg: "Membro adicionado!", tipo: 'sucesso' });
      setMostraAdd(false);
      setFormMembro({ name: '', city: 'Jundiaí', contact: '' });
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); }
  };

  const handleUpdateMembro = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS;
      const dadosUpdate = editandoMembro || sugestaoAberta;
      const payload = { name: dadosUpdate.name, city: dadosUpdate.city, contact: dadosUpdate.contact };

      if (isMaster) {
        await updateDoc(doc(db, nomeColecao, dadosUpdate.id), payload);
        setFeedback({ msg: "Atualizado!", tipo: 'sucesso' });
      } else {
        await addDoc(collection(db, "sugestoes_pendentes"), {
          ensaioId: dadosUpdate.id,
          localidade: dadosUpdate.city,
          cidade: dadosUpdate.city,
          tipo: aba === 'regionais' ? 'contato_regional' : 'contato_examinadora',
          dadosAntigos: { 
            name: listaAtual.find(x => x.id === dadosUpdate.id)?.name, 
            city: listaAtual.find(x => x.id === dadosUpdate.id)?.city || listaAtual.find(x => x.id === dadosUpdate.id)?.cidade,
            contact: listaAtual.find(x => x.id === dadosUpdate.id)?.contact 
          },
          dadosSugeridos: payload,
          solicitanteNome: user.nome,
          status: 'pendente',
          dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Sugestão enviada!", tipo: 'sucesso' });
      }
      setEditandoMembro(null);
      setSugestaoAberta(null);
    } catch (err) { setFeedback({ msg: "Erro no processamento", tipo: 'erro' }); }
    finally { setEnviando(false); }
  };

  const handleExcluirDefinitivo = async () => {
    try {
      const nomeColecao = aba === 'regionais' ? COLEC_REGIONAIS : COLEC_EXAMINADORAS;
      await deleteDoc(doc(db, nomeColecao, confirmaExclusao.id));
      setFeedback({ msg: "Membro removido!", tipo: 'sucesso' });
      setConfirmaExclusao(null);
    } catch (err) { setFeedback({ msg: "Erro ao excluir", tipo: 'erro' }); }
  };

  const abrirWappInteligente = (tipo, contato, nome) => {
    const limpo = contato.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá irmão ${nome}, tudo bem?`);
    const link = tipo === 'business' 
      ? `https://wa.me/55${limpo}` 
      : `https://api.whatsapp.com/send?phone=55${limpo}&text=${msg}`;
    window.open(link, '_blank');
    setWappSeletor(null);
  };

  const filtrados = useMemo(() => {
    return listaAtual.filter(item => {
      const nomeMembro = item.name || "";
      const cidadeMembro = item.city || item.cidade || "";
      const matchBusca = normalizarTexto(nomeMembro).includes(normalizarTexto(busca));
      const matchCidade = filtroCidade === 'Todas' || normalizarTexto(cidadeMembro) === normalizarTexto(filtroCidade);
      return matchBusca && matchCidade;
    }).sort((a, b) => (a.city || a.cidade || "").localeCompare(b.city || b.cidade || "") || (a.name || "").localeCompare(b.name || ""));
  }, [listaAtual, busca, filtroCidade]);

  if (loading) return <div className="p-10 text-center font-black uppercase text-[10px] text-slate-400 animate-pulse">Sincronizando...</div>;

  return (
    <div className="flex flex-col animate-in relative min-h-screen bg-[#F1F5F9]">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-4">
        {isMaster && (
          <button onClick={() => setMostraAdd(true)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
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
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 text-[11px] font-bold outline-none shadow-sm" />
          </div>
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-[42px] text-[10px] font-bold outline-none appearance-none min-w-[100px] shadow-sm">
            {['Todas', ...new Set(listaAtual.map(i => i.city || i.cidade).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4 pb-32">
        {filtrados.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all active:bg-slate-50/50">
            <div className="flex justify-between items-center mb-4 min-h-[80px]">
              <div className="flex flex-col text-left flex-1">
                <span className="text-amber-500 text-[11px] font-[900] uppercase italic tracking-widest mb-1">{item.city || item.cidade}</span>
                <h3 className="text-slate-950 text-base font-[900] tracking-tighter uppercase italic leading-tight pr-4">{item.name}</h3>
                
                {/* LINHA DO TELEFONE COM COPIAR DESTACADO */}
                <button 
                  onClick={() => copiarParaClipboard(item.contact, item.id)}
                  className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 w-fit group active:scale-95 transition-all shadow-sm"
                >
                  <span className="text-slate-950 text-[12px] font-black tracking-widest">{item.contact}</span>
                  {copiadoId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-300" />}
                </button>
              </div>

              {/* GESTÃO DO MASTER (CENTRALIZADOS NA DIREITA) */}
              <div className="flex gap-1.5 items-center">
                {podeSugerirContato(item) && (
                  <button onClick={() => { const data = { ...item, city: item.city || item.cidade }; isMaster ? setEditandoMembro(data) : setSugestaoAberta(data); }} className="bg-slate-50 text-slate-400 p-3 rounded-xl border border-slate-100 active:scale-90 shadow-sm"><Edit3 size={16}/></button>
                )}
                {isMaster && (
                  <button onClick={() => setConfirmaExclusao(item)} className="bg-red-50 text-red-400 p-3 rounded-xl border border-red-100 active:scale-90 shadow-sm"><Trash2 size={16}/></button>
                )}
              </div>
            </div>

            {/* AÇÕES DE CONTATO (PADRONIZADO CORES LOCAL) */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
              <a href={`tel:${(item.contact || "").replace(/\D/g, '')}`} className="bg-slate-50 text-blue-600 flex items-center justify-center py-4 rounded-2xl active:scale-95 border border-slate-100 shadow-sm">
                <Phone size={20} />
              </a>
              <button onClick={() => setWappSeletor(item)} className="bg-slate-50 text-emerald-600 flex items-center justify-center py-4 rounded-2xl active:scale-95 border border-slate-100 shadow-sm">
                <MessageCircle size={22} />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      {/* PORTAL: SELETOR DE WHATSAPP */}
      {wappSeletor && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 text-left">
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 mb-6 leading-tight">Contatar via...</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => abrirWappInteligente('standard', wappSeletor.contact, wappSeletor.name)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><MessageCircle size={20} /></div>
                <span className="text-[12px] font-[900] uppercase text-slate-950">WhatsApp Padrão</span>
              </button>
              <button onClick={() => abrirWappInteligente('business', wappSeletor.contact, wappSeletor.name)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 active:scale-95 text-left shadow-sm">
                <div className="p-3 bg-emerald-600 text-white rounded-xl"><MessageCircle size={20} /></div>
                <span className="text-[12px] font-[900] uppercase text-slate-950">WhatsApp Business</span>
              </button>
            </div>
            <button onClick={() => setWappSeletor(null)} className="w-full mt-6 py-2 text-slate-400 text-[10px] font-black uppercase text-center">Cancelar</button>
          </div>
        </div>, document.body
      )}

      {/* PORTAL: EDITAR / SUGERIR */}
      {(editandoMembro || sugestaoAberta) && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => { setEditandoMembro(null); setSugestaoAberta(null); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none">{isMaster ? 'Editar Membro' : 'Sugerir Correção'}</h3>
            <form onSubmit={handleUpdateMembro} className="space-y-4 mt-8">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nome</span>
                <input required type="text" value={isMaster ? editandoMembro.name : sugestaoAberta.name} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, name: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none uppercase" />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cidade</span>
                <select value={isMaster ? editandoMembro.city : sugestaoAberta.city} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, city: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Telefone</span>
                <input required type="text" value={isMaster ? editandoMembro.contact : sugestaoAberta.contact} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, contact: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-[11px] font-bold outline-none" />
              </div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all flex justify-center items-center gap-2 mt-4">
                <Send size={16}/> {isMaster ? 'Salvar Alterações' : 'Enviar Sugestão'}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* PORTAL: ADICIONAR */}
      {mostraAdd && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => setMostraAdd(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-8">Novo Cadastro</h3>
            <form onSubmit={handleAddMembro} className="space-y-3">
              <input required type="text" placeholder="Nome Completo" value={formMembro.name} onChange={ev => setFormMembro({...formMembro, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase shadow-sm" />
              <select value={formMembro.city} onChange={ev => setFormMembro({...formMembro, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none shadow-sm">
                {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input required type="text" placeholder="Telefone (ex: 11 99999-9999)" value={formMembro.contact} onChange={ev => setFormMembro({...formMembro, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none shadow-sm" />
              <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all mt-4">Cadastrar Agora</button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* PORTAL: EXCLUSÃO */}
      {confirmaExclusao && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32}/></div>
            <h3 className="text-lg font-black uppercase text-slate-950 tracking-tighter leading-tight">Remover Membro?</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">Esta ação não poderá ser desfeita.</p>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={handleExcluirDefinitivo} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-lg shadow-red-200">Confirmar Exclusão</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Comissao;