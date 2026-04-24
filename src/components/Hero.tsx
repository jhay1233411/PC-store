import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cpu, ShieldCheck, Zap } from 'lucide-react';

interface HeroProps {
  onStart: (tab: string) => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-black py-24 sm:py-32 transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20 dark:opacity-20 opacity-10">
        <div className="h-[400px] w-[600px] rounded-full bg-emerald-500/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              New: AI Building Assistant
            </span>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
              Build Your Dream PC <br />
              <span className="text-emerald-500">Like a Master.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              The ultimate destination for PC enthusiasts. Learn the art of assembly, 
              shop for premium components, and get real-time expert advice from our AI assistant.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => onStart('tutorial')}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all flex items-center gap-2"
              >
                Start Learning <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onStart('shop')}
                className="text-sm font-semibold leading-6 text-zinc-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                Browse Components <span aria-hidden="true">→</span>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { icon: Cpu, title: 'Premium Parts', desc: 'Handpicked high-performance components.' },
            { icon: Zap, title: 'Step-by-Step', desc: 'Interactive tutorials for all skill levels.' },
            { icon: ShieldCheck, title: 'Expert Advice', desc: 'AI-powered building guidance 24/7.' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
              className="flex flex-col items-center p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center shadow-sm dark:shadow-none transition-all hover:border-emerald-500/30 group"
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tighter italic">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
