// Wave Manager Module — Escalating Enemy Spawn System
import { Guard } from './guard.js?v=13';

// Perimeter spawn zones: kept far from player start area (~150,150)
const SPAWN_ZONES = [
  { x: 80,   y: 80   },
  { x: 80,   y: 450  },
  { x: 80,   y: 900  },
  { x: 80,   y: 1100 },
  { x: 500,  y: 80   },
  { x: 900,  y: 80   },
  { x: 1300, y: 80   },
  { x: 1500, y: 200  },
  { x: 1500, y: 600  },
  { x: 1500, y: 1050 },
  { x: 1200, y: 1100 },
  { x: 700,  y: 1100 },
  { x: 300,  y: 1100 },
];

export class WaveManager {
  constructor() {
    this.nextGuardId = 100; // Start above any manually placed IDs
    this.reset();
  }

  reset() {
    this.currentWave = 0;
    this.state = 'countdown'; // 'countdown' | 'active' | 'between'
    this.countdown = 180;     // 3-second grace before wave 1
    this.countdownMax = 180;

    // Time-based reinforcement trickle: keeps pressure rising even mid-wave,
    // independent of how fast the current wave is being cleared.
    this.reinforcementTimer = 900; // first trickle 15s after reset
  }

  // Guards per wave: ramps with wave number AND with how long the mission has run,
  // so a long session keeps getting harder even if waves are cleared quickly.
  getWaveGuardCount(elapsedTime = 0) {
    const waveScaling = 5 + this.currentWave * 2;
    const timeScaling = Math.floor(elapsedTime / 45); // +1 guard every 45s survived
    return Math.min(waveScaling + timeScaling, 30);
  }

  // Shuffle spawn zones and pick `count` positions
  getSpawnPoints(count) {
    const shuffled = [...SPAWN_ZONES].sort(() => Math.random() - 0.5);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    return result;
  }

  // Guard rank scales with wave number and with elapsed mission time
  getRankForWave(elapsedTime = 0) {
    const w = this.currentWave + Math.floor(elapsedTime / 90); // long sessions push rank up too
    if (w <= 1) return 1;
    if (w <= 3) return Math.random() < 0.5 ? 1 : 2;
    if (w <= 5) return Math.ceil(Math.random() * 3);
    return Math.min(4, Math.ceil(Math.random() * 4));
  }

  spawnWaveGuards(gameEngine) {
    const elapsedTime = gameEngine.elapsedTime || 0;
    const count = this.getWaveGuardCount(elapsedTime);
    const points = this.getSpawnPoints(count);

    for (let i = 0; i < count; i++) {
      const pt = points[i];
      const rank = this.getRankForWave(elapsedTime);
      const id = this.nextGuardId++;

      // Find a safe spot not inside a wall
      let spawnX = pt.x + (Math.random() - 0.5) * 50;
      let spawnY = pt.y + (Math.random() - 0.5) * 50;
      let retries = 0;
      while (gameEngine.isPositionFree && !gameEngine.isPositionFree(spawnX, spawnY, 24, 24) && retries < 30) {
        spawnX = 100 + Math.random() * 1400;
        spawnY = 100 + Math.random() * 1000;
        retries++;
      }

      // Patrol range centred on spawn point
      const rangeW = 200 + Math.random() * 200;
      const rangeH = 200 + Math.random() * 200;

      // Randomize colors on wave 2 and beyond explicitly
      const colors = ['R', 'G', 'B'];
      const chosenColor = (this.currentWave >= 2) ? colors[Math.floor(Math.random() * colors.length)] : null;

      gameEngine.guards.push(new Guard(
        id,
        spawnX,
        spawnY,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0,
        Math.max(40,   spawnX - rangeW / 2),
        Math.min(1560, spawnX + rangeW / 2),
        Math.max(40,   spawnY - rangeH / 2),
        Math.min(1160, spawnY + rangeH / 2),
        rank,
        chosenColor
      ));
    }

    this.state = 'active';
    gameEngine.addLog(
      `⚡ WAVE ${this.currentWave}: ${count} HOSTILES DEPLOYED`,
      'alert'
    );
  }

  // Spawns a small trickle of extra hostiles purely based on how long the mission
  // has run — keeps the pressure climbing even during a long, slow-cleared wave.
  spawnReinforcements(gameEngine) {
    const elapsedTime = gameEngine.elapsedTime || 0;
    // Scale trickle size with survival time: bigger, more frequent drops the longer you last
    const count = Math.min(1 + Math.floor(elapsedTime / 120), 5);
    const points = this.getSpawnPoints(count);

    for (let i = 0; i < count; i++) {
      const pt = points[i];
      const rank = this.getRankForWave(elapsedTime);
      const id = this.nextGuardId++;

      let spawnX = pt.x + (Math.random() - 0.5) * 50;
      let spawnY = pt.y + (Math.random() - 0.5) * 50;
      let retries = 0;
      while (gameEngine.isPositionFree && !gameEngine.isPositionFree(spawnX, spawnY, 24, 24) && retries < 30) {
        spawnX = 100 + Math.random() * 1400;
        spawnY = 100 + Math.random() * 1000;
        retries++;
      }

      const rangeW = 200 + Math.random() * 200;
      const rangeH = 200 + Math.random() * 200;
      const colors = ['R', 'G', 'B'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];

      gameEngine.guards.push(new Guard(
        id,
        spawnX,
        spawnY,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0,
        Math.max(40,   spawnX - rangeW / 2),
        Math.min(1560, spawnX + rangeW / 2),
        Math.max(40,   spawnY - rangeH / 2),
        Math.min(1160, spawnY + rangeH / 2),
        rank,
        chosenColor
      ));
    }

    gameEngine.addLog(
      `⚠️ REINFORCEMENTS INBOUND: ${count} MORE HOSTILES DEPLOYED!`,
      'alert'
    );

    // Reinforcements arrive more frequently the longer the mission runs (floor at 8s)
    const nextInterval = Math.max(480, 1500 - elapsedTime * 3);
    this.reinforcementTimer = nextInterval;
  }

  // Called every game frame from GameEngine.update()
  update(gameEngine) {
    // Time-based reinforcement trickle runs independently of wave/countdown state
    // once the mission is actually underway (skip during the very first grace period).
    if (this.state !== 'countdown' || this.currentWave > 0) {
      this.reinforcementTimer--;
      if (this.reinforcementTimer <= 0) {
        this.spawnReinforcements(gameEngine);
      }
    }

    if (this.state === 'countdown') {
      this.countdown--;
      if (this.countdown <= 0) {
        this.currentWave++;
        this.spawnWaveGuards(gameEngine);
      }
    } else if (this.state === 'active') {
      if (gameEngine.guards.length === 0) {
        this.state = 'between';
        this.countdown = 300;    // 5-second grace between waves
        this.countdownMax = 300;
        gameEngine.chaosLevel = Math.min(100, gameEngine.chaosLevel + 8);
        gameEngine.addLog(
          `✅ WAVE ${this.currentWave} CLEARED — NEXT WAVE IN 5s`,
          'success'
        );

        // Respawn dead players for co-op
        gameEngine.players.forEach((p, idx) => {
          if (p && (!p.active || p.hp <= 0)) {
            p.active = true;
            p.hp = p.maxHp;
            p.x = 150 + idx * 30;
            p.y = 150;
            gameEngine.addLog(`➕ OPERATIVE P${idx + 1} RESPAWNED FOR SQUAD PROTOCOL`, 'success');
          }
        });
      }
    } else if (this.state === 'between') {
      this.countdown--;
      if (this.countdown <= 0) {
        this.currentWave++;
        this.spawnWaveGuards(gameEngine);
      }
    }
  }

  // Seconds remaining in current countdown
  getCountdownSeconds() {
    return Math.ceil(this.countdown / 60);
  }
}
