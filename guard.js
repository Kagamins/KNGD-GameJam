// Guard Entity Module - Top-Down Rogue-lite AI with Color Coding and Ranks
import { Physics } from './physics.js?v=13';
import { VectorAnimator } from './vectorAnimator.js?v=25';

const COLOR_MAP = {
  'R': '#ff3333', // Red
  'G': '#33ff33', // Green
  'B': '#3333ff', // Blue

};

const RANK_NAMES = {
  1: 'GRUNT',
  2: 'CORPORAL',
  3: 'COMMANDER',
  4: 'ADMIRAL'
};

export class Guard {
  constructor(id, x, y, vx, vy, rangeMinX, rangeMaxX, rangeMinY, rangeMaxY, rank, colorCode = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 70;
    this.height = 100;
    this.rangeMinX = rangeMinX;
    this.rangeMaxX = rangeMaxX;
    this.rangeMinY = rangeMinY;
    this.rangeMaxY = rangeMaxY;
    this.rank = rank;
    this.target = null; // Guard or Player instance
    this.shootCooldown = 0;
    this.aimAngle = 0;

    // Color code: R, G, B only (Y, M, C removed)
    const colors = ['R', 'G', 'B'];
    this.colorCode = colorCode;
    if (!this.colorCode || !colors.includes(this.colorCode)) {
      this.colorCode = colors[Math.floor(Math.random() * colors.length)];
    }

    // Increased enemy health bars (doubled base HP values)
    const hpValues = { 1: 6, 2: 10, 3: 14, 4: 20 };
    this.maxHp = hpValues[rank] || 6;
    this.hp = this.maxHp;

    const speedValues = { 1: 0.7, 2: 0.9, 3: 1.1, 4: 1.3 };
    this.baseSpeed = speedValues[rank] || 0.7;

    // Assign weapon by rank: Grunts use blaster, Corporals may carry shotgun, Commanders use shotgun, Admirals use railgun
    if (rank >= 4) {
      this.weapon = 'railgun';
    } else if (rank === 3) {
      this.weapon = 'shotgun';
    } else if (rank === 2) {
      this.weapon = Math.random() < 0.5 ? 'shotgun' : 'blaster';
    } else {
      this.weapon = 'blaster';
    }

    this.gazeDamageTimer = 0;
    this.knockedTimer = 0;
    this.z = 0;
    this.vz = 0;
    this.facing = 'right';
  }

  update(players, decoys, gameEngine) {
    // Determine ground floor baseline (including building ledges)
    let groundZ = 0;
    for (let p of gameEngine.platforms) {
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

    // Z-axis updates
    this.z += this.vz;
    this.vz -= 0.25;
    if (this.z < groundZ) {
      this.z = groundZ;
      this.vz = 0;
    }

    if (this.knockedTimer > 0) {
      this.knockedTimer--;
      this.vx = 0;
      this.vy = 0;
      this.target = null;
      return;
    }

    if (this.shootCooldown > 0) this.shootCooldown--;

    // Lose target if they activated camouflage (90 frame grace = 1.5s)
    if (this.target && this.target.camoActive) {
      this.camoLoseTimer = (this.camoLoseTimer || 0) + 1;
      if (this.camoLoseTimer > 90) {
        this.target = null;
        this.camoLoseTimer = 0;
      }
    } else {
      this.camoLoseTimer = 0;
    }

    const player = players[0];
    const isChasingPlayer = this.target === player;
    let hasPlayerLOS = false;
    if (player && player.active) {
      hasPlayerLOS = Physics.checkLineOfSight(this.x + 12, this.y + 12, player.x + 12, player.y + 12, gameEngine.platforms);
    }

    // Target priority: Decoy -> Mutinous targeted guard -> Player -> Other different-colored guard
    let targetEntity = null;
    let targetDist = 250;

    // 1. Decoys (Only distract if not already chasing player with a clear line of sight!)
    if (!(isChasingPlayer && hasPlayerLOS)) {
      decoys.forEach(decoy => {
        const dx = decoy.x - this.x;
        const dy = decoy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < targetDist) {
          targetDist = dist;
          targetEntity = decoy;
        }
      });
    }

    // 2. Aggressive target guard / player
    if (!targetEntity && this.target) {
      targetEntity = this.target;
    }

    // 3. Spot different-colored guards in detection cone
    if (!targetEntity) {
      gameEngine.guards.forEach(g => {
        if (g.id !== this.id && g.hp > 0 && g.colorCode !== this.colorCode && g.knockedTimer <= 0) {
          // Check: Lower ranking mobs (rank < 3) do not attack the boss
          if (g.isBoss && this.rank < 3) return;

          const dx = g.x - this.x;
          const dy = g.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const angleToGuard = Math.atan2(dy, dx);
            const currentDirAngle = Math.atan2(this.vy, this.vx);
            let angleDiff = angleToGuard - currentDirAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            if (Math.abs(angleDiff) < 0.4) {
              const hasLOS = Physics.checkLineOfSight(this.x + 12, this.y + 12, g.x + 12, g.y + 12, gameEngine.platforms);
              if (hasLOS) {
                targetDist = dist;
                targetEntity = g;
                this.target = g; // lock target
                if (Math.random() < 0.02) {
                  gameEngine.addLog(`⚔️ MUTINY: Mismatched guards attacking each other!`, 'alert');
                }
              }
            }
          }
        }
      });
    }

    // 4. Fallback: Detection Cone (stealth detection + color code illusion rules)
    if (!targetEntity) {
      players.forEach(p => {
        if (p.active) {
          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Camo / Illusion rules
          const sameColor = (p.illusionColor === this.colorCode);
          let detectRange = 180;
          let coneWidth = 0.4;

          if (sameColor) {
            // Blends in! The player gives the illusion they are one of them.
            // Suspicion range is very small (35px), and ignores regular cone.
            detectRange = 35;
            coneWidth = 0.1;
          }

          if (p.camoActive) {
            detectRange = 55;
            coneWidth = 0.12;
          }

          if (dist < detectRange) {
            const angleToPlayer = Math.atan2(dy, dx);
            const currentDirAngle = Math.atan2(this.vy, this.vx);
            let angleDiff = angleToPlayer - currentDirAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            if (Math.abs(angleDiff) < coneWidth && !p.isRolling) {
              // Mismatched color gaze: spot the player (auto damage removed)
              if (!sameColor && !p.camoActive) {
                targetDist = dist;
                targetEntity = p;
                this.target = p;
                if (Math.random() < 0.58) {
                  gameEngine.addLog(`⚠ CAUGHT: Color mismatch spotted in ${RANK_NAMES[this.rank]}'s gaze!`, 'alert');
                }
              } else if (sameColor && dist < 35) {
                // Too close, suspicion broken
                targetDist = dist;
                targetEntity = p;
                this.target = p;
              }
            }
          }
        }
      });
    }

    // Move & Attack
    if (targetEntity) {
      const dx = targetEntity.x - this.x;
      const dy = targetEntity.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      this.aimAngle = dx >= 0 ? 0 : Math.PI;

      // Chase
      this.vx = (dx / dist) * this.baseSpeed;
      this.vy = (dy / dist) * this.baseSpeed;
      if (this.vx > 0.1) this.facing = 'right';
      if (this.vx < -0.1) this.facing = 'left';
      this.x += this.vx;
      this.y += this.vy;

      if (dist < 220 && this.shootCooldown <= 0) {
        const ldx = Math.cos(this.aimAngle);
        const ldy = Math.sin(this.aimAngle);
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;

        if (this.weapon === 'railgun') {
          // Railgun: single powerful shot, slow fire rate
          gameEngine.fireLaser(bx, by, ldx, ldy, 'guard', this.id, 'railgun', null, this.z || 0);
          this.shootCooldown = 120; // Very slow fire rate
        } else if (this.weapon === 'shotgun') {
          // Shotgun: 3 spread pellets
          const spread = 0.25;
          for (let s = -1; s <= 1; s++) {
            const a = this.aimAngle + s * spread;
            gameEngine.fireLaser(bx, by, Math.cos(a), Math.sin(a), 'guard', this.id, 'shotgun', null, this.z || 0);
          }
          this.shootCooldown = 80; // Slow reload
        } else {
          // Blaster: standard single shot
          gameEngine.fireLaser(bx, by, ldx, ldy, 'guard', this.id, 'blaster', null, this.z || 0);
          const isMismatchedPlayer = (targetEntity.illusionColor && targetEntity.illusionColor !== this.colorCode);
          this.shootCooldown = isMismatchedPlayer ? 30 : 65;
        }
      }
    } else {
      // Top-down 2D Patrol bounds
      if (this.vx > 0.15) this.facing = 'right';
      if (this.vx < -0.15) this.facing = 'left';
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < this.rangeMinX || this.x > this.rangeMaxX) {
        this.vx = -this.vx;
      }
      if (this.y < this.rangeMinY || this.y > this.rangeMaxY) {
        this.vy = -this.vy;
      }

      this.aimAngle = this.vx >= 0 ? 0 : Math.PI;
      this.gazeDamageTimer = 0;
    }
    if (this.target) {
      // Calculate vector to target
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.aimAngle = Math.atan2(dy, dx);


      // Move toward the target
      this.moveTowards(this.target.x, this.target.y);

      // Shoot at the target if in range (using your existing shoot logic)
      this.attemptShoot(this.target, gameEngine);
    }
  }

  attemptShoot(targetEntity, gameEngine) {

    gameEngine.damagePlayer(targetEntity);
  }
  // Add this method to the Guard class in guard.js
  moveTowards(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normalize and scale by baseSpeed
    this.vx = (dx / dist) * this.baseSpeed;
    this.vy = (dy / dist) * this.baseSpeed;

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;

    // Update facing direction for animations
    if (this.vx > 0.1) this.facing = 'right';
    else if (this.vx < -0.1) this.facing = 'left';
  }
  draw(ctx, cameraX, cameraY) {
    const rx = this.x - cameraX;
    const ry = this.y - cameraY;
    const cx = rx + this.width / 2;
    const cy = ry + this.height / 2;

    const displayColor = COLOR_MAP[this.colorCode] || '#ff0055';

    // Draw field of view sensor detection cone in matching color (if NOT knocked)
    if (this.knockedTimer <= 0) {
      ctx.save();
      ctx.fillStyle = this.target ? 'rgba(255, 183, 0, 0.05)' : displayColor.replace('#', 'rgba(') + ', 0.05)';
      // Fast conversion helper for alpha fill
      if (this.colorCode === 'R') ctx.fillStyle = 'rgba(255, 51, 51, 0.06)';
      else if (this.colorCode === 'G') ctx.fillStyle = 'rgba(51, 255, 51, 0.06)';
      else if (this.colorCode === 'B') ctx.fillStyle = 'rgba(51, 51, 255, 0.06)';
      else if (this.colorCode === 'Y') ctx.fillStyle = 'rgba(255, 255, 51, 0.06)';
      else if (this.colorCode === 'M') ctx.fillStyle = 'rgba(255, 51, 255, 0.06)';
      else if (this.colorCode === 'C') ctx.fillStyle = 'rgba(51, 255, 255, 0.06)';

      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const coneAngle = 0.4; // visual width
      const coneLength = 180;

      ctx.arc(cx, cy, coneLength, this.aimAngle - coneAngle, this.aimAngle + coneAngle);
      ctx.closePath();
      ctx.fill();

      // Light cone border lines
      ctx.strokeStyle = this.target ? 'rgba(255, 183, 0, 0.2)' : displayColor.replace('#', 'rgba(') + ', 0.2)';
      if (this.colorCode === 'R') ctx.strokeStyle = 'rgba(255, 51, 51, 0.2)';
      else if (this.colorCode === 'G') ctx.strokeStyle = 'rgba(51, 255, 51, 0.2)';
      else if (this.colorCode === 'B') ctx.strokeStyle = 'rgba(51, 51, 255, 0.2)';
      else if (this.colorCode === 'Y') ctx.strokeStyle = 'rgba(255, 255, 51, 0.2)';
      else if (this.colorCode === 'M') ctx.strokeStyle = 'rgba(255, 51, 255, 0.2)';
      else if (this.colorCode === 'C') ctx.strokeStyle = 'rgba(51, 255, 255, 0.2)';

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(this.aimAngle - coneAngle) * coneLength, cy + Math.sin(this.aimAngle - coneAngle) * coneLength);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(this.aimAngle + coneAngle) * coneLength, cy + Math.sin(this.aimAngle + coneAngle) * coneLength);
      ctx.stroke();
      ctx.restore();
    }

    // Floor shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, ry + this.height, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Visual position offset by Z height
    const gZ = this.z || 0;
    const ryOffset = ry - gZ;
    const cyOffset = cy - gZ;
    const facingLeft = Math.cos(this.aimAngle) < 0;

    // Draw Bipedal Reptile Guard
    // Get procedural vector animation offsets for guards (phase offset by id)
    const anim = VectorAnimator.getOffsets(this, Date.now() / 16 + this.id * 10);

    // Draw Bipedal Reptile Guard
    ctx.save();
    ctx.translate(cx, ryOffset + 50 + anim.bobY); // Center of 70x100 box + bobY
    if (facingLeft) {
      ctx.scale(-1, 1);
    }
    // Weight-shift lean into the direction of travel — gives the stride some life
    ctx.rotate(anim.leanAngle || 0);

    // Apply breathing scaling
    ctx.save();
    ctx.scale(1.0, anim.scaleY);

    // Colors
    const reptileSkinColor = '#22c55e'; // default green skin
    const reptileShadowSkin = '#16a34a';
    const armorColor = displayColor;
    // Darken armor color for duo-tone shadow
    // Quick helper to darken hex values slightly
    const darkenColor = (hex) => {
      if (hex === '#ff3333') return '#990000'; // red
      if (hex === '#33ff33') return '#009900'; // green
      if (hex === '#3333ff') return '#000099'; // blue
      if (hex === '#ffff33') return '#b2b200'; // yellow
      if (hex === '#ff33ff') return '#990099'; // magenta
      if (hex === '#33ffff') return '#009999'; // cyan
      return '#1e293b';
    };
    const armorShadow = darkenColor(armorColor);

    if (this.rank === 1) {
      // --- BIPEDAL LIZARD (Grunt) ---
      // Lizard Tail
      ctx.strokeStyle = reptileSkinColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      const tw = anim.tailWiggle;
      ctx.quadraticCurveTo(-22, 22 + tw, -32, 14 + tw);
      ctx.stroke();

      // Bipedal Legs & Boots with walking swing animations
      // Back leg
      ctx.save();
      ctx.translate(-9, 20);
      ctx.rotate(anim.legAngle1);
      ctx.fillStyle = '#334155'; // Dark grey uniform pants
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a'; // black boot
      ctx.fillRect(-5, 22, 9, 6);
      ctx.restore();

      // Front leg
      ctx.save();
      ctx.translate(9, 20);
      ctx.rotate(anim.legAngle2);
      ctx.fillStyle = '#1e293b'; // Shadow pants
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, 22, 9, 6);
      ctx.restore();

      // Torso & Armor Vest (Duo-tone)
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Torso skin shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, -25, 20, 50);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Vest Base
      ctx.fillStyle = armorColor;
      ctx.fillRect(-12, -10, 24, 25);
      // Vest Shadow overlay
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, -20, 20, 40);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.fillRect(-12, -10, 24, 25);
      ctx.restore();

      ctx.restore(); // End breathing scale

      // Head & Helmet
      const hY = -30 + anim.headBob;
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(3, hY, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head Shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 15, 23, 30);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(3, hY, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Helmet (Duo-tone)
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(2, hY - 2, 11.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 20, 22, 30);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.beginPath();
      ctx.arc(2, hY - 2, 11.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.restore();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(5, hY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(5, hY - 4, 0.8, 2);

    } else if (this.rank === 2) {
      // --- BIPEDAL SNAKE / COBRA (Corporal) ---
      // Sinuous Tail behind legs
      ctx.strokeStyle = armorColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      const tw = anim.tailWiggle;
      ctx.quadraticCurveTo(-24, 28 + tw, -32, 8 + tw);
      ctx.stroke();

      // Bipedal Legs & Boots with walking swing animations
      // Back leg
      ctx.save();
      ctx.translate(-9, 20);
      ctx.rotate(anim.legAngle1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 22, 9, 6);
      ctx.restore();

      // Front leg
      ctx.save();
      ctx.translate(9, 20);
      ctx.rotate(anim.legAngle2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, 22, 9, 6);
      ctx.restore();

      // Torso & Cobra Hood (Duo-tone shaded)
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.quadraticCurveTo(-28, -8, -12, 12);
      ctx.lineTo(12, 12);
      ctx.quadraticCurveTo(28, -8, 16, -20);
      ctx.closePath();
      ctx.fill();

      // Cobra Hood Shadow Overlay (left half)
      ctx.save();
      ctx.beginPath();
      ctx.rect(-30, -25, 30, 45);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.quadraticCurveTo(-28, -8, -12, 12);
      ctx.lineTo(12, 12);
      ctx.quadraticCurveTo(28, -8, 16, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Reptile green body core
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(0, 2, 12, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // End breathing scale

      // Snake Head (Bipedal Cobra head with head bob & tongue)
      const hY = -28 + anim.headBob;
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 15, 24, 30);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Flicking Red Tongue
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, hY);
      ctx.lineTo(16, hY - 2);
      ctx.moveTo(12, hY);
      ctx.lineTo(16, hY + 2);
      ctx.stroke();

      // Red slit eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(6, hY - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(6.2, hY - 2, 0.6, 2);

    } else if (this.rank === 3) {
      // --- BIPEDAL CHAMELEON (Commander) ---
      // Spiral Tail
      ctx.strokeStyle = reptileSkinColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      const tw = anim.tailWiggle;
      ctx.quadraticCurveTo(-22, 24 + tw, -24, 12 + tw);
      ctx.quadraticCurveTo(-26, 4 + tw, -18, 6 + tw);
      ctx.stroke();

      // Bipedal uniform legs walking swing
      // Back leg
      ctx.save();
      ctx.translate(-9, 20);
      ctx.rotate(anim.legAngle1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 22, 9, 6);
      ctx.restore();

      // Front leg
      ctx.save();
      ctx.translate(9, 20);
      ctx.rotate(anim.legAngle2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-3, 0, 6, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, 22, 9, 6);
      ctx.restore();

      // Main Torso with Chameleon colors
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(0, 2, 17, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body Shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, -25, 20, 50);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(0, 2, 17, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Chameleon tactical vest plates (Duo-tone shaded)
      ctx.fillStyle = armorColor;
      ctx.fillRect(-11, -8, 22, 20);
      ctx.save();
      ctx.rect(-20, -20, 20, 40);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.fillRect(-11, -8, 22, 20);
      ctx.restore();

      ctx.restore(); // End breathing scale

      // Head with crest & swivel eye (with head bob)
      const hY = -28 + anim.headBob;
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Back horn / crest
      ctx.beginPath();
      ctx.moveTo(-6, hY - 6);
      ctx.lineTo(-14, hY - 14);
      ctx.lineTo(-2, hY - 8);
      ctx.fill();

      // Head Shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 20, 24, 40);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Swivelling Eye (Duo-tone)
      const eyeAngle = Date.now() / 150 + this.id;
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(4, hY - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(4 + Math.cos(eyeAngle) * 1.5, -2 + hY + Math.sin(eyeAngle) * 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // --- BIPEDAL CROCODILE / ALLIGATOR (Admiral / Boss) ---
      // Spiked Tail
      ctx.strokeStyle = reptileSkinColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-10, 16);
      const tw = anim.tailWiggle;
      ctx.quadraticCurveTo(-26, 24 + tw, -34, 12 + tw);
      ctx.stroke();
      // Spikes on tail
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-16 - i * 5, 16 + tw);
        ctx.lineTo(-19 - i * 5, 10 + tw);
        ctx.lineTo(-22 - i * 5, 16 + tw);
        ctx.fill();
      }

      // Heavy Bipedal Legs & Iron Boots walking swing
      // Back leg
      ctx.save();
      ctx.translate(-10, 18);
      ctx.rotate(anim.legAngle1);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4.5, 0, 9, 26);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7.5, 22, 14, 9);
      ctx.restore();

      // Front leg
      ctx.save();
      ctx.translate(10, 18);
      ctx.rotate(anim.legAngle2);
      ctx.fillStyle = '#0f172a'; // Shadow leg
      ctx.fillRect(-4.5, 0, 9, 26);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4.5, 22, 14, 9);
      ctx.restore();

      // Massive Torso & Heavy Plate Armor (Duo-tone shaded)
      ctx.fillStyle = reptileSkinColor;
      ctx.fillRect(-18, -16, 36, 36);
      ctx.save();
      ctx.rect(-30, -25, 30, 50);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.fillRect(-18, -16, 36, 36);
      ctx.restore();

      // Armor plate
      ctx.fillStyle = armorColor;
      ctx.fillRect(-15, -14, 30, 32);
      ctx.save();
      ctx.rect(-30, -20, 30, 45);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.fillRect(-15, -14, 30, 32);
      ctx.restore();

      ctx.restore(); // End breathing scale

      // Crocodile Snout & Head (with head bob and teeth)
      const hY = -30 + anim.headBob;
      ctx.fillStyle = reptileSkinColor;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Long bipedal jaws
      ctx.fillRect(8, hY - 2, 15, 8);
      // Head Shadow
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 20, 24, 40);
      ctx.clip();
      ctx.fillStyle = reptileShadowSkin;
      ctx.beginPath();
      ctx.ellipse(4, hY, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // White Sharp Teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, hY + 4, 1.5, 2);
      ctx.fillRect(18, hY + 4, 1.5, 2);

      // Heavy armored helmet (Duo-tone)
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(2, hY - 2, 12.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, hY - 20, 22, 30);
      ctx.clip();
      ctx.fillStyle = armorShadow;
      ctx.beginPath();
      ctx.arc(2, hY - 2, 12.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.restore();

      // Angry yellow eye
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(3, hY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(2.8, hY - 3.5, 0.6, 3);
    }

    ctx.restore();

    // HP Bar
    const barW = (this.hp / this.maxHp) * this.width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(rx, ryOffset - 8, this.width, 4);
    ctx.fillStyle = displayColor;
    ctx.fillRect(rx, ryOffset - 8, barW, 4);

    // Draw Rank initials above HP bar
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(RANK_NAMES[this.rank], cx, ryOffset - 12);
    ctx.restore();

    // Draw Guard's dynamic arms holding weapon pointing at target
    ctx.save();
    const gAim = this.aimAngle;
    const gDist = 18;
    // When not actively aiming at a target, let the arms sway naturally with the gait
    const armSway = this.target ? 0 : (anim.armAngle1 || 0) * 6;
    const ggx = cx + Math.cos(gAim) * gDist;
    const ggy = cyOffset + Math.sin(gAim) * gDist + 4 + armSway;

    // Rear arm
    ctx.strokeStyle = '#334155'; // uniform grey sleeve
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 10 * Math.sin(gAim), cyOffset - 4 * Math.cos(gAim) - armSway);
    ctx.lineTo(ggx - 4 * Math.cos(gAim), ggy - 2 * Math.sin(gAim));
    ctx.stroke();

    ctx.strokeStyle = '#22c55e'; // green skin hand
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ggx - 4 * Math.cos(gAim), ggy - 2 * Math.sin(gAim));
    ctx.lineTo(ggx - 2 * Math.cos(gAim), ggy - 1 * Math.sin(gAim));
    ctx.stroke();

    // Guard Blaster
    ctx.save();
    ctx.translate(ggx, ggy);
    ctx.rotate(gAim);
    ctx.fillStyle = '#1e293b'; // slate dark gun body
    ctx.fillRect(-6, -3, 14, 6);
    ctx.fillStyle = '#ff0055'; // neon red/pink laser indicator
    ctx.fillRect(4, -2, 8, 4);
    ctx.restore();

    // Front arm
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 10 * Math.sin(gAim), cyOffset + 4 * Math.cos(gAim) + armSway);
    ctx.lineTo(ggx + 2 * Math.cos(gAim), ggy + 1 * Math.sin(gAim));
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ggx + 2 * Math.cos(gAim), ggy + 1 * Math.sin(gAim));
    ctx.lineTo(ggx + 4 * Math.cos(gAim), ggy + 2 * Math.sin(gAim));
    ctx.stroke();
    ctx.restore();
  }
}
