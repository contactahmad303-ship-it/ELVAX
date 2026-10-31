import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Terminal, Key } from 'lucide-react';
import { soundSynth } from '../audio/SoundSynth';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenTerminal: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  onOpenTerminal,
}) => {
  const [isMuted, setIsMuted] = useState(soundSynth.getMuted());

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onResume]);

  const toggleMute = () => {
    const next = soundSynth.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/75 backdrop-blur-none pointer-events-auto select-none font-mono">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col text-slate-100">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-xs text-amber-400 font-bold mb-2">
            EXECUTION SUSPENDED
          </div>
          <h2 className="text-2xl font-black font-cyber text-slate-100 tracking-wider uppercase">
            Kernel Paused
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-sm tracking-wider transition-all duration-150 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME EXECUTION</span>
            <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-semibold">
              ESC
            </span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART SIMULATION</span>
          </button>

          <button
            onClick={onOpenTerminal}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>OPEN CLI CONSOLE (~)</span>
          </button>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={toggleMute}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
            </button>

            <button
              onClick={onHome}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>

        {/* Control Quick Reference */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
          <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1">
            <Key className="w-3 h-3 text-cyan-400" />
            <span>Controls:</span>
          </div>
          <div className="flex justify-between">
            <span>WASD / Arrows</span>
            <span className="text-slate-200 font-semibold">Move Vector</span>
          </div>
          <div className="flex justify-between">
            <span>Mouse + LMB</span>
            <span className="text-slate-200 font-semibold">Aim & Fire Blaster</span>
          </div>
          <div className="flex justify-between">
            <span>Q / RMB</span>
            <span className="text-slate-200 font-semibold">Garbage Collection Shockwave</span>
          </div>
          <div className="flex justify-between">
            <span>E / Shift</span>
            <span className="text-slate-200 font-semibold">Overclock Turbo Mode</span>
          </div>
          <div className="flex justify-between">
            <span>Space / F</span>
            <span className="text-slate-200 font-semibold">Git Force Push (Dash)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
