import * as THREE from 'three';

// Reusable Materials (PBR with roughness/metalness contrast and emissive glow)
export class ModelFactory {
  // Shared materials for optimal performance
  public static readonly matHull = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.25,
    metalness: 0.9,
  });

  public static readonly matHullSecondary = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.4,
  });

  public static readonly matCyanGlow = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.1,
  });

  public static readonly matMagentaGlow = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xec4899,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.1,
  });

  public static readonly matAmberGlow = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.1,
  });

  public static readonly matGreenGlow = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.1,
  });

  public static readonly matRedGlow = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  public static readonly matChrome = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.1,
    metalness: 0.95,
  });

  /**
   * Hero Player Ship: Composite 9-part procedural cyber-interceptor
   * Primary: Sleek wedge fuselage
   * Secondary: Forward sweep wings, dual ion exhausts, twin cannons
   * Accent: Glowing cockpit visor, stabilizer fins, intake conduits
   */
  public static createPlayerShip(): THREE.Group {
    const ship = new THREE.Group();

    // 1. Primary Fuselage
    const hullGeo = new THREE.ConeGeometry(0.9, 2.4, 4);
    hullGeo.rotateY(Math.PI / 4);
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, this.matHull);
    hull.position.set(0, 0.45, 0);
    hull.castShadow = true;
    ship.add(hull);

    // 2. Cockpit Visor (Cyan Glow)
    const visorGeo = new THREE.SphereGeometry(0.35, 12, 12);
    visorGeo.scale(0.8, 0.5, 1.4);
    const visor = new THREE.Mesh(visorGeo, this.matCyanGlow);
    visor.position.set(0, 0.65, 0.1);
    ship.add(visor);

    // 3. Left Wing
    const wingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9);
    const leftWing = new THREE.Mesh(wingGeo, this.matHullSecondary);
    leftWing.position.set(-0.95, 0.4, -0.2);
    leftWing.rotation.y = -0.3;
    leftWing.castShadow = true;
    ship.add(leftWing);

    // 4. Right Wing
    const rightWing = new THREE.Mesh(wingGeo, this.matHullSecondary);
    rightWing.position.set(0.95, 0.4, -0.2);
    rightWing.rotation.y = 0.3;
    rightWing.castShadow = true;
    ship.add(rightWing);

    // 5. Left Cannon
    const cannonGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8);
    cannonGeo.rotateX(Math.PI / 2);
    const leftCannon = new THREE.Mesh(cannonGeo, this.matChrome);
    leftCannon.position.set(-0.9, 0.38, 0.5);
    ship.add(leftCannon);

    // 6. Right Cannon
    const rightCannon = new THREE.Mesh(cannonGeo, this.matChrome);
    rightCannon.position.set(0.9, 0.38, 0.5);
    ship.add(rightCannon);

    // 7. Left Ion Thruster Exhaust (Glowing nozzle)
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8);
    thrusterGeo.rotateX(Math.PI / 2);
    const leftThruster = new THREE.Mesh(thrusterGeo, this.matCyanGlow);
    leftThruster.position.set(-0.35, 0.45, -1.05);
    ship.add(leftThruster);

    // 8. Right Ion Thruster Exhaust
    const rightThruster = new THREE.Mesh(thrusterGeo, this.matCyanGlow);
    rightThruster.position.set(0.35, 0.45, -1.05);
    ship.add(rightThruster);

    // 9. Twin Vertical Stabilizer Fins
    const finGeo = new THREE.BoxGeometry(0.06, 0.6, 0.5);
    const leftFin = new THREE.Mesh(finGeo, this.matHull);
    leftFin.position.set(-0.4, 0.7, -0.7);
    leftFin.rotation.z = -0.25;
    ship.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, this.matHull);
    rightFin.position.set(0.4, 0.7, -0.7);
    rightFin.rotation.z = 0.25;
    ship.add(rightFin);

    // Contact shadow beneath ship
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    ship.add(shadow);

    return ship;
  }

  /**
   * Neural Copilot Drone (Orbital Companion)
   */
  public static createCopilotDrone(): THREE.Group {
    const drone = new THREE.Group();

    // 1. Central Orb
    const orbGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const orb = new THREE.Mesh(orbGeo, this.matChrome);
    drone.add(orb);

    // 2. Glowing Visor Core
    const visorGeo = new THREE.RingGeometry(0.1, 0.22, 16);
    const visor = new THREE.Mesh(visorGeo, this.matGreenGlow);
    visor.position.z = 0.36;
    drone.add(visor);

    // 3. Rotating Orbital Ring
    const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 24);
    const ring = new THREE.Mesh(ringGeo, this.matCyanGlow);
    ring.name = 'droneRing';
    drone.add(ring);

    // 4. Mini Laser Antenna
    const antGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
    const ant = new THREE.Mesh(antGeo, this.matChrome);
    ant.position.y = 0.4;
    drone.add(ant);

    return drone;
  }

  /**
   * Memory Leak Enemy: Bloated corrupted slime node
   * Composite 6-part procedural model
   */
  public static createMemoryLeakModel(): THREE.Group {
    const group = new THREE.Group();

    // Core Bloat Sphere
    const coreGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.9,
      roughness: 0.7,
      metalness: 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.9;
    core.castShadow = true;
    group.add(core);

    // 4 Orbiting Bloat Spores
    const sporeGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const sporeMat = this.matMagentaGlow;
    const offsets = [
      [0.9, 0.9, 0],
      [-0.9, 0.9, 0],
      [0, 1.3, 0.7],
      [0, 0.5, -0.8],
    ];
    offsets.forEach(([ox, oy, oz]) => {
      const spore = new THREE.Mesh(sporeGeo, sporeMat);
      spore.position.set(ox, oy, oz);
      group.add(spore);
    });

    // Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  /**
   * Zombie Thread Enemy: Fast jagged charging drill spike
   * Composite 6-part procedural model
   */
  public static createZombieThreadModel(): THREE.Group {
    const group = new THREE.Group();

    // 1. Pointed Needle Hull
    const spikeGeo = new THREE.ConeGeometry(0.45, 1.9, 4);
    spikeGeo.rotateX(Math.PI / 2);
    const spike = new THREE.Mesh(spikeGeo, this.matHullSecondary);
    spike.position.set(0, 0.55, 0);
    spike.castShadow = true;
    group.add(spike);

    // 2. Orange Overheat Core
    const coreGeo = new THREE.BoxGeometry(0.35, 0.35, 0.7);
    const core = new THREE.Mesh(coreGeo, this.matAmberGlow);
    core.position.set(0, 0.55, -0.2);
    group.add(core);

    // 3. 4 Barbed Swept Thrusters
    const bladeGeo = new THREE.BoxGeometry(0.1, 0.5, 0.4);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(bladeGeo, this.matHull);
      const angle = (i * Math.PI) / 2;
      blade.position.set(Math.cos(angle) * 0.45, 0.55 + Math.sin(angle) * 0.3, -0.6);
      blade.rotation.z = angle;
      group.add(blade);
    }

    // Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  /**
   * DDoS Swarm Drone: Agile delta-winged packet spammer
   */
  public static createDDoSDroneModel(): THREE.Group {
    const group = new THREE.Group();

    // 1. Triangular stealth body
    const bodyGeo = new THREE.CylinderGeometry(0.1, 0.8, 0.35, 3);
    bodyGeo.rotateY(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.matHull);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // 2. Dual Pulse emitters
    const emitterGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const leftE = new THREE.Mesh(emitterGeo, this.matRedGlow);
    leftE.position.set(-0.45, 0.5, -0.1);
    group.add(leftE);

    const rightE = new THREE.Mesh(emitterGeo, this.matRedGlow);
    rightE.position.set(0.45, 0.5, -0.1);
    group.add(rightE);

    // 3. Central glowing intake
    const intakeGeo = new THREE.BoxGeometry(0.25, 0.15, 0.4);
    const intake = new THREE.Mesh(intakeGeo, this.matRedGlow);
    intake.position.set(0, 0.52, 0.3);
    group.add(intake);

    // Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.3, 1.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  /**
   * Null Pointer Phantom: Phasing diamond entity
   */
  public static createNullPointerModel(): THREE.Group {
    const group = new THREE.Group();

    // 1. Outer Diamond Frame
    const outerGeo = new THREE.OctahedronGeometry(0.7, 0);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.position.y = 1.0;
    outer.name = 'nullOuter';
    group.add(outer);

    // 2. Inner Null Crystal
    const innerGeo = new THREE.OctahedronGeometry(0.45, 0);
    const inner = new THREE.Mesh(innerGeo, this.matCyanGlow);
    inner.position.y = 1.0;
    inner.name = 'nullInner';
    group.add(inner);

    // 3. Floating Orbital Data Node
    const nodeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    for (let i = 0; i < 3; i++) {
      const node = new THREE.Mesh(nodeGeo, this.matGreenGlow);
      const angle = (i * Math.PI * 2) / 3;
      node.position.set(Math.cos(angle) * 0.9, 1.0, Math.sin(angle) * 0.9);
      node.name = `node_${i}`;
      group.add(node);
    }

    // Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  /**
   * RAID BOSS 1: The Monolithic Spaghetti Daemon
   * Massive multi-tier server mainframe fortress
   * Composite 12-part procedural structure
   */
  public static createMonolithBossModel(): THREE.Group {
    const boss = new THREE.Group();

    // 1. Central Server Core Column
    const coreGeo = new THREE.CylinderGeometry(1.6, 2.0, 3.8, 8);
    const core = new THREE.Mesh(coreGeo, this.matHull);
    core.position.y = 1.9;
    core.castShadow = true;
    boss.add(core);

    // 2. Pulsing Main Reactor Core
    const reactorGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const reactor = new THREE.Mesh(reactorGeo, this.matRedGlow);
    reactor.position.y = 2.1;
    reactor.name = 'bossReactor';
    boss.add(reactor);

    // 3-6. Four Heavy Cooling Towers / Outriggers
    const towerGeo = new THREE.BoxGeometry(0.8, 3.2, 0.8);
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    angles.forEach((ang, i) => {
      const tower = new THREE.Mesh(towerGeo, this.matHullSecondary);
      const r = 2.4;
      tower.position.set(Math.cos(ang) * r, 1.6, Math.sin(ang) * r);
      tower.castShadow = true;
      boss.add(tower);

      // Status LED strip on each tower
      const ledGeo = new THREE.PlaneGeometry(0.2, 2.4);
      const led = new THREE.Mesh(ledGeo, this.matAmberGlow);
      led.position.set(Math.cos(ang) * (r + 0.42), 1.6, Math.sin(ang) * (r + 0.42));
      led.rotation.y = -ang + Math.PI / 2;
      boss.add(led);
    });

    // 7. Rotating Defense Shield Ring
    const ringGeo = new THREE.TorusGeometry(3.2, 0.12, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.matMagentaGlow);
    ring.position.y = 2.0;
    ring.name = 'bossRing';
    boss.add(ring);

    // 8. Dual Heavy Railgun Sponson Pods
    const podGeo = new THREE.BoxGeometry(0.9, 0.8, 2.4);
    const leftPod = new THREE.Mesh(podGeo, this.matHull);
    leftPod.position.set(-2.8, 2.2, 0);
    boss.add(leftPod);

    const rightPod = new THREE.Mesh(podGeo, this.matHull);
    rightPod.position.set(2.8, 2.2, 0);
    boss.add(rightPod);

    // 9. Crown Data Spire
    const spireGeo = new THREE.ConeGeometry(0.4, 1.8, 4);
    const spire = new THREE.Mesh(spireGeo, this.matChrome);
    spire.position.y = 4.7;
    boss.add(spire);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(7.0, 7.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    boss.add(shadow);

    return boss;
  }

  /**
   * RAID BOSS 2: Rogue AGI Singularity
   * Levitating multi-ring hyper-tesseract
   */
  public static createAGISingularityModel(): THREE.Group {
    const boss = new THREE.Group();

    // 1. Black Hole Singularity Core
    const coreGeo = new THREE.SphereGeometry(1.5, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.1,
      metalness: 1.0,
      emissive: 0x6366f1,
      emissiveIntensity: 0.8,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 3.0;
    core.name = 'agiCore';
    boss.add(core);

    // 2-4. Three Concentric Gyro Rings
    const ringMat = this.matCyanGlow;
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.1, 8, 36), ringMat);
    r1.position.y = 3.0;
    r1.name = 'agiRing1';
    boss.add(r1);

    const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 36), this.matMagentaGlow);
    r2.position.y = 3.0;
    r2.name = 'agiRing2';
    boss.add(r2);

    const r3 = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.14, 8, 36), this.matAmberGlow);
    r3.position.y = 3.0;
    r3.name = 'agiRing3';
    boss.add(r3);

    // 8 Floating Neural Pylons
    const pylonGeo = new THREE.OctahedronGeometry(0.35, 0);
    for (let i = 0; i < 8; i++) {
      const pylon = new THREE.Mesh(pylonGeo, this.matChrome);
      const ang = (i * Math.PI * 2) / 8;
      pylon.position.set(Math.cos(ang) * 4.6, 3.0 + Math.sin(ang * 2) * 0.8, Math.sin(ang) * 4.6);
      pylon.name = `agiPylon_${i}`;
      boss.add(pylon);
    }

    // Shadow
    const shadowGeo = new THREE.PlaneGeometry(8.0, 8.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    boss.add(shadow);

    return boss;
  }

  /**
   * RAM Crystal / XP Pickup Drop
   */
  public static createRamCrystalModel(): THREE.Group {
    const group = new THREE.Group();

    const geo = new THREE.OctahedronGeometry(0.3, 0);
    const mat = this.matCyanGlow;
    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.y = 0.35;
    group.add(crystal);

    // Wireframe halo
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const wire = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), wireMat);
    wire.position.y = 0.35;
    group.add(wire);

    return group;
  }

  /**
   * Cyber Mainframe Arena Grid Floor & Perimeter Server Monoliths
   */
  public static createArenaEnvironment(): { arenaGroup: THREE.Group; perimeterTowers: THREE.Group[] } {
    const arenaGroup = new THREE.Group();
    const perimeterTowers: THREE.Group[] = [];

    // 1. Procedural Cyber Grid Texture via HTML5 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark high-tech motherboard background
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, 1024, 1024);

    // Circuit grid lines
    ctx.strokeStyle = '#0e2340';
    ctx.lineWidth = 3;
    const step = 64;
    for (let x = 0; x <= 1024; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(1024, x);
      ctx.stroke();
    }

    // Glowing cyan bus traces
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    for (let i = 128; i < 1024; i += 256) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Microchip solder nodes
    ctx.fillStyle = '#06b6d4';
    for (let x = 128; x < 1024; x += 256) {
      for (let y = 128; y < 1024; y += 256) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(10, 10);
    gridTexture.colorSpace = THREE.SRGBColorSpace;

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.35,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaGroup.add(floor);

    // 2. Perimeter Server Monolith Towers (Natural boundary)
    // 16 server monoliths forming a circular perimeter at R=45
    const towerRadius = 45;
    const towerCount = 16;
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.4,
      metalness: 0.7,
    });

    for (let i = 0; i < towerCount; i++) {
      const angle = (i * Math.PI * 2) / towerCount;
      const tx = Math.cos(angle) * towerRadius;
      const tz = Math.sin(angle) * towerRadius;

      const tower = new THREE.Group();
      tower.position.set(tx, 0, tz);

      // Monolith column
      const h = 10 + Math.random() * 6;
      const col = new THREE.Mesh(new THREE.BoxGeometry(3.5, h, 3.5), towerMat);
      col.position.y = h / 2;
      col.castShadow = true;
      tower.add(col);

      // Vertical Glowing Neon LED array
      const ledGeo = new THREE.PlaneGeometry(0.6, h * 0.85);
      const isCyan = i % 2 === 0;
      const ledMat = isCyan ? this.matCyanGlow : this.matMagentaGlow;
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, h / 2, 1.8);
      led.rotation.y = -angle - Math.PI / 2;
      tower.add(led);

      // Top glowing transmitter beacon
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), isCyan ? this.matCyanGlow : this.matAmberGlow);
      beacon.position.y = h + 0.6;
      tower.add(beacon);

      perimeterTowers.push(tower);
      arenaGroup.add(tower);
    }

    // 3. Boundary laser fence line
    const fenceGeo = new THREE.RingGeometry(44.8, 45.2, 64);
    fenceGeo.rotateX(Math.PI / 2);
    const fenceMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.y = 0.05;
    arenaGroup.add(fence);

    return { arenaGroup, perimeterTowers };
  }
}
