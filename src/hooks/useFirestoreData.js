import { useState, useEffect } from 'react'; // Ferramentas base do React para gerenciar memória e observar o banco.
import { collection, onSnapshot } from 'firebase/firestore'; // Ferramentas para ouvir o banco de dados em tempo real.
import { db } from '../firebaseConfig'; // Importa a conexão oficial com o banco.

export function useFirestoreData() { // Função que busca todos os dados musicais da Regional.
  // GAVETAS DE MEMÓRIA (Ordem rigorosa para o React não se perder)
  const [todosEnsaios, setTodosEnsaios] = useState([]); // 1. Guarda os Ensaios Locais das igrejas comuns.
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]); // 2. Guarda a agenda dos Ensaios Regionais.
  const [reunioesData, setReunioesData] = useState([]); // 3. Guarda a agenda de Reuniões Administrativas da música.
  const [encarregadosData, setEncarregadosData] = useState([]); // 4. Guarda a lista de contatos dos Encarregados Regionais.
  const [examinadorasData, setExaminadorasData] = useState([]); // 5. Guarda a lista de contatos das Examinadoras de Organistas.
  const [loading, setLoading] = useState(true); // 6. Sinaliza para o App se os dados ainda estão vindo pela internet.

  useEffect(() => { // Monta os "ouvidos" do App para escutar o banco de dados assim que ele liga.
    
    // VIGIA 1: Fica atento a qualquer mudança na agenda de Ensaios Regionais.
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => {
      setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Pega o conteúdo e o código secreto (ID) de cada regional.
    });
    
    // VIGIA 2: Fica atento a qualquer mudança na lista de Ensaios Locais.
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()}))); // Pega o conteúdo e o código secreto (ID) de cada igreja comum.
      setLoading(false); // Assim que os locais chegam, o App avisa que já pode ser usado.
    });

    // VIGIA 3: Fica atento a nova pasta de Reuniões da Regional.
    const unsubReunioes = onSnapshot(collection(db, "reunioes_regionais"), (s) => {
      setReunioesData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Busca a agenda de reuniões administrativas e de instrução.
    });

    // VIGIA 4: Fica atento aos números de telefone da Comissão de Encarregados.
    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => {
      setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Mantém os contatos dos encarregados regionais atualizados.
    });

    // VIGIA 5: Fica atento aos números de telefone das Examinadoras.
    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => {
      setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Mantém os contatos das irmãs examinadoras sempre à mão.
    });

    // LIMPEZA: Quando o músico fecha o App, os "ouvidos" são desligados para não gastar dados nem bateria.
    return () => {
      unsubRegionais(); // Desliga a vigia de regionais.
      unsubLocais(); // Desliga a vigia de ensaios locais.
      unsubReunioes(); // Desliga a vigia de reuniões.
      unsubEncarregados(); // Desliga a vigia de encarregados.
      unsubExaminadoras(); // Desliga a vigia de examinadoras.
    };
  }, []); // O colchete vazio garante que os vigias comecem apenas uma vez ao abrir o App.

  return { // Entrega todas as pastas de informações prontas para o Maestro (App.jsx) distribuir nas telas.
    todosEnsaios, 
    ensaiosRegionaisData, 
    reunioesData, 
    encarregadosData, 
    examinadorasData, 
    loading 
  };
}