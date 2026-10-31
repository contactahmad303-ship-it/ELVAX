import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundSynth } from '../audio/SoundSynth';
import {
  GameMode,
  PlayerState,
  EnemyEntity,
  ProjectileEntity,
  ParticleEntity,
  FloatingText,
  LiveMetrics,
  EnemyType,
} from './types';
import { ModelFactory } from './ProceduralModels';
import { getRandomUpgrades } from './TechUpgrades';

// Preallocated math helpers to ensure ZERO GC in hot render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _raycaster = new THREE.Raycaster();
const _mouseNdc = new THREE.Vector2();

export class GameEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Game Mode
  public mode: GameMode = 'TITLE';
  public isGodMode: boolean = false;
  public isMatrixMode: boolean = false;
  public wave: number = 1;
  public waveTimer: number = 0;
  public enemiesRemainingInWave: number = 12;

  // Player State
  public player: PlayerState = {
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    energy: 100,
    maxEnergy: 100,
    speed: 16.0,
    attackSpeedMultiplier: 1.0,
    damageMultiplier: 1.0,
    bulletCount: 1,
    bulletPierce: 1,
    bulletSpeed: 38.0,
    critChance: 0.15,
    critMultiplier: 2.0,
    shieldRegenRate: 12.0,
    energyRegenRate: 15.0,
    gcDamage: 120,
    gcRadius: 18.0,
    hasDrone: false,
    droneDamage: 25,
    hasChainLightning: false,
    hasExplodingBullets: false,
    invincibleTimer: 0,

    dashTimer: 0,
    dashCooldown: 1.5,
    gcCooldownTimer: 0,
    gcCooldownMax: 8.0,
    overclockActiveTimer: 0,
    overclockDuration: 6.0,
    overclockCooldownTimer: 0,
    overclockCooldownMax: 15.0,

    score: 0,
    highScore: 0,
    multiplier: 1.0,
    multiplierTimer: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    bugsSquashed: 0,
    ramCrystalsCollected: 0,
    upgrades: [],
  };

  // Scene entities
  private playerMesh!: THREE.Group;
  private droneMesh: THREE.Group | null = null;
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelocity = new THREE.Vector3(0, 0, 0);
  private targetAimPoint = new THREE.Vector3(0, 0, 0);

  private enemies: EnemyEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private crystals: { id: number; mesh: THREE.Group; x: number; z: number; xp: number }[] = [];
  public floatingTexts: FloatingText[] = [];

  // Active Boss
  public activeBoss: EnemyEntity | null = null;

  // Pools
  private projectileIdCounter = 0;
  private enemyIdCounter = 0;
  private crystalIdCounter = 0;
  private textIdCounter = 0;

  // Input State
  private keysHeld = new Set<string>();
  private keysJustPressed = new Set<string>();
  private isMouseDown = false;
  private lastShootTime = 0;
  private lastDroneShootTime = 0;

  // Camera Shake & Hitstop
  private trauma = 0;
  private hitstopTimer = 0;
  private cameraBaseOffset = new THREE.Vector3(0, 28, 22);

  // Performance telemetry
  public metrics: LiveMetrics = {
    fps: 60,
    latencyNs: 240,
    activeThreads: 8,
    allocatedMemoryMb: 64,
    cpuLoadPercent: 12,
    gitCommitHash: 'git-0x' + Math.random().toString(16).substring(2, 8),
  };
  private fpsFrames = 0;
  private fpsTimer = 0;

  // Callbacks to React HUD
  public onStateUpdate?: (player: PlayerState, metrics: LiveMetrics, boss: EnemyEntity | null) => void;
  public onLevelUpPrompt?: (upgrades: any[]) => void;
  public onGameOverPrompt?: (finalState: PlayerState) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    try {
      this.player.highScore = parseInt(localStorage.getItem('kernel_highscore') || '0', 10);
    } catch {
      this.player.highScore = 0;
    }
    this.initThree();
    this.initInputs();
  }

  private initThree() {
    // Detect software WebGL guard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Modern WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x030712, 0.015);

    // Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    this.camera.position.copy(this.cameraBaseOffset);
    this.camera.lookAt(0, 0, 0);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced 3-point Studio Lighting (<= 3 shadow casters)
    // 1. Key Directional Light (Warm Cyan)
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(25, 45, 20);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 120;
    const d = 35;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // 2. Cool Sky/Ground Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x06b6d4, 0x1e1b4b, 1.2);
    this.scene.add(hemiLight);

    // 3. Rim/Backlight (Deep Magenta)
    const rimLight = new THREE.DirectionalLight(0xec4899, 1.5);
    rimLight.position.set(-20, 25, -25);
    this.scene.add(rimLight);

    // Arena Floor & Monolith Pillars
    const { arenaGroup } = ModelFactory.createArenaEnvironment();
    this.scene.add(arenaGroup);

    // Player Hero Model
    this.playerMesh = ModelFactory.createPlayerShip();
    this.scene.add(this.playerMesh);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Window resize handler
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initInputs() {
    window.addEventListener('keydown', (e) => {
      // Ignore inputs if target is an input field
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const code = e.code;
      if (!this.keysHeld.has(code)) {
        this.keysJustPressed.add(code);
      }
      this.keysHeld.add(code);

      // Dash on Space or KeyF
      if (code === 'Space' || code === 'KeyF') {
        if (this.mode === 'PLAYING') {
          this.triggerDash();
        }
      }

      // Garbage Collect on KeyQ
      if (code === 'KeyQ') {
        if (this.mode === 'PLAYING') {
          this.triggerGarbageCollection();
        }
      }

      // Overclock on KeyE or ShiftLeft
      if (code === 'KeyE' || code === 'ShiftLeft') {
        if (this.mode === 'PLAYING') {
          this.triggerOverclock();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld.delete(e.code);
    });

    // Clear held keys on blur to prevent phantom stuck controls
    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.keysJustPressed.clear();
      this.isMouseDown = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDestroyed || !this.renderer) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Project ray to ground plane Y=0
      _raycaster.setFromCamera(_mouseNdc, this.camera);
      _raycaster.ray.intersectPlane(_groundPlane, this.targetAimPoint);
    });

    window.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'BUTTON' || (e.target as HTMLElement)?.closest('button')) {
        return;
      }
      if (e.button === 0) {
        this.isMouseDown = true;
      } else if (e.button === 2) {
        // Right Click: Alternate trigger for Garbage Collection
        e.preventDefault();
        if (this.mode === 'PLAYING') {
          this.triggerGarbageCollection();
        }
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  // --- Public State Controls ---

  public startGame() {
    this.mode = 'PLAYING';
    soundSynth.startBGM();
    this.resetGame();
  }

  public resetGame() {
    this.player.hp = this.player.maxHp;
    this.player.shield = this.player.maxShield;
    this.player.energy = this.player.maxEnergy;
    this.player.score = 0;
    this.player.multiplier = 1.0;
    this.player.level = 1;
    this.player.xp = 0;
    this.player.xpToNextLevel = 100;
    this.player.bugsSquashed = 0;
    this.player.ramCrystalsCollected = 0;
    this.player.upgrades = [];
    this.player.bulletCount = 1;
    this.player.bulletPierce = 1;
    this.player.bulletSpeed = 38.0;
    this.player.damageMultiplier = 1.0;
    this.player.attackSpeedMultiplier = 1.0;
    this.player.speed = 16.0;
    this.player.hasDrone = false;
    this.player.hasChainLightning = false;
    this.player.hasExplodingBullets = false;

    this.playerPos.set(0, 0, 0);
    this.playerVelocity.set(0, 0, 0);

    // Clear existing entities
    this.enemies.forEach(e => this.scene.remove(e.meshGroup));
    this.enemies = [];

    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];

    this.crystals.forEach(c => this.scene.remove(c.mesh));
    this.crystals = [];

    if (this.droneMesh) {
      this.scene.remove(this.droneMesh);
      this.droneMesh = null;
    }

    this.activeBoss = null;
    this.wave = 1;
    this.waveTimer = 0;
    this.enemiesRemainingInWave = 14;

    this.spawnInitialWave();
  }

  public pauseGame() {
    if (this.mode === 'PLAYING') {
      this.mode = 'PAUSED';
      soundSynth.stopBGM();
    }
  }

  public resumeGame() {
    if (this.mode === 'PAUSED') {
      this.mode = 'PLAYING';
      soundSynth.startBGM();
    }
  }

  public applyUpgrade(upgrade: any) {
    upgrade.apply(this.player);
    this.player.upgrades.push(upgrade.id);
    soundSynth.playLevelUp();

    // Check if drone was just acquired
    if (this.player.hasDrone && !this.droneMesh) {
      this.droneMesh = ModelFactory.createCopilotDrone();
      this.scene.add(this.droneMesh);
    }

    this.mode = 'PLAYING';
    soundSynth.startBGM();
  }

  // --- Ability Triggers ---

  public triggerDash() {
    if (this.player.dashTimer > 0) return;
    this.player.dashTimer = this.player.dashCooldown;
    this.player.invincibleTimer = 0.35;
    soundSynth.playDash();

    // Impulse in current movement direction or forward
    const dashDir = this.playerVelocity.lengthSq() > 0.1
      ? _vec3A.copy(this.playerVelocity).normalize()
      : _vec3A.set(0, 0, -1).applyEuler(this.playerMesh.rotation);

    this.playerVelocity.addScaledVector(dashDir, 28);
    this.addCameraShake(0.3);

    // Particle dash trail
    for (let i = 0; i < 18; i++) {
      this.spawnParticle(
        this.playerPos.x + (Math.random() - 0.5) * 1.5,
        0.5,
        this.playerPos.z + (Math.random() - 0.5) * 1.5,
        -dashDir.x * (4 + Math.random() * 8),
        Math.random() * 3,
        -dashDir.z * (4 + Math.random() * 8),
        0x06b6d4,
        0.4,
        0.18
      );
    }
  }

  public triggerGarbageCollection() {
    if (this.player.gcCooldownTimer > 0 || this.player.energy < 30) return;
    this.player.energy = Math.max(0, this.player.energy - 30);
    this.player.gcCooldownTimer = this.player.gcCooldownMax;
    soundSynth.playGarbageCollect();

    this.hitstopTimer = 0.06; // 60ms hitstop impact
    this.addCameraShake(0.65);

    // Shockwave ring expansion & destroy bullets + damage bugs in radius
    const radius = this.player.gcRadius;
    const dmg = this.player.gcDamage * this.player.damageMultiplier;

    // Destroy enemy bullets
    this.projectiles = this.projectiles.filter(p => {
      if (!p.isPlayer) {
        const dist = Math.hypot(p.x - this.playerPos.x, p.z - this.playerPos.z);
        if (dist <= radius) {
          this.scene.remove(p.mesh);
          return false;
        }
      }
      return true;
    });

    // Damage enemies
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z);
      if (dist <= radius) {
        this.damageEnemy(e, dmg, true);
        // Knockback
        const kbDir = _vec3A.set(e.x - this.playerPos.x, 0, e.z - this.playerPos.z).normalize();
        e.vx += kbDir.x * 20;
        e.vz += kbDir.z * 20;
      }
    });

    // Particle shockwave circle
    for (let i = 0; i < 48; i++) {
      const ang = (i * Math.PI * 2) / 48;
      this.spawnParticle(
        this.playerPos.x,
        0.4,
        this.playerPos.z,
        Math.cos(ang) * 26,
        0.5,
        Math.sin(ang) * 26,
        0x06b6d4,
        0.5,
        0.28
      );
    }
  }

  public triggerOverclock() {
    if (this.player.overclockCooldownTimer > 0 || this.player.energy < 50) return;
    this.player.energy = Math.max(0, this.player.energy - 50);
    this.player.overclockActiveTimer = this.player.overclockDuration;
    this.player.overclockCooldownTimer = this.player.overclockCooldownMax;
    soundSynth.setOverclock(true);
    soundSynth.playOverclock();
    this.addCameraShake(0.4);

    this.addFloatingText(this.playerPos.x, 2.5, this.playerPos.z, 'OVERCLOCK ACTIVATED!', '#38bdf8');
  }

  // --- Spawning System ---

  private spawnInitialWave() {
    const count = 8 + this.wave * 3;
    for (let i = 0; i < count; i++) {
      this.spawnRandomEnemy();
    }
  }

  public spawnEnemy(type: EnemyType, x?: number, z?: number): EnemyEntity {
    // Generate position on boundary circle
    if (x === undefined || z === undefined) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 32 + Math.random() * 10;
      x = this.playerPos.x + Math.cos(angle) * dist;
      z = this.playerPos.z + Math.sin(angle) * dist;
      // Clamp to arena perimeter (R=42)
      const d = Math.hypot(x, z);
      if (d > 42) {
        x = (x / d) * 40;
        z = (z / d) * 40;
      }
    }

    let meshGroup: THREE.Group;
    let hp = 40;
    let speed = 7.0;
    let radius = 1.0;
    let damage = 12;
    let scoreValue = 250;

    switch (type) {
      case 'MEMORY_LEAK':
        meshGroup = ModelFactory.createMemoryLeakModel();
        hp = 60 + this.wave * 12;
        speed = 5.5 + Math.random() * 2;
        radius = 1.2;
        damage = 14;
        scoreValue = 300;
        break;

      case 'ZOMBIE_THREAD':
        meshGroup = ModelFactory.createZombieThreadModel();
        hp = 35 + this.wave * 8;
        speed = 9.5;
        radius = 0.9;
        damage = 18;
        scoreValue = 350;
        break;

      case 'DDOS_SWARM':
        meshGroup = ModelFactory.createDDoSDroneModel();
        hp = 28 + this.wave * 6;
        speed = 8.5;
        radius = 0.8;
        damage = 10;
        scoreValue = 280;
        break;

      case 'NULL_POINTER':
        meshGroup = ModelFactory.createNullPointerModel();
        hp = 50 + this.wave * 10;
        speed = 6.0;
        radius = 1.1;
        damage = 22;
        scoreValue = 500;
        break;

      case 'MONOLITH_BOSS':
        meshGroup = ModelFactory.createMonolithBossModel();
        hp = 1600 + this.wave * 400;
        speed = 2.8;
        radius = 3.6;
        damage = 35;
        scoreValue = 10000;
        break;

      case 'AGI_SINGULARITY':
        meshGroup = ModelFactory.createAGISingularityModel();
        hp = 3000 + this.wave * 600;
        speed = 3.4;
        radius = 4.2;
        damage = 45;
        scoreValue = 25000;
        break;
    }

    meshGroup.position.set(x, 0, z);
    this.scene.add(meshGroup);

    const enemy: EnemyEntity = {
      id: this.enemyIdCounter++,
      type,
      x,
      z,
      vx: 0,
      vz: 0,
      hp,
      maxHp: hp,
      speed,
      radius,
      damage,
      scoreValue,
      meshGroup,
      telegraphTimer: 0,
      attackCooldown: 1.0 + Math.random() * 2,
      hitFlashTimer: 0,
    };

    if (type === 'MONOLITH_BOSS' || type === 'AGI_SINGULARITY') {
      this.activeBoss = enemy;
      soundSynth.playBossAlarm();
      this.addCameraShake(0.5);
    }

    this.enemies.push(enemy);
    return enemy;
  }

  private spawnRandomEnemy() {
    const types: EnemyType[] = ['MEMORY_LEAK', 'ZOMBIE_THREAD'];
    if (this.wave >= 2) types.push('DDOS_SWARM');
    if (this.wave >= 4) types.push('NULL_POINTER');

    const chosen = types[Math.floor(Math.random() * types.length)];
    this.spawnEnemy(chosen);
  }

  // --- Projectile System ---

  public shootPlayerBullet() {
    const now = performance.now();
    const isOverclock = this.player.overclockActiveTimer > 0;
    const fireInterval = isOverclock ? 110 : 200 / this.player.attackSpeedMultiplier;

    if (now - this.lastShootTime < fireInterval) return;
    this.lastShootTime = now;

    soundSynth.playShoot();

    // Aim direction from player pos to targetAimPoint
    _vec3A.set(this.targetAimPoint.x - this.playerPos.x, 0, this.targetAimPoint.z - this.playerPos.z).normalize();
    if (_vec3A.lengthSq() < 0.01) _vec3A.set(0, 0, -1);

    const baseAngle = Math.atan2(_vec3A.x, _vec3A.z);
    const count = this.player.bulletCount;
    const spread = 0.16; // radians
    const startAngle = baseAngle - ((count - 1) * spread) / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spread;
      const dirX = Math.sin(angle);
      const dirZ = Math.cos(angle);

      // Procedural glowing bolt geometry
      const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
      boltGeo.rotateX(Math.PI / 2);
      const boltMat = isOverclock ? ModelFactory.matMagentaGlow : ModelFactory.matCyanGlow;
      const mesh = new THREE.Mesh(boltGeo, boltMat);

      mesh.position.set(this.playerPos.x + dirX * 1.2, 0.45, this.playerPos.z + dirZ * 1.2);
      mesh.rotation.y = angle;
      this.scene.add(mesh);

      const isCrit = Math.random() < this.player.critChance;
      const damage = 22 * this.player.damageMultiplier * (isCrit ? this.player.critMultiplier : 1.0);

      this.projectiles.push({
        id: this.projectileIdCounter++,
        x: mesh.position.x,
        z: mesh.position.z,
        vx: dirX * this.player.bulletSpeed,
        vz: dirZ * this.player.bulletSpeed,
        damage,
        isCrit,
        isPlayer: true,
        pierce: this.player.bulletPierce,
        range: 45,
        traveled: 0,
        radius: 0.35,
        color: isOverclock ? 0xec4899 : 0x06b6d4,
        mesh,
      });
    }

    // Small recoil
    this.playerVelocity.x -= _vec3A.x * 2.5;
    this.playerVelocity.z -= _vec3A.z * 2.5;
  }

  private shootEnemyBullet(x: number, z: number, dirX: number, dirZ: number, damage: number, speed: number = 18) {
    const geo = new THREE.SphereGeometry(0.22, 8, 8);
    const mat = ModelFactory.matRedGlow;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.5, z);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.projectileIdCounter++,
      x,
      z,
      vx: dirX * speed,
      vz: dirZ * speed,
      damage,
      isCrit: false,
      isPlayer: false,
      pierce: 1,
      range: 40,
      traveled: 0,
      radius: 0.28,
      color: 0xef4444,
      mesh,
    });
  }

  // --- Particles & FX ---

  public spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    color: number,
    maxLife: number = 0.4,
    size: number = 0.2
  ) {
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.particles.push({
      x,
      y,
      z,
      vx,
      vy,
      vz,
      life: maxLife,
      maxLife,
      size,
      color,
      mesh,
    });
  }

  public addCameraShake(intensity: number) {
    this.trauma = Math.min(1.0, this.trauma + intensity);
  }

  public addFloatingText(x: number, y: number, z: number, text: string, color: string = '#f8fafc') {
    this.floatingTexts.push({
      id: this.textIdCounter++,
      x,
      y,
      z,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      vy: 2.2,
    });
  }

  // --- Combat Resolution ---

  private damageEnemy(enemy: EnemyEntity, damage: number, isCrit: boolean = false) {
    enemy.hp -= damage;
    enemy.hitFlashTimer = 0.12;
    soundSynth.playHit(isCrit);

    // Format damage as tech hex or byte readout (developers love this!)
    const hexTag = isCrit ? `0x${Math.floor(damage).toString(16).toUpperCase()} [CRIT!]` : `${Math.floor(damage)}B`;
    this.addFloatingText(enemy.x, 1.8, enemy.z, hexTag, isCrit ? '#f43f5e' : '#38bdf8');

    // Particle blood / sparks
    for (let i = 0; i < (isCrit ? 10 : 4); i++) {
      this.spawnParticle(
        enemy.x,
        0.8,
        enemy.z,
        (Math.random() - 0.5) * 8,
        Math.random() * 6,
        (Math.random() - 0.5) * 8,
        isCrit ? 0xec4899 : 0x06b6d4,
        0.35,
        0.18
      );
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: EnemyEntity) {
    this.scene.remove(enemy.meshGroup);
    this.enemies = this.enemies.filter(e => e.id !== enemy.id);

    this.player.bugsSquashed++;
    const pts = enemy.scoreValue * this.player.multiplier;
    this.player.score += pts;

    // Multiplier combo boost
    this.player.multiplier = Math.min(10.0, this.player.multiplier + 0.15);
    this.player.multiplierTimer = 4.0;

    // Hitstop on elite or boss death
    if (enemy.type === 'MONOLITH_BOSS' || enemy.type === 'AGI_SINGULARITY') {
      this.hitstopTimer = 0.09;
      this.addCameraShake(0.8);
      this.activeBoss = null;
      this.addFloatingText(enemy.x, 3.0, enemy.z, 'CORE SYSTEM REFACTORED!', '#10b981');
    }

    // Split Memory Leak into 2 small leaks
    if (enemy.type === 'MEMORY_LEAK' && enemy.maxHp >= 60) {
      for (let i = 0; i < 2; i++) {
        const mini = this.spawnEnemy('MEMORY_LEAK', enemy.x + (i === 0 ? 1.5 : -1.5), enemy.z);
        mini.hp = 25;
        mini.maxHp = 25;
        mini.meshGroup.scale.set(0.65, 0.65, 0.65);
        mini.radius = 0.7;
      }
    }

    // Drop RAM Crystals (XP)
    const crystalCount = enemy.type === 'MONOLITH_BOSS' ? 12 : enemy.type === 'AGI_SINGULARITY' ? 20 : 2;
    for (let i = 0; i < crystalCount; i++) {
      this.spawnRamCrystal(
        enemy.x + (Math.random() - 0.5) * 2,
        enemy.z + (Math.random() - 0.5) * 2,
        15 + this.wave * 2
      );
    }

    // Big explosion particle burst
    for (let i = 0; i < 22; i++) {
      this.spawnParticle(
        enemy.x,
        1.0,
        enemy.z,
        (Math.random() - 0.5) * 16,
        Math.random() * 8,
        (Math.random() - 0.5) * 16,
        0x9333ea,
        0.5,
        0.25
      );
    }
  }

  private spawnRamCrystal(x: number, z: number, xp: number) {
    const mesh = ModelFactory.createRamCrystalModel();
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    this.crystals.push({
      id: this.crystalIdCounter++,
      mesh,
      x,
      z,
      xp,
    });
  }

  private damagePlayer(amount: number) {
    if (this.isGodMode || this.player.invincibleTimer > 0) return;

    soundSynth.playPlayerHit();
    this.addCameraShake(0.45);
    this.player.invincibleTimer = 0.5;

    // Shield absorbs first
    if (this.player.shield > 0) {
      if (this.player.shield >= amount) {
        this.player.shield -= amount;
        amount = 0;
      } else {
        amount -= this.player.shield;
        this.player.shield = 0;
      }
    }

    if (amount > 0) {
      this.player.hp -= amount;
      this.addFloatingText(this.playerPos.x, 2.2, this.playerPos.z, `-${Math.round(amount)} HP`, '#ef4444');
    }

    // Reset combo multiplier on taking hit
    this.player.multiplier = 1.0;

    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.player.hp = 0;
    this.mode = 'GAMEOVER';
    soundSynth.stopBGM();
    soundSynth.playGameOver();
    this.addCameraShake(0.9);

    if (this.player.score > this.player.highScore) {
      this.player.highScore = this.player.score;
      try {
        localStorage.setItem('kernel_highscore', String(this.player.highScore));
      } catch {
        // ignore
      }
    }

    if (this.onGameOverPrompt) {
      this.onGameOverPrompt(this.player);
    }
  }

  private collectCrystal(crystal: { id: number; mesh: THREE.Group; x: number; z: number; xp: number }) {
    this.scene.remove(crystal.mesh);
    this.crystals = this.crystals.filter(c => c.id !== crystal.id);
    this.player.ramCrystalsCollected++;
    this.player.xp += crystal.xp;
    soundSynth.playPickup();

    if (this.player.xp >= this.player.xpToNextLevel) {
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp() {
    this.player.level++;
    this.player.xp -= this.player.xpToNextLevel;
    this.player.xpToNextLevel = Math.floor(this.player.xpToNextLevel * 1.4);
    soundSynth.playLevelUp();

    // Pause game and present 3 tech upgrades
    this.mode = 'LEVEL_UP';
    soundSynth.stopBGM();

    const upgrades = getRandomUpgrades(3, this.player.upgrades);
    if (this.onLevelUpPrompt) {
      this.onLevelUpPrompt(upgrades);
    }
  }

  // --- Developer Terminal CLI execution ---

  public executeCommand(rawCmd: string): string {
    const cmd = rawCmd.trim().toLowerCase();
    const parts = cmd.split(' ');
    const main = parts[0];
    const arg = parts[1];

    switch (main) {
      case 'help':
        return `AVAILABLE ROOT COMMANDS:
- status : Displays kernel load, threads, memory, and player stats
- overclock : Instant 100% energy + max overclock frenzy
- nuke : Runs generational garbage collection on all active bugs
- spawn [leak|thread|drone|null|monolith|agi] : Spawns specific enemy
- godmode : Toggles invulnerability
- matrix : Toggles green phosphor terminal matrix visual shader
- fps : Shows current render loop performance metrics
- heal : Fully restores HP and Shield
- level : Awards free level-up and triggers Tech Stack upgrade
- clear : Clears console output`;

      case 'status':
        return `[KERNEL STATUS REPORT]
State: ${this.mode} | Wave: ${this.wave} | Active Bugs: ${this.enemies.length}
Player HP: ${Math.round(this.player.hp)}/${this.player.maxHp} | Shield: ${Math.round(this.player.shield)}/${this.player.maxShield}
Score: ${this.player.score.toLocaleString()} OPS | Multiplier: x${this.player.multiplier.toFixed(1)}
Active Threads: ${this.metrics.activeThreads} | Memory Alloc: ${this.metrics.allocatedMemoryMb}MB
Git Revision: ${this.metrics.gitCommitHash}`;

      case 'overclock':
        this.player.energy = this.player.maxEnergy;
        this.player.overclockCooldownTimer = 0;
        this.triggerOverclock();
        return 'SUCCESS: Kernel clock multiplier uncapped! Turbo thermal limits bypassed.';

      case 'nuke':
        this.triggerGarbageCollection();
        return 'SUCCESS: Full memory sweep initiated. Corrupted threads purged.';

      case 'godmode':
        this.isGodMode = !this.isGodMode;
        return `GODMODE: ${this.isGodMode ? 'ENABLED (Root Invincibility)' : 'DISABLED'}`;

      case 'matrix':
        this.isMatrixMode = !this.isMatrixMode;
        if (this.isMatrixMode) {
          this.scene.background = new THREE.Color(0x011a0c);
          this.scene.fog = new THREE.FogExp2(0x011a0c, 0.02);
        } else {
          this.scene.background = new THREE.Color(0x030712);
          this.scene.fog = new THREE.FogExp2(0x030712, 0.015);
        }
        return `MATRIX PHOSPHOR THEME: ${this.isMatrixMode ? 'ONLINE' : 'OFFLINE'}`;

      case 'heal':
        this.player.hp = this.player.maxHp;
        this.player.shield = this.player.maxShield;
        return 'SUCCESS: System buffers flushed and health fully restored.';

      case 'level':
        this.triggerLevelUp();
        return 'SUCCESS: Level up injected.';

      case 'spawn':
        if (!arg) return 'ERROR: Specify enemy type: leak, thread, drone, null, monolith, agi';
        if (arg === 'leak') this.spawnEnemy('MEMORY_LEAK');
        else if (arg === 'thread') this.spawnEnemy('ZOMBIE_THREAD');
        else if (arg === 'drone') this.spawnEnemy('DDOS_SWARM');
        else if (arg === 'null') this.spawnEnemy('NULL_POINTER');
        else if (arg === 'monolith') this.spawnEnemy('MONOLITH_BOSS');
        else if (arg === 'agi') this.spawnEnemy('AGI_SINGULARITY');
        else return `Unknown enemy type: ${arg}`;
        return `SUCCESS: Spawned entity ${arg}.`;

      case 'fps':
        return `FPS: ${this.metrics.fps} | Latency: ${this.metrics.latencyNs}ns | SoftwareGL: ${this.isSoftwareGl}`;

      default:
        return `Command not recognized: '${rawCmd}'. Type 'help' for command directory.`;
    }
  }

  // --- Main Game Loop (60fps simulation) ---

  public startLoop() {
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (this.isDestroyed) return;

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      // Clamp frame delta time as required by game guidelines
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(() => tick(performance.now()));
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(() => tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number) {
    // Profiling calculation
    this.fpsFrames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.metrics.fps = Math.round((this.fpsFrames / this.fpsTimer));
      this.metrics.latencyNs = Math.round(1000000 / Math.max(1, this.metrics.fps));
      this.metrics.activeThreads = 8 + this.enemies.length;
      this.metrics.allocatedMemoryMb = Math.round(64 + this.player.score / 5000 + this.enemies.length * 2);
      this.metrics.cpuLoadPercent = Math.min(99, Math.round(15 + this.enemies.length * 2.5));
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }

    // Hitstop freeze frame handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Title screen idle rotation
    if (this.mode === 'TITLE') {
      const t = performance.now() * 0.0005;
      this.camera.position.x = Math.sin(t) * 32;
      this.camera.position.z = Math.cos(t) * 32;
      this.camera.position.y = 24 + Math.sin(t * 1.5) * 4;
      this.camera.lookAt(0, 0, 0);

      if (this.playerMesh) {
        this.playerMesh.rotation.y = t * 1.5;
        this.playerMesh.position.y = 0.5 + Math.sin(t * 3) * 0.2;
      }
      return;
    }

    if (this.mode !== 'PLAYING') {
      return;
    }

    // Update Player cooldowns & timers
    if (this.player.dashTimer > 0) this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    if (this.player.gcCooldownTimer > 0) this.player.gcCooldownTimer = Math.max(0, this.player.gcCooldownTimer - dt);
    if (this.player.overclockCooldownTimer > 0) this.player.overclockCooldownTimer = Math.max(0, this.player.overclockCooldownTimer - dt);
    if (this.player.invincibleTimer > 0) this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - dt);

    if (this.player.overclockActiveTimer > 0) {
      this.player.overclockActiveTimer -= dt;
      if (this.player.overclockActiveTimer <= 0) {
        soundSynth.setOverclock(false);
      }
    }

    // Regenerate Shield & Energy
    if (this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + this.player.shieldRegenRate * dt);
    }
    if (this.player.energy < this.player.maxEnergy) {
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + this.player.energyRegenRate * dt);
    }

    // Multiplier decay
    if (this.player.multiplierTimer > 0) {
      this.player.multiplierTimer -= dt;
      if (this.player.multiplierTimer <= 0) {
        this.player.multiplier = Math.max(1.0, this.player.multiplier - 0.5);
        this.player.multiplierTimer = 1.0;
      }
    }

    // 1. Player Movement & Physics
    let moveX = 0;
    let moveZ = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) moveZ -= 1;
    if (this.keysHeld.has('KeyS') || this.arrowDown()) moveZ += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) moveX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) moveX += 1;

    const moveMag = Math.hypot(moveX, moveZ);
    if (moveMag > 0) {
      moveX /= moveMag;
      moveZ /= moveMag;
      const speed = this.player.speed * (this.player.overclockActiveTimer > 0 ? 1.4 : 1.0);
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, moveX * speed, 12, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, moveZ * speed, 12, dt);
    } else {
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 10, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 10, dt);
    }

    this.playerPos.x += this.playerVelocity.x * dt;
    this.playerPos.z += this.playerVelocity.z * dt;

    // Arena boundary containment (R=42)
    const pDist = Math.hypot(this.playerPos.x, this.playerPos.z);
    if (pDist > 42) {
      this.playerPos.x = (this.playerPos.x / pDist) * 42;
      this.playerPos.z = (this.playerPos.z / pDist) * 42;
      this.playerVelocity.set(0, 0, 0);
    }

    this.playerMesh.position.set(this.playerPos.x, 0.45, this.playerPos.z);

    // Aim player toward targetAimPoint
    _vec3A.set(this.targetAimPoint.x - this.playerPos.x, 0, this.targetAimPoint.z - this.playerPos.z);
    if (_vec3A.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(_vec3A.x, _vec3A.z);
      this.playerMesh.rotation.y = THREE.MathUtils.damp(this.playerMesh.rotation.y, targetAngle, 18, dt);
    }

    // Auto-fire if mouse is held down
    if (this.isMouseDown) {
      this.shootPlayerBullet();
    }

    // 2. Copilot Drone Behavior
    if (this.player.hasDrone && this.droneMesh) {
      const droneTime = performance.now() * 0.003;
      const droneRadius = 3.2;
      this.droneMesh.position.set(
        this.playerPos.x + Math.cos(droneTime) * droneRadius,
        1.8 + Math.sin(droneTime * 2) * 0.3,
        this.playerPos.z + Math.sin(droneTime) * droneRadius
      );
      const ring = this.droneMesh.getObjectByName('droneRing');
      if (ring) ring.rotation.x += dt * 4;

      // Drone auto-attacks nearest enemy
      const now = performance.now();
      if (now - this.lastDroneShootTime > 350 && this.enemies.length > 0) {
        let nearestEnemy: EnemyEntity | null = null;
        let nearestDistSq = 400; // max 20m range
        for (const e of this.enemies) {
          const dSq = (e.x - this.playerPos.x) ** 2 + (e.z - this.playerPos.z) ** 2;
          if (dSq < nearestDistSq) {
            nearestDistSq = dSq;
            nearestEnemy = e;
          }
        }
        if (nearestEnemy) {
          this.lastDroneShootTime = now;
          this.damageEnemy(nearestEnemy, this.player.droneDamage, false);
          // Drone laser particle
          this.spawnParticle(
            this.droneMesh.position.x,
            this.droneMesh.position.y,
            this.droneMesh.position.z,
            (nearestEnemy.x - this.droneMesh.position.x) * 4,
            0.5,
            (nearestEnemy.z - this.droneMesh.position.z) * 4,
            0x10b981,
            0.15,
            0.12
          );
        }
      }
    }

    // 3. Enemies AI & Collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Hit flash visual recovery
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      const dx = this.playerPos.x - e.x;
      const dz = this.playerPos.z - e.z;
      const dist = Math.hypot(dx, dz);

      // Behavior per enemy type
      switch (e.type) {
        case 'MEMORY_LEAK': {
          // Slow pulsating chase
          if (dist > 0.1) {
            e.vx = (dx / dist) * e.speed;
            e.vz = (dz / dist) * e.speed;
          }
          const pulse = 1.0 + Math.sin(performance.now() * 0.006 + e.id) * 0.15;
          e.meshGroup.scale.set(pulse, pulse, pulse);
          break;
        }

        case 'ZOMBIE_THREAD': {
          // Charge attack when telegraph completes
          e.telegraphTimer += dt;
          if (e.telegraphTimer > 2.0) {
            // Initiate dash toward player
            e.vx = (dx / dist) * e.speed * 1.8;
            e.vz = (dz / dist) * e.speed * 1.8;
            if (e.telegraphTimer > 3.0) {
              e.telegraphTimer = 0;
            }
          } else {
            // Normal pursuit
            e.vx = (dx / dist) * e.speed * 0.6;
            e.vz = (dz / dist) * e.speed * 0.6;
          }
          break;
        }

        case 'DDOS_SWARM': {
          // Strafe in orbit at 12m and shoot packets
          const targetDist = 12.0;
          const radial = dist - targetDist;
          const tangentX = -dz / dist;
          const tangentZ = dx / dist;

          e.vx = (dx / dist) * (radial * 0.5) + tangentX * e.speed;
          e.vz = (dz / dist) * (radial * 0.5) + tangentZ * e.speed;

          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 2.2 + Math.random();
            this.shootEnemyBullet(e.x, e.z, dx / dist, dz / dist, e.damage, 20);
          }
          break;
        }

        case 'NULL_POINTER': {
          // Phasing teleportation & 3-way beam
          e.telegraphTimer += dt;
          const outer = e.meshGroup.getObjectByName('nullOuter');
          if (outer) outer.rotation.y += dt * 3;

          if (e.telegraphTimer > 4.5) {
            e.telegraphTimer = 0;
            // Teleport to a random position near player
            const teleAngle = Math.random() * Math.PI * 2;
            const teleDist = 10 + Math.random() * 6;
            e.x = this.playerPos.x + Math.cos(teleAngle) * teleDist;
            e.z = this.playerPos.z + Math.sin(teleAngle) * teleDist;

            // Fire 3-way laser packet burst
            for (let a = -0.3; a <= 0.3; a += 0.3) {
              const baseAng = Math.atan2(dx, dz) + a;
              this.shootEnemyBullet(e.x, e.z, Math.sin(baseAng), Math.cos(baseAng), e.damage, 22);
            }
          }
          break;
        }

        case 'MONOLITH_BOSS': {
          // Boss AI
          e.vx = (dx / dist) * e.speed;
          e.vz = (dz / dist) * e.speed;

          const ring = e.meshGroup.getObjectByName('bossRing');
          if (ring) ring.rotation.z += dt * 2.5;

          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 3.2;
            // Radial bullet hell ring
            const bulletCount = 14;
            for (let b = 0; b < bulletCount; b++) {
              const bAng = (b * Math.PI * 2) / bulletCount;
              this.shootEnemyBullet(e.x, e.z, Math.cos(bAng), Math.sin(bAng), 16, 14);
            }
          }
          break;
        }

        case 'AGI_SINGULARITY': {
          // AGI Singularity Boss AI
          e.vx = (dx / dist) * e.speed;
          e.vz = (dz / dist) * e.speed;

          const r1 = e.meshGroup.getObjectByName('agiRing1');
          const r2 = e.meshGroup.getObjectByName('agiRing2');
          const r3 = e.meshGroup.getObjectByName('agiRing3');
          if (r1) r1.rotation.x += dt * 3;
          if (r2) r2.rotation.y += dt * 2;
          if (r3) r3.rotation.z += dt * 2.5;

          // Gravitational pull toward boss
          if (dist < 22) {
            const pull = (22 - dist) * 0.4;
            this.playerVelocity.x -= (dx / dist) * pull * dt * 8;
            this.playerVelocity.z -= (dz / dist) * pull * dt * 8;
          }

          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 2.4;
            // Spiral barrage
            for (let s = 0; s < 8; s++) {
              const sAng = performance.now() * 0.004 + (s * Math.PI * 2) / 8;
              this.shootEnemyBullet(e.x, e.z, Math.cos(sAng), Math.sin(sAng), 20, 16);
            }
          }
          break;
        }
      }

      // Move enemy
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      e.meshGroup.position.set(e.x, 0, e.z);

      // Rotate enemy toward player
      e.meshGroup.rotation.y = Math.atan2(dx, dz);

      // Collision with player
      if (dist < e.radius + 1.1) {
        this.damagePlayer(e.damage);
        // Push enemy back
        e.x -= (dx / dist) * 2;
        e.z -= (dz / dist) * 2;
      }
    }

    // 4. Projectiles Update
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.traveled += Math.hypot(p.vx * dt, p.vz * dt);
      p.mesh.position.set(p.x, 0.45, p.z);

      // Exceeded range or arena boundaries
      if (p.traveled >= p.range || Math.hypot(p.x, p.z) > 46) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Player projectile vs enemies
      if (p.isPlayer) {
        let hit = false;
        for (const e of this.enemies) {
          const d = Math.hypot(p.x - e.x, p.z - e.z);
          if (d <= p.radius + e.radius) {
            this.damageEnemy(e, p.damage, p.isCrit);
            hit = true;
            p.pierce--;
            if (p.pierce <= 0) break;
          }
        }
        if (hit && p.pierce <= 0) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy projectile vs Player
        const d = Math.hypot(p.x - this.playerPos.x, p.z - this.playerPos.z);
        if (d <= p.radius + 1.0) {
          this.damagePlayer(p.damage);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }

    // 5. RAM Crystals Pickup Logic (Vacuum effect)
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      c.mesh.rotation.y += dt * 3;

      const d = Math.hypot(this.playerPos.x - c.x, this.playerPos.z - c.z);
      // Magnetic collection radius: 6m
      if (d < 6.0) {
        const pullSpeed = 16.0;
        c.x += ((this.playerPos.x - c.x) / d) * pullSpeed * dt;
        c.z += ((this.playerPos.z - c.z) / d) * pullSpeed * dt;
        c.mesh.position.set(c.x, 0.35, c.z);

        if (d < 1.2) {
          this.collectCrystal(c);
        }
      }
    }

    // 6. Particles Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= dt;
      if (part.life <= 0) {
        this.scene.remove(part.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.z += part.vz * dt;
      part.vy -= 9.8 * dt; // gravity

      if (part.y < 0.05) {
        part.y = 0.05;
        part.vy = -part.vy * 0.4; // ground bounce
      }

      part.mesh.position.set(part.x, part.y, part.z);
      const scale = (part.life / part.maxLife) * part.size;
      part.mesh.scale.set(scale, scale, scale);
    }

    // 7. Floating Combat Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 8. Wave Progression System
    this.waveTimer += dt;
    if (this.enemies.length === 0 && !this.activeBoss) {
      this.wave++;
      this.addFloatingText(this.playerPos.x, 3.2, this.playerPos.z, `DEPLOYING WAVE 0x0${this.wave}`, '#38bdf8');
      soundSynth.playLevelUp();

      // Raid boss encounters at Wave 5 (Miniboss), Wave 10 (Monolith), Wave 15 (AGI)
      if (this.wave === 10) {
        this.spawnEnemy('MONOLITH_BOSS');
      } else if (this.wave === 15) {
        this.spawnEnemy('AGI_SINGULARITY');
      } else {
        const count = 10 + this.wave * 4;
        for (let s = 0; s < count; s++) {
          this.spawnRandomEnemy();
        }
      }
    }

    // 9. Camera Tracking with Silky Exponential Damping & Trauma Shake
    const targetCamX = this.playerPos.x + this.cameraBaseOffset.x;
    const targetCamY = this.cameraBaseOffset.y;
    const targetCamZ = this.playerPos.z + this.cameraBaseOffset.z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 6.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6.0, dt);

    // Apply trauma-squared camera shake
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma;
      const shakeAmt = 1.4 * shake;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmt;
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }

    this.camera.lookAt(this.playerPos.x, 0, this.playerPos.z);

    // Emit state update to HUD
    if (this.onStateUpdate) {
      this.onStateUpdate(this.player, this.metrics, this.activeBoss);
    }
  }

  private arrowDown(): boolean {
    return this.keysHeld.has('ArrowDown');
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    soundSynth.stopBGM();

    // Clean up Three.js resources
    this.scene.clear();
    this.renderer.dispose();
  }
}
