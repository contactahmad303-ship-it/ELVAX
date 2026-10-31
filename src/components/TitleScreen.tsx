import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Terminal, Shield, Cpu, Zap, Trophy, Play } from 'lucide-react';
import { soundSynth } from '../audio/SoundSynth';
import { DEV_RANKS } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenTerminal: () => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTerminal,
  highScore,
}) => {
  const [isMuted, setIsMuted] = useState(soundSynth.getMuted());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStartGame();
      } else if (e.code === 'KeyM') {
        const next = soundSynth.toggleMute();
        setIsMuted(next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const toggleMute = () => {
    const next = soundSynth.toggleMute();
    setIsMuted(next);
  };

  // Find user current rank from highscore
  const userRank = [...DEV_RANKS].reverse().find(r => highScore >= r.minScore) || DEV_RANKS[0];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 md:p-12 pointer-events-none select-none">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 backdrop-blur-none text-xs font-mono font-semibold tracking-wider text-cyan-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-none"></span>
            <span>KERNEL v4.19-RT // LINUX-ZERO-DAY</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>eBPF PROTECTED</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors flex items-center justify-center cursor-pointer"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={onOpenTerminal}
            className="px-3 py-2 rounded border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono transition-colors flex items-center space-x-2 cursor-pointer"
            title="Open Developer Console (~)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI CONSOLE (~)</span>
          </button>
        </div>
      </div>

      {/* Center Title Lockup & 35% Negative Space */}
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto my-auto text-center pointer-events-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="w-full max-w-xl mb-4">
          <svg viewBox="0 0 600 130" className="w-full h-auto drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Background grid accent */}
            <path d="M 50,20 L 550,20" stroke="url(#glowLine)" strokeWidth="1.5" />
            <path d="M 120,115 L 480,115" stroke="url(#glowLine)" strokeWidth="1" />
            {/* Title Text */}
            <text
              x="300"
              y="68"
              textAnchor="middle"
              fill="url(#cyberGrad)"
              fontFamily="Orbitron, monospace"
              fontSize="48"
              fontWeight="900"
              letterSpacing="6"
            >
              KERNEL OVERCLOCK
            </text>
            {/* Sub-banner */}
            <text
              x="300"
              y="98"
              textAnchor="middle"
              fill="#94a3b8"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fontWeight="700"
              letterSpacing="7"
            >
              // ZERO-DAY PROTOCOL : REFACTOR OR DIE
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm md:text-base max-w-xl font-mono mb-8 leading-relaxed">
          The global neural mainframe is under a catastrophic zero-day assault. Eliminate memory leaks, purge corrupted threads, deploy garbage collection shockwaves, and survive rogue AGI monoliths.
        </p>

        {/* Start Game CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <button
            onClick={onStartGame}
            className="group relative px-8 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-base md:text-lg tracking-wider transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.6)] cursor-pointer flex items-center space-x-3"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>INITIALIZE KERNEL</span>
            <span className="text-xs font-mono font-semibold opacity-75 bg-slate-950/20 px-2 py-0.5 rounded">
              ENTER / SPACE
            </span>
          </button>
        </div>

        {/* High Score & Rank Pill */}
        <div className="flex items-center space-x-6 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BEST SCORE:</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {highScore.toLocaleString()} OPS
            </span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2">
            <span>DEV RANK:</span>
            <span className="font-bold text-cyan-300">{userRank.title}</span>
          </div>
        </div>
      </div>

      {/* Flat Bottom Control Hint Line */}
      <div className="w-full text-center pointer-events-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-4 px-6 py-2.5 rounded-full border border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400 shadow-lg">
          <span className="text-slate-200 font-semibold">WASD</span>
          <span>Move</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">Mouse</span>
          <span>Aim</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">LMB</span>
          <span>Fire</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">Q / RMB</span>
          <span>Garbage Collect</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">E / Shift</span>
          <span>Overclock</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">Space</span>
          <span>Dash</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200 font-semibold">Esc</span>
          <span>Pause</span>
        </div>
      </div>
    </div>
  );
};
