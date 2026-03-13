// Este arquivo centraliza todas as ações de interação com aplicativos externos (Maps e WhatsApp).
import { buscarCoordenadas } from '../constants/comuns'; // Importa a ferramenta que sabe a latitude e longitude das igrejas.

// 1. FUNÇÃO PARA ABRIR O GPS (Google Maps)
export const abrirGoogleMaps = (localidade, cidade) => { 
  // Busca se temos a coordenada exata salva no nosso dicionário de comuns.
  const coords = buscarCoordenadas(cidade, localidade); 
  
  // Se tivermos a coordenada, usamos ela. Se não, montamos um texto de busca para o Google encontrar.
  const destino = coords 
    ? `${coords.lat},${coords.lon}` 
    : encodeURIComponent(`CCB ${localidade} ${cidade}`); 
    
  // Abre uma nova aba no navegador ou o aplicativo de mapas oficial do celular.
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destino}`, '_blank'); 
};

// 2. DICIONÁRIO AUXILIAR PARA NOMES DOS DIAS
const DICIONARIO_DIAS = { 
  "Dom": "Domingo", "Seg": "Segunda", "Ter": "Terça", "Qua": "Quarta", 
  "Qui": "Quinta", "Sex": "Sexta", "Sáb": "Sábado" 
};

// 3. FUNÇÃO PARA FORMATAR O DIA PARA O CONVITE
const formatarDiaExtenso = (textoDia) => { 
  if (!textoDia) return ""; // Se não vier nada, retorna vazio.
  const partes = textoDia.split(' '); // Separa "2ª" de "Sex".
  if (partes.length < 2) return textoDia; // Se for um texto simples, retorna como está.
  const sigla = partes[1].replace('.', ''); // Tira o ponto se houver (ex: "Sex." vira "Sex").
  const diaExtenso = DICIONARIO_DIAS[sigla] || sigla; // Busca no dicionário acima o nome completo.
  return `${partes[0]} ${diaExtenso}`; // Remonta: "2ª Sexta-feira".
};

// 4. FUNÇÃO PARA COMPARTILHAR CONVITES (WhatsApp ou Sistema)
export const compartilharEnsaio = async (evento, isRegional = false) => { 
  // Monta o texto do convite usando Bolding (*) para ficar bonito no WhatsApp.
  const texto = isRegional 
    ? `*CCB Regional Jundiaí - Ensaio Regional*\n📍 Sede: ${evento.sede} (${evento.local})\n📅 Data: ${evento.dia}/${evento.mes} às ${evento.hora}\n🗓️ ${formatarDiaExtenso(evento.weekday)}`
    : `*CCB Regional Jundiaí - Ensaio Local*\n📍 Igreja: ${evento.localidade} (${evento.cidade})\n🗓️ Data: ${formatarDiaExtenso(evento.dia)} às ${evento.hora}\n👤 Encarregado: ${evento.encarregado || 'N/I'}`;

  // Tenta usar a janela nativa de "Compartilhar" do Android ou iPhone.
  if (navigator.share) { 
    try { 
      await navigator.share({ title: 'Convite Ensaio CCB', text: texto }); 
    } catch (err) { 
      console.log("Usuário cancelou compartilhamento"); 
    }
  } else { 
    // Se o celular for antigo e não tiver a janela nativa, abre o WhatsApp Web ou App direto.
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank'); 
  }
};