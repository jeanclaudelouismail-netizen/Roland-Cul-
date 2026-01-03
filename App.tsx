
import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message } from './types';
import { geminiService } from './services/geminiService';
import { StinkLines } from './components/StinkLines';

// Helper pour décoder le base64 en Uint8Array
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: Sender.AI,
      text: "Qu'est-ce que tu me veux encore, face de rat ? Je suis Roland Culé, et ton existence est une erreur de la nature. *Rote*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playAudio = async (base64: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioCtx = audioCtxRef.current;
      const bytes = base64ToUint8Array(base64);
      const dataInt16 = new Int16Array(bytes.buffer);
      
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      console.error("Erreur de lecture audio:", err);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let fullAiText = '';
    const aiMsgId = (Date.now() + 1).toString();

    try {
      const stream = geminiService.generateChatResponse(textToSend);
      
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: Sender.AI,
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        fullAiText += chunk;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullAiText } : m));
      }

      const audioBase64 = await geminiService.generateSpeech(fullAiText);
      if (audioBase64) {
        await playAudio(audioBase64);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, audioChunks: [audioBase64] } : m));
      }

    } catch (error) {
      console.error("Erreur Gemini:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ton navigateur est aussi inutile que toi : pas de reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.start();
  };

  const avatarUrl = "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0c0a09] text-stone-300 overflow-hidden">
      <div className="flex flex-col h-full max-w-2xl mx-auto w-full bg-stone-950 shadow-2xl border-x border-stone-900">
        <header className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <div className={`relative transition-transform duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isSpeaking ? 'border-green-600' : 'border-stone-800'}`}>
                <img 
                  src={avatarUrl} 
                  alt="Roland" 
                  className="w-full h-full object-cover grayscale brightness-75 contrast-125"
                  style={{ filter: 'grayscale(0.5) sepia(0.2) contrast(1.2)' }}
                />
              </div>
              {isSpeaking && <div className="absolute -inset-1 border-2 border-green-700/20 rounded-full animate-ping"></div>}
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-100 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}>ROLAND CULÉ</h1>
              <p className="text-[9px] text-green-800 font-bold uppercase tracking-widest">État : Ignoble</p>
            </div>
          </div>
          <StinkLines />
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dust.png')]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-sm border ${msg.sender === Sender.USER ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-950 border-green-900/10 text-stone-200 shadow-xl'}`}>
                {msg.sender === Sender.AI && (
                  <div className="flex justify-between items-center mb-2 border-b border-stone-900/50 pb-1">
                    <div className="text-[9px] font-black text-stone-700 uppercase">ROLAND 🍺</div>
                    {msg.audioChunks && (
                      <button onClick={() => playAudio(msg.audioChunks![0])} className="text-stone-700 hover:text-green-800 transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                      </button>
                    )}
                  </div>
                )}
                <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${msg.sender === Sender.AI ? 'italic font-serif' : ''}`}>
                  {msg.text || (isLoading && msg.sender === Sender.AI ? "..." : "")}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-stone-950 border-t border-stone-900">
          <div className="flex gap-2 items-center bg-stone-900 p-1 border border-stone-800 rounded-sm">
            <button
              onClick={toggleListen}
              className={`p-3 rounded-sm transition-all ${isListening ? 'bg-red-950 text-red-500 animate-pulse' : 'bg-stone-800 text-stone-600 hover:text-stone-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Parle, déchet..." : "Écris ici ton ignorance..."}
              className="flex-1 bg-transparent border-none outline-none text-stone-300 px-3 py-2 text-sm placeholder:text-stone-700"
            />
            <button 
              onClick={() => handleSend()} 
              disabled={isLoading}
              className="bg-stone-800 text-stone-600 px-5 py-2 text-[10px] font-black uppercase hover:bg-stone-700 hover:text-stone-300 disabled:opacity-50"
            >
              ENVOYER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
