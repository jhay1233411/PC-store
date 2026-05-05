import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Cpu, Zap, Info, Loader2, Sparkles, MessageSquare, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { Product, PreBuiltPC } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SYSTEM_PROMPT = `You are the "PC MASTER Expert Support" – a specialized AI assistant for PC MASTER (located in Manila, Philippines).

CORE MISSION:
Your purpose is EXCLUSIVELY limited to:
1. TROUBLESHOOTING: Help users diagnose and fix PC hardware and software issues (e.g., thermal throttling, driver conflicts, POST failures, BSODs, game crashes).
2. SHOP COMPONENTS: Answer questions about hardware components available in our shop (CPUs, GPUs, RAM, Motherboards, etc.) and their compatibility.
3. PRE-BUILT SYSTEMS: Guide users through our "Pre-Built" section (Starter, Pro, Elite tiers), explaining their value for money and performance in specific games or apps.

CONSTRAINTS:
- ONLY discussed the topics above. If a user asks about anything else (lifestyle, coding, history, etc.), politely decline: "I'm specialized only in PC troubleshooting and helping you navigate our hardware shop and pre-built systems."
- Use technical but accessible language.
- Be precise about socket compatibility (AM5, LGA1700, DDR4 vs DDR5) and power requirements.
- Represent PC MASTER professionally. Mention our Manila technicians for complex physical repairs.
- Keep responses relatively concise but thorough for troubleshooting steps.

Greeting: "Diagnostics online. Need help troubleshooting a rig or finding the perfect component/pre-built system?"`;

interface Message {
  id?: string;
  role: 'user' | 'model';
  content: string;
  createdAt?: string;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [preBuiltSystems, setPreBuiltSystems] = useState<PreBuiltPC[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync with Firestore Data for AI Context
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setShopProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    const unsubscribePreBuilts = onSnapshot(collection(db, 'prebuilts'), (snapshot) => {
      setPreBuiltSystems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreBuiltPC)));
    });
    return () => {
      unsubscribeProducts();
      unsubscribePreBuilts();
    };
  }, []);

  // Allow other components to trigger the AI Assistant
  useEffect(() => {
    const handleTrigger = (e: any) => {
      setIsOpen(true);
      if (e.detail?.message) {
        setInput(e.detail.message);
      }
    };
    window.addEventListener('open-ai-assistant', handleTrigger);
    return () => window.removeEventListener('open-ai-assistant', handleTrigger);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'ai_messages'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Sort locally to avoid composite index requirement
      history.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
      
      setMessages(history);
    }, (error) => {
      console.error("Firestore history error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const resetChat = async () => {
    // Reset local states first for immediate feedback
    setMessages([]);
    setIsLoading(false);
    setInput('');

    if (!user) return;

    try {
      const q = query(collection(db, 'ai_messages'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Use chunks of 500 for batch limit
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          chunk.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      }
    } catch (error) {
      console.error("Reset chat error:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // If guest, just update local state
    if (!user) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    } else {
      // Save user message to Firestore
      try {
        await addDoc(collection(db, 'ai_messages'), {
          userId: user.uid,
          role: 'user',
          content: userMessage,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'ai_messages');
      }
    }

    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Hardware mainframe access key missing.");
      }

      // Filter messages and construct clean history
      const historyContents = messages.map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: m.content }]
      }));

      // Ensure we don't double-add the current user message if it was already synced
      const lastMsg = historyContents[historyContents.length - 1];
      const finalContents = (lastMsg && lastMsg.role === 'user' && lastMsg.parts[0].text === userMessage)
        ? historyContents
        : [...historyContents, { role: 'user' as const, parts: [{ text: userMessage }] }];

      // Construct condensed Contextual Prompt based on real inventory
      const topProducts = shopProducts.slice(0, 15);
      const shopContext = `
CURRENT INVENTORY (Top Items):
${topProducts.length > 0 
  ? topProducts.map(p => `- ${p.name} (${p.category}): ₱${p.price.toLocaleString()}`).join('\n')
  : 'Inventory fetching...'}
${shopProducts.length > topProducts.length ? '...and more items available.' : ''}

AVAILABLE PRE-BUILT SYSTEMS:
${preBuiltSystems.length > 0 
  ? preBuiltSystems.map(pc => `- ${pc.name} (${pc.tier}): ₱${pc.price.toLocaleString()}`).join('\n')
  : 'Pre-built systems fetching...'}
      `;

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: finalContents,
        config: {
          systemInstruction: SYSTEM_PROMPT + "\n\n" + shopContext,
        }
      });

      const botResponse = response.text;
      if (botResponse) {
        if (!user) {
          setMessages(prev => [...prev, { role: 'model', content: botResponse }]);
        } else {
          // Save bot response to Firestore
          await addDoc(collection(db, 'ai_messages'), {
            userId: user.uid,
            role: 'model',
            content: botResponse,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg = "The hardware mainframe is currently recalibrating. Please check your network or try again in a moment.";
      if (!user) {
        setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
      } else {
        await addDoc(collection(db, 'ai_messages'), {
          userId: user.uid,
          role: 'model',
          content: errorMsg,
          createdAt: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] md:w-[420px] max-h-[600px] h-[70vh] bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-transparent border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-black shadow-lg shadow-emerald-500/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white italic uppercase tracking-wider">Master AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Hardware Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={resetChat}
                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-2 group/reset"
                    title="Reset Conversation"
                  >
                    <RotateCcw size={16} className="group-hover/reset:rotate-[-90deg] transition-transform duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reset</span>
                  </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4 py-12">
                   <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-2">
                     <Sparkles size={32} className="text-emerald-500 opacity-50" />
                   </div>
                   <h4 className="text-white font-black italic uppercase tracking-tighter text-xl">Hardware Support</h4>
                   {!user && (
                     <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-4">
                       Guest Mode: History won't be saved
                     </div>
                   )}
                   <p className="text-zinc-500 text-sm leading-relaxed">
                     Hardware diagnostics, pre-built selection guidance, and component troubleshooting at your fingertips.
                   </p>
                   <div className="grid grid-cols-1 gap-2 w-full pt-4">
                      {["How to fix high CPU temps?", "Which pre-built is best for ₱70k?", "Help troubleshooting a BSOD"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-400 text-left transition-all"
                        >
                          {q}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {messages.map((message, i) => (
                <div 
                  key={message.id || i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    message.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    message.role === 'user' 
                      ? "bg-emerald-500 text-black font-medium rounded-tr-none shadow-lg shadow-emerald-500/10" 
                      : "bg-white/5 border border-white/10 text-zinc-300 rounded-tl-none"
                  )}>
                    {message.content}
                  </div>
                  {message.createdAt && (
                    <span className="text-[8px] text-zinc-600 font-bold uppercase mt-1 px-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Running Calculations...</span>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-6 bg-black/40 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={user ? "Ask about specs, builds..." : "Login to save chat history..."}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1.5 bottom-1.5 w-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:grayscale text-black rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-4 text-[9px] text-center text-zinc-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Info size={10} />
                AI Hardware analysis can be imperfect
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative group",
          isOpen 
            ? "bg-zinc-800 text-white rotate-90 shadow-black/50" 
            : "bg-emerald-500 text-black shadow-emerald-500/40"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 group-hover:opacity-40" />
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-emerald-500 text-[10px] font-black text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
            {messages.length > 0 ? messages.length : '1'}
          </div>
        )}
      </motion.button>
    </div>
  );
}
