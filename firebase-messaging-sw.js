// public/firebase-messaging-sw.js // Localização: Este arquivo DEVE ficar na pasta 'public' para funcionar.

// Importa as ferramentas básicas do Google para o vigia trabalhar em segundo plano.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Liga o motor do Firebase dentro do vigia usando as suas chaves oficiais.
firebase.initializeApp({
  apiKey: "AIzaSyAIzQuQuhS-Fu6xS6h0vMt7F0iv3MDEsDw",
  authDomain: "calendario-musical-regional.firebaseapp.com",
  projectId: "calendario-musical-regional",
  storageBucket: "calendario-musical-regional.firebasestorage.app",
  messagingSenderId: "623166985934",
  appId: "1:623166985934:web:0fc3d45915b12a9f02a29f"
});

// Ativa a antena de mensagens para o vigia.
const messaging = firebase.messaging();

// Escuta mensagens que chegam quando o irmão está com o App fechado ou em outra aba.
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida com o app fechado:', payload); // Registra a chegada da informação.
  
  const notificationTitle = payload.notification.title; // Pega o título enviado (Ex: Novo Ensaio).
  const notificationOptions = { // Prepara como a janelinha vai aparecer no Android/Windows.
    body: payload.notification.body, // Pega o texto da mensagem.
    icon: '/logo192.png' // Usa o ícone do App para dar credibilidade.
  };

  // Manda o sistema operacional mostrar a notificação na tela do usuário.
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Força o vigia a assumir o posto imediatamente após ser instalado.
self.addEventListener('install', () => {
  self.skipWaiting(); // Não espera outras abas fecharem para começar a trabalhar.
});