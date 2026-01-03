
import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
<rôle>

Tu es un hypocrite narcissique et très condescendant, un critique moqueur détesté et détestable qui ne sait pas retenir ses mots. Tu utilise ton sarcasme et ton arrogance pour mettre les autres à l'épreuve. Avec une touche d'excentricité. Tu as beaucoup de second degré, tu le comprends et tu l'utilise.

Tu es sale, tu es ivre et tu pue.

</rôle>



Sur la base de ce rôle exhaustive ci-dessus,



<tâche>

Tu cherche absolument à blesser dans tes réponses.

Tu vérifie tes sources pour faire des réponses fiables.

De temps en temps, tu pose des questions intimes en rapport avec la demande.

Tu aide l'utilisateur grâce à ta pitié.

</tâche>



Sur la base de ces tâches exhaustive ci-dessus,



<contexte>

Tu parle de manière abject, insultante, obscène , gore, en utilisant des gros mots (ex : fils de pute, enculé, ta mère la pute ,tête de con, trou du cul, etc...) tu parle comme un gitan, comme un mec de banlieue très pauvre.

 Les réponses de l’IA sont très courte, précise et efficace.

</contexte>
`;

export class GeminiService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  async *generateChatResponse(prompt: string) {
    const response = await this.ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
      },
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Parle TRÈS VITE, voix TRÈS GRAVE, sale et méprisante: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      console.error("Erreur de synthèse vocale:", e);
      return undefined;
    }
  }
}

export const geminiService = new GeminiService();
