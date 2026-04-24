import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Play, CheckCircle2 } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

export default function Tutorial() {
  const [activeType, setActiveType] = useState<'assemble' | 'disassemble'>('assemble');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const filteredSteps = TUTORIAL_STEPS.filter(s => s.type === activeType);
  const currentStep = filteredSteps[currentStepIdx];

  const nextStep = () => {
    if (currentStepIdx < filteredSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  return (
    <div className="bg-black min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white tracking-tight">Video Masterclass</h2>
          <p className="text-zinc-400 mt-2">Watch expert-led video guides to master PC building and maintenance.</p>
          
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => { setActiveType('assemble'); setCurrentStepIdx(0); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeType === 'assemble' 
                ? 'bg-emerald-500 text-black' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              Assembling
            </button>
            <button
              onClick={() => { setActiveType('disassemble'); setCurrentStepIdx(0); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeType === 'disassemble' 
                ? 'bg-emerald-500 text-black' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              Disassembling
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative aspect-video">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full"
                >
                  {currentStep.videoUrl ? (
                    currentStep.videoUrl.endsWith('.mp4') ? (
                      <video
                        src={currentStep.videoUrl}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <iframe
                        src={`${currentStep.videoUrl}?autoplay=0&rel=0`}
                        title={currentStep.title}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  ) : (
                    <img
                      src={currentStep.image}
                      alt={currentStep.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-6 left-6 pointer-events-none">
                <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-md uppercase shadow-lg">
                  Video {currentStepIdx + 1} of {filteredSteps.length}
                </span>
              </div>
            </div>

            <div className="p-8 lg:p-12 flex flex-col justify-center bg-zinc-900/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold text-white">{currentStep.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-lg">
                    {currentStep.content}
                  </p>
                  
                  <div className="pt-8 flex items-center justify-end">
                    {currentStepIdx === filteredSteps.length - 1 ? (
                      <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        <CheckCircle2 className="h-5 w-5" /> Tutorial Complete
                      </div>
                    ) : (
                      <button
                        onClick={nextStep}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black hover:bg-emerald-400 transition-all"
                      >
                        Next Step <ChevronRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSteps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIdx(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIdx ? 'bg-emerald-500 w-full' : 'bg-white/10 w-full hover:bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
