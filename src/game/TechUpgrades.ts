import { TechUpgrade, PlayerState } from './types';

export const TECH_UPGRADES: TechUpgrade[] = [
  {
    id: 'redis_cache',
    name: 'Redis In-Memory Cache',
    subtitle: 'Ultra low latency execution',
    description: 'Bypasses slow disk I/O. Increases attack speed and move speed by 25%.',
    icon: 'Database',
    tier: 'COMMON',
    category: 'OFFENSE',
    statBoost: '+25% Fire Rate, +15% Speed',
    apply: (p: PlayerState) => {
      p.attackSpeedMultiplier *= 1.25;
      p.speed *= 1.15;
    }
  },
  {
    id: 'rust_borrow_checker',
    name: 'Rust Memory Safety',
    subtitle: 'Zero runtime allocations',
    description: 'Enforces strict compile-time lifetimes. Boosts maximum shield by 40 and accelerates shield recharge.',
    icon: 'ShieldCheck',
    tier: 'RARE',
    category: 'DEFENSE',
    statBoost: '+40 Max Shield, +50% Regen Rate',
    apply: (p: PlayerState) => {
      p.maxShield += 40;
      p.shield += 40;
      p.shieldRegenRate *= 1.5;
    }
  },
  {
    id: 'async_multithreading',
    name: 'Async Multi-Threading',
    subtitle: 'Parallel worker goroutines',
    description: 'Spawns extra concurrent firing threads! Adds +1 projectile per shot and increases spread angle.',
    icon: 'Cpu',
    tier: 'EPIC',
    category: 'OFFENSE',
    statBoost: '+1 Parallel Projectile per Shot',
    apply: (p: PlayerState) => {
      p.bulletCount += 1;
    }
  },
  {
    id: 'wasm_jit',
    name: 'WebAssembly JIT Compiler',
    subtitle: 'Near-native byte bytecode execution',
    description: 'Compiled bytecode pierces through targets. All bullets pierce +1 additional bug and travel 30% faster.',
    icon: 'Zap',
    tier: 'RARE',
    category: 'OFFENSE',
    statBoost: '+1 Pierce, +30% Bullet Speed',
    apply: (p: PlayerState) => {
      p.bulletPierce += 1;
      p.bulletSpeed *= 1.3;
    }
  },
  {
    id: 'garbage_collector_turbo',
    name: 'Generational GC Turbo',
    subtitle: 'Zero pause time mark-and-sweep',
    description: 'Shrinks Garbage Collection shockwave cooldown by 40% and expands shockwave radius by 50%.',
    icon: 'Trash2',
    tier: 'RARE',
    category: 'SYSTEM',
    statBoost: '-40% GC Cooldown, +50% Blast Radius',
    apply: (p: PlayerState) => {
      p.gcCooldownMax = Math.max(3, p.gcCooldownMax * 0.6);
      p.gcRadius *= 1.5;
      p.gcDamage *= 1.4;
    }
  },
  {
    id: 'overclock_liquid_cooling',
    name: 'Sub-Zero Liquid Nitrogen',
    subtitle: 'Overclock thermal throttling disabled',
    description: 'Extends Kernel Overclock duration by 3 seconds and doubles energy regeneration rate.',
    icon: 'Flame',
    tier: 'EPIC',
    category: 'SYSTEM',
    statBoost: '+3s Overclock Duration, +100% Energy Regen',
    apply: (p: PlayerState) => {
      p.overclockDuration += 3.0;
      p.energyRegenRate *= 2.0;
    }
  },
  {
    id: 'copilot_neural_drone',
    name: 'Neural Copilot Sentry',
    subtitle: 'Autonomous LLM code agent',
    description: 'Deploys an autonomous orbital sentry drone that hovers around your ship and zaps nearest bugs with lasers.',
    icon: 'Bot',
    tier: 'LEGENDARY',
    category: 'UTILITY',
    statBoost: 'Orbital Autonomous Sentry Companion',
    apply: (p: PlayerState) => {
      p.hasDrone = true;
      p.droneDamage += 25;
    }
  },
  {
    id: 'zero_day_exploit',
    name: 'Zero-Day Chain Exploit',
    subtitle: 'Cascade privilege escalation',
    description: 'Critical hits trigger a chain lightning arc that leaps across up to 4 nearby corrupted processes.',
    icon: 'BugPlay',
    tier: 'LEGENDARY',
    category: 'OFFENSE',
    statBoost: '+20% Crit Chance, Chain Lightning on Hit',
    apply: (p: PlayerState) => {
      p.hasChainLightning = true;
      p.critChance += 0.20;
      p.critMultiplier += 0.5;
    }
  },
  {
    id: 'ebpf_kernel_probe',
    name: 'eBPF Kernel Telemetry Probe',
    subtitle: 'Real-time kernel hook instrumentation',
    description: 'Analyzing bug death signals grants +50% more XP memory crystals and boosts damage by 20%.',
    icon: 'Activity',
    tier: 'COMMON',
    category: 'UTILITY',
    statBoost: '+50% Crystal Yield, +20% Raw Damage',
    apply: (p: PlayerState) => {
      p.damageMultiplier *= 1.2;
    }
  },
  {
    id: 'k8s_autoscaler',
    name: 'Kubernetes Pod Auto-Scaler',
    subtitle: 'Horizontal pod elasticity',
    description: 'Whenever your shield breaks, triggers an emergency Git Rollback dash and restores 30% shield instantly.',
    icon: 'Layers',
    tier: 'EPIC',
    category: 'DEFENSE',
    statBoost: 'Emergency Shield Auto-Regen & Dash',
    apply: (p: PlayerState) => {
      p.maxHp += 30;
      p.hp = Math.min(p.maxHp, p.hp + 30);
    }
  }
];

export function getRandomUpgrades(count: number = 3, existingUpgrades: string[] = []): TechUpgrade[] {
  // Filter out unique upgrades like Copilot if already owned
  const available = TECH_UPGRADES.filter(u => {
    if (u.id === 'copilot_neural_drone' && existingUpgrades.includes(u.id)) {
      return false;
    }
    return true;
  });

  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
