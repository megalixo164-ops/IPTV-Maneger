import { GoogleGenAI } from "@google/genai";
import { Client } from "../types";

// Initialize Gemini
// NOTE: process.env.API_KEY is expected to be available in the build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper para formatar data DD/MM/YYYY de forma segura (sem UTC shift)
const formatDateSecure = (dateString: string) => {
  if (!dateString) return 'Data indefinida';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

export const generateRenewalMessage = async (client: Client): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada. Por favor, configure a variável de ambiente API_KEY.";
  }

  try {
    const formattedRenewalDate = formatDateSecure(client.renewalDate);
    const formattedStartDate = formatDateSecure(client.startDate);
    
    const systemInstruction = `Atue como um assistente pessoal de um revendedor de IPTV.
      Escreva uma mensagem de cobrança/renovação para WhatsApp (PT-BR) para o cliente.

      REGRAS ESTRITAS PARA A MENSAGEM:
      1. Informe educadamente que o plano está próximo do vencimento ou venceu.
      2. Informe OBRIGATORIAMENTE a Chave Pix para pagamento: 55996138553
      3. Adicione explicitamente a frase: "Assim que recebermos o pagamento/comprovante, sua renovação será feita imediatamente!"
      4. Mencione sutilmente que valoriza o cliente (ele está ativo desde ${formattedStartDate}).
      5. Use emojis relacionados a TV, Filmes e Pagamento para tornar a mensagem agradável.
      6. Seja breve e direto, retorne apenas o texto da mensagem pronto para copiar e enviar.`;

    const userPrompt = `Dados do Cliente:
      - Nome: ${client.name}
      - Cliente Desde: ${formattedStartDate}
      - Vencimento Atual: ${formattedRenewalDate}
      - Valor: R$ ${client.price.toFixed(2)}
      - Telas: ${client.devices}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Ocorreu um erro ao conectar com a IA para gerar a mensagem.";
  }
};