import { useState, useEffect } from 'react'; // Ferramentas base do React para gerenciar memória e observar o banco.
import { collection, onSnapshot } from 'firebase/firestore'; // Ferramentas para ouvir o banco de dados em tempo real.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco.

export function useFirestoreData() { // Função que busca todos os dados musicais da Regional.
  // GAVETAS DE MEMÓRIA (Ordem rigorosa para o React não se perder)
  const [todosEnsaios, setTodosEnsaios] = useState([]); // 1. Guarda os Ensaios Locais.
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]); // 2. Guarda os Ensaios Regionais.
  const [reunioesData, setReunioesData] = useState([]); // 3. NOVA GAVETA: Guarda a agenda de Reuniões.
  const [encarregadosData, setEncarregadosData] = useState([]); // 4. Guarda contatos dos Encarregados.
  const [examinadorasData, setExaminadorasData] = useState([]); // 5. Guarda contatos das Examinadoras.
  const [loading, setLoading] = useState(true); // 6. Sinaliza se os dados ainda estão carregando.

  useEffect(() => { // Monta os "ouvidos" do App para escutar o banco de dados.
    
    // VIGIA 1: Escuta a agenda de Ensaios Regionais.
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => {
      setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()}))); //
    });
    
    // VIGIA 2: Escuta a lista de Ensaios Locais das igrejas.
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()}))); //
      setLoading(false); //
    });

    // VIGIA 3: Escuta a nova pasta de Reuniões (RMA, RCM, etc).
    const unsubReunioes = onSnapshot(collection(db, "reunioes_regionais"), (s) => {
      setReunioesData(s.docs.map(d => ({id: d.id, ...d.data()}))); //
    });

    // VIGIA 4: Escuta os contatos da Comissão de Encarregados.
    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => {
      setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()}))); //
    });

    // VIGIA 5: Escuta os contatos das Examinadoras da Regional.
    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => {
      setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()}))); //
    });

    // LIMPEZA: Desliga todos os vigias ao fechar o App para economizar recursos.
    return () => {
      unsubRegionais(); //
      unsubLocais(); //
      unsubReunioes(); //
      unsubEncarregados(); //
      unsubExaminadoras(); //
    };
  }, []); // Garante que a vigia só comece uma vez.

  return { // Entrega as informações para o Maestro (App.jsx).
    todosEnsaios, 
    ensaiosRegionaisData, 
    reunioesData, 
    encarregadosData, 
    examinadorasData, 
    loading 
  };
}