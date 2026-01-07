import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pendenciasCount, setPendenciasCount] = useState(0);

  useEffect(() => {
    let unsubUserData = null;
    let unsubUsersPendentes = null;
    let unsubSugestoes = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 1. Ouvinte dos dados do perfil do usuário logado
        unsubUserData = onSnapshot(doc(db, "usuarios", currentUser.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().ativo) {
            const data = docSnap.data();
            setUserData(data);

            // 2. Se for MASTER, inicia a vigilância dupla das pendências
            if (data.nivel === 'master') {
              
              // Definição das queries
              const qUsers = query(collection(db, "usuarios"), where("status", "==", "pendente"));
              const qSugestoes = collection(db, "sugestoes_pendentes");

              // Variáveis para armazenar os tamanhos parciais e permitir a soma
              let countUsers = 0;
              let countSug = 0;

              // Listener para Usuários Pendentes
              unsubUsersPendentes = onSnapshot(qUsers, (snapUsers) => {
                countUsers = snapUsers.size;
                setPendenciasCount(countUsers + countSug);
              }, (err) => console.log("Aguardando permissões de usuários..."));

              // Listener para Sugestões de Alteração
              unsubSugestoes = onSnapshot(qSugestoes, (snapSug) => {
                countSug = snapSug.size;
                setPendenciasCount(countUsers + countSug);
              }, (err) => console.log("Aguardando permissões de sugestões..."));

            } else {
              setPendenciasCount(0);
            }
          } else {
            // Se o usuário não existe no banco ou está inativo, desloga
            signOut(auth);
            setUserData(null);
          }
        });
      } else {
        // Reset de estado ao deslogar
        setUserData(null);
        setPendenciasCount(0);
        if (unsubUserData) unsubUserData();
        if (unsubUsersPendentes) unsubUsersPendentes();
        if (unsubSugestoes) unsubSugestoes();
      }
    });

    // Limpeza de todos os listeners ao desmontar o hook
    return () => {
      unsubAuth();
      if (unsubUserData) unsubUserData();
      if (unsubUsersPendentes) unsubUsersPendentes();
      if (unsubSugestoes) unsubSugestoes();
    };
  }, []);

  return { user, userData, pendenciasCount };
}