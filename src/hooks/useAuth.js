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

    // 1. O "Vigia da Porta" começa a trabalhar observando o login do Google/Firebase
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Grava na memória quem é a pessoa que acabou de passar pela porta.
      
      if (currentUser) { // Se houver alguém logado...
        // 2. Busca no banco de dados a Ficha Cadastral específica desse UID (Identidade Única)
        unsubUserData = onSnapshot(doc(db, "usuarios", currentUser.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().ativo) { // Se o cadastro existe e o Master não inativou o irmão...
            const data = docSnap.data(); // Pega as informações de dentro do documento.
            setUserData(data); // Salva na memória o cargo e a cidade dele.

            // 3. REGRA DE MAESTRO: Se o nível for 'master', ele ganha olhos especiais para ver a fila de trabalho
            if (data.nivel === 'master') {
              
              // Define as buscas por cadastros "pendentes" e sugestões enviadas por editores
              const qUsers = query(collection(db, "usuarios"), where("status", "==", "pendente"));
              const qSugestoes = collection(db, "sugestoes_pendentes");

              // Variáveis temporárias para somar os dois tipos de trabalho pendente
              let countUsers = 0;
              let countSug = 0;

              // Vigia em tempo real se novos irmãos pediram para entrar no app
              unsubUsersPendentes = onSnapshot(qUsers, (snapUsers) => {
                countUsers = snapUsers.size; // Conta quantos cadastros novos existem.
                setPendenciasCount(countUsers + countSug); // Atualiza o total de notificações do painel.
              }, (err) => console.log("Aguardando permissões de usuários..."));

              // Vigia em tempo real se algum editor sugeriu mudar o horário ou local de um ensaio
              unsubSugestoes = onSnapshot(qSugestoes, (snapSug) => {
                countSug = snapSug.size; // Conta quantas sugestões de mudança existem.
                setPendenciasCount(countUsers + countSug); // Atualiza o total de notificações do painel.
              }, (err) => console.log("Aguardando permissões de sugestões..."));

            } else {
              setPendenciasCount(0); // Se for um músico comum, o contador de trabalho administrativo fica em zero.
            }
          } else {
            // SEGURANÇA CRÍTICA: Se o Master inativar o usuário enquanto ele usa o app, o sistema o expulsa na hora.
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

    // Função de limpeza: Quando o app é fechado, paramos de ouvir o banco para economizar bateria e dados do celular.
    return () => {
      unsubAuth(); // Para de vigiar o login.
      if (unsubUserData) unsubUserData(); // Para de vigiar o perfil.
      if (unsubUsersPendentes) unsubUsersPendentes(); // Para de vigiar novos cadastros.
      if (unsubSugestoes) unsubSugestoes(); // Para de vigiar sugestões.
    };
  }, []); // O colchete vazio indica que essa vigia começa apenas uma vez ao abrir o aplicativo.

  return { user, userData, pendenciasCount }; // Entrega as informações prontas para o Maestro (App.jsx) usar nas telas.
}