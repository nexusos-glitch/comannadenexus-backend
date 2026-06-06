import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- Types ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const OLLAMA_URL = 'http://localhost:11434/api/chat'; 
const DEFAULT_MODEL = 'llama3';

export const OllamaChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(OLLAMA_URL, {
        model: model,
        messages: [...messages, userMessage],
        stream: false,
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.data.message.content 
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error connecting to Ollama:", error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: "Error: Could not connect to Ollama. Make sure the server is running locally on port 11434." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] bg-slate-900 text-slate-100 font-sans rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Sidebar for Ollama Config */}
      <aside className="w-64 bg-slate-950 p-4 flex flex-col border-r border-slate-800 shrink-0 hidden lg:flex">
        <h1 className="text-xl font-bold mb-8 text-blue-400 tracking-tight">COMMAND<span className="text-white">NEXUS</span></h1>
        
        <div className="flex-1">
          <label className="text-xs uppercase text-slate-500 font-semibold">Active Model</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="w-full mt-2 p-2 bg-slate-800 border border-slate-700 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="llama3">Llama 3</option>
            <option value="mistral">Mistral</option>
            <option value="phi3">Phi-3</option>
            <option value="gemma">Gemma</option>
          </select>
        </div>

        <div className="text-xs text-slate-600 mt-auto">
          Status: <span className="text-green-500">● Local Server Ready</span>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-slate-900 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h1 className="text-lg font-bold text-blue-400 tracking-tight truncate">COMMAND<span className="text-white">NEXUS</span></h1>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="p-1.5 bg-slate-800 border border-slate-700 rounded text-xs outline-none focus:ring-2 focus:ring-blue-500 text-white max-w-[120px]"
          >
            <option value="llama3">Llama 3</option>
            <option value="mistral">Mistral</option>
            <option value="phi3">Phi-3</option>
            <option value="gemma">Gemma</option>
          </select>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-500 italic text-center px-4">
              Ready for local commands, Operator. Switch models in the panel.
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-2xl p-3 rounded-lg ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter system command..."
              className="flex-1 p-2 md:p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 min-w-0"
            />
            <button 
              disabled={isLoading}
              type="submit" 
              className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-semibold transition-colors shrink-0"
            >
              {isLoading ? '...' : 'SEND'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
