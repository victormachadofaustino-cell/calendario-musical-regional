// src/components/EnsaiosLocais.jsx // Localização do arquivo que gerencia a lista de ensaios nas igrejas.

import React, { useState, useMemo, useEffect } from 'react'; // Ferramenta base para criar componentes e gerenciar memória e dados.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes (modais) fora da estrutura principal.
import { db } from '../firebaseConfig'; // Importa a conexão com o banco de dados Firebase oficial.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para criar, ler, editar e apagar documentos.
import { 
  MapPin, Clock, User, AlertTriangle, Search, Filter, Edit3, Send, X, 
  Plus, Trash2, Calendar, ChevronDown, ChevronUp, Phone, Share2
} from 'lucide-react'; // Ícones modernos para os botões e indicações visuais.
import Feedback from './Feedback'; // Componente que mostra avisos de "Sucesso" ou "Erro" no topo.

// Importação das constantes centralizadas, funções utilitárias e permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de cidades da região.
import { normalizarTexto, registrarEvento, buscarDirecaoNoMapa } from '../constants/comuns'; // Importa a afinadora, o olheiro e o novo mestre do GPS.
import { isMaster, podeVerBotoesDeGestao } from '../constants/permissions'; // Motor de regras de acesso.

// Ferramentas centralizadas para ações de compartilhamento.
import { compartilharEnsaio } from '../utils/actions'; // Função para WhatsApp.

const EnsaiosLocais = ({ todosEnsaios, diaFiltro: diaFiltroApp, loading, user, userData }) => { // Início do componente recebendo o perfil.
  const [busca, setBusca] = useState(''); // Guarda o texto de procura de igreja.
  const [cidadeAberta, setCidadeAberta] = useState(null); // Controla qual sanfona de cidade está aberta.
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade selecionada no topo.
  
  const [semanaSelecionada, setSemanaSelecionada] = useState(''); // Filtro de semana (1ª, 2ª, etc).
  const [diaSelecionado, setDiaSelecionado] = useState(''); // Filtro de dia (Seg, Ter, etc).

  const [feedback, setFeedback] = useState(null); // Mensagem de sucesso ou erro.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Dados do ensaio em edição.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Ensaio a remover.
  const [mostraAdd, setMostraAdd] = useState(false); // Janela de "Novo Ensaio".
  const [enviando, setEnviando] = useState(false); // Trava contra cliques duplos.

  const [novoEnsaio, setNovoEnsaio] = useState({ cidade: 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); // Form de criação.
  const [formSugestao, setFormSugestao] = useState({ localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '', cidade: '' }); // Form de edição.

  const SEMANAS_LISTA = ["1ª", "2ª", "3ª", "4ª", "Últ."]; // Opções de semanas.
  const DIAS_SIGLAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Opções de dias.

  useEffect(() => { // Sincroniza filtros caso o usuário venha da tela inicial.
    if (diaFiltroApp) { 
      setSemanaSelecionada(diaFiltroApp.split(' ')[0]); 
      setDiaSelecionado(diaFiltroApp.split(' ')[1]); 
      setFiltroCidade('Todas'); 
    }
  }, [diaFiltroApp]); 

  const ligarTelefone = (numero, localidade, cidade) => { // Inicia chamada telefônica.
    if (!numero || numero === "-") return; 
    // Sensor: Grava o clique no telefone com a etiqueta [Igreja] - (Cidade).
    registrarEvento('GPS', 'Clique Telefone', `[${localidade}] - (${cidade})`, userData); 
    const limpo = numero.replace(/\D/g, ""); 
    window.open(`tel:${limpo}`, '_self'); 
  };

  const acaoAbrirMapa = (localidade, cidade) => { // Dispara o GPS Inteligente.
    // Sensor: Grava o interesse no mapa com a etiqueta padronizada [Igreja] - (Cidade).
    registrarEvento('GPS', 'Clique Mapa', `[${localidade}] - (${cidade})`, userData); 
    const urlMapa = buscarDirecaoNoMapa(cidade, localidade); // Gera o link do Google Maps.
    window.open(urlMapa, '_blank'); // Abre o navegador.
  };

  const acaoCompartilharEnsaioPadrao = (ensaio) => { // Partilha o ensaio via WhatsApp.
    // Sensor: Grava o compartilhamento com a etiqueta [Igreja] - (Cidade).
    registrarEvento('GPS', 'Clique Compartilhar', `[${ensaio.localidade}] - (${ensaio.cidade})`, userData); 
    compartilharEnsaio(ensaio); // Aciona a função de convite.
  };

  const normalizarCidadeParaDropdown = (cidadeBanco) => { // Faz a ponte entre o banco e o menu visual.
    if (!cidadeBanco) return "Jundiaí"; 
    const cidadeEncontrada = CIDADES_LISTA.find(c => normalizarTexto(c) === normalizarTexto(cidadeBanco)); 
    return cidadeEncontrada || "Jundiaí"; 
  };

  const aplicarTituloIr = (nome) => { // Garante o "Ir." antes do nome.
    if (!nome || nome === "-" || nome === "N/I") return nome; 
    let nomeLimpo = nome.replace(/^Ir\.\s*/i, "").replace(/^Ira\.\s*/i, "").replace(/^Irmao\s*/i, "").replace(/^Irma\s*/i, "").trim(); 
    return "Ir. " + nomeLimpo; 
  };

  const handleAddEnsaio = async (e) => { // Registra novo ensaio.
    e.preventDefault(); 
    setEnviando(true); 
    try {
      const dadosComTitulo = { ...novoEnsaio, encarregado: aplicarTituloIr(novoEnsaio.encarregado) };
      if (userData?.nivel === 'master') { 
        await addDoc(collection(db, "ensaios_locais"), dadosComTitulo); 
        setFeedback({ msg: "Ensaio adicionado com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          tipo: 'local_criacao', 
          cidade: userData?.cidade || novoEnsaio.cidade, 
          localidade: novoEnsaio.localidade, 
          dadosSugeridos: dadosComTitulo, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Musical", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Criação enviada para análise!", tipo: 'sucesso' }); 
      }
      setMostraAdd(false); 
      setNovoEnsaio({ cidade: userData?.cidade || 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); 
    } catch (err) { setFeedback({ msg: "Erro ao salvar ensaio", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const handleExcluirOuSugerir = async () => { // Apaga um ensaio ou sugere exclusão.
    try {
      if (userData?.nivel === 'master') { 
        await deleteDoc(doc(db, "ensaios_locais", confirmaExclusao.id)); 
        setFeedback({ msg: "Ensaio removido do sistema!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: confirmaExclusao.id, 
          tipo: 'local_exclusao', 
          cidade: userData?.cidade || confirmaExclusao.cidade, 
          localidade: confirmaExclusao.localidade, 
          dadosAntigos: confirmaExclusao, 
          solicitanteNome: userData?.nome || user?.email || "Secretário Local", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Pedido de remoção enviado!", tipo: 'sucesso' }); 
      }
      setConfirmaExclusao(null); 
    } catch (err) { setFeedback({ msg: "Erro na operação", tipo: 'erro' }); } 
  };

  const enviarSugestaoOuEdicao = async (ev) => { // Salva edições.
    ev.preventDefault(); 
    setEnviando(true); 
    try {
      const dadosSaneados = { ...formSugestao, encarregado: aplicarTituloIr(formSugestao.encarregado) }; 
      if (userData?.nivel === 'master') { 
        await updateDoc(doc(db, "ensaios_locais", sugestaoAberta.id), dadosSaneados); 
        setFeedback({ msg: "Dados atualizados com sucesso!", tipo: 'sucesso' }); 
      } else { 
        await addDoc(collection(db, "sugestoes_pendentes"), { 
          ensaioId: sugestaoAberta.id, 
          localidade: sugestaoAberta.localidade, 
          cidade: formSugestao.cidade, 
          tipo: 'local', 
          dadosAntigos: { ...sugestaoAberta }, 
          dadosSugeridos: dadosSaneados, 
          solicitanteNome: userData?.nome || user?.email || "Colaborador", 
          status: 'pendente', 
          dataSolicitacao: new Date() 
        });
        setFeedback({ msg: "Sugestão enviada para análise!", tipo: 'sucesso' }); 
      }
      setSugestaoAberta(null); 
    } catch (error) { setFeedback({ msg: "Falha ao processar pedido", tipo: 'erro' }); } 
    finally { setEnviando(false); } 
  };

  const ensaiosFiltradosFinal = useMemo(() => { // Motor de filtros da lista.
    let filtrados = [...todosEnsaios]; 
    if (semanaSelecionada) filtrados = filtrados.filter(e => e.dia.includes(semanaSelecionada.replace(/\D/g, "") || "Últ")); 
    if (diaSelecionado) filtrados = filtrados.filter(e => e.dia.includes(diaSelecionado)); 
    if (filtroCidade !== 'Todas') filtrados = filtrados.filter(e => normalizarTexto(e.cidade) === normalizarTexto(filtroCidade)); 
    if (busca) { 
      const b = normalizarTexto(busca); 
      filtrados = filtrados.filter(e => normalizarTexto(e.localidade).includes(b) || (e.encarregado && normalizarTexto(e.encarregado).includes(b))); 
    }
    const PESO_SEMANA = { "1ª": 1, "1º": 1, "2ª": 2, "2º": 2, "3ª": 3, "3º": 3, "4ª": 4, "4º": 4, "Últ": 5 }; 
    const PESO_DIA = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 }; 
    return filtrados.sort((a, b) => { 
      const semA = Object.keys(PESO_SEMANA).find(s => a.dia.includes(s)) || ""; 
      const semB = Object.keys(PESO_SEMANA).find(s => b.dia.includes(s)) || ""; 
      const diffSemana = (PESO_SEMANA[semA] || 99) - (PESO_SEMANA[semB] || 99); 
      if (diffSemana !== 0) return diffSemana; 
      const diaA = Object.keys(PESO_DIA).find(d => a.dia.includes(d)) || ""; 
      const diaB = Object.keys(PESO_DIA).find(d => b.dia.includes(d)) || ""; 
      const diffDia = (PESO_DIA[diaA] ?? 99) - (PESO_DIA[diaB] ?? 99); 
      if (diffDia !== 0) return diffDia; 
      return a.hora.localeCompare(b.hora) || a.localidade.localeCompare(b.localidade); 
    });
  }, [todosEnsaios, semanaSelecionada, diaSelecionado, filtroCidade, busca]); 

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-[10px] uppercase text-slate-300">Sincronizando Banco...</div>; 

  return ( 
    <div className="w-full text-left relative flex flex-col">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {userData?.nivel === 'master' && ( 
        <div className="px-6 pt-4">
          <button onClick={() => { setNovoEnsaio({ cidade: userData.cidade, localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Ensaio
          </button>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#F1F5F9]/95 backdrop-blur-xl px-6 py-4 space-y-3 border-b border-slate-200">
        <div className="flex gap-2">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Igreja ou encarregado..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-[11px] font-bold outline-none shadow-sm" />
          </div>
          <div className="relative flex-1">
            <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-4 text-[10px] font-bold outline-none appearance-none shadow-sm text-center">
              {['Todas', ...CIDADES_LISTA].map(c => <option key={c} value={c}>{c === 'Todas' ? 'Cidades' : c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSemanaSelecionada('')} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${!semanaSelecionada ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>ToDoS</button>
          {SEMANAS_LISTA.map(s => (
            <button key={s} onClick={() => setSemanaSelecionada(s)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${semanaSelecionada === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-1">
          <button onClick={() => setDiaSelecionado('')} className={`p-2.5 rounded-xl border transition-all ${!diaSelecionado ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-200'}`}><Calendar size={14} /></button>
          {DIAS_SIGLAS.map(d => (
            <button key={d} onClick={() => setDiaSelecionado(d)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-tighter border transition-all ${diaSelecionado === d ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-200'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-6 pb-32 mt-6">
        {CIDADES_LISTA.filter(c => (filtroCidade === 'Todas' || normalizarTexto(c) === normalizarTexto(filtroCidade))).map(cidade => {
          const ensaios = ensaiosFiltradosFinal.filter(e => normalizarTexto(e.cidade) === normalizarTexto(cidade));
          if (ensaios.length === 0) return null;
          const isAberta = cidadeAberta === cidade;

          return (
            <div key={cidade} className="bg-white rounded-[2.2rem] shadow-sm border border-slate-100 overflow-hidden mb-4">
              <button onClick={() => setCidadeAberta(isAberta ? null : cidade)} className={`w-full p-6 flex justify-between items-center transition-colors ${isAberta ? 'bg-slate-50' : 'bg-white'}`}>
                <div className="flex flex-col items-start text-left">
                  <span className="text-slate-950 text-lg font-[900] tracking-tighter uppercase italic">{cidade}</span>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">{ensaios.length} Ensaios</span>
                </div>
                {isAberta ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
              </button>

              {isAberta && (
                <div className="p-4 space-y-4 animate-in fade-in zoom-in-95">
                  {ensaios.map(e => (
                    <div key={e.id} className="bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100 space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-2">
                             <h4 className="text-base font-[900] text-slate-950 uppercase leading-none italic pr-20">{e.localidade}</h4>
                             {e.observacao && <AlertTriangle size={18} className="text-red-500 animate-pulse shrink-0" />}
                          </div>
                          <div className="flex flex-col mt-2">
                             <div className="flex items-center gap-1.5"><User size={12} className="text-slate-400 shrink-0"/><span className="text-[10px] font-black uppercase text-slate-600">{e.encarregado || 'N/I'}</span></div>
                             <div className="text-[10px] font-black text-slate-400 mt-0.5 ml-4.5">{e.contato || '-'}</div>
                          </div>
                        </div>
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                          <div className="bg-slate-950 text-white text-[9px] font-black px-3 py-3 rounded-xl uppercase shrink-0 shadow-md">{e.dia}</div>
                          <div className="flex gap-1">
                            {userData && (
                              <button onClick={() => { 
                                setSugestaoAberta(e); 
                                setFormSugestao({ ...e, cidade: normalizarCidadeParaDropdown(e.cidade) }); 
                              }} className="bg-amber-100 text-amber-600 p-2.5 rounded-xl active:scale-90 border border-amber-200"><Edit3 size={16}/></button>
                            )}
                            {userData?.nivel === 'master' && (
                              <button onClick={() => setConfirmaExclusao(e)} className="bg-red-100 text-red-600 p-2.5 rounded-xl active:scale-90 border border-red-200 shadow-sm"><Trash2 size={16}/></button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-black text-slate-950 pb-2"><Clock size={14} className="text-amber-500 shrink-0"/> {e.hora}</div>

                      {e.observacao && (
                        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex gap-2">
                          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-black text-red-700 uppercase leading-relaxed text-left">{e.observacao}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => ligarTelefone(e.contato, e.localidade, e.cidade)} className="bg-white border border-slate-200 text-blue-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Phone size={18} /></button>
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => acaoCompartilharEnsaioPadrao(e)} className="bg-white border border-slate-200 text-emerald-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Share2 size={18} /></button>
                        <button onClick={() => acaoAbrirMapa(e.localidade, e.cidade)} className="bg-slate-950 text-white p-4 rounded-2xl active:scale-90 flex justify-center shadow-lg"><MapPin size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(sugestaoAberta || mostraAdd) && createPortal(
        <div onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Ensaio' : (userData?.nivel === 'master' ? 'Editar Ensaio' : 'Sugerir Edição')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddEnsaio : enviarSugestaoOuEdicao} className="space-y-3 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Cidade</span>
                <select disabled={userData?.nivel !== 'master'} value={mostraAdd ? novoEnsaio.cidade : formSugestao.cidade} 
                        onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, cidade: ev.target.value}) : setFormSugestao({...formSugestao, cidade: ev.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none uppercase disabled:opacity-50">
                  {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Comum (Igreja)</span>
                <input required type="text" value={mostraAdd ? novoEnsaio.localidade : formSugestao.localidade} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, localidade: ev.target.value}) : setFormSugestao({...formSugestao, localidade: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Dia (Ex: 2ª Sex)</span>
                  <input required type="text" value={mostraAdd ? novoEnsaio.dia : formSugestao.dia} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, dia: ev.target.value}) : setFormSugestao({...formSugestao, dia: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Hora</span>
                  <input required type="time" value={mostraAdd ? novoEnsaio.hora : formSugestao.hora} 
                         onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, hora: ev.target.value}) : setFormSugestao({...formSugestao, hora: ev.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Encarregado (Apenas nome)</span>
                <input type="text" value={mostraAdd ? novoEnsaio.encarregado : formSugestao.encarregado} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, encarregado: ev.target.value}) : setFormSugestao({...formSugestao, encarregado: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold uppercase outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">WhatsApp / Contato</span>
                <input type="text" value={mostraAdd ? novoEnsaio.contato : formSugestao.contato} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, contato: ev.target.value}) : setFormSugestao({...formSugestao, contato: ev.target.value})} 
                       placeholder="11999999999"
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[11px] font-bold outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Observações</span>
                <textarea rows="2" value={mostraAdd ? novoEnsaio.observacao : formSugestao.observacao} 
                        onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, observacao: ev.target.value}) : setFormSugestao({...formSugestao, observacao: ev.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold uppercase outline-none resize-none" />
              </div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all mt-4">
                <Send size={16}/> {enviando ? 'Processando...' : (userData?.nivel === 'master' ? 'Salvar no Banco' : 'Enviar Sugestão')}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {confirmaExclusao && createPortal(
        <div onClick={() => setConfirmaExclusao(null)} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover {confirmaExclusao.localidade}?</h3>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirOuSugerir} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">{userData?.nivel === 'master' ? "Excluir Agora" : "Pedir Exclusão"}</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosLocais; // Exporta o arquivo afinado com a nova etiqueta [Igreja] - (Cidade).