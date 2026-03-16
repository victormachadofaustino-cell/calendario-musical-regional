import React from 'react'; // Ferramenta base para criar os elementos visuais na tela.
import { User, Lock, Save } from 'lucide-react'; // Importa os ícones de Bonequinho, Cadeado e Disco de Salvar.
import { CIDADES_LISTA, CARGOS_LISTA } from '../../constants/cidades'; // Importa a lista oficial de cidades e cargos da Regional.

// Este componente cuida exclusivamente da aba onde o usuário logado vê e edita seus dados.
const AbaPerfil = ({ 
  masterLogado, // Informação se o usuário é o Maestro (Master) ou não.
  meuNome, // O nome atual que está preenchido no sistema.
  setMeuNome, // Função para atualizar o nome enquanto o usuário digita.
  minhaCidade, // A cidade atual vinculada ao perfil.
  setMinhaCidade, // Função para trocar a cidade (se for Master).
  meuCargo, // O cargo atual (ex: Secretário).
  setMeuCargo, // Função para trocar o cargo (se for Master).
  atualizarMeuPerfil, // A ordem final para salvar as mudanças no banco de dados.
  resetarSenhaUsuario, // Função que envia o e-mail de "Esqueci minha senha".
  userEmail // O e-mail do usuário para saber para onde enviar o reset.
}) => {
  return ( // Início da parte visual que aparece no celular.
    <div className="space-y-4 animate-in"> {/* Container com espaçamento entre os blocos e animação de entrada suave. */}
      <form onSubmit={atualizarMeuPerfil} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4"> {/* Formulário branco com bordas bem arredondadas. */}
        
        {/* BLOCO DE CABEÇALHO DO PERFIL */}
        <div className="flex items-center justify-between mb-2"> {/* Linha horizontal que separa o título do botão de senha. */}
          <div className="flex items-center gap-3"> {/* Agrupa o ícone e o título com um pequeno espaço. */}
            <div className="p-3 bg-slate-950 text-white rounded-2xl"> {/* Fundo preto arredondado para o ícone de usuário. */}
              <User size={20}/> {/* Desenha o ícone do bonequinho (usuário). */}
            </div>
            <h4 className="text-[11px] font-black uppercase text-slate-950 italic">Meus Dados</h4> {/* Título da seção em letras pequenas e pretas. */}
          </div>
          
          {/* BOTÃO DE RESET DE SENHA */}
          <button 
            type="button" 
            onClick={() => resetarSenhaUsuario(userEmail)} 
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[7px] font-black uppercase border border-blue-100 active:scale-95 transition-all"
          > {/* Botão azul claro para solicitar nova senha por e-mail. */}
            <Lock size={12}/> {/* Ícone de cadeado pequeno. */}
            Reset Senha {/* Texto explicativo do botão. */}
          </button>
        </div>

        {/* CAMPOS DE EDIÇÃO */}
        <div className="space-y-4 text-left"> {/* Alinha todos os textos e campos para a esquerda. */}
          
          {/* CAMPO NOME: Aberto para todos os músicos da orquestra editarem */}
          <div className="flex flex-col gap-1"> {/* Agrupa o rótulo (Nome) com a caixa de digitação. */}
            <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Nome</span> {/* Rótulo cinza bem pequeno acima do campo. */}
            <input 
              required 
              type="text" 
              value={meuNome} 
              onChange={e => setMeuNome(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none uppercase" 
            /> {/* Caixa de texto onde o usuário escreve o nome. */}
          </div>
          
          {/* CAMPO CIDADE: Travado para Editores, Aberto para o Master */}
          <div className="flex flex-col gap-1"> {/* Agrupa o rótulo (Cidade) com o seletor ou texto travado. */}
            <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cidade Principal</span> {/* Rótulo cinza. */}
            {masterLogado ? ( // Se quem estiver logado for o Master...
              <select 
                required 
                value={minhaCidade} 
                onChange={e => setMinhaCidade(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none"
              > {/* ...mostra a lista de cidades para ele escolher. */}
                {CIDADES_LISTA.map(c => <option key={c} value={c}>{c}</option>)} {/* Percorre a lista oficial de cidades de Jundiaí e região. */}
              </select>
            ) : ( // Se não for Master (for um Editor comum)...
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-black text-slate-400 uppercase italic cursor-not-allowed select-none">
                {minhaCidade} {/* ...mostra apenas o nome da cidade em cinza, sem deixar clicar ou mudar. */}
              </div>
            )}
          </div>

          {/* CAMPO CARGO: Travado para Editores, Aberto para o Master */}
          <div className="flex flex-col gap-1"> {/* Agrupa o rótulo (Cargo) com o seletor ou texto travado. */}
            <span className="text-[8px] font-black uppercase text-slate-400 ml-2">Cargo Musical</span> {/* Rótulo cinza. */}
            {masterLogado ? ( // Se quem estiver logado for o Master...
              <select 
                required 
                value={meuCargo} 
                onChange={e => setMeuCargo(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-bold outline-none"
              > {/* ...mostra a lista de cargos oficiais (Ancião, Regional, etc). */}
                {CARGOS_LISTA.map(c => <option key={c} value={c}>{c}</option>)} {/* Gera as opções do menu baseado no arquivo de constantes. */}
              </select>
            ) : ( // Se for um Editor comum...
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-4 px-4 text-[11px] font-black text-slate-400 uppercase italic cursor-not-allowed select-none">
                {meuCargo} {/* ...exibe o cargo dele apenas como leitura, impedindo a auto-promoção. */}
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO SALVAR: O toque final para mandar os dados para o banco */}
        <button 
          type="submit" 
          className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-2 active:scale-95 shadow-lg mt-2 transition-all"
        > {/* Botão preto largo com efeito de clique. */}
          <Save size={16}/> {/* Ícone de disquete (salvar). */}
          Salvar Alterações {/* Texto principal do botão. */}
        </button>
      </form>
    </div>
  );
};

export default AbaPerfil; // Exporta este "naipe" para que o Maestro (PainelMaster) possa usá-lo.