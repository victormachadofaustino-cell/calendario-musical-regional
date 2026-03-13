import { useState, useEffect } from 'react'; // Ferramentas base do React para criar gavetas de memória (estado) e observar mudanças (efeito).
import { collection, onSnapshot } from 'firebase/firestore'; // Ferramentas para acessar as pastas de documentos e ouvir atualizações em tempo real no banco.
import { db } from '../firebaseConfig'; // Importa a chave de acesso oficial do nosso banco de dados.

export function useFirestoreData() { // Função que funciona como um "Caminhão de Carga" para abastecer o App com dados.
  const [todosEnsaios, setTodosEnsaios] = useState([]); // Gaveta de memória para guardar a lista de todos os Ensaios Locais das comuns.
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]); // Gaveta de memória para guardar a agenda oficial de Ensaios Regionais.
  const [encarregadosData, setEncarregadosData] = useState([]); // Gaveta de memória para guardar a lista de contatos dos Encarregados Regionais.
  const [examinadorasData, setExaminadorasData] = useState([]); // Gaveta de memória para guardar a lista de contatos das Examinadoras.
  const [loading, setLoading] = useState(true); // Um sinalizador (luz de carregando) que avisa se o caminhão ainda está na estrada buscando os dados.

  useEffect(() => { // Inicia a conexão com o banco de dados assim que o usuário abre o aplicativo.
    
    // 1. VIGIA DE REGIONAIS: Fica ouvindo a pasta "ensaios_regionais". Se mudar uma vírgula lá, o App atualiza sozinho.
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => {
      setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Mapeia os documentos e guarda o "ID" (RG do documento) junto com os dados.
    });
    
    // 2. VIGIA DE LOCAIS: Fica ouvindo a pasta "ensaios_locais" onde estão os ensaios de cada igreja comum.
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()}))); // Transforma a lista do banco em uma lista que o React entende.
      setLoading(false); // Assim que os ensaios chegam, apagamos a "luz de carregando".
    });

    // 3. VIGIA DE ENCARREGADOS: Fica ouvindo a pasta de contatos da comissão regional.
    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => {
      setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Garante que o telefone do encarregado esteja sempre certo.
    });

    // 4. VIGIA DE EXAMINADORAS: Fica ouvindo a pasta de contatos das examinadoras da regional.
    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => {
      setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()}))); // Atualiza os contatos das examinadoras instantaneamente.
    });

    // FUNÇÃO DE LIMPEZA: Quando o irmão fecha o App, nós "desligamos os rádios" para economizar a bateria do celular dele.
    return () => {
      unsubRegionais(); // Desliga o vigia de regionais.
      unsubLocais(); // Desliga o vigia de locais.
      unsubEncarregados(); // Desliga o vigia de encarregados.
      unsubExaminadoras(); // Desliga o vigia de examinadoras.
    };
  }, []); // O colchete vazio significa que essa logística só precisa ser montada uma vez na abertura.

  return { // Entrega as gavetas de memória prontas para os componentes de tela usarem.
    todosEnsaios, 
    ensaiosRegionaisData, 
    encarregadosData, 
    examinadorasData, 
    loading 
  };
}