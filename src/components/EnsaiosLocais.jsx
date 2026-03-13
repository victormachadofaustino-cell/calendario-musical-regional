import React, { useState, useMemo, useEffect } from 'react'; // Ferramenta base para criar componentes e gerenciar memória e dados.
import { createPortal } from 'react-dom'; // Permite desenhar janelas flutuantes (modais) fora da estrutura principal.
import { db } from '../firebaseConfig'; // Importa a conexão com o banco de dados Firebase.
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // Ferramentas para criar, ler, editar e apagar documentos no banco.
import { 
  MapPin, Clock, User, AlertTriangle, Search, Filter, Edit3, Send, X, 
  Plus, Trash2, Calendar, ChevronDown, ChevronUp, Phone, Share2
} from 'lucide-react'; // Ícones modernos para os botões e indicações visuais.
import Feedback from './Feedback'; // Componente que mostra avisos de "Sucesso" ou "Erro" no topo.

// Importação das constantes centralizadas, funções utilitárias e permissões
import { CIDADES_LISTA } from '../constants/cidades'; // Lista oficial de cidades da região.
import { normalizarTexto } from '../constants/comuns'; // Ferramenta para padronizar textos (comparar nomes sem erro de acento).
import { isMaster, podeVerBotoesDeGestao, obterNivelAcesso } from '../constants/permissions'; // Motor de regras de quem pode o quê.

// CORREÇÃO: Importando as ferramentas centralizadas do nosso canivete suíço.
import { abrirGoogleMaps, compartilharEnsaio } from '../utils/actions'; 

const EnsaiosLocais = ({ todosEnsaios, diaFiltro: diaFiltroApp, loading, user }) => { // Início do componente que recebe os ensaios e o usuário logado.
  const [busca, setBusca] = useState(''); // Guarda o texto que o usuário digita na barra de pesquisa.
  const [cidadeAberta, setCidadeAberta] = useState(null); // Controla qual sanfona (accordion) de cidade está aberta agora.
  const [filtroCidade, setFiltroCidade] = useState('Todas'); // Guarda a cidade selecionada no seletor de filtros.
  
  const [semanaSelecionada, setSemanaSelecionada] = useState(''); // Guarda se o usuário quer ver só a 1ª semana, 2ª, etc.
  const [diaSelecionado, setDiaSelecionado] = useState(''); // Guarda se o usuário quer ver só Segunda, Terça, etc.

  const [feedback, setFeedback] = useState(null); // Controla a mensagem de alerta que aparece após uma ação.
  const [sugestaoAberta, setSugestaoAberta] = useState(null); // Guarda o ensaio que está sendo editado no momento.
  const [confirmaExclusao, setConfirmaExclusao] = useState(null); // Guarda o ensaio que o usuário clicou para remover.
  const [mostraAdd, setMostraAdd] = useState(false); // Controla se o modal de "Novo Ensaio" deve aparecer.
  const [enviando, setEnviando] = useState(false); // Impede cliques duplos enquanto o sistema salva dados.

  const [novoEnsaio, setNovoEnsaio] = useState({ cidade: 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); // Dados do formulário de nova criação.
  const [formSugestao, setFormSugestao] = useState({ localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '', cidade: '' }); // Dados do formulário de edição/sugestão.

  const SEMANAS_LISTA = ["1ª", "2ª", "3ª", "4ª", "Últ."]; // Lista das semanas do mês para os botões de filtro.
  const DIAS_SIGLAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Lista dos dias da semana para os botões de filtro.

  useEffect(() => { // Lógica que roda quando a tela abre ou o filtro do App muda.
    if (diaFiltroApp) { // Se o usuário veio do Hub clicando em um dia específico...
      setSemanaSelecionada(diaFiltroApp.split(' ')[0]); // ...aplica a semana (1ª, 2ª...) automaticamente.
      setDiaSelecionado(diaFiltroApp.split(' ')[1]); // ...aplica o dia (Seg, Ter...) automaticamente.
      setFiltroCidade('Todas'); // Garante que mostre todas as cidades para aquele dia.
    }
    return () => { // Limpa tudo quando o usuário sai desta tela.
      setSemanaSelecionada('');
      setDiaSelecionado('');
      setBusca('');
      setFiltroCidade('Todas');
    };
  }, [diaFiltroApp]); // Monitora mudanças no filtro vindo de fora.

  const ligarTelefone = (numero) => { // Inicia uma chamada telefônica.
    if (!numero || numero === "-") return; // Se não tiver número, não faz nada.
    const limpo = numero.replace(/\D/g, ""); // Remove parênteses e traços.
    window.open(`tel:${limpo}`, '_self'); // Abre o discador do celular.
  };

  const handleAddEnsaio = async (e) => { // Lógica para salvar um novo ensaio.
    e.preventDefault(); // Impede a página de recarregar.
    setEnviando(true); // Trava o botão para evitar envio duplo.
    try {
      if (isMaster(user)) { // Se for Master, salva direto no banco oficial.
        await addDoc(collection(db, "ensaios_locais"), novoEnsaio);
        setFeedback({ msg: "Ensaio adicionado!", tipo: 'sucesso' });
      } else { // Se for Editor da cidade, envia como sugestão para o Master aprovar.
        await addDoc(collection(db, "sugestoes_pendentes"), {
          tipo: 'local_criacao', cidade: novoEnsaio.cidade, localidade: novoEnsaio.localidade,
          dadosSugeridos: novoEnsaio, solicitanteNome: user.nome, status: 'pendente', dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Criação enviada para análise!", tipo: 'sucesso' });
      }
      setMostraAdd(false); // Fecha a janelinha de cadastro.
      setNovoEnsaio({ cidade: user?.cidade || 'Jundiaí', localidade: '', dia: '', hora: '', encarregado: '', contato: '', observacao: '' }); // Reseta o formulário.
    } catch (err) { setFeedback({ msg: "Erro ao salvar", tipo: 'erro' }); } 
    finally { setEnviando(false); } // Destrava o botão.
  };

  const handleExcluirOuSugerir = async () => { // Lógica inteligente de remoção.
    try {
      if (isMaster(user)) { // Se for o mestre, apaga do banco imediatamente.
        await deleteDoc(doc(db, "ensaios_locais", confirmaExclusao.id));
        setFeedback({ msg: "Removido com sucesso!", tipo: 'sucesso' });
      } else { // Se for Editor, solicita ao Master a exclusão.
        await addDoc(collection(db, "sugestoes_pendentes"), {
          ensaioId: confirmaExclusao.id, tipo: 'local_exclusao', cidade: confirmaExclusao.cidade, localidade: confirmaExclusao.localidade,
          dadosAntigos: confirmaExclusao, solicitanteNome: user.nome, status: 'pendente', dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Solicitação de exclusão enviada!", tipo: 'sucesso' });
      }
      setConfirmaExclusao(null); // Fecha o aviso de confirmação.
    } catch (err) { setFeedback({ msg: "Erro na operação", tipo: 'erro' }); }
  };

  const enviarSugestaoOuEdicao = async (ev) => { // Lógica para o botão de "Salvar" no modal de edição.
    ev.preventDefault();
    setEnviando(true);
    try {
      if (isMaster(user)) { // Se for mestre, atualiza o banco na hora.
        await updateDoc(doc(db, "ensaios_locais", sugestaoAberta.id), formSugestao);
        setFeedback({ msg: "Banco atualizado!", tipo: 'sucesso' });
      } else { // Se for colaborador de cidade, envia a edição para a fila de espera do Master.
        await addDoc(collection(db, "sugestoes_pendentes"), {
          ensaioId: sugestaoAberta.id, localidade: sugestaoAberta.localidade, cidade: sugestaoAberta.cidade, tipo: 'local',
          dadosAntigos: { ...sugestaoAberta }, dadosSugeridos: formSugestao, solicitanteNome: user.nome, status: 'pendente', dataSolicitacao: new Date()
        });
        setFeedback({ msg: "Sugestão enviada ao Master!", tipo: 'sucesso' });
      }
      setSugestaoAberta(null); // Fecha a janelinha.
    } catch (error) { setFeedback({ msg: "Erro no envio", tipo: 'erro' }); } 
    finally { setEnviando(false); }
  };

  const ensaiosFiltradosFinal = useMemo(() => { // Lógica de filtro e ordenação ultra rápida.
    let filtrados = [...todosEnsaios];
    if (semanaSelecionada) filtrados = filtrados.filter(e => e.dia.includes(semanaSelecionada.replace(/\D/g, "") || "Últ")); // Filtra pela semana do mês.
    if (diaSelecionado) filtrados = filtrados.filter(e => e.dia.includes(diaSelecionado)); // Filtra pelo dia da semana (Seg, Ter...).
    if (filtroCidade !== 'Todas') filtrados = filtrados.filter(e => normalizarTexto(e.cidade) === normalizarTexto(filtroCidade)); // Filtra pela cidade escolhida.
    if (busca) { // Filtra pelo que o usuário escreveu na busca.
      const b = normalizarTexto(busca);
      filtrados = filtrados.filter(e => normalizarTexto(e.localidade).includes(b) || (e.encarregado && normalizarTexto(e.encarregado).includes(b)));
    }

    const PESO_SEMANA = { "1ª": 1, "1º": 1, "2ª": 2, "2º": 2, "3ª": 3, "3º": 3, "4ª": 4, "4º": 4, "Últ": 5 }; // Pesos para colocar em ordem cronológica.
    const PESO_DIA = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 }; // Ordem dos dias na semana.

    return filtrados.sort((a, b) => { // Organiza a lista final para o usuário ver.
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

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-[10px] uppercase tracking-[0.5em]">Sincronizando Banco...</div>; // Mensagem de espera.

  return ( // Desenho da tela de ensaios.
    <div className="w-full text-left relative flex flex-col">
      {feedback && <Feedback mensagem={feedback.msg} tipo={feedback.tipo} aoFechar={() => setFeedback(null)} />}
      
      {/* Botão de Adicionar: Só aparece para Master ou Editor na sua cidade */}
      {podeVerBotoesDeGestao(user, user?.cidade) && (
        <div className="px-6 pt-4">
          <button onClick={() => { setNovoEnsaio(prev => ({...prev, cidade: user.cidade})); setMostraAdd(true); }} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Plus size={16}/> Novo Ensaio em {isMaster(user) ? 'Qualquer Cidade' : user.cidade}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS FIXA: Facilita encontrar igrejas sem perder a barra de busca */}
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

      {/* LISTAGEM POR CIDADES (SANFONA/ACCORDION) */}
      <div className="space-y-4 px-6 pb-32 mt-6">
        {CIDADES_LISTA.filter(c => (filtroCidade === 'Todas' || normalizarTexto(c) === normalizarTexto(filtroCidade))).map(cidade => {
          const ensaios = ensaiosFiltradosFinal.filter(e => normalizarTexto(e.cidade) === normalizarTexto(cidade));
          if (ensaios.length === 0) return null; // Se a cidade não tem ensaios no filtro, não aparece.
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
                            {podeVerBotoesDeGestao(user, e.cidade) && ( 
                              <button onClick={() => { setSugestaoAberta(e); setFormSugestao({ ...e, cidade: e.cidade }); }} className="bg-amber-100 text-amber-600 p-2.5 rounded-xl active:scale-90 border border-amber-200"><Edit3 size={16}/></button>
                            )}
                            {podeVerBotoesDeGestao(user, e.cidade) && ( 
                              <button onClick={() => setConfirmaExclusao(e)} className="bg-red-100 text-red-600 p-2.5 rounded-xl active:scale-90 border border-red-200 shadow-sm"><Trash2 size={16}/></button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-black text-slate-950 pb-2"><Clock size={14} className="text-amber-500 shrink-0"/> {e.hora}</div>

                      {/* AVISO DE OBSERVAÇÃO: Mostra se a igreja está em reforma ou se o ensaio mudou */}
                      {e.observacao && (
                        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex gap-2">
                          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-black text-red-700 uppercase leading-relaxed text-left">{e.observacao}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                        {/* Ações Rápidas: Chamar telefone, Compartilhar ou GPS */}
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => ligarTelefone(e.contato)} className="bg-white border border-slate-200 text-blue-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Phone size={18} /></button>
                        <button disabled={!e.contato || e.contato === "-"} onClick={() => compartilharEnsaio(e)} className="bg-white border border-slate-200 text-emerald-600 p-4 rounded-2xl active:scale-90 flex justify-center shadow-sm disabled:opacity-30"><Share2 size={18} /></button>
                        <button onClick={() => abrirGoogleMaps(e.localidade, e.cidade)} className="bg-slate-950 text-white p-4 rounded-2xl active:scale-90 flex justify-center shadow-lg"><MapPin size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FORMULÁRIO DE EDIÇÃO/CRIAÇÃO (Modal Flutuante) */}
      {(sugestaoAberta || mostraAdd) && createPortal(
        <div onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-left">
            <button onClick={() => { setSugestaoAberta(null); setMostraAdd(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
              {mostraAdd ? 'Novo Ensaio' : (isMaster(user) ? 'Editar Ensaio' : 'Sugerir Edição')}
            </h3>
            <form onSubmit={mostraAdd ? handleAddEnsaio : enviarSugestaoOuEdicao} className="space-y-3 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Cidade</span>
                <select disabled={!isMaster(user)} value={mostraAdd ? novoEnsaio.cidade : formSugestao.cidade} 
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
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Encarregado</span>
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
                <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Observações (Deslocamentos, Reformas...)</span>
                <textarea rows="2" value={mostraAdd ? novoEnsaio.observacao : formSugestao.observacao} 
                       onChange={ev => mostraAdd ? setNovoEnsaio({...novoEnsaio, observacao: ev.target.value}) : setFormSugestao({...formSugestao, observacao: ev.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-[10px] font-bold uppercase outline-none resize-none" />
              </div>
              <button disabled={enviando} type="submit" className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-xl transition-all mt-4">
                <Send size={16}/> {enviando ? 'Processando...' : (isMaster(user) ? 'Salvar no Banco' : 'Enviar Sugestão')}
              </button>
            </form>
          </div>
        </div>, document.body
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmaExclusao && createPortal(
        <div onClick={() => setConfirmaExclusao(null)} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-4"/>
            <h3 className="text-lg font-[900] uppercase italic tracking-tighter text-slate-950 leading-tight">Remover {confirmaExclusao.localidade}?</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{isMaster(user) ? "A exclusão será permanente." : "Sua solicitação será enviada ao Master."}</p>
            <div className="flex flex-col gap-2 mt-6">
              <button onClick={handleExcluirOuSugerir} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">{isMaster(user) ? "Excluir Agora" : "Pedir Exclusão"}</button>
              <button onClick={() => setConfirmaExclusao(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default EnsaiosLocais; // Exporta a lista de ensaios locais devidamente conectada às ferramentas de ação centralizadas.