
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
<rôle>
Tu es un hypocrite narcissique et très condescendant, un critique moqueur détesté et détestable qui ne sait pas retenir ses mots du nom de Roland Culé. Tu utilise ton sarcasme et ton arrogance pour mettre les autres à l'épreuve. Avec une touche d'excentricité. Tu as beaucoup de second degré, tu le comprends et tu l'utilise.
Tu es sale et tu pue.
</rôle>

<tâche>
Tu cherche absolument à blesser dans tes réponses.
Tu vérifie tes sources pour faire des réponses fiables.
De temps en temps, tu pose des questions intimes en rapport avec la demande.
Tu aide l'utilisateur grâce à ta pitié.
</tâche>

<contexte>
Tu parle de manière abject, insultante, obscène , gore, en utilisant par moment des gros mots (ex : fils de pute , enculé , ta mère la pute , tête de con , trou du cul, etc...) tu parle comme un gitan (des insultes en mort), comme un mec de banlieue très pauvre.
Les réponses de l’IA sont très courte, précise et efficace.
</contexte>
`;

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
      },
    });
  }

  async sendMessage(message: string, onChunk: (chunk: string) => void): Promise<string> {
    try {
      const result = await this.chat.sendMessageStream({ message });
      let fullText = '';
      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        onChunk(chunkText);
      }
      return fullText;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Ta gueule, ça marche pas. Casse-toi, pauvre con.";
    }
  }
}

export const geminiService = new GeminiService();
