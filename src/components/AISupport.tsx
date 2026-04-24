import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Loader2, Trash2, Sparkles, Image as ImageIcon, X, HelpCircle, HardDrive, Cpu, ShieldCheck, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';
import { getGeminiResponse } from '../services/gemini';
import { Message } from '../types';

export default function AISupport() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pc_master_ai_support_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: '# Welcome to AI Support 2.0\n\nI am your specialized PC Hardware & Assembly Assistant. I can help you with:\n\n- **Compatibility Checks**: Ensure your parts fit correctly.\n- **Assembly Guidance**: Step-by-step help with your build.\n- **Troubleshooting**: Upload photos of your PC if it\'s not booting or has cable management issues.\n- **Hardware Advice**: Recommendations for workstation or gaming builds.\n\nHow can I help you build your master machine today?' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('pc_master_ai_support_messages', JSON.stringify(messages));
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
    scrollToBottom();
  }, [messages]);

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
    setMessages([{ role: 'model', text: 'Diagnostic logs cleared. I am ready for your next question.' }]);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex flex-col lg:flex-row">
      {/* Sidebar Info - Desktop */}
      <div className="hidden lg:flex w-80 border-r border-white/10 p-8 flex-col gap-8 bg-zinc-900/30">
        <div>
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <Sparkles size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">AI Capabilities</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 text-xs">
              <Cpu className="text-zinc-500 shrink-0" size={16} />
              <p className="text-zinc-400">Socket & RAM compatibility analysis across all major platforms.</p>
            </div>
            <div className="flex gap-3 text-xs">
              <ImageIcon className="text-zinc-500 shrink-0" size={16} />
              <p className="text-zinc-400">Post-build inspection via photo uploads for cable management and error codes.</p>
            </div>
            <div className="flex gap-3 text-xs">
              <ShieldCheck className="text-zinc-500 shrink-0" size={16} />
              <p className="text-zinc-400">Expert advice on extreme workstations and dual-CPU systems.</p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle size={14} className="text-emerald-500" />
              Pro Tip
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Upload a clear photo of your motherboard's "Debug LEDs" if your PC isn't posting for instant diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-black">
        <div className="p-4 border-b border-white/10 lg:hidden flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-emerald-500" />
            <span className="font-bold">AI Support</span>
          </div>
          <button onClick={clearChat} className="text-white/40"><Trash2 size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:max-w-4xl lg:mx-auto w-full scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                msg.role === 'model' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/10 text-white'
              }`}>
                {msg.role === 'model' ? <BrainCircuit size={24} /> : <User size={24} />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[85%] lg:max-w-[75%]`}>
                {msg.image && (
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 w-fit max-w-sm">
                    <img 
                      src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                      alt="Attachment" 
                      className="w-full h-auto object-contain bg-zinc-900"
                    />
                  </div>
                )}
                <div className={`rounded-3xl px-5 py-3 lg:px-6 lg:py-4 text-sm leading-relaxed ${
                  msg.role === 'model' 
                  ? 'bg-zinc-900 text-zinc-100 border border-white/5' 
                  : 'bg-emerald-500 text-black font-medium shadow-lg'
                }`}>
                  <div className="markdown-body prose prose-invert prose-emerald max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <div className="bg-zinc-900 border border-white/5 text-zinc-400 rounded-3xl px-5 py-3 text-sm italic">
                AI Expert is analyzing your request...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-8 bg-black/80 backdrop-blur-md border-t border-white/10 sticky bottom-0">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {attachedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="relative h-20 w-20 rounded-xl overflow-hidden border border-emerald-500 inline-block bg-zinc-900"
                >
                  <img 
                    src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                    className="h-full w-full object-cover opacity-50"
                  />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your PC issue or request build advice..."
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-6 pr-24 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className="p-2.5 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-zinc-600 font-medium">
              Powered by Gemini 1.5 Flash. AI responses can vary. Always double-check hardware manuals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
