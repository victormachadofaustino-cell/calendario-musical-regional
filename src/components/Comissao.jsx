import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Search, Phone, MessageCircle, X, Plus, Trash2, Edit3, Send } from 'lucide-react';
import Feedback from './Feedback';

// Importação da constante centralizada
import { CIDADES_LISTA } from '../constants/cidades';

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

  const isMaster = user?.nivel === 'master';

  // Normalização para comparar Paulista/Pta e Acentos
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\bPAULISTA\b/g, "")    
      .replace(/\bPTA\b/g, "")         
      .replace(/\s+/g, "")             
      .trim();
  };

  // Trava de segurança por cidade
  const podeSugerirContato = (item) => {
    if (isMaster) return true;
    const cidadeUser = normalizarParaComparacao(user?.cidade);
    const cidadeContato = normalizarParaComparacao(item.city || item.cidade);
    return cidadeUser !== "" && cidadeContato !== "" && (cidadeUser.includes(cidadeContato) || cidadeContato.includes(cidadeUser));
  };

  const COLEC_REGIONAIS = "encarregados_regionais"; 
  const COLEC_EXAMINADORAS = "examinadoras";
  const listaAtual = aba === 'regionais' ? encarregados : examinadoras;

  const [formMembro, setFormMembro] = useState({ name: '', city: 'Jundiaí', contact: '' });

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
      
      // Garantimos que a cidade seja salva no campo correto que o banco espera (city)
      const payload = {
        name: dadosUpdate.name,
        city: dadosUpdate.city,
        contact: dadosUpdate.contact
      };

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

  const filtrados = useMemo(() => {
    return listaAtual.filter(item => {
      const nomeMembro = item.name || "";
      const cidadeMembro = item.city || item.cidade || "";
      const matchBusca = normalizarParaComparacao(nomeMembro).includes(normalizarParaComparacao(busca));
      const matchCidade = filtroCidade === 'Todas' || normalizarParaComparacao(cidadeMembro) === normalizarParaComparacao(filtroCidade);
      return matchBusca && matchCidade;
    }).sort((a, b) => (a.city || a.cidade || "").localeCompare(b.city || b.cidade || "") || (a.name || "").localeCompare(b.name || ""));
  }, [listaAtual, busca, filtroCidade]);

  if (loading) return <div className="p-10 text-center font-black uppercase text-[10px] text-slate-400 animate-pulse">Sincronizando...</div>;

  return (
    <div className="flex flex-col animate-in relative min-h-screen">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}

      <div className="sticky top-0 z-40 bg-[#F1F5F9]/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 space-y-4">
        {isMaster && (
          <button onClick={() => setMostraAdd(true)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> {aba === 'regionais' ? 'Adicionar Regional' : 'Adicionar Examinadora'}
          </button>
        )}

        <div className="flex bg-slate-200 p-1 rounded-2xl w-full">
          <button onClick={() => { setAba('regionais'); setFiltroCidade('Todas'); }} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'regionais' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500'}`}>Regionais</button>
          <button onClick={() => { setAba('examinadoras'); setFiltroCidade('Todas'); }} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${aba === 'examinadoras' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500'}`}>Examinadoras</button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 text-[11px] font-bold outline-none" />
          </div>
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 h-[42px] text-[10px] font-bold outline-none appearance-none min-w-[100px] shadow-sm">
            {['Todas', ...new Set(listaAtual.map(i => i.city || i.cidade).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3 pb-24">
        {filtrados.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col gap-3 animate-in relative">
            <div className="flex justify-between items-start text-left">
              <div className="flex flex-col">
                <span className="text-amber-500 text-[10px] font-[900] uppercase italic mb-1">{item.city || item.cidade}</span>
                <h3 className="text-slate-950 text-base font-[900] tracking-tighter uppercase italic leading-none pr-12">{item.name}</h3>
              </div>
              
              <div className="absolute top-6 right-6 flex gap-1">
                {podeSugerirContato(item) && (
                  <button 
                    onClick={() => {
                      const data = { ...item, city: item.city || item.cidade };
                      isMaster ? setEditandoMembro(data) : setSugestaoAberta(data);
                    }} 
                    className="bg-amber-100 text-amber-600 p-2 rounded-xl active:scale-90 border border-amber-200 shadow-sm"
                  >
                    <Edit3 size={16}/>
                  </button>
                )}
                {isMaster && (
                  <button onClick={() => setConfirmaExclusao(item)} className="bg-red-100 text-red-600 p-2 rounded-xl active:scale-90 border border-red-200 shadow-sm"><Trash2 size={16}/></button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <a href={`tel:${(item.contact || "").replace(/\D/g, '')}`} className="flex-[2] bg-slate-950 text-white flex items-center justify-between px-5 py-3 rounded-2xl active:scale-95 shadow-md">
                <div className="flex items-center gap-2"><Phone size={12} className="text-amber-500" /><span className="text-[11px] font-black tracking-widest">{item.contact}</span></div>
                <span className="text-[7px] font-black uppercase opacity-30">Ligar</span>
              </a>
              <a href={`https://api.whatsapp.com/send?phone=55${(item.contact || "").replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-500 text-white flex items-center justify-center gap-2 py-3 rounded-2xl active:scale-95 shadow-md">
                <MessageCircle size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center">Wapp</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR OU SUGERIR */}
      {(editandoMembro || sugestaoAberta) && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => { setEditandoMembro(null); setSugestaoAberta(null); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 leading-none">{isMaster ? 'Editar Cadastro' : 'Sugestão'}</h3>
            <form onSubmit={handleUpdateMembro} className="space-y-3 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Nome Completo</span>
                <input required type="text" value={isMaster ? editandoMembro.name : sugestaoAberta.name} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, name: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none uppercase" />
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Cidade</span>
                <select value={isMaster ? editandoMembro.city : sugestaoAberta.city} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, city: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Telefone</span>
                <input required type="text" value={isMaster ? editandoMembro.contact : sugestaoAberta.contact} onChange={ev => isMaster ? setEditandoMembro({...editandoMembro, contact: ev.target.value}) : setSugestaoAberta({...sugestaoAberta, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[11px] font-bold outline-none" />
              </div>

              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all flex justify-center items-center gap-2 mt-4">
                <Send size={16}/> {isMaster ? 'Salvar no Banco' : 'Enviar Sugestão'}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* MODAL ADICIONAR */}
      {mostraAdd && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left pointer-events-auto">
            <button onClick={() => setMostraAdd(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic text-slate-950 mb-6">Novo Cadastro</h3>
            <form onSubmit={handleAddMembro} className="space-y-3">
              <input required type="text" placeholder="Nome Completo" value={formMembro.name} onChange={ev => setFormMembro({...formMembro, name: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase" />
              <select value={formMembro.city} onChange={ev => setFormMembro({...formMembro, city: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none">
                {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input required type="text" placeholder="Telefone" value={formMembro.contact} onChange={ev => setFormMembro({...formMembro, contact: ev.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
              <button type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow-xl transition-all">Salvar</button>
            </form>
          </div>
        </div>, document.body
      )}

      {confirmaExclusao && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 shadow-2xl">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-black uppercase text-slate-950">Excluir?</h3>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirDefinitivo} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95">Sim, Excluir</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default Comissao;