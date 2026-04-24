import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Loader2, Trash2, Sparkles, Image as ImageIcon, X, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';
import { getGeminiResponse } from '../services/gemini';
import { Message } from '../types';
import { cn } from '../lib/utils';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pc_master_chatbot_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: 'Hello! I am your PC Master AI Assistant. Need help choosing parts, assembling your build, or troubleshooting? Ask me anything!' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('pc_master_chatbot_messages', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      text: input,
      image: attachedImage || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [
        { text: m.text },
        ...(m.image ? [{ inlineData: { data: m.image.data, mimeType: m.image.mimeType } }] : [])
      ]
    }));

    const response = await getGeminiResponse(input, history, userMessage.image);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: 'Chat cleared. How else can I help you today?' }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <AnimatePresence>
        {isOpen && (
            <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300"
          >
            {/* Header */}
            <div className="p-4 bg-emerald-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-black/10 rounded-lg">
                  <BrainCircuit className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black leading-none">Master AI</h2>
                  <p className="text-[10px] text-black/60 uppercase tracking-widest font-bold mt-1">Grounded Expert</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-1.5 text-black/40 hover:text-black transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                    msg.role === 'model' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white"
                  )}>
                    {msg.role === 'model' ? <BrainCircuit className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed transition-colors",
                    msg.role === 'model' 
                    ? "bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/5 shadow-sm" 
                    : "bg-emerald-500 text-black font-medium shadow-md shadow-emerald-500/10"
                  )}>
                    {msg.image && (
                      <img 
                        src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                        alt="Attachment" 
                        className="rounded-lg mb-2 max-w-full h-auto border border-black/5"
                      />
                    )}
                    <div className={cn(
                      "markdown-body prose prose-xs max-w-none transition-colors",
                      msg.role === 'model' ? "dark:prose-invert" : "prose-emerald"
                    )}>
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 rounded-2xl px-3 py-2 text-xs italic border border-zinc-200 dark:border-white/5">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-zinc-50/50 dark:bg-black/40 border-t border-zinc-200 dark:border-white/5">
              {attachedImage && (
                <div className="relative inline-block mb-2 group">
                  <img 
                    src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                    className="h-12 w-12 object-cover rounded-lg border border-emerald-500"
                    alt="Preview"
                  />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask the Master..."
                  className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-20 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-zinc-400 hover:text-emerald-500 dark:hover:text-white transition-colors"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !attachedImage) || isLoading}
                    className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Head */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-emerald-500 rounded-full shadow-2xl flex items-center justify-center text-black hover:bg-emerald-400 transition-colors relative group"
      >
        <BrainCircuit size={28} />
        {!isOpen && (
          <div className="absolute right-full mr-4 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Need help building?
          </div>
        )}
      </motion.button>
    </div>
  );
}
