// src/hooks/useFirestoreData.js // Identifica o arquivo que busca todos os dados musicais da Regional no Google.

import { useState, useEffect } from 'react'; // Ferramentas base do React para gerenciar memória e observar o banco.
import { collection, onSnapshot } from 'firebase/firestore'; // Ferramentas para ouvir o banco de dados em tempo real.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco de dados da Regional.

export function useFirestoreData() { // Função que busca e organiza todas as informações para o Maestro (App.jsx).
  // GAVETAS DE MEMÓRIA (Onde o App guarda o que o Google envia)
  const [todosEnsaios, setTodosEnsaios] = useState([]); // 1. Guarda os Ensaios Locais das igrejas comuns.
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]); // 2. Guarda a agenda dos Ensaios Regionais.
  const [reunioesData, setReunioesData] = useState([]); // 3. Guarda a agenda de Reuniões Administrativas da música.
  const [encarregadosData, setEncarregadosData] = useState([]); // 4. Guarda a lista de contatos dos Encarregados Regionais.
  const [examinadorasData, setExaminadorasData] = useState([]); // 5. Guarda a lista de contatos das Examinadoras de Organistas.
  const [loading, setLoading] = useState(true); // 6. Sinaliza para o App se os dados ainda estão vindo pela internet.

  useEffect(() => { // Inicia os "vigias" que monitoram o banco de dados assim que o App é aberto.
    
    // Rastreador de carregamento para garantir que tudo chegou antes de liberar a tela.
    let carregados = { locais: false, regionais: false, reunioes: false };

    const checkFinalizado = () => { // Função interna que verifica se as 3 agendas principais já chegaram.
      if (carregados.locais && carregados.regionais && carregados.reunioes) {
        setLoading(false); // Libera o App para uso apenas quando tudo estiver pronto na memória.
      }
    };

    // VIGIA 1: Fica atento a qualquer mudança na agenda de Ensaios Regionais.
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => {
      setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Organiza os dados dos regionais.
      carregados.regionais = true; // Marca que os regionais já chegaram.
      checkFinalizado(); // Pergunta se já pode liberar a tela.
    });
    
    // VIGIA 2: Fica atento a qualquer mudança na lista de Ensaios Locais.
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()}))); // Organiza os dados de cada igreja comum.
      carregados.locais = true; // Marca que os locais já chegaram.
      checkFinalizado(); // Pergunta se já pode liberar a tela.
    });

    // VIGIA 3: Fica atento à nova pasta de Reuniões da Regional.
    const unsubReunioes = onSnapshot(collection(db, "reunioes_regionais"), (s) => {
      setReunioesData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Organiza a agenda de reuniões administrativas.
      carregados.reunioes = true; // Marca que as reuniões já chegaram.
      checkFinalizado(); // Pergunta se já pode liberar a tela.
    });

    // VIGIA 4: Fica atento aos números de telefone da Comissão de Encarregados.
    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => {
      setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Mantém os contatos dos regionais atualizados.
    });

    // VIGIA 5: Fica atento aos números de telefone das Examinadoras.
    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => {
      setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Mantém os contatos das irmãs sempre à mão.
    });

    // LIMPEZA: Desliga todos os vigias ao fechar o App para proteger a bateria do músico.
    return () => {
      unsubRegionais(); // Encerra a escuta de regionais.
      unsubLocais(); // Encerra a escuta de locais.
      unsubReunioes(); // Encerra a escuta de reuniões.
      unsubEncarregados(); // Encerra a escuta de encarregados.
      unsubExaminadoras(); // Encerra a escuta de examinadoras.
    };
  }, []); // Garante que essa configuração de vigias ocorra apenas uma vez.

  return { // Entrega as pastas de informações completas para o App distribuir nas telas.
    todosEnsaios, 
    ensaiosRegionaisData, 
    reunioesData, 
    encarregadosData, 
    examinadorasData, 
    loading 
  };
}