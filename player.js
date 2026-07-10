// Player Entity Module - Top-Down Rogue-lite Shooter
import { Physics } from './physics.js?v=13';

export class Player {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 70;
    this.height = 100;
    this.color = color;
    this.active = true;

    // Aim angle (in radians) towards mouse cursor
    this.aimAngle = 0;

    // Movement speeds
    this.speed = 1.8;

    // Dodge Roll States (i-frames)
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollCooldown = 0;
    this.rollSpeed = 4.0;
    this.rollDirX = 0;
    this.rollDirY = 0;
    this.invincibilityFrames = 0;

    // Disguise rank progression
    this.rank = 1;
    this.rankProgress = 0;

    // Combat readouts
    this.hp = 5;
    this.maxHp = 5;
    this.ammo = 10;
    this.maxAmmo = 10;
    this.shootCooldown = 0;
    this.ammoRechargeTimer = 0;

    // Weapon Inventory Profile
    this.weapons = ['blaster', 'shotgun', 'railgun'];
    this.currentWeaponIndex = 0;
    this.keys_q_lock = false;

    // Reloading State
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 75;

    // Visual trails
    this.trail = [];

    // Camouflage System — disguise as a guard (C key)
    this.camoActive = false;
    this.camoDuration = 0;
    this.camoMaxDuration = 420;  // 7 seconds at 60fps
    this.camoCooldown = 0;
    this.camoMaxCooldown = 600;  // 10-second cooldown
    this.keys_c_lock = false;

    // Color Swapping System
    this.colorsList = ['R', 'G', 'B'];
    this.colorIndex = 1; // starts at 'G' (index 1)
    this.illusionColor = 'G';
    this.colorCharges = 5;
    this.maxColorCharges = 5;
    this.colorRechargeTimer = 0;
    this.keys_x_lock = false;

    // 2.5D Side-Scroller physics
    this.z = 0;
    this.vz = 0;
    this.facing = 'right';
    
    // Grenade Inventory
    this.grenades      = 3;
    this.maxGrenades   = 3;
    this.keys_g_lock   = false;

    // Weapon Recoil State
    this.recoilTimer = 0;
  }

  // --- ACTIONS ---
  update(keys, platforms, guards, gameEngine, mouseX, mouseY, remoteAimAngle = null) {
    // 1. Blaster Recharge Cycle
    if (this.ammo < this.maxAmmo) {
      this.ammoRechargeTimer++;
      if (this.ammoRechargeTimer >= 35) {
        this.ammo++;
        this.ammoRechargeTimer = 0;
      }
    }

    // Tick Cooldowns
    if (this.rollCooldown > 0) this.rollCooldown--;
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincibilityFrames > 0) this.invincibilityFrames--;
    if (this.recoilTimer > 0) this.recoilTimer--;

    // Aim Angle & Reload Cycle
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    const worldMouseX = mouseX + gameEngine.cameraX;
    const worldMouseY = mouseY + gameEngine.cameraY;
    this.aimAngle = (this.facing === 'left') ? Math.PI : 0;

    // Process Reload
    if (this.isReloading) {
      this.reloadTimer--;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
        gameEngine.addLog("> AMMO CELLS REPLENISHED.", "success");
      }
    }

    // 3. Movement & Dodge Roll Physics
    if (this.isRolling) {
      this.vx = this.rollDirX * this.rollSpeed;
      this.vy = this.rollDirY * this.rollSpeed;
      this.rollTimer--;

      // Push ghost trails during roll
      this.trail.push({
        x: this.x,
        y: this.y,
        z: this.z,
        opacity: 0.5,
        width: this.width,
        height: this.height
      });

      if (this.rollTimer <= 0) {
        this.isRolling = false;
      }
    } else if (this.recoilTimer > 0) {
      // Recoil active: gradually decay recoil velocities
      this.vx *= 0.88;
      this.vy *= 0.88;
    } else {
      // 8-way directional inputs
      let dirX = 0;
      let dirY = 0;
      if (keys['a'] || keys['arrowleft']) dirX = -1;
      if (keys['d'] || keys['arrowright']) dirX = 1;
      if (keys['w'] || keys['arrowup']) dirY = -1;
      if (keys['s'] || keys['arrowdown']) dirY = 1;

      if (dirX > 0) this.facing = 'right';
      if (dirX < 0) this.facing = 'left';

      // Normalize diagonal speed vectors
      if (dirX !== 0 && dirY !== 0) {
        const length = Math.sqrt(2);
        this.vx = (dirX / length) * this.speed;
        this.vy = (dirY / length) * this.speed;
      } else {
        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;
      }

      // Dodge Roll Trigger
      if (keys['shift'] && this.rollCooldown <= 0 && (dirX !== 0 || dirY !== 0)) {
        this.isRolling = true;
        this.rollTimer = 20; // 20 frames roll
        this.rollCooldown = 35;
        this.invincibilityFrames = 20; // Invincible during the entire roll!
        this.rollDirX = dirX;
        this.rollDirY = dirY;
        // Normalize diagonals for roll direction
        if (dirX !== 0 && dirY !== 0) {
          const len = Math.sqrt(2);
          this.rollDirX /= len;
          this.rollDirY /= len;
        }
        AudioController.playDash();
      }
    }

    // Decay ghost trails
    this.trail.forEach((item, idx) => {
      item.opacity -= 0.05;
      if (item.opacity <= 0) {
        this.trail.splice(idx, 1);
      }
    });

    // Weapon selection keys
    if (keys['q'] && !this.keys_q_lock) {
      this.keys_q_lock = true;
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
      AudioController.playRankUp();
    }
    if (!keys['q']) this.keys_q_lock = false;

    if (keys['1']) this.currentWeaponIndex = 0;
    if (keys['2']) this.currentWeaponIndex = 1;
    if (keys['3']) this.currentWeaponIndex = 2;

    // --- CAMOUFLAGE (C key) ---
    if (keys['c'] && !this.keys_c_lock && this.camoCooldown <= 0 && !this.camoActive) {
      this.keys_c_lock = true;
      this.camoActive = true;
      this.camoDuration = this.camoMaxDuration;
      gameEngine.addLog('> CAMOUFLAGE ACTIVATED: BLENDING WITH HOSTILES.', 'success');
      AudioController.playWarpDecoy();
      gameEngine.spawnCamoFlash(this.x + this.width / 2, this.y + this.height / 2);
    }
    if (!keys['c']) this.keys_c_lock = false;

    // --- ASSASSINATION MECHANIC (F key / Controller B Button) ---
    if (keys['f'] && !this.keys_f_lock) {
      this.keys_f_lock = true;
      // Search for close enemies
      let bestGuard = null;
      let bestDist = 60; // Close range threshold
      for (const g of gameEngine.guards) {
        const dx = g.x + g.width / 2 - (this.x + this.width / 2);
        const dy = g.y + g.height / 2 - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestGuard = g;
        }
      }

      if (bestGuard) {
        // Condition: Player is camouflaged, OR guard target is not set, OR guard is looking away
        const playerFacingLeft = (this.facing === 'left');
        const guardFacingLeft = (bestGuard.facing === 'left');
        const lookingAway = (playerFacingLeft === guardFacingLeft);

        if (this.camoActive || !bestGuard.target || lookingAway) {
          // Execute assassination!
          bestGuard.hp = 0;
          gameEngine.spawnExplosion(bestGuard.x + bestGuard.width / 2, bestGuard.y + bestGuard.height / 2, '#ff0055');
          AudioController.playHurt();

          this.rankProgress = Math.min(100, this.rankProgress + 25);
          gameEngine.credits += 30;

          // Spawn chips and drops
          gameEngine.rankChips.push({ x: bestGuard.x, y: bestGuard.y, width: 12, height: 12 });
          for (let i = 0; i < 4; i++) {
            gameEngine.currencyChips.push({
              x: bestGuard.x + Math.random() * 24 - 12,
              y: bestGuard.y + Math.random() * 24 - 12,
              width: 8, height: 8,
              value: Math.floor(Math.random() * 10) + 5
            });
          }
          if (Math.random() < 0.6) gameEngine.ammoDrops.push({ x: bestGuard.x, y: bestGuard.y, w: 12, h: 12 });

          // Remove guard
          const idx = gameEngine.guards.indexOf(bestGuard);
          if (idx !== -1) gameEngine.guards.splice(idx, 1);

          gameEngine.addLog(`⚡ ASSASSINATION: Silent execution confirmed (+30 CR)!`, 'success');
        } else {
          gameEngine.addLog(`⚠️ ASSASSINATION FAILED: Target is alert and facing you!`, 'alert');
        }
      } else {
        gameEngine.addLog(`⚠️ NO TARGET WITHIN RANGE FOR SILENT EXECUTION.`, 'alert');
      }
    }
    if (!keys['f']) this.keys_f_lock = false;

    // --- COLOR SWAPPING (X key) ---
    if (keys['x'] && !this.keys_x_lock) {
      this.keys_x_lock = true;
      if (this.colorCharges > 0) {
        this.colorIndex = (this.colorIndex + 1) % this.colorsList.length;
        this.illusionColor = this.colorsList[this.colorIndex];
        this.colorCharges--;
        gameEngine.addLog(`> COLOR SWAPPED TO: ${this.illusionColor}`, 'success');
        AudioController.playRankUp();
        gameEngine.spawnSwapFlash(this.x + this.width / 2, this.y + this.height / 2, this.illusionColor);
      } else {
        gameEngine.addLog(`> NO COLOR ENERGY CHARGES REMAINING!`, 'alert');
      }
    }
    if (!keys['x']) this.keys_x_lock = false;

    // --- GRENADE THROW (G key) ---
    if (keys['g'] && !this.keys_g_lock && this.grenades > 0) {
      this.keys_g_lock = true;
      this.grenades--;
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const targetX = cx + Math.cos(this.aimAngle) * 250;
      const targetY = cy + Math.sin(this.aimAngle) * 250;
      gameEngine.fireGrenade(cx, cy, targetX, targetY);
      gameEngine.addLog(`💣 GRENADE THROWN! (${this.grenades}/${this.maxGrenades} remaining)`, 'alert');
    }
    if (!keys['g']) this.keys_g_lock = false;

    // Tick camo duration
    if (this.camoActive) {
      this.camoDuration--;
      if (this.camoDuration <= 0) {
        this.camoActive = false;
        this.camoCooldown = this.camoMaxCooldown;
        gameEngine.addLog('> CAMOUFLAGE EXPIRED.', 'alert');
      }
    }
    if (this.camoCooldown > 0) this.camoCooldown--;

    // Color Recharge
    if (this.colorCharges < this.maxColorCharges) {
      this.colorRechargeTimer++;
      if (this.colorRechargeTimer >= 720) { // 12 seconds
        this.colorCharges++;
        this.colorRechargeTimer = 0;
        gameEngine.addLog(`> COLOR CHARGE REPLENISHED.`, 'success');
      }
    }

    const weaponType = this.weapons[this.currentWeaponIndex];
    let ammoCost = 1;
    if (weaponType === 'shotgun') ammoCost = 2;
    if (weaponType === 'railgun') ammoCost = 3;

    // Weapons are enabled; player can shoot blasters, shotguns, and railguns
    if (true) {
      if ((keys['r'] || ((keys['j'] || keys['click']) && this.ammo < ammoCost)) && !this.isReloading) {
        this.isReloading = true;
        this.reloadTimer = this.reloadDuration;
      }
      if ((keys['j'] || keys['click']) && this.shootCooldown <= 0 && !this.isRolling && !this.isReloading && this.ammo >= ammoCost) {
        this.ammo -= ammoCost;
        // Increased shot delay/cooldowns: Blaster (30 frames), Shotgun (50 frames), Railgun (70 frames)
        this.shootCooldown = weaponType === 'railgun' ? 70 : weaponType === 'shotgun' ? 50 : 30;

        // Calculate aim vector
        const angle = this.aimAngle;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        // Spawn laser
        const spawnX = this.x + this.width / 2 + dx * 20;
        const spawnY = this.y + this.height / 2 + dy * 20;
        gameEngine.fireLaser(spawnX, spawnY, dx, dy, 'player', this.playerId, weaponType, this.illusionColor, this.z);
        AudioController.playBlaster();

        // Heavier weapon recoil: push player back opposite to firing direction
        if (weaponType === 'shotgun') {
          this.vx = -dx * 2.2;
          this.vy = -dy * 2.2;
          this.recoilTimer = 8; // Lock movement inputs for 8 frames during kickback
        } else if (weaponType === 'railgun') {
          this.vx = -dx * 4.5;
          this.vy = -dy * 4.5;
          this.recoilTimer = 14; // Lock movement inputs for 14 frames during kickback
        }
      }
    }

    // 5. Decoy Projection
    if (keys['i'] && !this.keys_decoy_lock) {
      this.keys_decoy_lock = true;
      this.projectDecoy(worldMouseX, worldMouseY, gameEngine);
    }
    if (!keys['i']) this.keys_decoy_lock = false;

    // Determine ground floor baseline (including building ledges)
    let groundZ = 0;
    for (let p of platforms) {
      if (p.isLedge) {
        const px = this.x;
        const py = this.y;
        const pw = this.width;
        const ph = this.height;
        if (px < p.x + p.w && px + pw > p.x && py < p.y + p.h && py + ph > p.y) {
          if (this.z >= p.zHeight - 6 && this.vz <= 0) {
            groundZ = p.zHeight;
          }
        }
      }
    }

    // Jump mechanics (River City Ransom style)
    if (keys[' '] && this.z <= groundZ + 0.1) {
      this.vz = 5.5;
    }

    const wasAbove = (this.z > groundZ + 0.1);
    this.z += this.vz;
    this.vz -= 0.25;
    if (this.z < groundZ) {
      this.z = groundZ;
      this.vz = 0;
      if (wasAbove) {
        gameEngine.spawnDust(this.x + this.width / 2, this.y + this.height, 8);
      }
    }

    // Spawn running dust
    if (this.z <= groundZ + 0.1 && !this.isRolling && (this.vx !== 0 || this.vy !== 0)) {
      if (Math.random() < 0.08) {
        gameEngine.spawnDust(this.x + this.width / 2, this.y + this.height, 2);
      }
    }

    // Apply movement (filtering out ledges from solid collisions)
    const solidWalls = platforms.filter(p => !p.isLedge);
    this.x += this.vx;
    Physics.resolveCollisionsX(this, solidWalls);
    this.y += this.vy;
    Physics.resolveCollisionsY(this, solidWalls);
  }

  projectDecoy(targetX, targetY, gameEngine) {
    const decoy = {
      x: targetX - 12,
      y: targetY - 12,
      width: this.width,
      height: this.height,
      life: 200,
      color: this.color
    };
    gameEngine.decoys.push(decoy);
    AudioController.playWarpDecoy();
    gameEngine.addLog("> DECOY POSITIONED AT AIM COORDINATES.", "success");
  }

  // Draw Dash/Roll ghost after-images
  drawTrail(ctx, cameraX, cameraY) {
    this.trail.forEach(item => {
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(item.x - cameraX, item.y - cameraY, item.width, item.height);
      ctx.restore();
    });
  }
}
