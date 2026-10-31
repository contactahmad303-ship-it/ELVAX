import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Terminal,
  Shield,
  Zap,
  Trash2,
  Flame,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';
import { PlayerState, LiveMetrics, EnemyEntity, DEV_RANKS } from '../game/types';
import { soundSynth } from '../audio/SoundSynth';

interface GameHUDProps {
  player: PlayerState;
  metrics: LiveMetrics;
  activeBoss: EnemyEntity | null;
  wave: number;
  onPause: () => void;
  onToggleTerminal: () => void;
  onTriggerDash: () => void;
  onTriggerGC: () => void;
  onTriggerOverclock: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  metrics,
  activeBoss,
  wave,
  onPause,
  onToggleTerminal,
  onTriggerDash,
  onTriggerGC,
  onTriggerOverclock,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundSynth.getMuted());

  const toggleMute = () => {
    const next = soundSynth.toggleMute();
    setIsMuted(next);
  };

  // Find user current rank from score
  const userRank = [...DEV_RANKS].reverse().find(r => player.score >= r.minScore) || DEV_RANKS[0];

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
  const energyPercent = Math.max(0, Math.min(100, (player.energy / player.maxEnergy) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100));

  const isOverclock = player.overclockActiveTimer > 0;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 font-mono text-slate-100">
      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Player Vital Status & XP */}
        <div className="flex flex-col space-y-2 pointer-events-auto max-w-xs md:max-w-sm">
          {/* Dev Rank & Level Header */}
          <div className="flex items-center space-x-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-slate-900/90 text-cyan-300"
              style={{ borderColor: userRank.color, color: userRank.color }}
            >
              {userRank.badge}
            </span>
            <span className="text-xs font-semibold text-slate-200 tracking-wider">
              {userRank.title}
            </span>
            <span className="text-xs text-cyan-400 font-bold ml-auto tabular-nums">
              LVL {player.level}
            </span>
          </div>

          {/* Core Health Bar */}
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-xs bg-red-500 inline-block"></span>
                <span>KERNEL HP</span>
              </span>
              <span className="tabular-nums font-semibold text-slate-200">
                {Math.round(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="w-full h-2 rounded-xs bg-slate-950/80 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>RUST SHIELD</span>
              </span>
              <span className="tabular-nums font-semibold text-cyan-300">
                {Math.round(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-xs bg-slate-950/80 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-sky-300 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Energy Bar */}
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
              <span className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>ENERGY CYCLES</span>
              </span>
              <span className="tabular-nums font-semibold text-amber-300">
                {Math.round(player.energy)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-xs bg-slate-950/80 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-300 transition-all duration-150"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full pt-1">
            <div className="w-full h-1 rounded-xs bg-slate-950/80 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-100"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center: Raid Boss Status (when active) */}
        {activeBoss && (
          <div className="flex flex-col items-center max-w-md w-full px-4 pointer-events-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 tracking-widest mb-1 uppercase font-cyber">
              <span className="text-amber-400">⚠️ RAID BOSS :</span>
              <span>{activeBoss.type.replace('_', ' ')}</span>
            </div>
            <div className="w-full h-3 rounded bg-slate-950 border border-rose-500/50 overflow-hidden shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-400 transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">
              {Math.round(activeBoss.hp)} / {activeBoss.maxHp} INTEGRITY
            </span>
          </div>
        )}

        {/* Top-Right: Memory / Score / Telemetry Cluster */}
        <div className="flex flex-col items-end space-y-2 pointer-events-auto text-right">
          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Toggle Audio (M)"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
            <button
              onClick={onToggleTerminal}
              className="px-2 py-1 rounded border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Open CLI Terminal (~)"
            >
              <Terminal className="w-3 h-3" />
              <span>~ CLI</span>
            </button>
            <button
              onClick={onPause}
              className="p-1.5 rounded border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
              title="Pause Game (ESC)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Score & Combo */}
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-slate-400 font-mono">MEMORY OPS PROCESSED</div>
            <div className="text-xl md:text-2xl font-bold font-cyber text-slate-100 tabular-nums">
              {player.score.toLocaleString()}
            </div>
            {player.multiplier > 1.0 && (
              <div className="text-xs font-bold text-amber-400 font-mono flex items-center space-x-1 mt-0.5">
                <span>x{player.multiplier.toFixed(1)}</span>
                <span className="text-[10px] text-amber-500">STACK OVERFLOW</span>
              </div>
            )}
          </div>

          {/* Wave & Telemetry stats */}
          <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold">
              WAVE 0x0{wave}
            </span>
            <span className="tabular-nums">{metrics.fps} FPS</span>
            <span className="tabular-nums">{metrics.latencyNs}ns</span>
            <span className="tabular-nums">{metrics.allocatedMemoryMb}MB</span>
          </div>
        </div>
      </div>

      {/* BOTTOM PERIMETER: COMPACT SKILL HOTBAR DOCK (Low Occlusion) */}
      <div className="flex flex-col items-center justify-end w-full pb-2">
        {/* Overclock active banner */}
        {isOverclock && (
          <div className="mb-2 px-4 py-1 rounded border border-cyan-400/80 bg-cyan-950/90 text-cyan-300 font-cyber font-bold text-xs tracking-wider flex items-center space-x-2 animate-bounce">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <span>OVERCLOCK ENGAGED : {player.overclockActiveTimer.toFixed(1)}s</span>
          </div>
        )}

        {/* Skill Hotbar Dock */}
        <div className="pointer-events-auto flex items-center gap-2 md:gap-3 p-1.5 rounded-lg border border-slate-800 bg-slate-950/90 shadow-2xl">
          {/* Skill 1: Byte Blaster (LMB) */}
          <div className="flex flex-col items-center px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-center min-w-[72px]">
            <span className="text-[9px] font-bold text-slate-500">LMB / SPACE</span>
            <div className="flex items-center justify-center my-0.5 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300">BLASTER</span>
          </div>

          {/* Skill 2: Garbage Collection (Q / RMB) */}
          <button
            onClick={onTriggerGC}
            disabled={player.gcCooldownTimer > 0 || player.energy < 30}
            className={`flex flex-col items-center px-3 py-1.5 rounded border text-center min-w-[72px] transition-all cursor-pointer ${
              player.gcCooldownTimer > 0 || player.energy < 30
                ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
                : 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <span className="text-[9px] font-bold text-slate-400">Q / RMB</span>
            <div className="flex items-center justify-center my-0.5">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold">
              {player.gcCooldownTimer > 0 ? `${player.gcCooldownTimer.toFixed(1)}s` : 'SWEEP'}
            </span>
          </button>

          {/* Skill 3: Kernel Overclock (E / Shift) */}
          <button
            onClick={onTriggerOverclock}
            disabled={player.overclockCooldownTimer > 0 || player.energy < 50}
            className={`flex flex-col items-center px-3 py-1.5 rounded border text-center min-w-[72px] transition-all cursor-pointer ${
              player.overclockCooldownTimer > 0 || player.energy < 50
                ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
                : 'bg-pink-950/40 hover:bg-pink-900/60 border-pink-500/50 text-pink-300'
            }`}
          >
            <span className="text-[9px] font-bold text-slate-400">E / SHIFT</span>
            <div className="flex items-center justify-center my-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold">
              {player.overclockCooldownTimer > 0 ? `${player.overclockCooldownTimer.toFixed(1)}s` : 'OVERCLOCK'}
            </span>
          </button>

          {/* Skill 4: Git Force Push / Dash (Space / F) */}
          <button
            onClick={onTriggerDash}
            disabled={player.dashTimer > 0}
            className={`flex flex-col items-center px-3 py-1.5 rounded border text-center min-w-[72px] transition-all cursor-pointer ${
              player.dashTimer > 0
                ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <span className="text-[9px] font-bold text-slate-400">SPACE / F</span>
            <div className="flex items-center justify-center my-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold">
              {player.dashTimer > 0 ? `${player.dashTimer.toFixed(1)}s` : 'DASH'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
