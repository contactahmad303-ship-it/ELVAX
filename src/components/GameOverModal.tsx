import React, { useEffect } from 'react';
import { PlayerState, DEV_RANKS } from '../game/types';
import { RotateCcw, Home, Trophy, Bug, Sparkles, Terminal } from 'lucide-react';

interface GameOverModalProps {
  finalPlayer: PlayerState;
  onRestart: () => void;
  onHome: () => void;
  onOpenTerminal: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalPlayer,
  onRestart,
  onHome,
  onOpenTerminal,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onHome();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRestart, onHome]);

  const devRank = [...DEV_RANKS].reverse().find(r => finalPlayer.score >= r.minScore) || DEV_RANKS[0];
  const isNewHighScore = finalPlayer.score >= finalPlayer.highScore && finalPlayer.score > 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/85 backdrop-blur-none pointer-events-auto select-none font-mono">
      <div className="max-w-xl w-full rounded-2xl border border-rose-500/50 bg-slate-950/95 p-6 md:p-8 shadow-[0_0_50px_rgba(244,63,94,0.35)] flex flex-col text-slate-100">
        {/* Panic Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-500/30 mb-6">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm tracking-wider font-cyber">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>KERNEL PANIC // ZERO-DAY CRASH</span>
          </div>
          <span className="text-xs text-rose-400/70 font-mono">FAULT: 0xDEADBEEF</span>
        </div>

        {/* Failure summary message */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-black font-cyber text-slate-100 tracking-wide uppercase mb-2">
            Execution Terminated
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Corrupted processes overwhelmed kernel safeguards. Memory dump preserved in local registers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Final Score */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Total Operations</div>
            <div className="text-xl md:text-2xl font-bold font-cyber text-cyan-300 tabular-nums">
              {finalPlayer.score.toLocaleString()} OPS
            </div>
            {isNewHighScore && (
              <span className="text-[10px] text-amber-400 font-bold flex items-center mt-1">
                <Sparkles className="w-3 h-3 mr-1" /> NEW ALL-TIME RECORD!
              </span>
            )}
          </div>

          {/* Dev Rank */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Dev Rank Achieved</div>
            <div
              className="text-xs md:text-sm font-bold font-cyber mt-1 truncate"
              style={{ color: devRank.color }}
            >
              {devRank.title}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Tier: {devRank.badge}
            </span>
          </div>

          {/* Bugs Squashed */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded bg-rose-950/60 text-rose-400">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Bugs Purged</div>
              <div className="text-base font-bold text-slate-200 tabular-nums">
                {finalPlayer.bugsSquashed}
              </div>
            </div>
          </div>

          {/* RAM Crystals Harvested */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-950/60 text-cyan-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">RAM Harvested</div>
              <div className="text-base font-bold text-slate-200 tabular-nums">
                {finalPlayer.ramCrystalsCollected}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-sm tracking-wider transition-all duration-150 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART KERNEL</span>
            <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-semibold">
              SPACE
            </span>
          </button>

          <button
            onClick={onHome}
            className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-mono transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>BIOS MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
