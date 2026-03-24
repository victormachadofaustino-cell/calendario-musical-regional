// src/hooks/useNotifications.js // Arquivo que gerencia a captura do endereço digital (Token) do celular.

import { useState } from 'react'; // Ferramenta para gerenciar o estado de espera (carregamento) na tela.
import { db, messaging } from '../firebaseConfig'; // Importa a conexão oficial com o banco e o sistema de mensagens.
import { getToken } from 'firebase/messaging'; // Ferramenta do Google que gera o código único do aparelho.
import { doc, updateDoc } from 'firebase/firestore'; // Ferramentas para atualizar os dados do irmão no banco.
import { registrarEvento } from '../constants/comuns'; // Olheiro de telemetria para registrar a ativação.

// CORREÇÃO TÉCNICA: Exportação garantida para evitar o erro de Syntax no console.
export const useNotifications = (userData) => { // Inicia o motor de notificações usando o perfil do irmão.
  const [loading, setLoading] = useState(false); // Memória para saber se o processo de registro está em andamento.

  const ativarNotificacoes = async () => { // Função acionada quando o irmão clica no botão de Alertas.
    if (!messaging || !userData?.uid) return; // Se o aparelho for incompatível ou não houver login, ignora.

    setLoading(true); // Ativa o sinal de "processando" para o usuário ver.
    try { // Tenta realizar a ponte com o servidor de mensagens do Google.
      
      const permission = await Notification.requestPermission(); // Abre o pedido oficial: "Deseja permitir notificações?"
      
      if (permission === 'granted') { // Se o irmão clicar em "Permitir"...
        // Pede ao Google o Token (o endereço de entrega para as mensagens deste celular).
        const token = await getToken(messaging, { 
          vapidKey: 'BIF2ybnyxRfK3vkFBzJbuW21YFVIKdS8M8KOsHPDwnL1o6is4A_Cm-d8NmibTrY129lAcrZ600dmDNV1uk-8dcQ' 
        });

        if (token) { // Se o endereço (Token) foi gerado com sucesso...
          const userRef = doc(db, "usuarios", userData.uid); // Localiza a ficha do irmão no banco de dados.
          
          await updateDoc(userRef, { // Salva o endereço digital dentro do perfil dele.
            fcmToken: token, // O Token necessário para o Master enviar o "zap" oficial.
            notificacoesAtivas: true, // Marca que este irmão aceita receber avisos.
            ultimoAcessoNotificacao: new Date() // Guarda o horário do registro.
          });

          // REGISTRO DE TELEMETRIA: Registra no Dashboard quem ativou as notificações com sucesso.
          registrarEvento('Segurança', 'Ativação de Notificações', `Sucesso no Aparelho`, userData);
          
          return { sucesso: true, token }; // Retorna que deu tudo certo para a tela de permissões.
        }
      } else { // Caso o usuário recuse ou bloqueie...
        return { sucesso: false, erro: 'negado' }; // Retorna que o acesso foi negado.
      }
    } catch (error) { // Caso ocorra falha de internet ou erro técnico de segurança.
      console.error("Erro ao ativar mensageiro:", error); // Log interno para manutenção.
      return { sucesso: false, erro: error.message }; // Reporta o erro.
    } finally { // Independente do resultado...
      setLoading(false); // Destrava o botão na tela.
    }
  };

  return { ativarNotificacoes, loading }; // Entrega as ferramentas para o arquivo CentralPermissoes.jsx.
};