
import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message } from './types';
import { geminiService } from './services/geminiService';
import { StinkLines } from './components/StinkLines';

// Audio decoding helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: Sender.AI,
      text: "Qu'est-ce que tu me veux encore, face de rat ? Tu viens admirer mon génie ou tu cherches juste à te faire humilier ? Je suis Roland Culé, et ton existence est une erreur de la nature. *Rote violemment*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = () => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setIsStarted(true);
  };

  const playRolandVoice = async (text: string) => {
    if (!audioCtxRef.current || !text) return;
    setIsSpeaking(true);
    const base64Audio = await geminiService.generateSpeech(text);
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtxRef.current);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } else {
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      setTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob, transcript);
        stream.getTracks().forEach(t => t.stop());
      };

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'fr-FR';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e: any) => {
          let current = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            current += e.results[i][0].transcript;
          }
          setTranscript(current);
        };
        recognitionRef.current = rec;
        rec.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Micro inaccessible. Roland a dû pisser dessus.");
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (blob: Blob, text: string) => {
    const content = text || "Un bruit sourd et pathétique";
    handleMessageProcess(content, blob);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    handleMessageProcess(input);
    setInput('');
  };

  const handleMessageProcess = async (text: string, audioBlob?: Blob) => {
    setIsLoading(true);
    const userMsg: Message = { id: Date.now().toString(), sender: Sender.USER, text: audioBlob ? `🎤 ${text}` : text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, sender: Sender.AI, text: '', timestamp: new Date() }]);

    try {
      let audioData;
      if (audioBlob) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((res) => {
          reader.onloadend = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(audioBlob);
        });
        audioData = { data: base64, mimeType: 'audio/webm' };
      }

      let fullText = '';
      await geminiService.sendMessage(text, (chunk) => {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
      }, audioData);

      await playRolandVoice(fullText);
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Erreur fatale. Roland est en PLS." } : m));
    } finally {
      setIsLoading(false);
      setTranscript('');
    }
  };

  const avatarUrl = "https://images.unsplash.com/photo-1544161515-4af6b1d8b159?q=80&w=2070&auto=format&fit=crop";

  if (!isStarted) {
    return (
      <div className="h-[100dvh] bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-12">
          <div className="text-9xl animate-bounce">💩</div>
        </div>
        <h1 className="text-7xl font-black text-stone-100 mb-4 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}> Roland Culé </h1>
        <button onClick={handleStart} className="px-16 py-5 bg-stone-900 border border-stone-800 text-stone-100 font-black text-xl hover:bg-green-950 transition-all shadow-[6px_6px_0px_#1c1917] active:shadow-none active:translate-x-1 active:translate-y-1"> LANCER </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-[#0c0a09] border-x border-stone-900 shadow-2xl overflow-hidden">
      <header className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className={`relative ${isSpeaking ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isSpeaking ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-green-900'} bg-stone-800`}>
              <img src={avatarUrl} alt="Roland" className="w-full h-full object-cover grayscale" />
            </div>
            {isSpeaking && <div className="absolute -inset-1 border-2 border-green-500 rounded-full animate-ping opacity-20"></div>}
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-100 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}>ROLAND CULÉ</h1>
            <p className="text-[9px] text-green-700 font-bold uppercase">Humeur : Exécrable</p>
          </div>
        </div>
        <StinkLines />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dust.png')]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-sm border ${msg.sender === Sender.USER ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-stone-950 border-green-900/20 text-stone-100'}`}>
              {msg.sender === Sender.AI && (
                <div className="flex justify-between items-center mb-2 border-b border-stone-900/50 pb-1">
                  <div className="text-[9px] font-black text-stone-700 uppercase">ROLAND 🍺</div>
                  <button 
                    onClick={() => playRolandVoice(msg.text)}
                    className="text-stone-700 hover:text-stone-400 transition-colors p-1"
                    title="Réécouter cette insulte"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  </button>
                </div>
              )}
              <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${msg.sender === Sender.AI ? 'italic' : ''}`}>{msg.text || "Roland bave..."}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-stone-950 border-t border-stone-900">
        <div className="flex gap-2 items-center bg-stone-900 p-1 border border-stone-800">
          <button
            onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }} onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            className={`p-3 rounded-sm transition-all ${isRecording ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-stone-800 text-stone-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <input
            type="text" value={isRecording ? transcript : input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Roland t'écoute..." : "Pose ta question inutile..."}
            className="flex-1 bg-transparent border-none outline-none text-stone-200 px-3 py-2 text-sm"
          />
          <button onClick={handleSend} disabled={isLoading} className="bg-stone-800 text-stone-500 px-5 py-2 text-[10px] font-black uppercase">ENVOYER</button>
        </div>
        {isRecording && <div className="text-[10px] text-red-700 font-bold uppercase mt-2 text-center animate-pulse"> {transcript || "Parle, déchet..."} </div>}
      </div>
    </div>
  );
};

export default App;
