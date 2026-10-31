import React from 'react';
import { TechUpgrade } from '../game/types';
import {
  Database,
  ShieldCheck,
  Cpu,
  Zap,
  Trash2,
  Flame,
  Bot,
  BugPlay,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface UpgradeModalProps {
  upgrades: TechUpgrade[];
  onSelectUpgrade: (upgrade: TechUpgrade) => void;
  level: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  ShieldCheck,
  Cpu,
  Zap,
  Trash2,
  Flame,
  Bot,
  BugPlay,
  Activity,
  Layers,
};

const TIER_COLORS: Record<string, { badge: string; border: string; glow: string }> = {
  COMMON: {
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    border: 'border-slate-800 hover:border-slate-600',
    glow: 'hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]',
  },
  RARE: {
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    border: 'border-cyan-800/60 hover:border-cyan-400',
    glow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]',
  },
  EPIC: {
    badge: 'bg-purple-950 text-purple-300 border-purple-800',
    border: 'border-purple-800/60 hover:border-purple-400',
    glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]',
  },
  LEGENDARY: {
    badge: 'bg-amber-950 text-amber-300 border-amber-700',
    border: 'border-amber-700/60 hover:border-amber-400',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]',
  },
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  upgrades,
  onSelectUpgrade,
  level,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/75 backdrop-blur-none pointer-events-auto select-none font-mono">
      {/* Level Up Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-xs text-emerald-400 font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SYSTEM ARCHITECTURE UPGRADE // LEVEL {level}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-cyber font-black tracking-wider text-slate-100 uppercase">
          Select Tech Dependency
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Compile new kernel capability into your runtime stack
        </p>
      </div>

      {/* 3 Tech Upgrade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
        {upgrades.map((upgrade) => {
          const IconComponent = ICON_MAP[upgrade.icon] || Cpu;
          const tierStyle = TIER_COLORS[upgrade.tier] || TIER_COLORS.COMMON;

          return (
            <button
              key={upgrade.id}
              onClick={() => onSelectUpgrade(upgrade)}
              className={`group flex flex-col items-start p-6 rounded-xl bg-slate-900/90 border transition-all duration-200 text-left cursor-pointer transform hover:-translate-y-1.5 ${tierStyle.border} ${tierStyle.glow}`}
            >
              {/* Header: Tier & Category */}
              <div className="flex items-center justify-between w-full mb-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tierStyle.badge}`}
                >
                  {upgrade.tier}
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider">
                  {upgrade.category}
                </span>
              </div>

              {/* Icon Box */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/50 transition-colors mb-4">
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Name & Subtitle */}
              <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors font-cyber mb-1">
                {upgrade.name}
              </h3>
              <div className="text-xs text-cyan-400/80 font-semibold mb-3">
                {upgrade.subtitle}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                {upgrade.description}
              </p>

              {/* Stat Boost Pill */}
              <div className="w-full pt-3 border-t border-slate-800 text-[11px] font-bold text-emerald-400">
                ⚡ {upgrade.statBoost}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
