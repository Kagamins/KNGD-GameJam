import { VectorAnimator } from './vectorAnimator.js?v=36';

const playerParts = {
    torso: new Image(), head: new Image(), back_arm: new Image(),
    back_hand: new Image(), back_leg: new Image(), front_arm: new Image(),
    front_hand: new Image(), front_leg: new Image(), full: new Image()
};
playerParts.torso.src = 'assets/player/player_torso.svg';
playerParts.head.src = 'assets/player/player_head.svg';
playerParts.back_arm.src = 'assets/player/player_back-arm.svg';
playerParts.back_hand.src = 'assets/player/player_back-hand.svg';
playerParts.back_leg.src = 'assets/player/player_back-leg.svg';
playerParts.front_arm.src = 'assets/player/player_front-arm.svg';
playerParts.front_hand.src = 'assets/player/player_front-hand.svg';
playerParts.front_leg.src = 'assets/player/player_front-leg.svg';
playerParts.full.src = 'assets/player/player_player.svg';

const platformImage = new Image(); platformImage.src = 'assets/static/platform.png';
const houseImage = new Image(); houseImage.src = 'assets/static/House.png';
const treeImage = new Image(); treeImage.src = 'assets/static/tree.png';

const weaponImages = { gun: new Image(), shotgun: new Image() };
weaponImages.gun.src = 'assets/static/gun.png';
weaponImages.shotgun.src = 'assets/static/shotgun.png';

const enemyParts = {
    torso: new Image(), head: new Image(), l_arm: new Image(), r_arm: new Image(),
    l_leg: new Image(), r_leg: new Image(), l_boot: new Image(), r_boot: new Image()
};
enemyParts.torso.src = 'assets/enemy/Enemy_torso.svg';
enemyParts.head.src = 'assets/enemy/Enemy_enemy-head.svg';
enemyParts.l_arm.src = 'assets/enemy/Enemy_arm-l.svg';
enemyParts.r_arm.src = 'assets/enemy/Enemy_r-arm.svg';
enemyParts.l_leg.src = 'assets/enemy/Enemy_l-leg.svg';
enemyParts.r_leg.src = 'assets/enemy/Enemy_r-leg.svg';
enemyParts.l_boot.src = 'assets/enemy/Enemy_bootl.svg';
enemyParts.r_boot.src = 'assets/enemy/Enemy_bootr.svg';

const COLOR_MAP = { 'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff', 'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff' };
const RANK_NAMES = { 1: 'GRUNT', 2: 'CORPORAL', 3: 'COMMANDER', 4: 'ADMIRAL' };

export class GameRenderer {
    // ---- DAY/NIGHT TIMELINE SHADER SHIFTER ----
    static getAtmosphereAmbient() {
        const t = Date.now() / 14000; // Loop cycle frequency duration
        const pulse = (Math.sin(t) + 1) / 2; // Normalized range 0.0 to 1.0

        return {
            timeOfDay: pulse,
            // Color interpolation setups matching Day -> Sunset -> Midnight
            ambientColor: pulse > 0.5
                ? `rgba(15, 23, 42, ${0.62 * ((pulse - 0.5) * 2)})` // Dark slate night blue tint
                : `rgba(234, 88, 12, ${0.24 * (1 - (pulse * 2))})`, // Warm sunset orange bloom
            fogDensity: 0.12 + (1 - pulse) * 0.18, // Fog thickens during early midnight cycles
            fogColor: pulse > 0.4 ? '#091d2c' : '#fcd34d'
        };
    }

    // ---- BACKGROUND & SCENERY RENDERING ----
    static renderBackground(ctx, game) {
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 500;
        const t = Date.now();
        const atmos = this.getAtmosphereAmbient();

        // 1. Deep Ocean (Color grading dynamically shifted by global daylight parameters)
        const waterGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        if (atmos.timeOfDay > 0.5) {
            waterGrad.addColorStop(0, '#041e2c'); waterGrad.addColorStop(1, '#020f1a');
        } else {
            waterGrad.addColorStop(0, '#0a4a6b'); waterGrad.addColorStop(0.5, '#0e6b8a'); waterGrad.addColorStop(1, '#0c5670');
        }
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Animated Ripples
        ctx.save();
        ctx.globalAlpha = atmos.timeOfDay > 0.5 ? 0.04 : 0.10;
        ctx.strokeStyle = '#7ee8fa'; ctx.lineWidth = 2;
        const waveOffX = (-game.cameraX * 0.12) % 180;
        const waveOffY = (-game.cameraY * 0.08) % 90;
        for (let wy = waveOffY - 90; wy < CANVAS_HEIGHT + 90; wy += 45) {
            for (let wx = waveOffX - 180; wx < CANVAS_WIDTH + 180; wx += 180) {
                ctx.beginPath(); ctx.moveTo(wx, wy + Math.sin(t / 900 + wx / 120) * 6);
                ctx.bezierCurveTo(wx + 45, wy - 5, wx + 90, wy + 5, wx + 180, wy); ctx.stroke();
            }
        }
        ctx.restore();

        // 3. Sandy Beach
        const beachWorldTop = 40; const beachWorldBottom = 180;
        const beachTop = beachWorldTop - game.cameraY; const beachBottom = beachWorldBottom - game.cameraY;
        if (beachBottom > 0 && beachTop < CANVAS_HEIGHT) {
            const sandGrad = ctx.createLinearGradient(0, beachTop, 0, beachBottom);
            if (atmos.timeOfDay > 0.5) {
                sandGrad.addColorStop(0, '#473f2d'); sandGrad.addColorStop(1, '#242015');
            } else {
                sandGrad.addColorStop(0, '#f7e4aa'); sandGrad.addColorStop(0.6, '#e8c97a'); sandGrad.addColorStop(1, '#d4b455');
            }
            ctx.fillStyle = sandGrad;
            ctx.fillRect(0, Math.max(0, beachTop), CANVAS_WIDTH, Math.min(CANVAS_HEIGHT, beachBottom) - Math.max(0, beachTop));
        }

        // 4. Inland Terrain
        const grassWorldTop = beachWorldBottom; const grassTop = grassWorldTop - game.cameraY;
        if (grassTop < CANVAS_HEIGHT) {
            const grassGrad = ctx.createLinearGradient(0, grassTop, 0, CANVAS_HEIGHT);
            if (atmos.timeOfDay > 0.5) {
                grassGrad.addColorStop(0, '#143012'); grassGrad.addColorStop(1, '#091408');
            } else {
                grassGrad.addColorStop(0, '#3d8c3a'); grassGrad.addColorStop(0.4, '#2d6b2a'); grassGrad.addColorStop(1, '#1e4d1c');
            }
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, Math.max(0, grassTop), CANVAS_WIDTH, CANVAS_HEIGHT - Math.max(0, grassTop));
        }

        // 5. Palm Trees
        const totalLevelWidth = 1600;
        for (let tx = 60; tx < totalLevelWidth; tx += 200) {
            const rx = tx - game.cameraX; const ry = beachWorldTop - 70 - game.cameraY;
            if (rx + 80 < 0 || rx > CANVAS_WIDTH) continue;
            if (treeImage.complete && treeImage.naturalWidth > 0) {
                ctx.save(); ctx.translate(rx + 28, ry + 85); ctx.rotate(Math.sin(tx * 0.03) * 0.08);
                ctx.drawImage(treeImage, -28, -85, 55, 100); ctx.restore();
            }
        }
    }

    // ---- STATIC STRUCTURES ----
    static renderStaticBuilding(ctx, building, cameraX, cameraY) {
        const rx = building.x - cameraX; const ry = building.y - cameraY;
        ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath();
        ctx.ellipse(rx + building.w / 2, ry + building.h, building.w * 0.4, 15, 0, 0, Math.PI * 2); ctx.fill();
        if (houseImage.complete && houseImage.naturalWidth > 0) ctx.drawImage(houseImage, rx, ry, building.w, building.h);
        ctx.restore();
    }

    static renderPlatforms(ctx, game) {
        game.platforms.forEach(platform => {
            const rx = platform.x - game.cameraX; const ry = platform.y - game.cameraY;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; ctx.fillRect(rx - 4, ry + 12, platform.w + 8, platform.h - 8);
            if (platformImage.complete && platformImage.naturalWidth > 0) {
                ctx.drawImage(platformImage, rx, ry, platform.w, platform.h);
            } else {
                ctx.fillStyle = '#1e293b'; ctx.fillRect(rx, ry + 22, platform.w, platform.h - 22);
                ctx.fillStyle = '#475569'; ctx.fillRect(rx, ry, platform.w, 22);
            }
        });
    }

    static renderVehicles(ctx, game) {
        game.vehicles.forEach(v => {
            const rx = v.x - game.cameraX, ry = v.y - game.cameraY;
            ctx.save(); ctx.translate(rx, ry); ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; ctx.beginPath();
            ctx.ellipse(0, v.h / 2 - 2, v.w / 2 + 8, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(-v.w / 2 + 18, v.h / 2 - 4, 11, 0, Math.PI * 2); ctx.arc(v.w / 2 - 18, v.h / 2 - 4, 11, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = v.color; ctx.beginPath(); ctx.roundRect(-v.w / 2 - 4, -v.h / 2 + 6, v.w + 8, v.h - 10, 8); ctx.fill();
            ctx.fillStyle = '#00f2ff'; ctx.fillRect(-v.w / 2 + 18, -v.h / 2 - 2, 16, 7); ctx.fillRect(6, -v.h / 2 - 2, 20, 7); ctx.restore();
        });
    }

    static renderThrowables(ctx, game) {
        game.throwables.forEach(t => {
            let tx = t.x, ty = t.y, tz = t.z;
            if (t.state === 'held' && t.holder) { tx = t.holder.x + t.holder.width / 2 - t.w / 2; ty = t.holder.y - 38; tz = t.holder.z || 0; }
            const rx = tx - game.cameraX, ry = ty - game.cameraY - tz;
            if (rx + t.w > 0 && rx < 800) {
                if (t.state !== 'held') { ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; ctx.beginPath(); ctx.ellipse(rx + t.w / 2, ty + t.h - game.cameraY, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); }
                ctx.fillStyle = t.type === 'crate' ? '#b45309' : '#b91c1c'; ctx.fillRect(rx, ry, t.w, t.h);
            }
        });
    }

    static drawShadow(ctx, x, y) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)'; ctx.beginPath(); ctx.ellipse(x, y, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ---- GLOBAL ILLUMINATION (SCREEN SPACE LIGHT BOUNCE PASS) ----
    static applyGlobalIllumination(ctx, cx, cy, radius, lightColor) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen'; // Screen blend shader mode simulation
        const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        radGrad.addColorStop(0, lightColor);
        radGrad.addColorStop(0.3, lightColor + '44'); // Gradual dropoff alpha
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
    }

    // ---- LINEAR ATMOSPHERIC FOG ENGINE SCHEMATIC SHADER ----
    static applyAtmosphericFog(ctx) {
        const atmos = this.getAtmosphereAmbient();
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = atmos.fogDensity;
        ctx.fillStyle = atmos.fogColor;
        ctx.fillRect(0, 0, 800, 500); // Standard full frame overlay window clip bound
        ctx.restore();
    }

    // ---- PLAYER RENDERING ----
    static renderPlayer(ctx, player, isLocal, cameraX, cameraY, weapons, currentWepIdx) {
        const rx = player.x - cameraX, ry = player.y - cameraY;
        const facingLeft = (player.facing === 'left');
        const anim = VectorAnimator.getOffsets(player, Date.now() / 16);
        const armorColor = COLOR_MAP[player.illusionColor] || player.color || '#ff0055';

        ctx.save();
        ctx.translate(rx + player.width / 2, ry + player.height);
        this.drawShadow(ctx, 0, 0);

        ctx.translate(0, -(player.z || 0)); ctx.translate(0, anim.bobY);
        if (facingLeft) ctx.scale(-1, 1);
        ctx.rotate(anim.leanAngle || 0);

        if (player.camoActive) ctx.globalAlpha = 0.28;

        const partsLoaded = playerParts.torso.complete && playerParts.torso.naturalWidth > 0
            && playerParts.head.complete && playerParts.head.naturalWidth > 0
            && playerParts.back_leg.complete && playerParts.back_leg.naturalWidth > 0;

        if (partsLoaded) {
            // Body layer rendering stack execution sequence
            ctx.save(); ctx.translate(-6, -42); ctx.rotate(anim.legAngle2); ctx.drawImage(playerParts.back_leg, -6, 0, 12, 18); ctx.restore();
            ctx.save(); ctx.translate(8, -60); ctx.rotate(Math.PI / 6 + (facingLeft ? -anim.armAngle2 : anim.armAngle2)); ctx.drawImage(playerParts.back_arm, -6, 0, 12, 14); if (playerParts.back_hand.complete) ctx.drawImage(playerParts.back_hand, -5, 12, 10, 8); ctx.restore();

            ctx.save();
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = 32; tempCanvas.height = 32;
            const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage(playerParts.torso, 0, 0, 32, 32);
            tempCtx.globalCompositeOperation = 'source-in'; tempCtx.fillStyle = armorColor; tempCtx.fillRect(0, 0, 32, 32);
            ctx.drawImage(tempCanvas, -16, -68, 32, 32); ctx.restore();

            ctx.save(); ctx.translate(2, -72 + anim.headBob); ctx.drawImage(playerParts.head, -13, -13, 26, 26); ctx.restore();
            ctx.save(); ctx.translate(6, -42); ctx.rotate(anim.legAngle1); ctx.drawImage(playerParts.front_leg, -6, 0, 12, 18); ctx.restore();

            ctx.save(); ctx.translate(-8, -60); ctx.rotate(player.aimAngle); ctx.drawImage(playerParts.front_arm, -6, 0, 12, 14);
            if (playerParts.front_hand.complete) ctx.drawImage(playerParts.front_hand, -5, 12, 10, 8);
            this.drawWeapon(ctx, 4, 6, 0, weapons || ['blaster'], currentWepIdx, facingLeft); ctx.restore();
        } else if (playerParts.full.complete && playerParts.full.naturalWidth !== 0) {
            ctx.drawImage(playerParts.full, -35, -100, 70, 100);
        }
        ctx.restore();

        // Trigger GI radiosity pass around local player weapon positions
        if (!player.camoActive) {
            this.applyGlobalIllumination(ctx, rx + player.width / 2, ry + player.height - 50, 45, armorColor);
        }
    }

    // ---- GUARD RENDERING ----
    static renderGuard(ctx, guard, isLocal, cameraX, cameraY) {
        const rx = guard.x - cameraX, ry = guard.y - cameraY;
        const facingLeft = (guard.facing === 'left');
        const anim = VectorAnimator.getOffsets(guard, Date.now() / 16 + guard.id * 10);
        const armorColor = COLOR_MAP[guard.colorCode] || guard.color || '#ff0055';
        const skinColor = '#22c55e';

        ctx.save();
        ctx.translate(rx + guard.width / 2, ry + guard.height);
        this.drawShadow(ctx, 0, 0);

        ctx.translate(0, -(guard.z || 0)); ctx.translate(0, anim.bobY);
        if (facingLeft) ctx.scale(-1, 1);
        ctx.rotate(anim.leanAngle || 0);

        const headLoaded = enemyParts.head.complete && enemyParts.head.naturalWidth > 0;
        const torsoLoaded = enemyParts.torso.complete && enemyParts.torso.naturalWidth > 0;

        if (headLoaded && torsoLoaded) {
            ctx.save();
            if (guard.rank === 3) {
                ctx.strokeStyle = skinColor; ctx.lineWidth = 5.0; ctx.beginPath(); ctx.moveTo(-10, -32);
                ctx.bezierCurveTo(-22, -26, -28, -38, -26, -50); ctx.bezierCurveTo(-24, -60, -14, -60, -12, -54); ctx.stroke();
            } else if (guard.rank === 4 || guard.isBoss) {
                ctx.fillStyle = skinColor; ctx.beginPath(); ctx.moveTo(-10, -38); ctx.lineTo(-35, -25 + (anim.tailWiggle || 0)); ctx.lineTo(-10, -26); ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            ctx.save(); ctx.translate(-6, -42); ctx.rotate(anim.legAngle2); ctx.drawImage(enemyParts.l_leg, -6, 0, 12, 14); if (enemyParts.l_boot.complete) ctx.drawImage(enemyParts.l_boot, -6, 10, 12, 6); ctx.restore();
            ctx.save(); ctx.translate(8, -58); ctx.rotate(guard.aimAngle + Math.PI / 6); ctx.drawImage(enemyParts.l_arm, -6, 0, 12, 14); ctx.restore();

            ctx.save();
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = 28; tempCanvas.height = 28;
            const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage(enemyParts.torso, 0, 0, 28, 28);
            tempCtx.globalCompositeOperation = 'source-in'; tempCtx.fillStyle = armorColor; tempCtx.fillRect(0, 0, 28, 28);
            ctx.drawImage(tempCanvas, -14, -64, 28, 28); ctx.restore();

            ctx.save(); ctx.translate(2, -70 + anim.headBob); ctx.scale(-1, 1); ctx.drawImage(enemyParts.head, -12, -12, 24, 24);
            if (guard.rank === 2) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-16 - Math.sin(Date.now() / 40) * 3, 2); ctx.stroke(); }
            ctx.restore();

            ctx.save(); ctx.translate(4, -42); ctx.rotate(anim.legAngle1); ctx.drawImage(enemyParts.r_leg, -6, 0, 12, 14); if (enemyParts.r_boot.complete) ctx.drawImage(enemyParts.r_boot, -6, 10, 12, 6); ctx.restore();
            ctx.save(); ctx.translate(-8, -58); ctx.rotate(guard.aimAngle); ctx.drawImage(enemyParts.r_arm, -6, 0, 12, 14);
            this.drawWeapon(ctx, 4, 6, 0, [guard.weapon || 'blaster'], 0, facingLeft); ctx.restore();
        }
        ctx.restore();

        // Health UI frame tracking layers
        ctx.save();
        const barW = (guard.hp / guard.maxHp) * guard.width; const barY = ry - (guard.z || 0) - 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(rx, barY, guard.width, 4);
        ctx.fillStyle = armorColor; ctx.fillRect(rx, barY, barW, 4);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px Orbitron, monospace'; ctx.textAlign = 'center'; ctx.fillText(RANK_NAMES[guard.rank], rx + guard.width / 2, barY - 4);
        ctx.restore();

        // Faction ambient radiation bounce pass
        this.applyGlobalIllumination(ctx, rx + guard.width / 2, ry + guard.height - 40, 35, armorColor);
    }

    static drawWeapon(ctx, gx, gy, aimAngle, weapons, currentWepIdx, facingLeft = false) {
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(aimAngle);
        if (facingLeft) ctx.scale(1, -1);
        const currentWep = (weapons && currentWepIdx !== null) ? weapons[currentWepIdx] : 'blaster';

        if (currentWep === 'shotgun' && weaponImages.shotgun.complete && weaponImages.shotgun.naturalWidth > 0) {
            ctx.drawImage(weaponImages.shotgun, 0, -6, 32, 12);
        } else if ((currentWep === 'blaster' || currentWep === 'railgun') && weaponImages.gun.complete && weaponImages.gun.naturalWidth > 0) {
            ctx.drawImage(weaponImages.gun, 0, -5, 26, 10);
        } else {
            if (currentWep === 'railgun') { ctx.fillStyle = '#1e293b'; ctx.fillRect(-8, -4, 22, 7); ctx.fillStyle = '#00f2ff'; ctx.fillRect(6, -3, 14, 5); }
            else if (currentWep === 'shotgun') { ctx.fillStyle = '#b45309'; ctx.fillRect(-8, -3, 10, 6); ctx.fillStyle = '#475569'; ctx.fillRect(0, -3, 18, 5); }
            else { ctx.fillStyle = '#334155'; ctx.fillRect(-6, -3, 14, 6); ctx.fillStyle = '#3cff00'; ctx.fillRect(4, -2, 10, 4); }
        }
        ctx.restore();
    }

    // ---- SCREEN-SPACE POST PROCESSING HUD OVERLAYS ----
    static renderUI(ctx, game) {
        const CANVAS_WIDTH = 800; const CANVAS_HEIGHT = 500;
        const atmos = this.getAtmosphereAmbient();

        // Apply lighting ambient shroud context mask overlay layer
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; // Shading shader multiply mode simulation
        ctx.fillStyle = atmos.ambientColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        // Process linear height-fog layers
        this.applyAtmosphericFog(ctx);

        // Vignette post-processing filter
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < CANVAS_HEIGHT; y += 3) ctx.fillRect(0, y, CANVAS_WIDTH, 1);
        const vignette = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)'); vignette.addColorStop(1, 'rgba(0, 0, 0, 0.40)');
        ctx.fillStyle = vignette; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }
}