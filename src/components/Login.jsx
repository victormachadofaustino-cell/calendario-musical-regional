import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { X, Mail, Lock, User, MapPin, Briefcase, Loader2 } from 'lucide-react';

// Importação das constantes centralizadas
import { CIDADES_LISTA, CARGOS_LISTA } from '../constants/cidades';

const Login = ({ aoFechar }) => {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('Jundiaí');
  const [cargo, setCargo] = useState('Secretário da Música Cidade');
  const [loading, setLoading] = useState(false);

  const lidarComAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (modo === 'cadastro') {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await sendEmailVerification(cred.user);

        // BLINDAGEM: Nível 'master' só é concedido se o e-mail for exatamente o seu.
        const ehMaster = email.toLowerCase().trim() === "victormachadofaustino@gmail.com";

        await setDoc(doc(db, "usuarios", cred.user.uid), {
          uid: cred.user.uid,
          nome, 
          cidade, 
          cargo, 
          email: email.toLowerCase().trim(),
          nivel: ehMaster ? "master" : "editor",
          status: ehMaster ? "aprovado" : "pendente",
          ativo: true,
          dataCriacao: new Date()
        });

        alert("Solicitação enviada! Verifique seu e-mail para validar a conta e aguarde a aprovação do Master.");
        await signOut(auth);
        aoFechar();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, senha);
        const docSnap = await getDoc(doc(db, "usuarios", cred.user.uid));
        
        if (docSnap.exists()) {
          const dados = docSnap.data();
          
          // TRAVA DE SEGURANÇA: Bloqueia acesso se não estiver aprovado
          if (dados.status !== "aprovado" || !dados.ativo) {
            alert("Sua conta está aguardando aprovação ou foi inativada pelo Master.");
            await signOut(auth);
            setLoading(false);
            return;
          }

          // CORREÇÃO: O App.jsx já gerencia o login via onAuthStateChanged.
          // Apenas fechamos o modal para liberar a tela.
          aoFechar();
        }
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      alert("Falha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10">
        <button onClick={aoFechar} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all">
          <X size={20}/>
        </button>
        
        <div className="mb-8 text-left">
          <h2 className="text-2xl font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">
            {modo === 'login' ? 'Gestão Musical' : 'Solicitar Acesso'}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
            {modo === 'login' ? 'Área restrita a colaboradores' : 'Cadastre-se para análise do Master'}
          </p>
        </div>

        <form onSubmit={lidarComAuth} className="space-y-4">
          {modo === 'cadastro' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all uppercase shadow-none" />
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
            <input required type="email" placeholder="E-mail oficial" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-none" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input required type="password" placeholder="Senha de acesso" value={senha} onChange={e => setSenha(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-none" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (modo === 'login' ? 'Entrar no Sistema' : 'Enviar Solicitação')}
          </button>
        </form>

        <button onClick={() => setModo(modo === 'login' ? 'cadastro' : 'login')} className="w-full text-center mt-6 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-950 transition-colors">
          {modo === 'login' ? 'Não tem conta? Solicite Acesso' : 'Já possui cadastro? Faça Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;