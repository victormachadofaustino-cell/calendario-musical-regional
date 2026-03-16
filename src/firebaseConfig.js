import { initializeApp } from "firebase/app"; // Importa a ferramenta mestre que liga o motor principal do Firebase.
import { getFirestore } from "firebase/firestore"; // Importa o acesso ao nosso Livro de Registros (Banco de Dados).
import { getAuth } from "firebase/auth"; // Importa o acesso ao sistema de Crachás e Identidades (Autenticação).

const firebaseConfig = { // Início da lista de endereços e chaves exclusivas do seu projeto.
  apiKey: "AIzaSyAIzQuQuhS-Fu6xS6h0vMt7F0iv3MDEsDw", // Chave de segurança para o Google identificar que é o seu App.
  authDomain: "calendario-musical-regional.firebaseapp.com", // Endereço da central de login do seu sistema.
  projectId: "calendario-musical-regional", // O nome único do seu projeto na nuvem do Google.
  storageBucket: "calendario-musical-regional.firebasestorage.app", // Espaço reservado para guardar arquivos (se necessário).
  messagingSenderId: "623166985934", // Código para envio de notificações e mensagens internas.
  appId: "1:623166985934:web:0fc3d45915b12a9f02a29f", // Identificador único deste aplicativo específico.
  measurementId: "G-KCTFZ86L35" // Código para as estatísticas de uso (Google Analytics).
}; // Fim das configurações de endereço.

// Inicializa o Firebase
const app = initializeApp(firebaseConfig); // Liga o motor do Firebase usando as chaves de endereço acima.

// Exporta as instâncias para serem usadas no Login.jsx e App.jsx
export const db = getFirestore(app); // Cria e libera a ferramenta 'db' para mexermos no banco de dados em todo o App.
export const auth = getAuth(app); // Cria e libera a ferramenta 'auth' para gerenciar o login dos irmãos.