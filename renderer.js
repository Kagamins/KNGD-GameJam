import { VectorAnimator } from './vectorAnimator.js?v=35';

const playerParts = {
  torso: new Image(),
  head: new Image(),
  back_arm: new Image(),
  back_hand: new Image(),
  back_leg: new Image(),
  front_arm: new Image(),
  front_hand: new Image(),
  front_leg: new Image(),
  full: new Image()
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

const platformImage = new Image();
platformImage.src = 'assets/static/platform.png';
const houseImage = new Image();
houseImage.src = 'assets/static/House.png';
const treeImage = new Image();
treeImage.src = 'assets/static/tree.png';

// Weapon sprites
const weaponImages = {
  gun: new Image(),
  shotgun: new Image()
};
weaponImages.gun.src = 'assets/static/gun.png';
weaponImages.shotgun.src = 'assets/static/shotgun.png';

const enemySVG = new Image();
enemySVG.src = 'assets/enemy/Enemy_enemy.svg';

const enemyParts = {
  torso: new Image(),
  head: new Image(),
  l_arm: new Image(),
  r_arm: new Image(),
  l_leg: new Image(),
  r_leg: new Image(),
  l_boot: new Image(),
  r_boot: new Image()
};
enemyParts.torso.src = 'assets/enemy/Enemy_torso.svg';
enemyParts.head.src = 'assets/enemy/Enemy_enemy-head.svg';
enemyParts.l_arm.src = 'assets/enemy/Enemy_arm-l.svg';
enemyParts.r_arm.src = 'assets/enemy/Enemy_r-arm.svg';
enemyParts.l_leg.src = 'assets/enemy/Enemy_l-leg.svg';
enemyParts.r_leg.src = 'assets/enemy/Enemy_r-leg.svg';
enemyParts.l_boot.src = 'assets/enemy/Enemy_bootl.svg';
enemyParts.r_boot.src = 'assets/enemy/Enemy_bootr.svg';

const GECKO_PATHS = {
  torso: "m 50.788117,102.13231 -0.695095,1.15848 0.556075,1.62189 -1.204828,0.32437 -1.760903,3.15109 0.417058,4.12422 1.714561,4.12422 0.556075,2.08528 0.509735,5.65342 2.734032,1.01946 5.282704,5.42173 2.363317,-0.74143 4.355914,-4.26324 0.88045,-2.2243 -0.324376,-8.61915 0.648753,-0.92679 0.370718,-1.39018 -0.695095,-4.03154 -1.807239,-2.68769 -0.324379,-0.37072 -0.09268,-1.7609 -1.992598,0.60241 -1.204828,3.05841 -1.621883,0.18536 -1.112149,-3.10475 -2.548673,-0.41706 -3.058409,-0.78777 z",
  head: "m 59.406554,107.73786 c 1.703882,0 1.212376,0.0983 1.703882,0 0.491506,-0.0983 0.851942,-3.21116 0.851942,-3.21116 0,0 5.865292,-1.93325 6.586165,-3.40777 0.720873,-1.474514 0.458741,-3.407766 -0.327671,-3.276697 -0.786408,0.131067 0.232574,-9.058794 -5.734222,-5.34102 -4.25971,2.654127 -0.897825,-7.472688 -10.714807,2.293689 -6.356796,6.324028 0.119498,8.112228 1.310679,8.617718 1.707629,0.72466 4.620147,1.04854 4.620147,1.04854 z",
  l_thigh: "m 54.703804,136.80585 -3.498632,0.45181 -3.672407,-0.93838 -1.47128,2.90781 -0.370717,2.20113 -0.278038,6.40643 -0.532904,1.78408 c 0.0168,0.31036 1.40177,0.77233 1.957844,0.88046 l 2.849883,-0.37072 0.104265,-2.58343 2.062108,-4.68029 1.482865,-1.80725 z",
  l_leg: "m 61.07549,135.82114 0.04634,2.82671 -0.139017,2.87305 1.297506,3.15109 0.324376,1.85358 -0.04634,1.25117 2.548673,1.01946 2.409656,-0.74143 -0.602414,-1.7609 0.04634,-1.29751 0.463394,-3.70716 0.648753,-3.70716 0.509736,-2.64135 -5.69976,-0.78777 z",
  l_foot: "m 49.652798,150.07054 0.06951,2.31698 0.09268,1.11214 0.509735,1.08898 -0.94996,0.97313 -1.112149,-0.11584 -0.370716,-1.9231 -0.78777,-0.0927 -0.764604,1.83041 -1.181658,0.0463 -1.227997,-0.78777 1.274336,-1.62189 -1.297506,1.57554 -0.301207,0.37072 -1.691391,-0.16219 0.162187,-1.32067 1.297506,-0.57925 1.506035,-3.31327 1.87675,-0.44023 z",
  r_thigh: "m 59.082889,130.67745 c 1.158489,3.15109 1.158489,3.15109 1.158489,3.15109 l 1.06581,2.03894 3.382785,2.36331 3.058406,1.15849 0.880452,-1.80724 -0.370716,-3.7535 -0.648753,-5.9778 -1.11215,-6.07048 -3.058408,0.97313 -3.290105,5.19003 z",
  r_leg: "m 61.07549,135.82114 0.04634,2.82671 -0.139017,2.87305 1.297506,3.15109 0.324376,1.85358 -0.04634,1.25117 2.548673,1.01946 2.409656,-0.74143 -0.602414,-1.7609 0.04634,-1.29751 0.463394,-3.70716 0.648753,-3.70716 0.509736,-2.64135 -5.69976,-0.78777 z",
  r_foot: "m 62.604694,147.63772 -0.417057,0.88045 0.11585,1.50603 0.857282,0.85728 6.163156,1.11215 1.598713,0.25487 0.648753,-1.20483 -2.224296,-0.69509 -1.645055,-0.69509 1.529205,0.62558 2.201126,0.71826 -0.09268,0.78777 2.363317,-0.23169 0.370715,-1.04264 c 0,0 -1.923089,-0.30121 -2.03894,-0.30121 -0.115847,0 -0.857279,-0.27804 -0.857279,-0.27804 l 2.108446,0.4634 0.440227,0.0695 0.139018,0.9963 1.320678,-0.64876 -0.254868,-1.2975 -1.737733,-0.0463 -3.197426,-0.57925 -2.409656,-1.59871 -2.177957,0.13902 z",
  l_shoulder: "m 52.459951,108.26214 -0.393204,3.9648 -3.473302,4.71844 c 0,0 -2.766365,-0.7655 -3.407766,-1.04854 -0.432346,-0.19079 -1.441747,-1.76941 -1.441747,-1.76941 l 2.195389,-6.3568 2.981795,-2.09709 c 3.60437,-0.58981 3.538835,2.5886 3.538835,2.5886 z",
  l_arm: "m 48.429611,116.87985 c -0.393203,1.73665 -0.393203,1.73665 -0.393203,1.73665 l -0.851942,5.50486 -0.13107,1.47451 -2.850726,-0.0983 -1.212379,0.75364 -0.06553,-3.50607 -0.557038,-3.9648 0.327671,-2.9818 0.983009,-1.63835 1.245145,1.50728 z",
  l_hand: "m 47.118931,125.3665 1.671116,1.60558 1.146844,2.55583 -0.753639,1.11408 -1.048543,-0.62257 -0.294905,-1.44175 -0.557038,-0.58981 0.327671,1.47452 0.884708,1.67111 0.262136,-0.32767 0.163835,1.80219 -1.310679,0.65534 -1.212379,-0.78641 -1.08131,-3.1784 1.015775,3.14563 -1.703882,-0.2949 -0.720873,-0.65534 -0.393206,-2.06432 0.491506,2.35922 -1.671116,-1.14684 0.393203,-4.62015 1.63835,-0.85194 z",
  r_shoulder: "m 32.31369,113.77172 -1.283445,3.77188 1.208321,5.73301 c 0,0 2.835082,0.44841 3.536113,0.4563 0.472542,0.005 2.044909,-1.0138 2.044909,-1.0138 l 0.6332,-6.69535 -1.846112,-3.14337 c -3.036824,-2.02905 -4.292986,0.89133 -4.292986,0.89133 z",
  r_arm: "m 48.434662,116.88469 c -0.344341,1.54338 -0.344341,1.54338 -0.344341,1.54338 l -0.740719,4.89335 -0.112028,1.31099 -2.535506,-0.0954 -1.075873,0.66685 -0.06906,-3.1183 -0.507578,-3.52765 0.282234,-2.65094 0.86917,-1.45431 1.111966,1.34398 z",
  r_hand: "m 37.161591,129.96299 -0.05085,2.31688 0.991203,2.62012 1.320178,0.25744 0.303509,-1.18107 -0.808549,-1.22957 -0.02159,-0.81099 0.808462,1.27592 0.552549,1.80831 -0.416964,-0.0472 1.155782,1.39244 1.391085,-0.46068 0.303958,-1.41277 -1.476999,-3.01495 1.500302,2.94548 0.999051,-1.41141 0.04823,-0.97304 -1.17827,-1.74003 1.316746,2.01834 0.374598,-1.99187 -3.539149,-2.9958 -1.76198,0.55264 z",
  shadow: "m 50.788117,102.13231 c 0,0 0.857279,0.27804 0.857279,0.27804 l -2.108446,-0.4634 -0.440227,-0.0695 -0.139018,-0.9963 -1.320678,0.64876 0.254868,1.2975 1.737733,0.0463 3.197426,0.57925 2.409656,1.59871 2.177957,-0.13902 z"
};

function drawSVGPath(ctx, pathStr, scale = 1.0, offsetX = 0, offsetY = 0, originX = 57, originY = 116) {
  ctx.beginPath();
  const tokens = pathStr.match(/[a-df-z]|-?\d+(\.\d+)?/gi) || [];
  let currentCmd = '';
  let cx = 0, cy = 0;
  let i = 0;

  // Organic wobble path manipulation
  const wobbleX = Math.sin(Date.now() / 220) * 0.35;
  const wobbleY = Math.cos(Date.now() / 180) * 0.35;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[a-df-z]/i.test(token)) {
      currentCmd = token;
      i++;
    }

    if (currentCmd === 'm') {
      const dx = parseFloat(tokens[i++]) || 0;
      const dy = parseFloat(tokens[i++]) || 0;
      cx += dx;
      cy += dy;
      ctx.moveTo(((cx - originX) + wobbleX) * scale + offsetX, ((cy - originY) + wobbleY) * scale + offsetY);
    } else if (currentCmd === 'M') {
      cx = parseFloat(tokens[i++]) || 0;
      cy = parseFloat(tokens[i++]) || 0;
      ctx.moveTo(((cx - originX) + wobbleX) * scale + offsetX, ((cy - originY) + wobbleY) * scale + offsetY);
    } else if (currentCmd === 'c') {
      const dx1 = parseFloat(tokens[i++]) || 0;
      const dy1 = parseFloat(tokens[i++]) || 0;
      const dx2 = parseFloat(tokens[i++]) || 0;
      const dy2 = parseFloat(tokens[i++]) || 0;
      const dx = parseFloat(tokens[i++]) || 0;
      const dy = parseFloat(tokens[i++]) || 0;
      ctx.bezierCurveTo(
        ((cx + dx1 - originX) + wobbleX) * scale + offsetX, ((cy + dy1 - originY) + wobbleY) * scale + offsetY,
        ((cx + dx2 - originX) + wobbleX) * scale + offsetX, ((cy + dy2 - originY) + wobbleY) * scale + offsetY,
        ((cx + dx - originX) + wobbleX) * scale + offsetX, ((cy + dy - originY) + wobbleY) * scale + offsetY
      );
      cx += dx;
      cy += dy;
    } else if (currentCmd === 'C') {
      const x1 = parseFloat(tokens[i++]) || 0;
      const y1 = parseFloat(tokens[i++]) || 0;
      const x2 = parseFloat(tokens[i++]) || 0;
      const y2 = parseFloat(tokens[i++]) || 0;
      const x = parseFloat(tokens[i++]) || 0;
      const y = parseFloat(tokens[i++]) || 0;
      ctx.bezierCurveTo(
        ((x1 - originX) + wobbleX) * scale + offsetX, ((y1 - originY) + wobbleY) * scale + offsetY,
        ((x2 - originX) + wobbleX) * scale + offsetX, ((y2 - originY) + wobbleY) * scale + offsetY,
        ((x - originX) + wobbleX) * scale + offsetX, ((y - originY) + wobbleY) * scale + offsetY
      );
      cx = x;
      cy = y;
    } else if (currentCmd === 'l' || (currentCmd === 'm' && i < tokens.length && !/[a-df-z]/i.test(tokens[i]))) {
      const dx = parseFloat(tokens[i++]) || 0;
      const dy = parseFloat(tokens[i++]) || 0;
      cx += dx;
      cy += dy;
      ctx.lineTo(((cx - originX) + wobbleX) * scale + offsetX, ((cy - originY) + wobbleY) * scale + offsetY);
    } else if (currentCmd === 'L') {
      cx = parseFloat(tokens[i++]) || 0;
      cy = parseFloat(tokens[i++]) || 0;
      ctx.lineTo(((cx - originX) + wobbleX) * scale + offsetX, ((cy - originY) + wobbleY) * scale + offsetY);
    } else if (currentCmd === 'z' || currentCmd === 'Z') {
      ctx.closePath();
      i++;
    } else {
      i++;
    }
  }
}

const COLOR_VALUES = {
  'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff',
  'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff'
};

const COLOR_MAP = {
  'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff',
  'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff'
};

const RANK_NAMES = {
  1: 'GRUNT', 2: 'CORPORAL', 3: 'COMMANDER', 4: 'ADMIRAL'
};

export class GameRenderer {
  // ---- BACKGROUND & SCENERY RENDERING — ISLAND AESTHETIC ----
  static renderBackground(ctx, game) {
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 500;
    const t = Date.now();

    // --- 1. DEEP OCEAN WATER FILL ---
    const waterGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    waterGrad.addColorStop(0, '#0a4a6b');
    waterGrad.addColorStop(0.5, '#0e6b8a');
    waterGrad.addColorStop(1, '#0c5670');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- 2. ANIMATED WAVE RIPPLES ---
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = '#7ee8fa';
    ctx.lineWidth = 2;
    const waveOffX = (-game.cameraX * 0.12) % 180;
    const waveOffY = (-game.cameraY * 0.08) % 90;
    for (let wy = waveOffY - 90; wy < CANVAS_HEIGHT + 90; wy += 45) {
      for (let wx = waveOffX - 180; wx < CANVAS_WIDTH + 180; wx += 180) {
        const wave = Math.sin(t / 900 + wx / 120) * 6;
        ctx.beginPath();
        ctx.moveTo(wx, wy + wave);
        ctx.bezierCurveTo(wx + 45, wy + wave - 5, wx + 90, wy + wave + 5, wx + 180, wy + wave);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // --- 3. SANDY BEACH BAND (horizontal stripe in world-space) ---
    // Beach sits at y=40 to y=160 in world space
    const beachWorldTop = 40;
    const beachWorldBottom = 180;
    const beachTop = beachWorldTop - game.cameraY;
    const beachBottom = beachWorldBottom - game.cameraY;
    if (beachBottom > 0 && beachTop < CANVAS_HEIGHT) {
      const sandGrad = ctx.createLinearGradient(0, beachTop, 0, beachBottom);
      sandGrad.addColorStop(0, '#f7e4aa');
      sandGrad.addColorStop(0.6, '#e8c97a');
      sandGrad.addColorStop(1, '#d4b455');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, Math.max(0, beachTop), CANVAS_WIDTH, Math.min(CANVAS_HEIGHT, beachBottom) - Math.max(0, beachTop));

      // Wave foam edge at water-beach boundary
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#d0f4ff';
      const foamY = beachTop;
      for (let fx = (-game.cameraX * 0.15 + t / 60) % 80 - 80; fx < CANVAS_WIDTH + 80; fx += 80) {
        const foamOffset = Math.sin(t / 700 + fx / 90) * 5;
        ctx.beginPath();
        ctx.ellipse(fx + 40, foamY + foamOffset, 40, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // Beach texture dots (pebbles/shells)
      ctx.save();
      ctx.fillStyle = 'rgba(200,170,90,0.55)';
      const pebbleSeed = 7;
      for (let pi = 0; pi < 28; pi++) {
        const px = ((pi * 137 + 31) % 1600) - game.cameraX;
        const py = beachWorldTop + ((pi * 97 + 13) % (beachWorldBottom - beachWorldTop)) - game.cameraY;
        if (px > -10 && px < CANVAS_WIDTH + 10 && py > 0 && py < CANVAS_HEIGHT) {
          ctx.beginPath();
          ctx.ellipse(px, py, 3 + (pi % 3), 2 + (pi % 2), pi * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // --- 4. INLAND TERRAIN (grass/jungle floor) below beach ---
    const grassWorldTop = beachWorldBottom;
    const grassTop = grassWorldTop - game.cameraY;
    if (grassTop < CANVAS_HEIGHT) {
      const grassGrad = ctx.createLinearGradient(0, grassTop, 0, CANVAS_HEIGHT);
      grassGrad.addColorStop(0, '#3d8c3a');
      grassGrad.addColorStop(0.4, '#2d6b2a');
      grassGrad.addColorStop(1, '#1e4d1c');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, Math.max(0, grassTop), CANVAS_WIDTH, CANVAS_HEIGHT - Math.max(0, grassTop));

      // Scattered tropical undergrowth blobs
      ctx.save();
      ctx.globalAlpha = 0.30;
      for (let bi = 0; bi < 40; bi++) {
        const bx = ((bi * 211 + 53) % 1560 + 40) - game.cameraX;
        const by = ((bi * 173 + 67) % 900 + grassWorldTop + 20) - game.cameraY;
        if (bx > -40 && bx < CANVAS_WIDTH + 40 && by > 0 && by < CANVAS_HEIGHT) {
          ctx.fillStyle = (bi % 3 === 0) ? '#4ade80' : (bi % 3 === 1) ? '#22c55e' : '#15803d';
          ctx.beginPath();
          ctx.ellipse(bx, by, 18 + (bi % 12), 11 + (bi % 8), bi * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.restore();
    }

    // --- 5. ISLAND OUTPOST STRUCTURES (thatched huts instead of cyberpunk towers) ---
    game.buildings.forEach(b => {
      const rx = b.x - game.cameraX;
      const ry = b.y - game.cameraY;
      if (rx + b.w < 0 || rx > CANVAS_WIDTH) return;

      // Hut base — sandy wood planks
      ctx.fillStyle = '#b5813a';
      ctx.fillRect(rx, ry + 20, b.w, b.h - 20);

      // Side shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(rx, ry + 20, b.w * 0.35, b.h - 20);
      ctx.restore();

      // Plank lines
      ctx.save();
      ctx.strokeStyle = '#8b5e20';
      ctx.lineWidth = 1.5;
      for (let ply = ry + 30; ply < ry + b.h; ply += 16) {
        ctx.beginPath();
        ctx.moveTo(rx + 4, ply);
        ctx.lineTo(rx + b.w - 4, ply);
        ctx.stroke();
      }
      ctx.restore();

      // Thatched roof (triangle)
      ctx.fillStyle = '#c8a84b';
      ctx.beginPath();
      ctx.moveTo(rx - 10, ry + 24);
      ctx.lineTo(rx + b.w / 2, ry - 10);
      ctx.lineTo(rx + b.w + 10, ry + 24);
      ctx.closePath();
      ctx.fill();

      // Roof texture lines
      ctx.save();
      ctx.strokeStyle = '#a07830';
      ctx.lineWidth = 1;
      for (let ri = 0; ri < 5; ri++) {
        const rly = ry + 4 + ri * 6;
        const rWidth = (ri / 5) * (b.w + 20);
        ctx.beginPath();
        ctx.moveTo(rx + b.w / 2 - rWidth / 2, rly);
        ctx.lineTo(rx + b.w / 2 + rWidth / 2, rly);
        ctx.stroke();
      }
      ctx.restore();

      // Roof overhang shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(rx, ry + 20, b.w, 10);

      // Doorway
      ctx.fillStyle = '#3d1f05';
      const doorW = Math.min(26, b.w * 0.25);
      ctx.fillRect(rx + b.w / 2 - doorW / 2, ry + b.h - 36, doorW, 36);

      // Name sign on hut
      ctx.save();
      ctx.fillStyle = '#f7e4aa';
      ctx.font = 'bold 7px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, rx + b.w / 2, ry + 16);
      ctx.restore();
    });

    // --- 6. PALM TREES along the beach line ---
    const palmSpacing = 200;
    const totalLevelWidth = 1600;
    for (let tx = 60; tx < totalLevelWidth; tx += palmSpacing) {
      const rx = tx - game.cameraX;
      // Place palms at beach top edge
      const ry = beachWorldTop - 70 - game.cameraY;
      if (rx + 80 < 0 || rx > CANVAS_WIDTH) continue;

      if (treeImage.complete && treeImage.naturalWidth > 0) {
        // Slight tilt using canvas transform
        const tilt = Math.sin(tx * 0.03) * 0.08;
        ctx.save();
        ctx.translate(rx + 28, ry + 85);
        ctx.rotate(tilt);
        ctx.drawImage(treeImage, -28, -85, 55, 100);
        ctx.restore();
      } else {
        // Procedural palm fallback
        ctx.save();
        const palmTrunkX = rx + 20;
        const palmBaseY = ry + 90;
        // Trunk
        ctx.strokeStyle = '#8b5e20';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(palmTrunkX, palmBaseY);
        ctx.bezierCurveTo(palmTrunkX + 5, palmBaseY - 30, palmTrunkX - 3, palmBaseY - 60, palmTrunkX + 8, palmBaseY - 85);
        ctx.stroke();
        // Fronds
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        for (let fi = 0; fi < 6; fi++) {
          const angle = (fi / 6) * Math.PI * 2;
          const fx = palmTrunkX + 8 + Math.cos(angle) * 28;
          const fy = palmBaseY - 85 + Math.sin(angle) * 14;
          ctx.beginPath();
          ctx.moveTo(palmTrunkX + 8, palmBaseY - 85);
          ctx.quadraticCurveTo(palmTrunkX + 8 + Math.cos(angle) * 14, palmBaseY - 85 + Math.sin(angle) * 7, fx, fy);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
  // Add this to your GameRenderer object in renderer.js
  static renderStaticBuilding(ctx, building, cameraX, cameraY) {
    const rx = building.x - cameraX;
    const ry = building.y - cameraY;

    // Optional: Add a shadow to match the platform style
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(rx + building.w / 2, ry + building.h, building.w * 0.4, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    if (building.image && building.image.complete) {
      ctx.drawImage(building.image, rx, ry, building.w, building.h);
    }
  }
  // ---- OBJECT RENDERING ----
  static renderPlatforms(ctx, game) {
    game.platforms.forEach(platform => {
      const rx = platform.x - game.cameraX;
      const ry = platform.y - game.cameraY;
      const topHeight = 22;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(rx - 4, ry + 12, platform.w + 8, platform.h - 8);

      if (platformImage.complete && platformImage.naturalWidth > 0) {
        ctx.drawImage(platformImage, rx, ry, platform.w, platform.h);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(rx, ry + topHeight, platform.w, platform.h - topHeight);

        ctx.fillStyle = '#0f172a';
        for (let bx = rx + 12; bx < rx + platform.w - 12; bx += 32) {
          ctx.fillRect(bx, ry + topHeight + 6, 8, platform.h - topHeight - 12);
        }

        ctx.fillStyle = '#475569';
        ctx.fillRect(rx, ry, platform.w, topHeight);
      }
    });
  }

  static renderVehicles(ctx, game) {
    game.vehicles.forEach(v => {
      const rx = v.x - game.cameraX, ry = v.y - game.cameraY;

      ctx.save();
      ctx.translate(rx, ry);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, v.h / 2 - 2, v.w / 2 + 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-v.w / 2 + 18, v.h / 2 - 4, 11, 0, Math.PI * 2);
      ctx.arc(v.w / 2 - 18, v.h / 2 - 4, 11, 0, Math.PI * 2);
      ctx.fill();
      // Hubcaps
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(-v.w / 2 + 18, v.h / 2 - 4, 5, 0, Math.PI * 2);
      ctx.arc(v.w / 2 - 18, v.h / 2 - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Lower Chassis (sun-bleached jungle jeep styling)
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-v.w / 2 - 4, -v.h / 2 + 6, v.w + 8, v.h - 10, 8);
      ctx.fill();

      // Shadow Overlay (Duo-tone split)
      ctx.save();
      ctx.beginPath();
      ctx.rect(-v.w / 2 - 6, -v.h / 2, v.w / 2 + 6, v.h + 10);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.roundRect(-v.w / 2 - 4, -v.h / 2 + 6, v.w + 8, v.h - 10, 8);
      ctx.fill();
      ctx.restore();

      // Upper Cabin/Roof
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-v.w / 2 + 10, -v.h / 2 - 6, v.w - 20, 14, [8, 8, 0, 0]);
      ctx.fill();

      // Cabin Shadow split
      ctx.save();
      ctx.beginPath();
      ctx.rect(-v.w / 2, -v.h / 2 - 10, v.w / 2, 20);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.roundRect(-v.w / 2 + 10, -v.h / 2 - 6, v.w - 20, 14, [8, 8, 0, 0]);
      ctx.fill();
      ctx.restore();

      // Windows
      ctx.fillStyle = '#00f2ff';
      ctx.fillRect(-v.w / 2 + 18, -v.h / 2 - 2, 16, 7);
      ctx.fillRect(6, -v.h / 2 - 2, 20, 7);

      // Lights & Exhaust pipe details
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(v.w / 2 + 2, -v.h / 2 + 10, 3, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-v.w / 2 - 4, -v.h / 2 + 10, 3, 5);

      ctx.restore();
    });
  }

  static renderThrowables(ctx, game) {
    game.throwables.forEach(t => {
      let tx = t.x, ty = t.y, tz = t.z;

      if (t.state === 'held' && t.holder) {
        tx = t.holder.x + t.holder.width / 2 - t.w / 2;
        ty = t.holder.y - 38;
        tz = t.holder.z || 0;
      }

      const rx = tx - game.cameraX;
      const ry = ty - game.cameraY - tz;

      if (rx + t.w > 0 && rx < 800) {
        if (t.state !== 'held') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(rx + t.w / 2, ty + t.h - game.cameraY, 11, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (t.type === 'crate') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(rx, ry, t.w, t.h);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(rx, ry, t.w / 2, t.h);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx + 2, ry + 2, t.w - 4, t.h - 4);

          ctx.beginPath();
          ctx.moveTo(rx + 3, ry + 3); ctx.lineTo(rx + t.w - 3, ry + t.h - 3);
          ctx.moveTo(rx + t.w - 3, ry + 3); ctx.lineTo(rx + 3, ry + t.h - 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.roundRect(rx + 2, ry, t.w - 4, t.h, 4);
          ctx.fill();

          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.roundRect(rx + 2, ry, (t.w - 4) / 2, t.h, [4, 0, 0, 4]);
          ctx.fill();

          ctx.fillStyle = '#475569';
          ctx.fillRect(rx + 1, ry + 4, t.w - 2, 3);
          ctx.fillRect(rx + 1, ry + t.h - 7, t.w - 2, 3);
        }
      }
    });
  }
  static drawShadow(ctx, x, y, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + height, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // --- PLAYER RENDERER ---
  static renderPlayer(ctx, player, isLocal, cameraX, cameraY, weapons, currentWepIdx) {
    const rx = player.x - cameraX;
    const ry = player.y - cameraY - (player.z || 0);
    const cx = rx + player.width / 2;
    const cy = ry + player.height / 2;
    const anim = VectorAnimator.getOffsets(player, Date.now() / 16);
    const facingLeft = (player.facing === 'left');

    ctx.save();
    ctx.translate(cx, ry + 50 + anim.bobY);
    if (facingLeft) ctx.scale(-1, 1);
    ctx.rotate(anim.leanAngle || 0);

    const armorColor = COLOR_MAP[player.illusionColor] || player.color || '#ff0055';
    if (player.camoActive) ctx.globalAlpha = 0.28;

    // 1. Shadow
    this.drawShadow(ctx, 0, 0, player.width, 0);

    // 2. Body Layers (Back leg -> Back arm -> Torso -> Head -> Front leg -> Front arm)
    if (playerParts.back_leg.complete) {
      ctx.save(); ctx.translate(-6, 8); ctx.rotate(anim.legAngle2);
      ctx.drawImage(playerParts.back_leg, -6, 0, 12, 18);
      ctx.restore();
    }

    // Back Arm
    ctx.save();
    ctx.translate(8, -10);
    ctx.rotate(Math.PI / 6 + (facingLeft ? -anim.armAngle2 : anim.armAngle2));
    if (playerParts.back_arm.complete) ctx.drawImage(playerParts.back_arm, -6, 0, 12, 14);
    ctx.restore();

    // Torso (Tinted)
    if (playerParts.torso.complete) {
      ctx.save();
      const temp = document.createElement('canvas'); temp.width = 32; temp.height = 32;
      const tCtx = temp.getContext('2d');
      tCtx.drawImage(playerParts.torso, 0, 0, 32, 32);
      tCtx.globalCompositeOperation = 'source-in';
      tCtx.fillStyle = armorColor;
      tCtx.fillRect(0, 0, 32, 32);
      ctx.drawImage(temp, -16, -16, 32, 32);
      ctx.restore();
    }

    // Head
    ctx.save(); ctx.translate(2, -22 + anim.headBob);
    if (playerParts.head.complete) ctx.drawImage(playerParts.head, -13, -13, 26, 26);
    ctx.restore();

    // Front leg
    ctx.save(); ctx.translate(6, 8); ctx.rotate(anim.legAngle1);
    if (playerParts.front_leg.complete) ctx.drawImage(playerParts.front_leg, -6, 0, 12, 18);
    ctx.restore();

    // Front arm (Weapon attached here)
    ctx.save();
    ctx.translate(-8, -10);
    // Arm rotation is purely based on aimAngle to keep weapon locked to hand
    //ctx.rotate(player.aimAngle);
    if (playerParts.front_arm.complete) ctx.drawImage(playerParts.front_arm, -6, 0, 12, 14);

    // Weapon drawn relative to hand position
    this.drawWeapon(ctx, 10, 5, 0, weapons, currentWepIdx, facingLeft);
    ctx.restore();

    ctx.restore(); // Final restore
  }

  // ---- GUARD RENDERING ----
  static renderGuard(ctx, guard, isLocal, cameraX, cameraY) {
    // 1. Calculate camera-relative viewport ground position
    const rx = guard.x - cameraX;
    const ry = guard.y - cameraY; // Base y position on ground

    const facingLeft = (guard.facing === 'left');
    const anim = VectorAnimator.getOffsets(guard, Date.now() / 16);
    const armorColor = COLOR_MAP[guard.colorCode] || guard.color || '#ff0055';
    const skinColor = '#22c55e';

    ctx.save();
    // Translate directly to the base foot center of the enemy guard
    ctx.translate(rx + guard.width / 2, ry + guard.height);

    // Apply vertical jumping/falling coordinates
    ctx.translate(0, -(guard.z || 0));

    // Ground contact shadow layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -26, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply general sprite flipping adjustments
    if (facingLeft) ctx.scale(-1, 1);

    const headLoaded = enemyParts.head.complete && enemyParts.head.naturalWidth > 0;
    const torsoLoaded = enemyParts.torso.complete && enemyParts.torso.naturalWidth > 0;

    if (headLoaded && torsoLoaded) {
      // ---- LAYERED ENEMY RENDERER (All dimensions matching custom Rank overlays) ----

      // 1. Render Tail/Rank Overlays (Drawn background layer first)
      ctx.save();
      if (guard.rank === 3) {
        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 5.0;
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.bezierCurveTo(-22, -26, -28, -38, -26, -50);
        ctx.bezierCurveTo(-24, -60, -14, -60, -12, -54);
        ctx.stroke();
      } else if (guard.rank === 4 || guard.isBoss) {
        const tw = anim.tailWiggle || 0;
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.moveTo(-10, -38);
        ctx.lineTo(-35, -25 + tw);
        ctx.lineTo(-10, -26);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 2. Back leg
      ctx.save();
      ctx.translate(-6, -42);
      ctx.rotate(anim.legAngle2);
      ctx.drawImage(enemyParts.l_leg, -6, 0, 12, 14);
      if (enemyParts.l_boot.complete) ctx.drawImage(enemyParts.l_boot, -6, 10, 12, 6);
      ctx.restore();

      // 3. Back Arm
      ctx.save();
      ctx.translate(8, -58);
      ctx.rotate(guard.aimAngle + Math.PI / 6);
      ctx.drawImage(enemyParts.l_arm, -6, 0, 12, 14);
      ctx.restore();

      // 4. Torso (Dynamic faction color-tinting context)
      ctx.save();
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempCtx = tempCanvas.getContext('2d');

      tempCtx.drawImage(enemyParts.torso, 0, 0, 28, 28);
      tempCtx.globalCompositeOperation = 'source-in';
      tempCtx.fillStyle = armorColor;
      tempCtx.fillRect(0, 0, 28, 28);

      ctx.drawImage(tempCanvas, -14, -64, 28, 28);
      ctx.restore();

      // 5. Head & Face Rank Details
      ctx.save();
      ctx.translate(2, -70 + anim.headBob);
      ctx.scale(-1, 1); // Flip context to align look-direction
      ctx.drawImage(enemyParts.head, -12, -12, 24, 24);

      if (guard.rank === 2) {
        // Cobra red tongue
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        const forkX = -16 - Math.sin(Date.now() / 40) * 3;
        ctx.lineTo(forkX, 2);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Front Leg
      ctx.save();
      ctx.translate(4, -42);
      ctx.rotate(anim.legAngle1);
      ctx.drawImage(enemyParts.r_leg, -6, 0, 12, 14);
      if (enemyParts.r_boot.complete) ctx.drawImage(enemyParts.r_boot, -6, 10, 12, 6);
      ctx.restore();

      // 7. Front Arm + Weapon Mount
      ctx.save();
      ctx.translate(-8, -58);
      ctx.rotate(guard.aimAngle);
      ctx.drawImage(enemyParts.r_arm, -6, 0, 12, 14);

      // Mount weapon exactly in front hand local coordinate space
      const entityWeapons = [guard.weapon || 'blaster'];
      this.drawWeapon(ctx, 4, 6, 0, entityWeapons, 0, facingLeft);
      ctx.restore();
    }

    ctx.restore();
  }


  static drawBipedalArm(ctx, cx, cy, aimAngle, isBack, gx = 0, gy = 0, isPlayer = false, skinColor = '#22c55e') {
    ctx.save();
    if (isPlayer) {
      ctx.translate(cx, cy);
      ctx.rotate(aimAngle);
      ctx.fillStyle = skinColor;
      if (isBack) {
        drawSVGPath(ctx, GECKO_PATHS.l_shoulder, 1.0, 0, 0, 47, 112);
        ctx.fill();
        drawSVGPath(ctx, GECKO_PATHS.l_arm, 1.0, 0, 6, 44, 122);
        ctx.fill();
        drawSVGPath(ctx, GECKO_PATHS.l_hand, 1.0, 0, 14, 43, 129);
        ctx.fill();
      } else {
        drawSVGPath(ctx, GECKO_PATHS.r_shoulder, 1.0, 0, 0, 36, 110);
        ctx.fill();
        drawSVGPath(ctx, GECKO_PATHS.r_arm, 1.0, 0, 6, 44, 122);
        ctx.fill();
        drawSVGPath(ctx, GECKO_PATHS.r_hand, 1.0, 0, 14, 39, 133);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = isBack ? '#172554' : '#1e3a8a';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (isBack) {
        ctx.moveTo(-10, -6);
        ctx.lineTo(-24 * Math.cos(aimAngle), 8 * Math.sin(aimAngle));
      } else {
        ctx.moveTo(cx + 10 * Math.sin(aimAngle), cy + 4 * Math.cos(aimAngle));
        ctx.lineTo(gx + 2 * Math.cos(aimAngle), gy + 1 * Math.sin(aimAngle));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  static drawWeapon(ctx, gx, gy, aimAngle, weapons, currentWepIdx, facingLeft = false) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(aimAngle);
    if (facingLeft) ctx.scale(1, -1); // Flip sprite vertically when facing left

    const currentWep = (weapons && currentWepIdx !== null) ? weapons[currentWepIdx] : 'blaster';

    if (currentWep === 'shotgun' && weaponImages.shotgun.complete && weaponImages.shotgun.naturalWidth > 0) {
      // Shotgun PNG sprite — rendered centered at gun mount point
      ctx.drawImage(weaponImages.shotgun, 0, -6, 32, 12);
    } else if ((currentWep === 'blaster' || currentWep === 'railgun') && weaponImages.gun.complete && weaponImages.gun.naturalWidth > 0) {
      // Gun PNG sprite — rendered centered at gun mount point
      ctx.drawImage(weaponImages.gun, 0, -5, 26, 10);
    } else {
      // Fallback block shapes if PNGs not loaded
      if (currentWep === 'railgun') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -4, 22, 7);
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(6, -3, 14, 5);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-10, -1, 4, 4);
      } else if (currentWep === 'shotgun') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-8, -3, 10, 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, -3, 18, 5);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, -2, 2, 4);
      } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-6, -3, 14, 6);
        ctx.fillStyle = '#3cff00';
        ctx.fillRect(4, -2, 10, 4);
      }
    }
    ctx.restore();
  }

  // ---- UI RENDERING ----
  static renderUI(ctx, game) {
    // CRT scanline overlay
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 500;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }
    const vignette = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }
}
