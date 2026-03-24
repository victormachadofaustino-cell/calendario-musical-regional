// src/components/CentralPermissoes.jsx // Identifica o arquivo que cuida da privacidade e alertas do músico.
import React, { useState, useEffect } from 'react'; // Ferramentas para gerenciar o que aparece na tela.
import { Bell, MapPin, ShieldCheck, X, ChevronRight, Info } from 'lucide-react'; // Ícones elegantes para a interface.
import { motion } from 'framer-motion'; // Ferramenta para as animações suaves de abrir e fechar.

// IMPORTAÇÕES DE TELEMETRIA E NOTIFICAÇÕES (O MOTOR DO APP)
import { registrarEvento } from '../constants/comuns'; // Olheiro que grava os passos da irmandade.
import { useNotifications } from '../hooks/useNotifications'; // Importa o novo motor que cadastra o celular no banco.

const CentralPermissoes = ({ aoFechar, user }) => { // Início do componente, recebendo a função de fechar e os dados do usuário.
  const [statusGPS, setStatusGPS] = useState('prompt'); // Memória para saber se o GPS está ligado ou desligado.
  const [statusPush, setStatusPush] = useState(Notification.permission); // Memória para o estado das notificações no navegador.
  
  // ACIONA O MOTOR DE NOTIFICAÇÕES: Prepara a ferramenta usando o perfil do irmão logado.
  const { ativarNotificacoes: motorAtivarPush, loading: processandoPush } = useNotifications(user);

  useEffect(() => { // Verifica silenciosamente se o navegador já tem as permissões gravadas ao abrir a tela.
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setStatusGPS(result.state);
      });
    }
  }, []); 

  const ativarGPS = () => { // Função que solicita acesso à localização atual.
    if (!("geolocation" in navigator)) {
      alert("Seu aparelho não suporta GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setStatusGPS('granted'); // Marca como autorizado na tela.
        registrarEvento('Permissões', 'GPS Autorizado', `Cidade: ${user?.cidade || 'Visitante'}`, user); // Grava a vitória no Dashboard.
      },
      (erro) => {
        setStatusGPS('denied'); // Marca como negado.
        registrarEvento('Permissões', 'GPS Negado', '', user); // Registra a recusa.
        alert("Para usar o GPS, você precisará autorizar nas configurações do seu navegador.");
      }
    );
  }; 

  const handleAtivarPush = async () => { // Lógica nova para ligar os alertas e cadastrar o aparelho.
    const resultado = await motorAtivarPush(); // Chama o motor que gera o Token e salva no Firebase.
    if (resultado?.sucesso) {
      setStatusPush('granted'); // Atualiza a bolinha visual para "Ativado".
    } else if (resultado?.erro === 'negado') {
      alert("Notificações bloqueadas. Habilite nas configurações do site/navegador.");
    }
  }; 

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#F8FAFC] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white"
      >
        <div className="p-8 space-y-6">
          
          {/* CABEÇALHO DA JANELA */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-950 uppercase italic tracking-tighter">Privacidade</h2>
            </div>
            <button onClick={aoFechar} className="p-2 bg-slate-200/50 rounded-full text-slate-500 active:scale-90 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* TEXTO EXPLICATIVO */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 leading-tight">Configurações de Acesso</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">
              Habilite as funções abaixo para receber avisos e encontrar ensaios próximos.
            </p>
          </div>

          {/* LISTA DE OPÇÕES (BOTÕES) */}
          <div className="space-y-3">
            
            {/* OPÇÃO 1: GPS */}
            <button 
              onClick={statusGPS === 'granted' ? null : ativarGPS}
              className={`w-full p-4 rounded-[1.8rem] border transition-all flex items-center justify-between active:scale-95 ${
                statusGPS === 'granted' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${statusGPS === 'granted' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <MapPin size={20} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase text-slate-950">Localização</span>
                  <span className={`text-[8px] font-bold uppercase ${statusGPS === 'granted' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {statusGPS === 'granted' ? 'Ativado com Precisão' : 'Desativado • Clique aqui'}
                  </span>
                </div>
              </div>
              {statusGPS !== 'granted' && <ChevronRight size={14} className="text-slate-300" />}
            </button>

            {/* OPÇÃO 2: NOTIFICAÇÕES (CONECTADO AO MOTOR FCM) */}
            <button 
              disabled={processandoPush}
              onClick={statusPush === 'granted' ? null : handleAtivarPush}
              className={`w-full p-4 rounded-[1.8rem] border transition-all flex items-center justify-between active:scale-95 ${
                statusPush === 'granted' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${statusPush === 'granted' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell size={20} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase text-slate-950">Alertas de Ensaios</span>
                  <span className={`text-[8px] font-bold uppercase ${statusPush === 'granted' ? 'text-amber-600' : 'text-slate-400'}`}>
                    {processandoPush ? 'Sincronizando...' : (statusPush === 'granted' ? 'Alertas Ativos' : 'Desativado • Clique aqui')}
                  </span>
                </div>
              </div>
              {statusPush !== 'granted' && !processandoPush && <ChevronRight size={14} className="text-slate-300" />}
            </button>

          </div>

          {/* RODAPÉ E BOTÃO FINAL */}
          <div className="pt-2 space-y-4">
            <div className="bg-white p-4 rounded-2xl flex gap-3 border border-slate-100">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[8px] font-bold text-slate-400 uppercase leading-normal">
                Suas informações são privadas e não são compartilhadas com terceiros.
              </p>
            </div>

            <button 
              onClick={aoFechar} 
              className="w-full py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              Confirmar e Voltar
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

export default CentralPermissoes; // Exportação da central de permissões agora integrada ao sistema de notificações reais.