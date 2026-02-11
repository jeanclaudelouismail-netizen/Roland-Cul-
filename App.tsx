
import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message } from './types';
import { geminiService } from './services/geminiService';
import { StinkLines } from './components/StinkLines';

// Audio decoding helpers
function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decoding failed", e);
    return new Uint8Array(0);
  }
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer | null> {
  if (data.length === 0) return null;
  try {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  } catch (e) {
    console.error("Audio decoding failed", e);
    return null;
  }
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: Sender.AI,
      text: "Vazy vazy, mange tes morts mon coushin ! C'est Roland Culé, le Tuche Daddy en personne ! Tu m'veux quoi avec ta sale gueule de gadjo ? J'cause vite parce que j'suis plein de bière et d'frites, et j'ai pas ton temps, sale merdeux. Cause avant qu'j'te crache dessus... vazy vazy !",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasVoiceError, setHasVoiceError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = () => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setIsStarted(true);
  };

  const playRolandVoice = async (text: string) => {
    if (!audioCtxRef.current || !text) return;
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (hasVoiceError) return;

    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e) {}
    }

    setIsSpeaking(true);
    try {
      const base64Audio = await geminiService.generateSpeech(text);
      if (base64Audio) {
        const decoded = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(decoded, audioCtxRef.current);
        if (audioBuffer) {
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtxRef.current.destination);
          source.onended = () => {
            setIsSpeaking(false);
            currentSourceRef.current = null;
          };
          currentSourceRef.current = source;
          source.start();
        } else {
          setIsSpeaking(false);
        }
      } else {
        setHasVoiceError(true);
        setIsSpeaking(false);
        setTimeout(() => setHasVoiceError(false), 60000);
      }
    } catch (err) {
      console.error("Voice playback failed", err);
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
      alert("Ton micro est aussi pété que toi, gadjo !");
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
    const content = text || "Un bruit de merde";
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
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Mange tes morts, l'serveur est HS. C'est sûrement ta faute." } : m));
    } finally {
      setIsLoading(false);
      setTranscript('');
    }
  };

  const avatarUrl = "https://images.unsplash.com/photo-1544161515-4af6b1d8b159?q=80&w=2070&auto=format&fit=crop";
  const bgUrl = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1974&auto=format&fit=crop";

  if (!isStarted) {
    return (
      <div 
        className="h-[100dvh] bg-cover bg-center flex flex-col items-center justify-center p-6 text-center relative"
        style={{ backgroundImage: `linear-gradient(rgba(12, 10, 9, 0.9), rgba(12, 10, 9, 0.9)), url(${bgUrl})` }}
      >
        <div className="relative mb-12">
          <div className="text-9xl animate-bounce">🍺🖕🍟</div>
        </div>
        <h1 className="text-7xl font-black text-stone-100 mb-4 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}> Roland Culé </h1>
        <p className="text-stone-500 mb-8 max-w-md italic font-serif">"L'insulte est un art, et t'es ma toile, sale merdeux."</p>
        <button onClick={handleStart} className="px-16 py-5 bg-stone-900 border border-stone-800 text-stone-100 font-black text-xl hover:bg-yellow-600 transition-all shadow-[6px_6px_0px_#1c1917] active:shadow-none active:translate-x-1 active:translate-y-1"> VIENS T'FAIRE INSULTER </button>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `linear-gradient(rgba(12, 10, 9, 0.8), rgba(12, 10, 9, 0.8)), url(${bgUrl})` }}
    >
      <div className="flex flex-col h-full max-w-2xl mx-auto w-full bg-stone-950/90 backdrop-blur-md shadow-2xl border-x border-stone-900/50 overflow-hidden">
        <header className="p-4 bg-stone-950/95 border-b border-stone-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <div className={`relative ${isSpeaking ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isSpeaking ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-stone-800'} bg-stone-800`}>
                <img src={avatarUrl} alt="Roland" className="w-full h-full object-cover grayscale opacity-80" />
              </div>
              {isSpeaking && <div className="absolute -inset-1 border-2 border-yellow-500 rounded-full animate-ping opacity-20"></div>}
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-100 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}>ROLAND CULÉ</h1>
              <p className="text-[9px] text-yellow-700 font-bold uppercase">Lieu : Bouzolles - Caravane insalubre</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <StinkLines />
             {hasVoiceError && <span className="text-[8px] text-red-900 font-bold animate-pulse">PLUS D'VOIX MON COUSHIN</span>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-sm border ${msg.sender === Sender.USER ? 'bg-stone-900/80 border-stone-800 text-stone-300' : 'bg-stone-950/80 border-yellow-900/10 text-stone-100 shadow-lg'}`}>
                {msg.sender === Sender.AI && (
                  <div className="flex justify-between items-center mb-2 border-b border-stone-900/50 pb-1">
                    <div className="text-[9px] font-black text-stone-700 uppercase">ROLAND L'ABJECT 🍟</div>
                    <button 
                      onClick={() => playRolandVoice(msg.text)}
                      className="text-stone-700 hover:text-yellow-600 transition-colors p-1"
                      title="Réécoute mon mépris"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    </button>
                  </div>
                )}
                <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${msg.sender === Sender.AI ? 'italic text-yellow-50/90 font-medium' : ''}`}>{msg.text || "Il cherche une canette pour t'la lancer..."}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-stone-950/95 border-t border-stone-900 backdrop-blur-sm">
          <div className="flex gap-2 items-center bg-stone-900/60 p-1 border border-stone-800">
            <button
              onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }} onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              className={`p-3 rounded-sm transition-all ${isRecording ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-stone-800 text-stone-500'}`}
              title="Gueule au coushin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
            <input
              type="text" value={isRecording ? transcript : input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Cause mon coushin..." : "Dis une connerie, gadjo..."}
              className="flex-1 bg-transparent border-none outline-none text-stone-200 px-3 py-2 text-sm"
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-stone-800 text-stone-500 px-5 py-2 text-[10px] font-black uppercase hover:bg-yellow-900 hover:text-yellow-100 transition-colors">V-VAZY</button>
          </div>
          {isRecording && <div className="text-[10px] text-yellow-700 font-bold uppercase mt-2 text-center animate-pulse"> {transcript || "On t'écoute coushin..."} </div>}
        </div>
      </div>
    </div>
  );
};

export default App;
