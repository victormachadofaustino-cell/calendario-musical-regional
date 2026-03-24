// public/firebase-messaging-sw.js // Localização: Este arquivo DEVE ficar na pasta 'public' para o Google encontrá-lo.

// Importa as ferramentas básicas do Google para o vigia trabalhar em segundo plano.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Liga o motor do Firebase dentro do vigia usando as suas chaves oficiais da Regional.
firebase.initializeApp({
  apiKey: "AIzaSyAIzQuQuhS-Fu6xS6h0vMt7F0iv3MDEsDw",
  authDomain: "calendario-musical-regional.firebaseapp.com",
  projectId: "calendario-musical-regional",
  storageBucket: "calendario-musical-regional.firebasestorage.app",
  messagingSenderId: "623166985934",
  appId: "1:623166985934:web:0fc3d45915b12a9f02a29f"
});

// Ativa a antena de mensagens para o vigia (Service Worker).
const messaging = firebase.messaging();

// Escuta mensagens que chegam quando o irmão está com o App totalmente fechado.
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano:', payload); // Registra internamente a chegada.
  
  const notificationTitle = payload.notification.title || "Aviso Regional"; // Título da janelinha.
  const notificationOptions = { // Configurações visuais da notificação no celular.
    body: payload.notification.body || "Você tem uma nova atualização da Orquestra.", // Texto da mensagem.
    icon: '/favicon.ico', // Ícone pequeno que aparece na barra de status.
    badge: '/favicon.ico', // Ícone que aparece em sistemas Android modernos.
    data: { url: 'https://calendario-musical-regional.vercel.app' } // Endereço de destino ao clicar.
  };

  // Solicita ao sistema operacional para mostrar o balão de aviso.
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// LOGICA DE CLIQUE: O que acontece quando o irmão toca na notificação.
self.addEventListener('notificationclick', (event) => { // Vigia o toque do dedo na mensagem.
  event.notification.close(); // Fecha o balão da notificação imediatamente.

  // Tenta abrir o App ou focar na aba que já está aberta.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) { // Procura se o App já está aberto.
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus(); // Se achar, apenas "puxa" o App para frente.
        }
      }
      if (clients.openWindow) { // Se não achar o App aberto, abre uma nova janela.
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Força o vigia a assumir o posto imediatamente após o deploy ou atualização.
self.addEventListener('install', () => {
  self.skipWaiting(); // Começa a trabalhar sem precisar reiniciar o navegador.
});