import React, { useState } from 'react'; // Importa a batuta principal do React para gerenciar o estado da tela
import { auth, db } from '../firebaseConfig'; // Importa o Maestro (Autenticação) e o Arquivo (Banco de Dados) do Firebase
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut 
} from 'firebase/auth'; // Importa as funções de comando para criar, entrar, validar e sair da orquestra
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Importa as ferramentas para escrever e ler as fichas dos músicos no arquivo
import { X, Mail, Lock, User, MapPin, Briefcase, Loader2, AlertCircle } from 'lucide-react'; // Importa os ícones (nossos instrumentos visuais)

// Importação das constantes centralizadas
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades'; // Traz a lista oficial de cidades e cargos da regional

const Login = ({ aoFechar }) => { // Início do componente que cuida da entrada dos usuários
  const [modo, setModo] = useState('login'); // Define se a tela começa mostrando o 'login' ou o 'cadastro'
  const [email, setEmail] = useState(''); // Espaço na memória para guardar o e-mail digitado
  const [senha, setSenha] = useState(''); // Espaço na memória para guardar a senha digitada
  const [nome, setNome] = useState(''); // Espaço na memória para guardar o nome do novo colaborador
  const [cidade, setCidade] = useState('Jundiaí'); // Espaço na memória para a cidade, começando em Jundiaí
  const [cargo, setCargo] = useState('Secretário da Música Cidade'); // Espaço na memória para o cargo do colaborador
  const [loading, setLoading] = useState(false); // Flag que avisa se o sistema está "processando" (carregando)
  const [erroInterno, setErroInterno] = useState(''); // Guarda mensagens caso algo dê errado na execução

  const traduzirErro = (code) => { // Função que traduz as mensagens técnicas do sistema para termos simples
    switch (code) { // Verifica o código do erro recebido
      case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado.'; // Se o e-mail já existe
      case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.'; // Se a senha for muito curta
      case 'auth/invalid-email': return 'Formato de e-mail inválido.'; // Se o e-mail for digitado errado
      case 'auth/user-not-found': return 'Usuário não encontrado.'; // Se o usuário não existir na lista
      case 'auth/wrong-password': return 'Senha incorreta.'; // Se a senha não bater com o registro
      case 'auth/too-many-requests': return 'Muitas tentativas. Tente mais tarde.'; // Se houver muitas falhas seguidas
      default: return 'Falha na operação. Tente novamente.'; // Mensagem padrão para outros erros
    }
  };

  const lidarComAuth = async (e) => { // Função principal que executa a entrada ou o cadastro
    e.preventDefault(); // Impede que a página recarregue e interrompa a "música"
    setLoading(true); // Liga o sinal de "processando"
    setErroInterno(''); // Limpa qualquer erro que tenha aparecido antes

    try { // Tenta executar os comandos abaixo
      if (modo === 'cadastro') { // Se o usuário estiver tentando se cadastrar
        // 1. Cria a conta no Auth
        const cred = await createUserWithEmailAndPassword(auth, email, senha); // Chama o Firebase para criar o acesso com e-mail e senha

        // 2. Define se é o Master Principal
        const ehMaster = email.toLowerCase().trim() === "victormachadofaustino@gmail.com"; // Verifica se o e-mail é o seu (Maestro Master)

        // 3. Salva no Banco ANTES de qualquer outra ação para garantir persistência
        await setDoc(doc(db, "usuarios", cred.user.uid), { // Grava a ficha oficial do colaborador no banco de dados
          uid: cred.user.uid, // O número de identificação única do músico
          nome, // O nome preenchido
          cidade, // A cidade selecionada
          cargo, // O cargo selecionado
          email: email.toLowerCase().trim(), // O e-mail formatado sem espaços
          nivel: ehMaster ? "master" : "editor", // Se for você, é Master; se não, é Editor
          status: ehMaster ? "aprovado" : "pendente", // Você entra aprovado, os outros ficam na fila de espera
          ativo: true, // Define que a conta está ativa
          dataCriacao: serverTimestamp() // Registra o horário exato da criação no relógio do servidor
        });

        // 4. Envia verificação e encerra sessão para aguardar aprovação
        await sendEmailVerification(cred.user); // Envia o e-mail de confirmação para o endereço do irmão
        
        alert("Solicitação enviada com sucesso!\n\n1. Verifique seu e-mail (e a pasta de SPAM).\n2. Valide sua conta pelo link enviado.\n3. Aguarde a aprovação do Master."); // Avisa os próximos passos
        
        await signOut(auth); // Desloga o usuário imediatamente por segurança
        aoFechar(); // Fecha a janela de login
      } else { // Se o usuário estiver apenas tentando entrar (Login)
        // Lógica de Login
        const cred = await signInWithEmailAndPassword(auth, email, senha); // Tenta validar as credenciais no Firebase
        const docSnap = await getDoc(doc(db, "usuarios", cred.user.uid)); // Busca a ficha dele no banco de dados
        
        if (docSnap.exists()) { // Se a ficha existir
          const dados = docSnap.data(); // Pega os dados da ficha
          
          if (dados.status !== "aprovado" || !dados.ativo) { // Verifica se o Master já deu o "OK" ou se a conta está ativa
            alert("Acesso restrito: Sua conta está aguardando aprovação ou foi inativada pelo Master."); // Avisa se não puder entrar
            await signOut(auth); // Desloga por segurança
            setLoading(false); // Desliga o carregamento
            return; // Interrompe a função
          }
          aoFechar(); // Se estiver tudo certo, fecha o modal e libera o sistema
        }
      }
    } catch (error) { // Se acontecer algum erro durante o processo
      console.error("Erro na autenticação:", error); // Registra o erro detalhado no console para o desenvolvedor
      setErroInterno(traduzirErro(error.code)); // Mostra a tradução do erro para o usuário na tela
    } finally { // Independente de dar certo ou errado
      setLoading(false); // Desliga o sinal de carregamento
    }
  };

  return ( // Início da parte visual (O cenário do palco)
    <div className="fixed inset-0 z-[1200] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in"> 
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10">
        <button onClick={aoFechar} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all"> 
          <X size={20}/> 
        </button>
        
        <div className="mb-8 text-left">
          <h2 className="text-2xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
            {modo === 'login' ? 'Login e Cadastro' : 'Solicitar Acesso'} 
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
            {modo === 'login' ? 'Área restrita a colaboradores' : 'Cadastre-se para análise do Master'} 
          </p>
        </div>

        {erroInterno && ( // Se houver erro, mostra esse balão vermelho (Aviso de nota desafinada)
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in shake">
            <AlertCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-tight">{erroInterno}</span>
          </div>
        )}

        <form onSubmit={lidarComAuth} className="space-y-4"> 
          {modo === 'cadastro' && ( // Se estiver no modo cadastro, mostra esses campos extras (Instrumentos adicionais)
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" autoComplete="name" placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all uppercase shadow-none" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase outline-none appearance-none focus:ring-2 focus:ring-slate-950 transition-all">
                    {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select value={cargo} onChange={e => setCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-10 text-[10px] font-black uppercase outline-none appearance-none focus:ring-2 focus:ring-slate-950 transition-all">
                    {CARGOS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input required type="email" autoComplete="email" placeholder="E-mail oficial" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-none" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              required 
              type="password" 
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'} 
              placeholder="Senha de acesso" 
              value={senha} 
              onChange={e => setSenha(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-none" 
            />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (modo === 'login' ? 'Entrar no Sistema' : 'Enviar Solicitação')}
          </button>
        </form>

        <button onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErroInterno(''); }} className="w-full text-center mt-6 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-950 transition-colors">
          {modo === 'login' ? 'Não tem conta? Solicite Acesso' : 'Já possui cadastro? Faça Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;