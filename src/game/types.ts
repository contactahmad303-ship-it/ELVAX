export type GameMode = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_UP';

export type EnemyType =
  | 'MEMORY_LEAK'       // Bloated slime, splits on death, caustic hazard
  | 'ZOMBIE_THREAD'     // Fast charger, direct laser line
  | 'DDOS_SWARM'        // Agile swarmer, fires packets
  | 'NULL_POINTER'      // Teleporting diamond, phasing beam
  | 'MONOLITH_BOSS'     // Giant Legacy Server Boss
  | 'AGI_SINGULARITY';  // Rogue AGI Boss

export interface TechUpgrade {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: 'OFFENSE' | 'DEFENSE' | 'SYSTEM' | 'UTILITY';
  statBoost: string;
  apply: (player: PlayerState) => void;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  attackSpeedMultiplier: number;
  damageMultiplier: number;
  bulletCount: number;
  bulletPierce: number;
  bulletSpeed: number;
  critChance: number;
  critMultiplier: number;
  shieldRegenRate: number;
  energyRegenRate: number;
  gcDamage: number;
  gcRadius: number;
  hasDrone: boolean;
  droneDamage: number;
  hasChainLightning: boolean;
  hasExplodingBullets: boolean;
  invincibleTimer: number;

  // Abilities cooldowns & timers
  dashTimer: number;
  dashCooldown: number;
  gcCooldownTimer: number;
  gcCooldownMax: number;
  overclockActiveTimer: number;
  overclockDuration: number;
  overclockCooldownTimer: number;
  overclockCooldownMax: number;

  // Progression
  score: number;
  highScore: number;
  multiplier: number;
  multiplierTimer: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  bugsSquashed: number;
  ramCrystalsCollected: number;
  upgrades: string[];
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  z: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  scoreValue: number;
  meshGroup: any; // THREE.Group
  telegraphTimer: number;
  attackCooldown: number;
  phase?: number;
  phaseTimer?: number;
  chargeDirection?: { x: number; z: number };
  hitFlashTimer: number;
}

export interface ProjectileEntity {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  isCrit: boolean;
  isPlayer: boolean;
  pierce: number;
  range: number;
  traveled: number;
  radius: number;
  color: number;
  mesh: any;
  hasExploded?: boolean;
}

export interface ParticleEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  mesh: any;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface DevRank {
  title: string;
  minScore: number;
  badge: string;
  color: string;
}

export const DEV_RANKS: DevRank[] = [
  { title: 'JUNIOR SCRIPT KIDDIE', minScore: 0, badge: 'v0.1-alpha', color: '#94a3b8' },
  { title: 'CODE REVIEW SURVIVOR', minScore: 5000, badge: 'v0.9-beta', color: '#38bdf8' },
  { title: 'FULLSTACK REFACTORER', minScore: 15000, badge: 'v1.0-lts', color: '#34d399' },
  { title: 'STAFF INFRA ARCHITECT', minScore: 35000, badge: 'v2.4-k8s', color: '#fbbf24' },
  { title: 'KERNEL ZERO-DAY HACKER', minScore: 75000, badge: 'v3.0-root', color: '#f43f5e' },
  { title: 'DISTINGUISHED FELLOW', minScore: 150000, badge: 'v4.0-god', color: '#c084fc' },
  { title: 'TURING AWARD LEGEND', minScore: 300000, badge: 'v5.0-singularity', color: '#e879f9' }
];

export interface LiveMetrics {
  fps: number;
  latencyNs: number;
  activeThreads: number;
  allocatedMemoryMb: number;
  cpuLoadPercent: number;
  gitCommitHash: string;
}
