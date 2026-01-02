
import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message } from './types';
import { geminiService } from './services/geminiService';
import { StinkLines } from './components/StinkLines';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: Sender.AI,
      text: "Qu'est-ce que tu veux encore, espèce de sous-merde ? T'as l'air aussi pathétique que l'odeur de mon aisselle gauche.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-screen max-w-3xl mx-auto border-x border-stone-800 dirty-gradient shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-stone-700 rounded-full border-2 border-green-900/50 overflow-hidden relative">
             <img src="https://picsum.photos/seed/disgusting/200" alt="Avatar" className="opacity-60 grayscale hover:grayscale-0 transition-all duration-1000" />
             <div className="absolute inset-0 bg-green-900/20 mix-blend-multiply"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-100 tracking-tighter" style={{ fontFamily: 'Creepster, cursive' }}>
              L'ABJECT CRITIC
            </h1>
            <p className="text-[10px] text-green-700 font-bold animate-pulse">STATUT: SALE & INFECT</p>
          </div>
        </div>
        <StinkLines />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-stone-800">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-3 border ${
                msg.sender === Sender.USER 
                  ? 'bg-stone-800 border-stone-700 text-stone-200' 
                  : 'bg-stone-950/80 border-stone-800 text-stone-100 italic toxic-glow'
              } shadow-lg`}
            >
              {msg.sender === Sender.AI && (
                <div className="text-[10px] uppercase font-bold text-stone-600 mb-1 border-b border-stone-900 pb-1">
                  Le Détritus Suprême
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.text || (isLoading && msg.sender === Sender.AI ? '...' : '')}
              </div>
              <div className="mt-2 text-[8px] text-stone-600 text-right uppercase">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-stone-900 border-t border-stone-800 z-10">
        <div className="flex gap-2 bg-stone-950 border border-stone-800 p-1 focus-within:border-green-900/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Dis quelque chose de stupide..."
            className="flex-1 bg-transparent border-none outline-none text-stone-200 p-2 text-sm placeholder:text-stone-700"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:bg-stone-900 disabled:text-stone-800 text-stone-400 font-bold text-xs border border-stone-700 transition-all uppercase"
          >
            {isLoading ? '...' : 'Insulter'}
          </button>
        </div>
        <p className="text-[9px] text-stone-700 mt-2 text-center uppercase tracking-widest">
          Appuyez sur ENTRÉE pour recevoir votre dose de mépris
        </p>
      </div>

      {/* Overlay background effects */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
    </div>
  );
};

export default App;
