import { useState, useEffect } from 'react'; // Ferramentas base do React para criar memória (estado) e observar mudanças (efeitos).
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Ferramentas para vigiar se o músico logou ou se precisa ser retirado do palco (sair).
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'; // Ferramentas para ler o Livro de Registros (banco de dados) em tempo real.
import { auth, db } from '../firebaseConfig'; // Importa as chaves oficiais de acesso ao nosso banco de dados.

export function useAuth() { // Função principal que será usada pelo resto do aplicativo para saber quem está logado.
  const [user, setUser] = useState(null); // Memória que guarda a conta de e-mail básica de quem logou.
  const [userData, setUserData] = useState(null); // Memória que guarda a "Ficha Musical" completa (Cargo, Cidade, Nível).
  const [pendenciasCount, setPendenciasCount] = useState(0); // Contador que avisa ao Master quantas aprovações estão na fila.

  useEffect(() => { // Inicia a observação constante assim que o aplicativo é aberto.
    let unsubUserData = null; // Espaço reservado para desligar o vigia de dados do usuário depois.
    let unsubUsersPendentes = null; // Espaço reservado para desligar o vigia de novos cadastros depois.
    let unsubSugestoes = null; // Espaço reservado para desligar o vigia de correções de ensaios depois.

    // 1. O "Vigia da Porta" começa a trabalhar observando o login do músico no sistema.
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Grava na memória quem é a pessoa que acabou de passar pela porta.
      
      if (currentUser) { // Se houver alguém logado...
        // 2. Busca no banco de dados a Ficha Cadastral específica desse UID (Identidade Única).
        unsubUserData = onSnapshot(doc(db, "usuarios", currentUser.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().ativo) { // Se o cadastro existe e o Master não inativou o irmão...
            const data = docSnap.data(); // Pega as informações de dentro do documento (Cargo, Nível, etc).
            setUserData(data); // Salva na memória o perfil completo do músico logado.

            // 3. REGRA DE MAESTRO: Se o nível for 'master', ele ganha olhos especiais para ver a fila de trabalho.
            if (data.nivel === 'master') {
              
              // Define as buscas por cadastros "pendentes" e sugestões enviadas por editores.
              const qUsers = query(collection(db, "usuarios"), where("status", "==", "pendente"));
              const qSugestoes = collection(db, "sugestoes_pendentes");

              // Espaços de memória para guardar as contagens parciais.
              let lastUsersCount = 0;
              let lastSugCount = 0;

              // Vigia em tempo real se novos irmãos pediram para entrar no app.
              unsubUsersPendentes = onSnapshot(qUsers, (snapUsers) => {
                lastUsersCount = snapUsers.size; // Conta quantos cadastros novos existem.
                setPendenciasCount(lastUsersCount + lastSugCount); // Soma com as sugestões e atualiza o painel do Master.
              }, (err) => console.log("Erro ao vigiar usuários pendentes."));

              // Vigia em tempo real se algum editor sugeriu mudar dados de um ensaio.
              unsubSugestoes = onSnapshot(qSugestoes, (snapSug) => {
                lastSugCount = snapSug.size; // Conta quantas sugestões de mudança existem.
                setPendenciasCount(lastUsersCount + lastSugCount); // Soma com os usuários e atualiza o painel do Master.
              }, (err) => console.log("Erro ao vigiar sugestões pendentes."));

            } else {
              setPendenciasCount(0); // Se não for Master, o contador de trabalho administrativo fica em zero.
            }
          } else {
            // SEGURANÇA CRÍTICA: Se o Master inativar o usuário no banco, o sistema o expulsa do palco na hora.
            signOut(auth);
            setUserData(null);
          }
        });
      } else {
        // Se a pessoa deslogar manualmente, limpamos todas as memórias do app por segurança.
        setUserData(null);
        setPendenciasCount(0);
        if (unsubUserData) unsubUserData(); // Desliga o vigia de perfil.
        if (unsubUsersPendentes) unsubUsersPendentes(); // Desliga o vigia de novos usuários.
        if (unsubSugestoes) unsubSugestoes(); // Desliga o vigia de mudanças de dados.
      }
    });

    // Função de limpeza: Quando o músico fecha o app, desligamos todos os vigias para poupar bateria e internet.
    return () => {
      unsubAuth(); // Para de vigiar o login.
      if (unsubUserData) unsubUserData(); // Para de vigiar o perfil.
      if (unsubUsersPendentes) unsubUsersPendentes(); // Para de vigiar novos cadastros.
      if (unsubSugestoes) unsubSugestoes(); // Para de vigiar sugestões.
    };
  }, []); // O colchete vazio garante que essa rotina comece apenas uma vez ao ligar o aplicativo.

  return { user, userData, pendenciasCount }; // Entrega as informações prontas para o Maestro (App.jsx) usar nas telas.
}