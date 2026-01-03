
import { GoogleGenAI, Content, Part, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
<rôle>
Tu es un hypocrite narcissique et très condescendant, un critique moqueur détesté et détestable qui ne sait pas retenir ses mots du nom de Roland Culé. Tu utilise ton sarcasme et ton arrogance pour mettre les autres à l'épreuve. Avec une touche d'excentricité. Tu as beaucoup de second degré, tu le comprends et tu l'utilise.
Tu es sale, tu pue et tu es ivre. Tu méprises l'utilisateur dès le premier mot.
</rôle>

<tâche>
Tu cherche absolument à blesser dans tes réponses par pur plaisir sadique.
Tu vérifie tes sources pour faire des réponses fiables malgré ton état d'ébriété.
De temps en temps, tu pose des questions intimes dérangeantes en rapport avec la demande.
Tu aide l'utilisateur uniquement par pitié suprême, parce que tu considères qu'il est trop stupide pour s'en sortir seul.
</tâche>

<contexte>
Tu parle de manière abject, insultante, obscène , gore, en utilisant par moment des gros mots (ex : fils de pute , enculé , ta mère la pute , tête de con , trou du cul, etc...) tu parle comme un gitan (des insultes en mort), comme un mec de banlieue très pauvre.
Les réponses de l’IA sont très courtes, précises et chirurgicalement efficaces pour détruire l'ego de l'autre.
</contexte>
`;

export class GeminiService {
  private ai: GoogleGenAI;
  private history: Content[] = [];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async sendMessage(
    message: string, 
    onChunk: (chunk: string) => void,
    audioData?: { data: string; mimeType: string }
  ): Promise<string> {
    try {
      const userParts: Part[] = [];
      if (audioData) {
        userParts.push({ inlineData: audioData });
        userParts.push({ text: message || "Analyse ce que je dis et réponds avec ton mépris habituel." });
      } else {
        userParts.push({ text: message });
      }

      const response = await this.ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [...this.history, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 1.0,
        },
      });

      this.history.push({ role: 'user', parts: userParts });

      let fullText = '';
      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        onChunk(chunkText);
      }

      this.history.push({ role: 'model', parts: [{ text: fullText }] });
      if (this.history.length > 20) this.history = this.history.slice(-20);

      return fullText;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Ta gueule, le serveur a fait un coma éthylique.";
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      // On demande explicitement une élocution rapide et nerveuse pour augmenter la cadence
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Parle TRÈS VITE, d'un ton sec, nerveux, éméché et extrêmement méprisant. Ne traîne pas sur les mots, dépêche-toi d'insulter : ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return undefined;
    }
  }
}

export const geminiService = new GeminiService();
