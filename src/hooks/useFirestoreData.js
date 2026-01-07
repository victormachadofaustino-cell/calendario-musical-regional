import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function useFirestoreData() {
  const [todosEnsaios, setTodosEnsaios] = useState([]);
  const [ensaiosRegionaisData, setEnsaiosRegionaisData] = useState([]);
  const [encarregadosData, setEncarregadosData] = useState([]);
  const [examinadorasData, setExaminadorasData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listeners Globais extraídos do App original
    const unsubRegionais = onSnapshot(collection(db, "ensaios_regionais"), (s) => {
      setEnsaiosRegionaisData(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    
    const unsubLocais = onSnapshot(collection(db, "ensaios_locais"), (s) => {
      setTodosEnsaios(s.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    });

    const unsubEncarregados = onSnapshot(collection(db, "encarregados_regionais"), (s) => {
      setEncarregadosData(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubExaminadoras = onSnapshot(collection(db, "examinadoras"), (s) => {
      setExaminadorasData(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => {
      unsubRegionais();
      unsubLocais();
      unsubEncarregados();
      unsubExaminadoras();
    };
  }, []);

  return { 
    todosEnsaios, 
    ensaiosRegionaisData, 
    encarregadosData, 
    examinadorasData, 
    loading 
  };
}