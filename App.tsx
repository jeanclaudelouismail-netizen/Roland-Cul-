
import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message } from './types';
import { geminiService } from './services/geminiService';
import { StinkLines } from './components/StinkLines';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: Sender.AI,
      text: "Qu'est-ce que tu veux encore, espèce de sous-merde ? T'as l'air aussi pathétique que l'odeur de mon aisselle gauche. Je suis Roland Culé, et ta présence m'irrite déjà.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Note: 'avatar.png' refers to the image you provided. 
  // For the preview, we use a source that mimics the style.
  const avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      sender: Sender.AI,
      text: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMsg]);

    let accumulatedText = '';
    await geminiService.sendMessage(input, (chunk) => {
      accumulatedText += chunk;
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m));
    });

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-3xl mx-auto border-x border-stone-800 dirty-gradient shadow-2xl relative overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="avatar-container w-14 h-14 bg-stone-800 rounded-full border-2 border-green-900/40 overflow-hidden relative shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
             <img 
              src={avatarUrl} 
              alt="Roland Culé" 
              className="avatar-sepia w-full h-full object-cover" 
              onError={(e) => {
                // Fallback to a placeholder if the local avatar.png isn't found yet
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/roland/200";
              }}
            />
             <div className="absolute inset-0 bg-green-900/10 mix-blend-color"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-100 tracking-tighter leading-none" style={{ fontFamily: 'Creepster, cursive' }}>
              ROLAND CULÉ
            </h1>
            <p className="text-[9px] text-green-600 font-black animate-pulse mt-1 tracking-[0.3em] uppercase">Statut : Infect & Précis</p>
          </div>
        </div>
        <StinkLines />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-stone-800 pb-8">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[88%] p-3.5 border ${
                msg.sender === Sender.USER 
                  ? 'bg-stone-800 border-stone-700 text-stone-200' 
                  : 'bg-stone-950/90 border-stone-800 text-stone-50 toxic-glow'
              } shadow-xl rounded-sm`}
            >
              {msg.sender === Sender.AI && (
                <div className="text-[10px] uppercase font-black text-stone-600 mb-1.5 border-b border-stone-900 pb-1 tracking-widest flex justify-between items-center">
                  <span>Roland</span>
                  <span className="text-[8px] text-green-900/50">● EN LIGNE</span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium tracking-tight">
                {msg.text || (isLoading && msg.sender === Sender.AI ? '...' : '')}
              </div>
              <div className="mt-2 text-[9px] text-stone-700 text-right font-bold tabular-nums">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-stone-900/90 border-t border-stone-800 z-10 pb-safe backdrop-blur-sm">
        <div className="flex gap-2 bg-stone-950 border border-stone-800 p-1.5 focus-within:border-green-900/50 transition-colors rounded-md shadow-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Parle à mon cul, ma tête est malade..."
            className="flex-1 bg-transparent border-none outline-none text-stone-100 px-2 py-1 text-base placeholder:text-stone-800"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 disabled:bg-stone-900 disabled:text-stone-900 text-stone-400 font-bold text-xs border border-stone-700 transition-all uppercase rounded-sm"
          >
            {isLoading ? '...' : 'Cracher'}
          </button>
        </div>
        <p className="text-[8px] text-stone-800 mt-2 text-center uppercase tracking-[0.4em] font-bold">
          Dernière douche : Janvier 2022
        </p>
      </div>

      {/* Overlay background effects */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
    </div>
  );
};

export default App;
