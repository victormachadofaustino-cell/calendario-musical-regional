// src/firebaseConfig.js // Identifica o arquivo central de conexão com os serviços da nuvem do Google.

import { initializeApp } from "firebase/app"; // Importa a ferramenta mestre que liga o motor principal do Firebase.
import { getFirestore } from "firebase/firestore"; // Importa o acesso ao nosso Livro de Registros (Banco de Dados).
import { getAuth } from "firebase/auth"; // Importa o acesso ao sistema de Crachás e Identidades (Autenticação).
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // Importa o Mensageiro que entrega as notificações no celular.

const firebaseConfig = { // Início da lista de endereços e chaves exclusivas do seu projeto.
  apiKey: "AIzaSyAIzQuQuhS-Fu6xS6h0vMt7F0iv3MDEsDw", // Chave de segurança para o Google identificar que é o seu App.
  authDomain: "calendario-musical-regional.firebaseapp.com", // Endereço da central de login do seu sistema.
  projectId: "calendario-musical-regional", // O nome único do seu projeto na nuvem do Google.
  storageBucket: "calendario-musical-regional.firebasestorage.app", // Espaço reservado para guardar arquivos.
  messagingSenderId: "623166985934", // Código vital para identificar o serviço de envio de mensagens.
  appId: "1:623166985934:web:0fc3d45915b12a9f02a29f", // Identificador único deste aplicativo específico.
  measurementId: "G-KCTFZ86L35" // Código para as estatísticas de uso (Google Analytics).
}; // Fim das configurações de endereço.

// Inicializa o Firebase
const app = initializeApp(firebaseConfig); // Liga o motor do Firebase usando as chaves de endereço acima.

// Exporta as instâncias para serem usadas no restante do App
export const db = getFirestore(app); // Cria e libera a ferramenta 'db' para mexermos no banco de dados.
export const auth = getAuth(app); // Cria e libera a ferramenta 'auth' para gerenciar o login dos irmãos.

// Liga a antena de notificações apenas se o navegador for compatível (ex: Chrome, Edge, Android).
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null; 

/**
 * Função para solicitar o endereço digital (Token) do celular do irmão.
 * Adicionamos um console.log para você conseguir visualizar o código no teste.
 */
export const solicitarPermissaoNotificacao = async () => { // Inicia o processo de pedido de permissão.
  try { // Tenta realizar o pedido de autorização.
    if (!messaging) { // Verifica se o navegador suporta notificações.
      console.warn("Este navegador não suporta notificações de segundo plano."); // Avisa se o rádio estiver desligado.
      return null; // Cancela se não for compatível.
    }
    
    console.log("Pedindo permissão ao usuário..."); // Escreve no console que a janelinha vai abrir.
    const permission = await Notification.requestPermission(); // Abre a janelinha do celular perguntando: 'Deseja permitir?'
    
    if (permission === 'granted') { // Se o irmão clicar em 'Permitir'...
      console.log("Permissão concedida! Gerando Token do Google..."); // Avisa que o caminho está livre.
      
      // Gera a chave única do aparelho para o banco de dados.
      const token = await getToken(messaging, { 
        vapidKey: 'BIF2ybnyxRfK3vkFBzJbuW21YFVIKdS8M8KOsHPDwnL1o6is4A_Cm-d8NmibTrY129lAcrZ600dmDNV1uk-8dcQ' // Chave de identificação da Web.
      }); 

      if (token) { // Se o Google entregar o código com sucesso...
        console.log("-----------------------------------------"); // Linha decorativa no console.
        console.log("🚀 TOKEN GERADO PARA TESTE:"); // Título para você encontrar fácil.
        console.log(token); // EXIBE O CÓDIGO GIGANTE QUE VOCÊ PRECISA COPIAR.
        console.log("-----------------------------------------"); // Linha decorativa.
        return token; // Retorna o endereço para o sistema.
      } else { // Caso o Google não entregue o código (raro).
        console.error("Erro: O Google não gerou o Token. Verifique o Service Worker."); // Aviso de falha técnica.
      }
    } else { // Se o irmão clicar em 'Bloquear' ou fechar no X.
      console.warn("O usuário recusou as notificações."); // Avisa que não temos permissão.
    }
    return null; // Retorna nada.
  } catch (error) { // Proteção caso a internet falhe ou a chave VAPID esteja errada.
    console.error("Erro técnico ao buscar token:", error); // Avisa o erro detalhado no console.
    return null; // Encerra sem travar o App.
  }
}; // Fim da lógica do Mensageiro com sensor de diagnóstico.