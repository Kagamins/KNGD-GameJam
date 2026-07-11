// Spectral Infiltrator: Gungeon Mutiny — Main Game Engine v14
import { Physics } from './physics.js?v=36';
import { Player } from './player.js?v=36';
import { Guard } from './guard.js?v=36';
import { WaveManager } from './waveManager.js?v=36';
import { NetworkManager } from './network.js?v=36';
import { VectorAnimator } from './vectorAnimator.js?v=36';
import { GameRenderer } from './renderer.js?v=36';

// --- CONFIG ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

const STATE_LOBBY = 'lobby';
const STATE_PLAYING = 'playing';
const STATE_GAMEOVER = 'gameover';

// 4-player distinct colours
const PLAYER_COLORS = ['#3cff00', '#00f2ff', '#ffb700', '#ff69b4'];

class GameEngine {
    constructor() {
        this.state = STATE_LOBBY;
        this.mode = 'single'; // 'single' | 'host' | 'join' | 'local'

        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.mouseX = 0;
        this.mouseY = 0;

        // Up to 4 players. Index 0 = P1/host, 1-3 = joiners.
        this.players = [null, null, null, null];
        this.player1 = null;  // Convenience alias for players[0]
        this.localPlayerIndex = 0;

        // World objects
        this.platforms = [];
        this.vehicles = [];
        this.lasers = [];
        this.guards = [];
        this.decoys = [];
        this.rankChips = [];
        this.particles = [];
        this.stars = [];
        this.currencyChips = [];
        this.ammoDrops = [];
        this.throwables = [];
        this.buildings = [];

        this.cameraX = 0;
        this.cameraY = 0;

        this.chaosLevel = 0;
        this.mutiniesTriggered = 0;
        this.elapsedTime = 0;
        this.grenades = [];
        this.grenadeDrops = [];
        this.weaponDrops = [];
        this.startTime = 0;
        this.isPaused = false;
        this.keys = {};
        this.credits = 0;
        this.score = 0;

        this.hitstopTimer = 0;
        this.screenshakeTimer = 0;
        this.screenshakeIntensity = 0;

        // Progression stage & door portals
        this.stageNumber = 1;
        this.door = null;
        this.rankUpAlertTimer = 0;

        // Local player nickname
        this.nickname = 'OPERATIVE';

        // Systems
        this.waveManager = new WaveManager();
        this.networkManager = null;

        this.lobbyScreen = document.getElementById('lobby-screen');
        this.hudOverlay = document.getElementById('hud-overlay');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.waitingScreen = document.getElementById('waiting-screen');
        this.terminalContent = document.getElementById('terminal-content');
        this.shopScreen = document.getElementById('shop-screen');

        this.initStars();
        this.initEvents();
    }

    initStars() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                size: Math.random() * 2 + 0.5,
                depth: Math.random() * 0.7 + 0.1
            });
        }
    }

    initEvents() {
        document.getElementById('btn-single-player').addEventListener('click', () => this.startSinglePlayer());
        document.getElementById('btn-local-coop').addEventListener('click', () => this.startLocalCoop());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToLobby());
        document.getElementById('btn-pause-game').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-pause-quit').addEventListener('click', () => this.quitToLobby());

        // Shop upgrades click handlers
        document.getElementById('btn-shop-hp').addEventListener('click', () => this.buyShopUpgrade('hp'));
        document.getElementById('btn-shop-color').addEventListener('click', () => this.buyShopUpgrade('color'));
        document.getElementById('btn-shop-close').addEventListener('click', () => this.closeShop());

        // ---- CONTROLS MODAL ----
        const controlsModal = document.getElementById('controls-modal');
        const openControls = () => controlsModal.classList.remove('hidden');
        const closeControls = () => controlsModal.classList.add('hidden');
        document.getElementById('btn-controls-lobby').addEventListener('click', openControls);
        document.getElementById('btn-pause-controls').addEventListener('click', openControls);
        document.getElementById('btn-controls-close').addEventListener('click', closeControls);
        controlsModal.addEventListener('click', (e) => { if (e.target === controlsModal) closeControls(); });

        // ---- OPTIONS MODAL ----
        const optionsModal = document.getElementById('options-modal');
        const openOptions = () => {
            const sfxSlider = document.getElementById('sfx-volume');
            const musicSlider = document.getElementById('music-volume');
            if (sfxSlider) sfxSlider.value = Math.round((AudioController._sfxVol ?? 0.7) * 100);
            if (musicSlider) musicSlider.value = Math.round((AudioController._musicVol ?? 0.4) * 100);
            document.getElementById('sfx-vol-display').innerText = sfxSlider?.value ?? '70';
            document.getElementById('music-vol-display').innerText = musicSlider?.value ?? '40';
            optionsModal.classList.remove('hidden');
        };
        const closeOptions = () => optionsModal.classList.add('hidden');
        document.getElementById('btn-options').addEventListener('click', openOptions);
        document.getElementById('btn-pause-options').addEventListener('click', openOptions);
        document.getElementById('btn-options-close').addEventListener('click', closeOptions);
        optionsModal.addEventListener('click', (e) => { if (e.target === optionsModal) closeOptions(); });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            const v = parseInt(e.target.value) / 100;
            document.getElementById('sfx-vol-display').innerText = e.target.value;
            AudioController.init();
            AudioController.setSFXVolume(v);
        });
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const v = parseInt(e.target.value) / 100;
            document.getElementById('music-vol-display').innerText = e.target.value;
            AudioController.init();
            AudioController.setMusicVolume(v);
        });

        (() => {
            const sfxV = Math.round((parseFloat(localStorage.getItem('si_sfx_vol') ?? '0.7')) * 100);
            const musicV = Math.round((parseFloat(localStorage.getItem('si_music_vol') ?? '0.4')) * 100);
            const sfxEl = document.getElementById('sfx-volume');
            const musEl = document.getElementById('music-volume');
            if (sfxEl) { sfxEl.value = sfxV; document.getElementById('sfx-vol-display').innerText = sfxV; }
            if (musEl) { musEl.value = musicV; document.getElementById('music-vol-display').innerText = musicV; }
        })();

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (this.state === STATE_LOBBY) AudioController.init();
            if (e.key === 'Escape') this.togglePause();
            if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        window.addEventListener('gamepadconnected', (e) => {
            this.addLog(`🎮 CONTROLLER ${e.gamepad.index + 1} CONNECTED: ${e.gamepad.id.split('(')[0].trim()}`, 'success');
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            this.addLog(`🎮 CONTROLLER ${e.gamepad.index + 1} DISCONNECTED`, 'alert');
        });

        window.addEventListener('mousedown', () => { this.keys['click'] = true; AudioController.init(); });
        window.addEventListener('mouseup', () => { this.keys['click'] = false; });

        this.canvas.addEventListener('touchstart', (e) => this.handleCanvasTouch(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleCanvasTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', () => {
            this.touchAiming = false;
            this.keys['click'] = false;
        });

        const bindTouchKey = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; AudioController.init(); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
        };
        bindTouchKey('btn-dpad-up', 'w');
        bindTouchKey('btn-dpad-down', 's');
        bindTouchKey('btn-dpad-left', 'a');
        bindTouchKey('btn-dpad-right', 'd');
        bindTouchKey('btn-touch-dash', 'shift');
        bindTouchKey('btn-touch-shoot', 'j');
        bindTouchKey('btn-touch-weapon', 'q');
        bindTouchKey('btn-touch-decoy', 'i');
        bindTouchKey('btn-touch-camo', 'c');
        bindTouchKey('btn-touch-color', 'x');

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
    }

    handleCanvasTouch(e) {
        if (this.state !== STATE_PLAYING) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return;

        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        this.touchX = (touch.clientX - rect.left) * scaleX;
        this.touchY = (touch.clientY - rect.top) * scaleY;

        this.mouseX = this.touchX;
        this.mouseY = this.touchY;
        this.touchAiming = true;
        this.keys['click'] = true;
        AudioController.init();
    }

    hostGame() {
        AudioController.init();
        this.nickname = (document.getElementById('nickname-input')?.value.trim() || 'OPERATIVE').toUpperCase();
        if (!this.networkManager) this.networkManager = new NetworkManager(this);
        this.networkManager.playerNicknames[1] = this.nickname;
        this.networkManager.initHost();
    }

    joinGame() {
        AudioController.init();
        this.nickname = (document.getElementById('nickname-input')?.value.trim() || 'OPERATIVE').toUpperCase();
        const codeInput = document.getElementById('join-code-input');
        const code = codeInput ? codeInput.value.trim() : '';
        if (!code) {
            const s = document.getElementById('join-status');
            if (s) s.innerText = 'ENTER A ROOM CODE FIRST.';
            return;
        }
        if (!this.networkManager) this.networkManager = new NetworkManager(this);
        document.querySelector('.menu-sections')?.classList.add('hidden');
        this.lobbyScreen.classList.remove('active');
        if (this.waitingScreen) {
            this.waitingScreen.classList.remove('hidden');
            this.waitingScreen.classList.add('active');
        }
        this.networkManager.connectToHost(code, this.nickname);
    }

    cancelCoop() {
        AudioController.init();
        if (this.networkManager) {
            this.networkManager.destroy();
            this.networkManager = null;
        }
        document.getElementById('connection-panel').classList.add('hidden');
        document.getElementById('host-controls').classList.add('hidden');
        document.querySelector('.menu-sections').classList.remove('hidden');
        this.lobbyScreen.classList.add('active');
        if (this.waitingScreen) {
            this.waitingScreen.classList.add('hidden');
            this.waitingScreen.classList.remove('active');
        }
        this.mode = 'single';
    }

    startMultiplayerGame() {
        this.startGame();
        if (this.networkManager) this.networkManager.sendStartGame();
    }

    startSinglePlayer() {
        AudioController.init();
        this.mode = 'single';
        this.localPlayerIndex = 0;
        this.networkManager = null;
        this.startGame();
    }

    startLocalCoop() {
        AudioController.init();
        this.mode = 'local';
        this.localPlayerIndex = 0;
        this.networkManager = null;
        this.startGame();
    }

    startGame() {
        this.lobbyScreen.classList.remove('active');
        const connPanel = document.getElementById('connection-panel');
        if (connPanel) connPanel.classList.add('hidden');
        document.querySelector('.menu-sections')?.classList.remove('hidden');
        if (this.waitingScreen) {
            this.waitingScreen.classList.remove('active');
            this.waitingScreen.classList.add('hidden');
        }

        const briefingScreen = document.getElementById('briefing-screen');
        if (briefingScreen) {
            briefingScreen.classList.remove('hidden');
            briefingScreen.classList.add('active');
            document.getElementById('btn-start-briefing').onclick = () => {
                briefingScreen.classList.remove('active');
                briefingScreen.classList.add('hidden');
                this.runRealGameplayStart();
            };
        } else {
            this.runRealGameplayStart();
        }
    }

    runRealGameplayStart() {
        this.state = STATE_PLAYING;
        this.hudOverlay.classList.remove('hidden');

        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.getElementById('touch-controls-container').classList.remove('hidden');
        }

        this.startTime = Date.now();
        this.chaosLevel = 0;
        this.mutinyR = 0; this.mutinyG = 0; this.mutinyB = 0;
        this.mutiniesTriggered = 0;
        this.isPaused = false;
        this.credits = 0;
        this.killStreak = 0;
        this.killStreakTimer = 0;

        this.upgradePurchases = { hp: 0, color: 0 };
        this.lasers = []; this.decoys = []; this.rankChips = [];
        this.currencyChips = []; this.ammoDrops = []; this.particles = [];
        this.grenades = []; this.grenadeDrops = []; this.weaponDrops = [];

        if (this.mode === 'join') {
            this.players = [null, null, null, null];
            if (this.localPlayerIndex > 0) {
                const localP = new Player(200 + this.localPlayerIndex * 50, 150, PLAYER_COLORS[this.localPlayerIndex]);
                localP.playerId = this.localPlayerIndex + 1;
                this.players[this.localPlayerIndex] = localP;
            }
            this.player1 = null;
        } else {
            const p1 = new Player(150, 150, PLAYER_COLORS[0]);
            p1.playerId = 1;
            this.players = [p1, null, null, null];
            this.player1 = p1;

            if (this.mode === 'local') {
                const p2 = new Player(220, 150, PLAYER_COLORS[1]);
                p2.playerId = 2;
                p2.illusionColor = 'B';
                this.players[1] = p2;
            }

            if (this.mode === 'host' && this.networkManager) {
                const spawnPos = [{ x: 150, y: 150 }, { x: 220, y: 150 }, { x: 150, y: 220 }, { x: 220, y: 220 }];
                for (let assignedId = 2; assignedId < this.networkManager.nextAssignId; assignedId++) {
                    const idx = assignedId - 1;
                    if (idx < 4) {
                        const pos = spawnPos[idx] || spawnPos[1];
                        const p = new Player(pos.x, pos.y, PLAYER_COLORS[idx]);
                        p.playerId = assignedId;
                        this.players[idx] = p;
                    }
                }
            }
        }

        this.waveManager.reset();
        this.initLevel();
        this.resizeCanvas();
        requestAnimationFrame(() => this.loop());
    }

    isPositionFree(x, y, w, h) {
        if (Physics.checkWallCollision(x, y, w, h, this.platforms)) return false;
        if (x < 320 && y < 320) return false;

        const campPositions = [{ x: 1800, y: 300 }, { x: 400, y: 1300 }, { x: 1800, y: 1300 }];
        for (const camp of campPositions) {
            if (Math.sqrt((x - camp.x) ** 2 + (y - camp.y) ** 2) < 200) return false;
        }
        return true;
    }

    initLevel() {
        this.door = null;
        this.guards = [];

        const roomCodeString = (this.networkManager && this.networkManager.peerId) ? this.networkManager.peerId.replace('SI-', '') : '42';
        const roomCodeInt = parseInt(roomCodeString) || 42;
        let seed = roomCodeInt * 100 + this.stageNumber;

        const seededRandom = () => {
            let x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        this.platforms = [
            { x: 0, y: 0, w: 2400, h: 40, color: '#102040', isBoundary: true },
            { x: 0, y: 0, w: 40, h: 1800, color: '#102040', isBoundary: true },
            { x: 2360, y: 0, w: 40, h: 1800, color: '#102040', isBoundary: true },
            { x: 0, y: 1760, w: 2400, h: 40, color: '#102040', isBoundary: true }
        ];

        this.buildings = [{ x: 800, y: 600, w: 301, h: 327 }];
        const numPillars = 8 + (this.stageNumber % 3) + Math.floor(seededRandom() * 6);
        for (let i = 0; i < numPillars; i++) {
            const w = 80 + Math.floor(seededRandom() * 90);
            const h = 80 + Math.floor(seededRandom() * 90);
            let px = 250 + Math.floor(seededRandom() * 1900);
            let py = 250 + Math.floor(seededRandom() * 1300);

            let retries = 0;
            while (!this.isPositionFree(px, py, w, h) && retries < 15) {
                px = 250 + Math.floor(seededRandom() * 1900);
                py = 250 + Math.floor(seededRandom() * 1300);
                retries++;
            }
            if (this.isPositionFree(px, py, w, h)) {
                this.platforms.push({ x: px, y: py, w, h, color: '#16284d' });
            }
        }

        this.vehicles = [];
        const vehicleColors = ['#dc2626', '#2563eb', '#16a34a', '#db2777'];
        const numCars = 4 + (this.stageNumber % 2);
        for (let i = 0; i < numCars; i++) {
            let vx = 300 + seededRandom() * 1800;
            let vy = 300 + seededRandom() * 1200;
            let retries = 0;
            while (!this.isPositionFree(vx - 32, vy - 20, 64, 40) && retries < 15) {
                vx = 300 + seededRandom() * 1800;
                vy = 300 + seededRandom() * 1200;
                retries++;
            }
            const carColor = vehicleColors[Math.floor(seededRandom() * vehicleColors.length)];
            this.vehicles.push({ id: i + 1, x: vx, y: vy, w: 64, h: 40, color: carColor });
        }

        this.throwables = [];
        const numThrowables = 12 + Math.floor(seededRandom() * 8);
        for (let i = 0; i < numThrowables; i++) {
            let tx = 200 + seededRandom() * 1900;
            let ty = 300 + seededRandom() * 1300;
            let retries = 0;
            while (!this.isPositionFree(tx - 12, ty - 12, 24, 24) && retries < 20) {
                tx = 200 + seededRandom() * 1900;
                ty = 300 + seededRandom() * 1300;
                retries++;
            }
            const isCrate = seededRandom() < 0.5;
            this.throwables.push({
                id: i + 1, x: tx, y: ty, z: 0, w: 24, h: 24, vx: 0, vy: 0, vz: 0,
                hp: isCrate ? 40 : 60, state: 'idle', type: isCrate ? 'crate' : 'barrel', color: isCrate ? '#b45309' : '#b91c1c'
            });
        }

        const camps = [
            { name: 'RED CAMP', x: 1800, y: 300, color: '#ff3333', code: 'R' },
            { name: 'GREEN CAMP', x: 400, y: 1300, color: '#33ff33', code: 'G' },
            { name: 'BLUE CAMP', x: 1800, y: 1300, color: '#3333ff', code: 'B' }
        ];

        camps.forEach((camp, idx) => {
            this.platforms.push({ x: camp.x - 60, y: camp.y - 60, w: 120, h: 20, color: camp.color });
            this.platforms.push({ x: camp.x - 60, y: camp.y - 60, w: 20, h: 120, color: camp.color });
            this.platforms.push({ x: camp.x + 40, y: camp.y - 60, w: 20, h: 120, color: camp.color });

            const cmd = new Guard(200 + idx, camp.x, camp.y, 0, 0, camp.x - 30, camp.x + 30, camp.y - 30, camp.y + 30, 3, camp.code);
            this.guards.push(cmd);

            for (let gIdx = 0; gIdx < 3; gIdx++) {
                const grunt = new Guard(
                    300 + idx * 10 + gIdx, camp.x + Math.cos((gIdx * Math.PI * 2) / 3) * 90, camp.y + Math.sin((gIdx * Math.PI * 2) / 3) * 90,
                    (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, camp.x - 150, camp.x + 150, camp.y - 150, camp.y + 150, 1, camp.code
                );
                this.guards.push(grunt);
            }
        });

        let bx = 1100 + seededRandom() * 500;
        let by = 800 + seededRandom() * 400;
        let retries = 0;
        while (!this.isPositionFree(bx - 45, by - 65, 90, 130) && retries < 30) {
            bx = 1100 + seededRandom() * 500;
            by = 800 + seededRandom() * 400;
            retries++;
        }

        const bossColors = ['R', 'G', 'B'];
        const bossColor = bossColors[Math.floor(seededRandom() * bossColors.length)];
        const boss = new Guard(99, bx, by, 0.45, 0.45, bx - 80, bx + 80, by - 80, by + 80, 4, bossColor);
        boss.isBoss = true; boss.maxHp = 60 + this.stageNumber * 10; boss.hp = boss.maxHp;
        boss.width = 90; boss.height = 130; boss.baseSpeed = 0.8;
        this.guards.push(boss);

        const BOSS_FACTION_NAMES = { R: 'RED', G: 'GREEN', B: 'BLUE' };
        this.addLog(`⚡ ISLAND ${this.stageNumber} SECURED: TARGET THE ${BOSS_FACTION_NAMES[bossColor]} ADMIRAL!`, 'alert');
        AudioController.playBossTheme(bossColor);
    }

    loop() {
        if (this.state !== STATE_PLAYING) return;
        if (this.hitstopTimer > 0) {
            this.hitstopTimer--;
            this.render();
            requestAnimationFrame(() => this.loop());
            return;
        }
        if (!this.isPaused) this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    _applyStickToKeys(keys, axes, deadzone) {
        keys['d'] = axes[0] > deadzone; keys['a'] = axes[0] < -deadzone;
        keys['s'] = axes[1] > deadzone; keys['w'] = axes[1] < -deadzone;
        if (Math.abs(axes[0]) <= deadzone) { keys['d'] = false; keys['a'] = false; }
        if (Math.abs(axes[1]) <= deadzone) { keys['s'] = false; keys['w'] = false; }
        if (keys['dpad_up']) keys['w'] = true;
        if (keys['dpad_down']) keys['s'] = true;
        if (keys['dpad_left']) keys['a'] = true;
        if (keys['dpad_right']) keys['d'] = true;
    }

    _applyButtonsToKeys(keys, gp) {
        keys['shift'] = !!(gp.buttons[0]?.pressed);
        keys['f'] = !!(gp.buttons[1]?.pressed);
        keys['c'] = !!(gp.buttons[3]?.pressed);
        keys['x'] = !!(gp.buttons[4]?.pressed);
        keys['i'] = !!(gp.buttons[2]?.pressed);
        keys[' '] = !!(gp.buttons[0]?.pressed);
        keys['dpad_up'] = !!(gp.buttons[12]?.pressed);
        keys['dpad_down'] = !!(gp.buttons[13]?.pressed);
        keys['dpad_left'] = !!(gp.buttons[14]?.pressed);
        keys['dpad_right'] = !!(gp.buttons[15]?.pressed);
    }

    _getRightStickAngle(axes, deadzone) {
        if (Math.abs(axes[2]) > deadzone || Math.abs(axes[3]) > deadzone) {
            return { aiming: true, angle: Math.atan2(axes[3], axes[2]) };
        }
        return { aiming: false, angle: 0 };
    }

    updateGamepadInput() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const deadzone = 0.22;

        if (this.mode === 'local') {
            if (!this.p2LocalKeys) this.p2LocalKeys = {};

            const gp0 = gamepads[0];
            if (gp0) {
                this._applyStickToKeys(this.keys, gp0.axes, deadzone);
                this._applyButtonsToKeys(this.keys, gp0);
                const aim0 = this._getRightStickAngle(gp0.axes, deadzone);
                this.gamepadAiming = aim0.aiming; this.gamepadAimAngle = aim0.angle;
                this.keys['f'] = !!(gp0.buttons[1]?.pressed);
                this.keys['e'] = !!(gp0.buttons[6]?.pressed);
                this.keys['click'] = !!(gp0.buttons[7]?.pressed);
                if (gp0.buttons[5]?.pressed) {
                    if (!this.gamepad_rb_lock) {
                        this.gamepad_rb_lock = true; const p1 = this.players[0];
                        if (p1 && p1.active) { p1.currentWeaponIndex = (p1.currentWeaponIndex + 1) % p1.weapons.length; AudioController.playRankUp(); }
                    }
                } else { this.gamepad_rb_lock = false; }
                if (gp0.buttons[9]?.pressed) {
                    if (!this.gamepad_start_lock) { this.gamepad_start_lock = true; this.togglePause(); }
                } else { this.gamepad_start_lock = false; }
            } else { this.gamepadAiming = false; }

            const gp1 = gamepads[1]; const p2Keys = this.p2LocalKeys;
            if (gp1) {
                this._applyStickToKeys(p2Keys, gp1.axes, deadzone);
                this._applyButtonsToKeys(p2Keys, gp1);
                const aim1 = this._getRightStickAngle(gp1.axes, deadzone);
                this.p2GamepadAiming = aim1.aiming; this.p2GamepadAimAngle = aim1.angle;
                p2Keys['f'] = !!(gp1.buttons[1]?.pressed);
                p2Keys['e'] = !!(gp1.buttons[6]?.pressed);
                p2Keys['click'] = !!(gp1.buttons[7]?.pressed);
                if (gp1.buttons[5]?.pressed) {
                    if (!this.gamepad_rb_lock_p2) {
                        this.gamepad_rb_lock_p2 = true; const p2 = this.players[1];
                        if (p2 && p2.active) { p2.currentWeaponIndex = (p2.currentWeaponIndex + 1) % p2.weapons.length; AudioController.playRankUp(); }
                    }
                } else { this.gamepad_rb_lock_p2 = false; }
            } else {
                p2Keys['a'] = this.keys['arrowleft'] || false; p2Keys['d'] = this.keys['arrowright'] || false;
                p2Keys['w'] = this.keys['arrowup'] || false; p2Keys['s'] = this.keys['arrowdown'] || false;
                p2Keys[' '] = this.keys['enter'] || this.keys['numpad0'] || false;
                p2Keys['j'] = this.keys['/'] || this.keys['numpad1'] || false;
                p2Keys['x'] = this.keys['.'] || this.keys['numpad2'] || false;
                p2Keys['shift'] = this.keys['rightshift'] || this.keys['numpad3'] || false;
                p2Keys['q'] = this.keys['numpad4'] || false; p2Keys['i'] = this.keys['numpad5'] || false;
                p2Keys['c'] = this.keys['numpad6'] || false; p2Keys['f'] = this.keys['numpad7'] || false;
                p2Keys['e'] = this.keys['numpad8'] || false; this.p2GamepadAiming = false;
            }
            return;
        }

        const gp = gamepads[0];
        if (!gp) { this.gamepadAiming = false; return; }
        this._applyStickToKeys(this.keys, gp.axes, deadzone);
        this._applyButtonsToKeys(this.keys, gp);
        const aim = this._getRightStickAngle(gp.axes, deadzone);
        this.gamepadAiming = aim.aiming; this.gamepadAimAngle = aim.angle;
        this.keys['f'] = !!(gp.buttons[1]?.pressed);
        this.keys['e'] = !!(gp.buttons[6]?.pressed);
        this.keys['click'] = !!(gp.buttons[7]?.pressed);
        if (gp.buttons[5]?.pressed) {
            if (!this.gamepad_rb_lock) {
                this.gamepad_rb_lock = true; const localP = this.players[this.localPlayerIndex] || this.players[0];
                if (localP && localP.active) { localP.currentWeaponIndex = (localP.currentWeaponIndex + 1) % localP.weapons.length; AudioController.playRankUp(); }
            }
        } else { this.gamepad_rb_lock = false; }
        if (gp.buttons[9]?.pressed) { if (!this.gamepad_start_lock) { this.gamepad_start_lock = true; this.togglePause(); } } else { this.gamepad_start_lock = false; }
    }

    update() {
        this.updateGamepadInput();
        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

        const isAuthority = (this.mode === 'single' || this.mode === 'host' || this.mode === 'local');

        if (isAuthority) {
            if (this.players[0] && this.players[0].active) {
                const p1AimAngle = this.gamepadAiming ? this.gamepadAimAngle : null;
                this.players[0].update(this.keys, this.platforms, this.guards, this, this.mouseX, this.mouseY, p1AimAngle);
                if (this.gamepadAiming) { this.players[0].aimAngle = this.gamepadAimAngle; this.players[0].facing = Math.cos(this.gamepadAimAngle) >= 0 ? 'right' : 'left'; }
            }

            if (this.mode === 'local' && this.players[1] && this.players[1].active) {
                const p2 = this.players[1]; const p2InputKeys = this.p2LocalKeys || {};
                let p2AimAngle = p2.aimAngle;
                if (this.p2GamepadAiming) { p2AimAngle = this.p2GamepadAimAngle; } else { if (p2InputKeys['a']) p2AimAngle = Math.PI; if (p2InputKeys['d']) p2AimAngle = 0; }
                p2.update(p2InputKeys, this.platforms, this.guards, this, 0, 0, p2AimAngle);
                if (this.p2GamepadAiming) { p2.aimAngle = this.p2GamepadAimAngle; p2.facing = Math.cos(this.p2GamepadAimAngle) >= 0 ? 'right' : 'left'; }
            }

            if (this.mode === 'host' && this.networkManager) {
                for (let i = 1; i <= 3; i++) {
                    const p = this.players[i]; if (!p || !p.active) continue;
                    const ri = this.networkManager.remoteInputs[i + 1];
                    if (ri && ri.keys) { p.update(ri.keys, this.platforms, this.guards, this, 0, 0, ri.aimAngle || 0); }
                }
            }
        } else {
            const localP = this.players[this.localPlayerIndex];
            if (localP && localP.active) {
                localP.update(this.keys, this.platforms, this.guards, this, this.mouseX, this.mouseY);
                if (this.gamepadAiming) { localP.aimAngle = this.gamepadAimAngle; localP.facing = Math.cos(this.gamepadAimAngle) >= 0 ? 'right' : 'left'; }
            }
            if (this.networkManager && localP) {
                const aimAngleToSend = this.gamepadAiming ? this.gamepadAimAngle : localP.aimAngle;
                this.networkManager.sendInput(this.keys, aimAngleToSend);
            }
        }

        if (isAuthority) {
            const activePlayers = this.players.filter(p => p && p.active);

            activePlayers.forEach(p => {
                this.guards.forEach(g => {
                    const gCollWidth = 40; const gCollHeight = 60;
                    const gCollX = g.x + (g.width - gCollWidth) / 2; const gCollY = g.y + (g.height - gCollHeight) / 2;

                    if (Physics.checkAABB(p.x, p.y, p.width, p.height, gCollX, gCollY, gCollWidth, gCollHeight)) {
                        const dx = (p.x + p.width / 2) - (g.x + g.width / 2); const dy = (p.y + p.height / 2) - (g.y + g.height / 2);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const overlapX = (p.width / 2 + gCollWidth / 2) - Math.abs(dx); const overlapY = (p.height / 2 + gCollHeight / 2) - Math.abs(dy);

                        if (overlapX > 0 && overlapY > 0) {
                            if (overlapX < overlapY) { const pushX = (dx > 0 ? 0.5 : -0.5) * overlapX; p.x += pushX; g.x -= pushX; }
                            else { const pushY = (dy > 0 ? 0.5 : -0.5) * overlapY; p.y += pushY; g.y -= pushY; }
                        }

                        p.vx += (dx / dist) * 2.2; p.vy += (dy / dist) * 2.2;
                        this.damagePlayer(p);
                        if (p.isRolling) {
                            g.knockedTimer = 300; g.vx = 0; g.vy = 0; g.target = null;
                            this.spawnExplosion(g.x + 12, g.y + 12, '#00f2ff'); this.addLog('⚡ TACKLED: Guard knocked down for 5 seconds!', 'success');
                        }
                    }
                });
            });

            this.waveManager.update(this);
            this.guards.forEach(g => g.update(activePlayers, this.decoys, this));
            this.updateProjectiles();
            this.magnetizeLoot(activePlayers);
            activePlayers.forEach(p => this.updateEntitiesCollision(p));
            this.updateThrowables();
            this.updateGrenades();

            if (this.mode === 'host' && this.networkManager) { this.networkManager.broadcastState(); }
        }

        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
        this.decoys = this.decoys.filter(d => { d.life--; return d.life > 0; });

        if (this.killStreakTimer > 0) {
            this.killStreakTimer--;
            if (this.killStreakTimer <= 0 && this.killStreak > 1) { this.addLog(`💀 STREAK ENDED: ×${this.killStreak} kills`, 'alert'); this.killStreak = 0; }
        }

        // Always center camera directly on the local player slot
        const camTarget = this.players[this.localPlayerIndex] || this.players[0];
        if (camTarget) { this.setCamera(camTarget); }

        this.closestKnockedGuard = null; this.closestKnockedGuardIndex = -1;
        const refP = this.players[this.localPlayerIndex] || this.players[0];
        if (refP && refP.active) {
            let minDist = 40;
            this.guards.forEach((g, idx) => {
                const isLowHp = g.hp > 0 && (g.hp / g.maxHp) <= 0.20;
                const matchesColor = refP.illusionColor && refP.illusionColor === g.colorCode;
                if ((g.knockedTimer > 0 || isLowHp || matchesColor) && g.hp > 0) {
                    const dist = Math.sqrt((g.x - refP.x) ** 2 + (g.y - refP.y) ** 2);
                    if (dist < minDist) { minDist = dist; this.closestKnockedGuard = g; this.closestKnockedGuardIndex = idx; }
                }
            });

            if ((this.keys['f'] || this.keys['y']) && this.closestKnockedGuardIndex !== -1) {
                const targetG = this.closestKnockedGuard; targetG.hp = 0; this.score += 500; this.mutiniesTriggered++;
                this.incrementMutiny(targetG.colorCode, 8);

                this.guards.forEach(otherG => {
                    if (otherG.id !== targetG.id && otherG.hp > 0) {
                        if (Math.sqrt((otherG.x - targetG.x) ** 2 + (otherG.y - targetG.y) ** 2) < 320) {
                            const rival = this.guards.find(r => r.id !== otherG.id && r.id !== targetG.id && r.colorCode !== otherG.colorCode && r.hp > 0 && Math.sqrt((r.x - otherG.x) ** 2 + (r.y - otherG.y) ** 2) < 320);
                            if (rival) { otherG.target = rival; this.addLog(`⚠️ FACTION ALERT: ${otherG.colorCode} Guard targets ${rival.colorCode} Guard!`, 'alert'); }
                        }
                    }
                });

                this.damageGuard(targetG, this.closestKnockedGuardIndex, { type: 'player', colorCode: targetG.colorCode, subType: 'blaster' });
                AudioController.playHurt(); this.spawnExplosion(targetG.x + 12, targetG.y + 12, '#ff0055');
                this.addLog('🗡️ SILENT ASSASSINATION: Hostile eliminated! Faction war incited.', 'success');
                this.keys['f'] = false; this.keys['y'] = false;
            }
        }

        this.updateHUD();
    }

    fireLaser(x, y, dx, dy, type, ownerId = null, subType = 'blaster', colorCode = null, z = 0) {
        this.lasers.push({
            x, y, z, vx: dx * (subType === 'railgun' ? 6.5 : 5.0), vy: dy * (subType === 'railgun' ? 6.5 : 5.0),
            width: subType === 'railgun' ? 14 : 6, height: subType === 'railgun' ? 14 : 6, type, ownerId, subType, colorCode
        });
    }

    fireGrenade(x, y, tx, ty) {
        const dx = tx - x; const dy = ty - y; const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = Math.min(dist / 25, 7.5); const angle = Math.atan2(dy, dx);
        this.grenades.push({ x: x - 6, y: y - 6, z: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 4.5, w: 12, h: 12, timer: 80 });
        AudioController.playBlaster();
    }

    updateProjectiles() {
        this.lasers = this.lasers.filter((laser) => {
            laser.x += laser.vx; laser.y += laser.vy;

            if (Physics.checkWallCollision(laser.x, laser.y, laser.width, laser.height, this.platforms)) return false;

            for (let ti = this.throwables.length - 1; ti >= 0; ti--) {
                const t = this.throwables[ti];
                if (t.state === 'idle') {
                    if (Math.abs(laser.z - t.z) < 20 && Physics.checkAABB(laser.x, laser.y, laser.width, laser.height, t.x, t.y, t.w, t.h)) {
                        t.hp -= (laser.subType === 'railgun') ? 25 : 10;
                        if (t.hp <= 0) { this.smashThrowable(t, ti); } else { this.spawnExplosion(laser.x, laser.y, t.color); }
                        return false;
                    }
                }
            }

            for (let gi = this.guards.length - 1; gi >= 0; gi--) {
                const g = this.guards[gi]; const guardZ = g.z || 0;
                const gHurtW = 65; const gHurtH = 90;
                const gHurtX = g.x + (g.width - gHurtW) / 2; const gHurtY = g.y + (g.height - gHurtH) / 2;
                if (Math.abs(laser.z - guardZ) < 24 && Physics.checkAABB(laser.x, laser.y, laser.width, laser.height, gHurtX, gHurtY, gHurtW, gHurtH)) {
                    this.damageGuard(g, gi, laser); return false;
                }
            }

            if (laser.type === 'guard') {
                for (const player of this.players) {
                    if (!player || !player.active || player.isRolling || player.camoActive) continue;
                    if (Math.abs(laser.z - (player.z || 0)) < 24 && Physics.checkAABB(laser.x, laser.y, laser.width, laser.height, player.x, player.y, player.width, player.height)) {
                        this.damagePlayer(player); return false;
                    }
                }
            }

            return true;
        });
    }

    damageGuard(guard, index, laser) {
        let damage = 1; const shooter = this.players.find(p => p.id === laser.sourceId);
        if (laser.subType === 'railgun') damage = 3;
        guard.hp -= damage; this.spawnExplosion(guard.x + 12, guard.y + 12, '#ff0055'); AudioController.playHurt();

        this.hitstopTimer = 4;
        if (shooter) { guard.target = shooter; guard.isAlerted = true; this.addLog(`Guard ${guard.id} is retaliating against Player ${shooter.id}`); }
        if (laser.type === 'guard' && laser.ownerId && laser.ownerId !== guard.id) {
            const attacker = this.guards.find(g => g.id === laser.ownerId);
            if (attacker) {
                const allowTarget = !(guard.isBoss && attacker.rank < 3);
                if (allowTarget) { guard.target = attacker; }
                this.incrementMutiny(guard.colorCode, 5); this.addLog('DECEIT SYNC: MUTINY SPREADING THROUGH THE JUNGLE CAMP!', 'alert');
            }
        }

        if (guard.hp <= 0) {
            this.killStreak++; this.killStreakTimer = 240;
            const streakMultiplier = Math.min(1 + (this.killStreak - 1) * 0.25, 3.0);

            if (this.killStreak >= 2) {
                const label = this.killStreak >= 8 ? '🔥 RAMPAGE' : this.killStreak >= 5 ? '⚡ KILLING SPREE' : this.killStreak >= 3 ? '💀 STREAK' : '✖️ COMBO';
                this.addLog(`${label} ×${this.killStreak}! MUTINY ×${streakMultiplier.toFixed(2)}`, 'success');
            }

            if (laser.type === 'player') {
                const refP = this.players[this.localPlayerIndex] || this.players[0];
                if (refP && refP.illusionColor && refP.illusionColor !== guard.colorCode) {
                    const mutinyGain = Math.round(10 * streakMultiplier);
                    this.incrementMutiny(refP.illusionColor, mutinyGain); this.addLog(`⚡ ILLUSION STRIKE: Mutiny +${mutinyGain} for Faction ${refP.illusionColor}!`, 'success');
                }
                const WITNESS_RADIUS = 300; const player = this.players[this.localPlayerIndex] || this.players[0];
                this.guards.forEach(otherG => {
                    if (otherG.id !== guard.id && otherG.colorCode === guard.colorCode && otherG.hp > 0) {
                        if (Math.sqrt((otherG.x - guard.x) ** 2 + (otherG.y - guard.y) ** 2) < WITNESS_RADIUS) {
                            if (Physics.checkLineOfSight(otherG.x, otherG.y, player.x, player.y, this.platforms)) {
                                otherG.target = player; this.addLog(`🚨 WITNESS: ${otherG.colorCode} Guard saw their comrade die!`, 'alert');
                            }
                        }
                    }
                });
            }

            this.guards.splice(index, 1); this.score += guard.isBoss ? 1000 : 150;
            this.rankChips.push({ x: guard.x, y: guard.y, width: 12, height: 12 });
            for (let i = 0; i < 3; i++) { this.currencyChips.push({ x: guard.x + Math.random() * 24 - 12, y: guard.y + Math.random() * 24 - 12, width: 8, height: 8, value: Math.floor(Math.random() * 10) + 5 }); }
            if (Math.random() < 0.4) this.ammoDrops.push({ x: guard.x, y: guard.y, w: 12, h: 12 });
            if (Math.random() < 0.25) this.grenadeDrops.push({ x: guard.x + 8, y: guard.y - 8, w: 14, h: 14 });
            if (Math.random() < (guard.rank >= 3 ? 0.40 : 0.15)) {
                const droppedWeapons = ['shotgun', 'railgun', 'blaster'];
                this.weaponDrops.push({ x: guard.x + 4, y: guard.y + 4, w: 18, h: 14, weapon: droppedWeapons[Math.floor(Math.random() * droppedWeapons.length)] });
            }

            if (guard.isBoss) {
                this.door = { x: guard.x, y: guard.y, w: 48, h: 48, active: true };
                this.spawnExplosion(guard.x + 22, guard.y + 22, '#3cff00'); this.spawnExplosion(guard.x + 22, guard.y + 22, '#00f2ff');
                this.addLog('🔓 ADMIRAL ELIMINATED! ISLAND FERRY DOOR ENABLED!', 'success'); this.showShop();
            }
        }
    }

    healPlayer(player) {
        if (player.invincibilityFrames > 0) return;
        this.spawnExplosion(player.x + 12, player.y + 12, player.color);
        if (player.hp < player.maxHp) player.hp += 1;
        else if (player.hp === player.maxHp) { player.rankProgress += 50; this.addLog('> RANK PROGRESS INCREASED!', 'success'); }
    }

    damagePlayer(player) {
        if (player.invincibilityFrames > 0) return;
        AudioController.playHurt(); this.spawnExplosion(player.x + 12, player.y + 12, player.color);
        player.hp = Math.max(0, player.hp - 0.05); player.rankProgress = Math.max(0, player.rankProgress - 15); player.invincibilityFrames = 45;

        if (player.camoActive) { player.camoActive = false; player.camoCooldown = player.camoMaxCooldown; this.addLog('> CAMO COMPROMISED BY IMPACT!', 'alert'); }
        this.addLog('SECURITY THREAT: INTRUDER HIT!', 'alert');
        this.hitstopTimer = 6; this.screenshakeTimer = 16; this.screenshakeIntensity = 10;

        if (player.hp <= 0) {
            player.active = false;
            if (this.players.every(p => !p || !p.active)) { this.endGame(false, 'MISSION TERMINATED: ALL OPERATIVES NEUTRALISED.'); }
        }
    }

    updateThrowables() {
        if (this.mode !== 'single' && this.mode !== 'host' && this.mode !== 'local') return;
        const refP = this.players[this.localPlayerIndex] || this.players[0];

        if (this.keys['e'] && !this.keys_e_lock && refP && refP.active) {
            this.keys_e_lock = true;
            if (refP.heldThrowable) {
                const t = refP.heldThrowable; const angle = refP.aimAngle;
                t.vx = Math.cos(angle) * 12; t.vy = Math.sin(angle) * 12; t.vz = 5; t.state = 'thrown';
                refP.heldThrowable = null; t.holder = null; AudioController.playHurt();
            } else {
                let closestT = null; let minDist = 45;
                this.throwables.forEach(t => {
                    if (t.state === 'idle') {
                        const dist = Math.sqrt(((t.x + t.w / 2) - (refP.x + refP.width / 2)) ** 2 + ((t.y + t.h / 2) - (refP.y + refP.height / 2)) ** 2);
                        if (dist < minDist) { minDist = dist; closestT = t; }
                    }
                });
                if (closestT) { closestT.state = 'held'; closestT.holder = refP; refP.heldThrowable = closestT; AudioController.playRankUp(); }
            }
        }
        if (!this.keys['e']) this.keys_e_lock = false;

        this.throwables.forEach((t, index) => {
            if (t.state === 'thrown') {
                t.x += t.vx; t.y += t.vy; t.z += t.vz; t.vz -= 0.25; t.vx *= 0.98; t.vy *= 0.98;

                if (t.z <= 0) {
                    t.z = 0; t.vz = 0;
                    if (Math.sqrt(t.vx * t.vx + t.vy * t.vy) > 4.5) { this.smashThrowable(t, index); } else { t.state = 'idle'; t.vx = 0; t.vy = 0; }
                }

                this.guards.forEach((g) => {
                    if (g.hp > 0) {
                        if (Math.sqrt(((t.x + t.w / 2) - (g.x + g.width / 2)) ** 2 + ((t.y + t.h / 2) - (g.y + g.height / 2)) ** 2) < 40 && Math.abs(t.z - g.z) < 30) {
                            g.hp -= 25; g.knockedTimer = 180; AudioController.playHurt();
                            this.spawnExplosion(t.x + t.w / 2, t.y + t.h / 2, t.color); this.addLog("💥 CRASH: Guard knocked down by flying object!", "alert"); this.smashThrowable(t, index);
                        }
                    }
                });
            }
        });
    }

    updateGrenades() {
        this.grenades = this.grenades.filter(g => {
            g.x += g.vx; g.y += g.vy; g.z += g.vz; g.vz -= 0.22; g.vx *= 0.98; g.vy *= 0.98;

            if (g.z <= 0) {
                g.z = 0;
                if (g.vz < -1.0) { g.vz = -g.vz * 0.45; g.vx *= 0.75; g.vy *= 0.75; } else { g.vz = 0; g.vx *= 0.85; g.vy *= 0.85; }
            }

            g.timer--;
            if (g.timer <= 0) {
                this.spawnExplosion(g.x + 6, g.y + 6, '#ff0055'); this.spawnExplosion(g.x + 6, g.y + 6, '#ffb700'); this.spawnExplosion(g.x + 6, g.y + 6, '#ff3333');
                AudioController.playHurt(); this.screenshakeTimer = 12; this.screenshakeIntensity = 8;

                this.guards.forEach((guard) => {
                    const dist = Math.sqrt(((guard.x + guard.width / 2) - (g.x + 6)) ** 2 + ((guard.y + guard.height / 2) - (g.y + 6)) ** 2);
                    if (dist < 140) {
                        const damage = Math.round(15 * (1 - dist / 140));
                        if (damage > 0) { guard.hp -= damage; guard.knockedTimer = 180; this.spawnExplosion(guard.x + 12, guard.y + 12, '#ff0055'); }
                    }
                });

                for (let i = 0; i < 20; i++) {
                    const ang = Math.random() * Math.PI * 2; const spd = Math.random() * 4 + 2;
                    this.particles.push({ x: g.x + 6, y: g.y + 6, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, size: Math.random() * 6 + 3, color: Math.random() < 0.5 ? '#ffb700' : '#ff0055', life: 30 + Math.random() * 20 });
                }
                return false;
            }
            return true;
        });
    }

    smashThrowable(t, index) {
        for (let i = 0; i < 15; i++) { this.particles.push({ x: t.x + t.w / 2, y: t.y + t.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, size: Math.random() * 4 + 2, color: t.color, life: 25 }); }
        this.throwables.splice(index, 1);
    }

    magnetizeLoot(activePlayers) {
        if (!activePlayers || activePlayers.length === 0) return;
        const MAGNET_SPEED = 9;

        const pull = (item, w, h) => {
            let bestDx = 0, bestDy = 0, bestDist = Infinity;
            const ix = item.x + w / 2; const iy = item.y + h / 2;
            for (const p of activePlayers) {
                const dx = (p.x + p.width / 2) - ix; const dy = (p.y + p.height / 2) - iy; const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) { bestDist = dist; bestDx = dx; bestDy = dy; }
            }
            if (bestDist > 1) {
                const step = Math.min(MAGNET_SPEED, bestDist);
                item.x += (bestDx / bestDist) * step; item.y += (bestDy / bestDist) * step;
            }
        };

        this.rankChips.forEach(c => pull(c, c.width, c.height)); this.currencyChips.forEach(c => pull(c, c.width, c.height));
        this.ammoDrops.forEach(c => pull(c, c.w, c.h)); this.grenadeDrops.forEach(c => pull(c, c.w, c.h)); this.weaponDrops.forEach(c => pull(c, c.w, c.h));
    }

    updateEntitiesCollision(player) {
        this.rankChips = this.rankChips.filter(chip => {
            if (Physics.checkAABB(chip.x, chip.y, chip.width, chip.height, player.x, player.y, player.width, player.height)) { this.increaseRank(player); return false; }
            return true;
        });

        this.currencyChips = this.currencyChips.filter(coin => {
            if (Physics.checkAABB(coin.x, coin.y, coin.width, coin.height, player.x, player.y, player.width, player.height)) { this.credits += coin.value; this.score += 50; AudioController.playRankUp(); return false; }
            return true;
        });

        this.ammoDrops = this.ammoDrops.filter(crate => {
            if (Physics.checkAABB(crate.x, crate.y, crate.w, crate.h, player.x, player.y, player.width, player.height)) {
                player.ammo = Math.min(player.maxAmmo, player.ammo + 5); AudioController.playRankUp(); this.healPlayer(player); this.addLog('> AMMO CELLS RECOVERED: +5', 'success'); return false;
            }
            return true;
        });

        this.grenadeDrops = this.grenadeDrops.filter(drop => {
            if (Physics.checkAABB(drop.x, drop.y, drop.w, drop.h, player.x, player.y, player.width, player.height)) {
                const gained = Math.min(player.maxGrenades - player.grenades, 2); player.grenades = Math.min(player.maxGrenades, player.grenades + 2);
                AudioController.playRankUp(); this.addLog(`💣 GRENADES RECOVERED: +${gained} (${player.grenades}/${player.maxGrenades})`, 'success'); return false;
            }
            return true;
        });

        this.weaponDrops = this.weaponDrops.filter(drop => {
            if (Physics.checkAABB(drop.x, drop.y, drop.w, drop.h, player.x, player.y, player.width, player.height)) {
                if (!player.weapons.includes(drop.weapon)) { player.weapons.push(drop.weapon); this.addLog(`🔫 WEAPON ACQUIRED: ${drop.weapon.toUpperCase()}!`, 'success'); }
                else { player.ammo = player.maxAmmo; this.addLog(`> ${drop.weapon.toUpperCase()} AMMO MAXED (already owned)`, 'success'); }
                AudioController.playRankUp(); return false;
            }
            return true;
        });

        if (player.rank >= 4 && this.chaosLevel >= 100) { this.endGame(true, 'MUTINY SUCCESSFUL. THE FORTRESS HAS COMPROMISED ITSELF.'); }

        if (this.door && Physics.checkAABB(this.door.x, this.door.y, this.door.w, this.door.h, player.x, player.y, player.width, player.height)) {
            this.score += 1000; this.stageNumber++; this.initLevel();
            this.waveManager.reset(); this.waveManager.currentWave = this.waveManager.currentWave + 1; this.waveManager.countdown = 0;

            this.players.forEach((p, idx) => { if (p) { p.active = true; p.hp = p.maxHp; p.x = 150 + idx * 35; p.y = 150; } });
            if (this.mode === 'host' && this.networkManager) { this.networkManager.connections.forEach(conn => { if (conn.open) { conn.send({ type: 'next-stage', stageNumber: this.stageNumber }); } }); }
        }
    }

    alertGuardsNear(x, y, radius) {
        this.guards.forEach(guard => {
            if (!guard.target) {
                if (Math.sqrt((guard.x + 12 - x) ** 2 + (guard.y + 12 - y) ** 2) < radius) {
                    if (Physics.checkLineOfSight(guard.x + 12, guard.y + 12, x, y, this.platforms)) {
                        guard.target = this.player1 || this.players[0]; if (Math.random() < 0.08) this.addLog('SECURITY: INTRUDER POSITION ALERTED BY DISCHARGE!', 'alert');
                    }
                }
            }
        });
    }

    increaseRank(player) {
        player.rankProgress += 35; AudioController.playRankUp();
        if (player.rankProgress >= 100) {
            player.rankProgress = 0; player.rank = Math.min(4, player.rank + 1); AudioController.playLevelUp(); player.hp = player.maxHp;
            this.screenshakeTimer = 22; this.screenshakeIntensity = 7.5; this.rankUpAlertTimer = 120;
            this.addLog(`⚡ RANK INCREASED: SECURITY CLEARANCE — LEVEL ${player.rank} [${['', 'GRUNT', 'SENTINEL', 'LIEUTENANT', 'COMMANDER'][player.rank]}]`, 'success');
        }
    }

    // ---- FIXED RENDER CONFIGURATION (SINGLE CAM LOCK) ----
    render() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const camTarget = this.players[this.localPlayerIndex] || this.players[0];
        if (camTarget) {
            this.setCamera(camTarget);
        }
        this.renderWorld();
    }

    setCamera(player) {
        if (!player) return;
        // Lock completely onto center of target model
        const targetX = (player.x + player.width / 2) - CANVAS_WIDTH / 2;
        const targetY = (player.y + player.height / 2) - CANVAS_HEIGHT / 2;
        this.cameraX = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, targetX));
        this.cameraY = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, targetY));
    }

    renderWorld() {
        this.ctx.save();

        if (this.screenshakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.screenshakeIntensity;
            const sy = (Math.random() - 0.5) * this.screenshakeIntensity;
            this.ctx.translate(sx, sy); this.screenshakeTimer--; this.screenshakeIntensity *= 0.92;
        }

        GameRenderer.renderBackground(this.ctx, this);

        const drawables = [];
        this.buildings.forEach(b => { drawables.push({ ySort: b.y + b.h, draw: () => GameRenderer.renderStaticBuilding(this.ctx, b, this.cameraX, this.cameraY) }); });
        this.platforms.forEach(p => { drawables.push({ ySort: p.y + p.h, draw: () => GameRenderer.renderPlatforms(this.ctx, { platforms: [p], cameraX: this.cameraX, cameraY: this.cameraY }) }); });
        this.vehicles.forEach(v => { drawables.push({ ySort: v.y + v.h / 2, draw: () => GameRenderer.renderVehicles(this.ctx, { vehicles: [v], cameraX: this.cameraX, cameraY: this.cameraY }) }); });
        this.throwables.forEach(t => { drawables.push({ ySort: t.state === 'held' && t.holder ? t.holder.y + t.holder.height : t.y + t.h, draw: () => GameRenderer.renderThrowables(this.ctx, { throwables: [t], cameraX: this.cameraX, cameraY: this.cameraY }) }); });

        this.rankChips.forEach(chip => {
            drawables.push({
                ySort: chip.y + chip.height,
                draw: () => {
                    const hoverY = Math.sin(Date.now() / 220) * 4; const rx = chip.x - this.cameraX; const ry = chip.y - this.cameraY + hoverY;
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.ctx.beginPath(); this.ctx.ellipse(rx + chip.width / 2, chip.y - this.cameraY + chip.height, chip.width * 0.5, 2, 0, 0, Math.PI * 2); this.ctx.fill();
                    this.ctx.fillStyle = '#ffb700'; this.ctx.fillRect(rx, ry, chip.width, chip.height); this.ctx.restore();
                }
            });
        });

        this.currencyChips.forEach(coin => {
            drawables.push({
                ySort: coin.y + coin.height,
                draw: () => {
                    const hoverY = Math.sin(Date.now() / 260) * 4.5; const rx = coin.x - this.cameraX; const ry = coin.y - this.cameraY + hoverY; const spin = Date.now() / 120;
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.ctx.beginPath(); this.ctx.ellipse(rx + 4, coin.y - this.cameraY + 8, 4.5, 1.5, 0, 0, Math.PI * 2); this.ctx.fill();
                    this.ctx.translate(rx + 4, ry + 4); this.ctx.scale(Math.abs(Math.sin(spin)), 1.0); this.ctx.fillStyle = '#ffd700'; this.ctx.beginPath(); this.ctx.arc(0, 0, 4.5, 0, Math.PI * 2); this.ctx.fill();
                    this.ctx.strokeStyle = '#b29600'; this.ctx.lineWidth = 1; this.ctx.stroke(); this.ctx.restore();
                }
            });
        });

        this.ammoDrops.forEach(crate => {
            drawables.push({
                ySort: crate.y + crate.h,
                draw: () => {
                    const hoverY = Math.sin(Date.now() / 200) * 3.5; const rx = crate.x - this.cameraX; const ry = crate.y - this.cameraY + hoverY;
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.ctx.beginPath(); this.ctx.ellipse(rx + crate.w / 2, crate.y - this.cameraY + crate.h, crate.w * 0.5, 2, 0, 0, Math.PI * 2); this.ctx.fill();
                    this.ctx.fillStyle = '#006c7a'; this.ctx.fillRect(rx, ry, crate.w, crate.h); this.ctx.strokeStyle = '#00f2ff'; this.ctx.lineWidth = 1.5; this.ctx.strokeRect(rx, ry, crate.w, crate.h);
                    this.ctx.beginPath(); this.ctx.moveTo(rx + 3, ry + 3); this.ctx.lineTo(rx + crate.w - 3, ry + crate.h - 3); this.ctx.moveTo(rx + crate.w - 3, ry + 3); this.ctx.lineTo(rx + 3, ry + crate.h - 3); this.ctx.stroke(); this.ctx.restore();
                }
            });
        });

        this.grenadeDrops.forEach(drop => {
            drawables.push({
                ySort: drop.y + drop.h,
                draw: () => {
                    const hoverY = Math.sin(Date.now() / 230) * 4; const rx = drop.x - this.cameraX; const ry = drop.y - this.cameraY + hoverY;
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.ctx.beginPath(); this.ctx.ellipse(rx + drop.w / 2, drop.y - this.cameraY + drop.h, drop.w * 0.45, 2, 0, 0, Math.PI * 2); this.ctx.fill();
                    const pulse = 0.7 + Math.abs(Math.sin(Date.now() / 300)) * 0.3; this.ctx.fillStyle = '#14532d'; this.ctx.strokeStyle = '#3cff00'; this.ctx.lineWidth = 1.5; this.ctx.shadowColor = '#3cff00'; this.ctx.shadowBlur = 6 * pulse;
                    this.ctx.beginPath(); this.ctx.roundRect(rx, ry, drop.w, drop.h, 4); this.ctx.fill(); this.ctx.stroke();
                    this.ctx.shadowBlur = 0; this.ctx.fillStyle = '#3cff00'; this.ctx.font = 'bold 9px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.fillText('💣', rx + drop.w / 2, ry + drop.h - 3); this.ctx.restore();
                }
            });
        });

        const WEAPON_DROP_COLORS = { shotgun: '#ffb700', railgun: '#00f2ff', blaster: '#3cff00' };
        this.weaponDrops.forEach(drop => {
            drawables.push({
                ySort: drop.y + drop.h,
                draw: () => {
                    const hoverY = Math.sin(Date.now() / 210) * 4; const rx = drop.x - this.cameraX; const ry = drop.y - this.cameraY + hoverY; const col = WEAPON_DROP_COLORS[drop.weapon] || '#ffffff';
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.ctx.beginPath(); this.ctx.ellipse(rx + drop.w / 2, drop.y - this.cameraY + drop.h, drop.w * 0.45, 2, 0, 0, Math.PI * 2); this.ctx.fill();
                    const pulse = 0.7 + Math.abs(Math.sin(Date.now() / 280)) * 0.3; this.ctx.fillStyle = 'rgba(0,0,0,0.75)'; this.ctx.strokeStyle = col; this.ctx.lineWidth = 1.5; this.ctx.shadowColor = col; this.ctx.shadowBlur = 8 * pulse;
                    this.ctx.beginPath(); this.ctx.roundRect(rx, ry, drop.w, drop.h, 4); this.ctx.fill(); this.ctx.stroke();
                    this.ctx.shadowBlur = 0; this.ctx.fillStyle = col; this.ctx.font = 'bold 7px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.fillText(drop.weapon.toUpperCase(), rx + drop.w / 2, ry + drop.h - 4); this.ctx.restore();
                }
            });
        });

        this.decoys.forEach(decoy => { drawables.push({ ySort: decoy.y + decoy.height, draw: () => { const rx = decoy.x - this.cameraX, ry = decoy.y - this.cameraY; this.ctx.globalAlpha = 0.45; this.ctx.fillStyle = decoy.color; this.ctx.fillRect(rx, ry, decoy.width, decoy.height); this.ctx.globalAlpha = 1.0; } }); });

        if (this.door) {
            drawables.push({
                ySort: this.door.y + this.door.h,
                draw: () => {
                    const rx = this.door.x - this.cameraX; const ry = this.door.y - this.cameraY; const pulse = 10 + Math.abs(Math.sin(Date.now() / 150)) * 8;
                    this.ctx.save(); this.ctx.fillStyle = 'rgba(0, 242, 255, 0.15)'; this.ctx.beginPath(); this.ctx.arc(rx + 24, ry + 24, 24 + pulse, 0, Math.PI * 2); this.ctx.fill();
                    this.ctx.strokeStyle = '#00f2ff'; this.ctx.lineWidth = 3; this.ctx.strokeRect(rx, ry, this.door.w, this.door.h);
                    this.ctx.fillStyle = '#102040'; this.ctx.fillRect(rx + 6, ry + 6, this.door.w - 12, this.door.h - 12);
                    this.ctx.fillStyle = '#00f2ff'; this.ctx.font = 'bold 8px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.fillText('NEXT ISLAND', rx + 24, ry + 28); this.ctx.restore();
                }
            });
        }

        const COLOR_HEX = { 'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff', 'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff' };
        const localP = this.players[this.localPlayerIndex] || this.players[0];
        this.guards.forEach(g => {
            if (localP && localP.illusionColor && g.colorCode === localP.illusionColor && g.hp > 0) {
                const matchColor = COLOR_HEX[g.colorCode] || '#ffffff';
                drawables.push({
                    ySort: g.y + g.height - 0.5,
                    draw: () => {
                        const rx = g.x + g.width / 2 - this.cameraX; const ry = g.y + g.height - 8 - this.cameraY; const t = Date.now();
                        const outerR = 20 + Math.abs(Math.sin(t / 500)) * 8; const innerR = 10 + Math.abs(Math.sin(t / 280)) * 5;
                        const outerAlpha = 0.45 + Math.abs(Math.sin(t / 500)) * 0.35; const innerAlpha = 0.65 + Math.abs(Math.sin(t / 280)) * 0.25;
                        this.ctx.save(); this.ctx.strokeStyle = matchColor; this.ctx.lineWidth = 2.5; this.ctx.globalAlpha = outerAlpha; this.ctx.shadowColor = matchColor; this.ctx.shadowBlur = 12; this.ctx.beginPath(); this.ctx.ellipse(rx, ry, outerR, outerR * 0.35, 0, 0, Math.PI * 2); this.ctx.stroke();
                        this.ctx.globalAlpha = innerAlpha * 0.3; this.ctx.fillStyle = matchColor; this.ctx.shadowBlur = 6; this.ctx.beginPath(); this.ctx.ellipse(rx, ry, innerR, innerR * 0.35, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.globalAlpha = 1.0; this.ctx.shadowBlur = 0; this.ctx.restore();
                    }
                });
            }
            drawables.push({ ySort: g.y + g.height, draw: () => GameRenderer.renderGuard(this.ctx, g, false, this.cameraX, this.cameraY) });
        });

        this.players.forEach((player, idx) => {
            if (player && player.active) {
                player.trail.forEach(item => {
                    drawables.push({
                        ySort: item.y + item.height - 1,
                        draw: () => { this.ctx.save(); this.ctx.globalAlpha = item.opacity; this.ctx.fillStyle = player.color; const iy = item.y - this.cameraY - (item.z || 0); this.ctx.fillRect(item.x - this.cameraX, iy, item.width, item.height); this.ctx.restore(); }
                    });
                });
                drawables.push({ ySort: player.y + player.height, draw: () => GameRenderer.renderPlayer(this.ctx, player, idx === this.localPlayerIndex, this.cameraX, this.cameraY, player.weapons, player.currentWeaponIndex) });
            }
        });

        drawables.sort((a, b) => a.ySort - b.ySort);
        drawables.forEach(d => d.draw());

        this.lasers.forEach(laser => {
            const rx = laser.x - this.cameraX, ry = laser.y - this.cameraY;
            if (laser.type === 'player') {
                if (laser.subType === 'railgun') { this.ctx.fillStyle = '#00f2ff'; this.ctx.fillRect(rx - 4, ry - 4, 12, 12); }
                else if (laser.subType === 'shotgun') { this.ctx.fillStyle = '#ffb700'; this.ctx.fillRect(rx, ry, 5, 5); }
                else { this.ctx.fillStyle = '#3cff00'; this.ctx.beginPath(); this.ctx.arc(rx + 3, ry + 3, 3, 0, Math.PI * 2); this.ctx.fill(); }
            } else { this.ctx.fillStyle = '#ff0055'; this.ctx.beginPath(); this.ctx.arc(rx + 3, ry + 3, 3, 0, Math.PI * 2); this.ctx.fill(); }
        });

        this.grenades.forEach(gr => {
            const rx = gr.x - this.cameraX; const ry = gr.y - this.cameraY - gr.z; const shadowRy = gr.y - this.cameraY;
            this.ctx.save(); this.ctx.globalAlpha = 0.3; this.ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.ctx.beginPath(); this.ctx.ellipse(rx + 6, shadowRy + 6, 6 + gr.z * 0.05, 2, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.globalAlpha = 1.0;
            const pulse = 0.7 + Math.abs(Math.sin(Date.now() / 80)) * 0.3; const dangerFrac = gr.timer / 80; const bodyColor = dangerFrac < 0.3 ? '#ff0055' : '#ffb700';
            this.ctx.fillStyle = bodyColor; this.ctx.shadowColor = bodyColor; this.ctx.shadowBlur = 10 * pulse; this.ctx.beginPath(); this.ctx.arc(rx + 6, ry + 6, 6, 0, Math.PI * 2); this.ctx.fill();
            const ringFrac = gr.timer / 80; this.ctx.strokeStyle = '#ffffff'; this.ctx.lineWidth = 1.5; this.ctx.globalAlpha = 0.7; this.ctx.shadowBlur = 0; this.ctx.beginPath(); this.ctx.arc(rx + 6, ry + 6, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringFrac); this.ctx.stroke(); this.ctx.restore();
        });

        this.particles.forEach(p => { this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x - this.cameraX, p.y - this.cameraY, p.size, p.size); });

        if (this.closestKnockedGuard) {
            const rx = this.closestKnockedGuard.x - this.cameraX; const ry = this.closestKnockedGuard.y - this.cameraY;
            this.ctx.save(); this.ctx.fillStyle = '#ff3333'; this.ctx.font = 'bold 9px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.shadowColor = '#ff3333'; this.ctx.shadowBlur = 8; this.ctx.fillText('[F] ASSASSINATE', rx + 12, ry - 18); this.ctx.restore();

            const localPlayer = this.players[this.localPlayerIndex] || this.players[0];
            if (localPlayer && localPlayer.camoActive) {
                const pulse = 0.75 + Math.abs(Math.sin(Date.now() / 180)) * 0.25; const bW = 320, bH = 52; const bX = CANVAS_WIDTH / 2 - bW / 2; const bY = 18;
                this.ctx.save(); this.ctx.globalAlpha = pulse; this.ctx.fillStyle = 'rgba(10, 0, 0, 0.88)'; this.ctx.beginPath(); this.ctx.roundRect(bX, bY, bW, bH, 6); this.ctx.fill();
                this.ctx.strokeStyle = `rgba(255, 30, 30, ${pulse})`; this.ctx.lineWidth = 2.5; this.ctx.shadowColor = '#ff0055'; this.ctx.shadowBlur = 16 * pulse; this.ctx.stroke();
                this.ctx.shadowBlur = 0; this.ctx.fillStyle = '#ff2222'; this.ctx.font = 'bold 13px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.fillText('🗡️  [F]  ASSASSINATE', CANVAS_WIDTH / 2, bY + 22);
                this.ctx.fillStyle = `rgba(255, 180, 180, ${pulse})`; this.ctx.font = 'bold 8px Orbitron, monospace'; this.ctx.fillText('CAMO ACTIVE — SILENT ELIMINATION AVAILABLE', CANVAS_WIDTH / 2, bY + 40); this.ctx.restore();
            }
        }

        if (this.waveManager.state !== 'active') {
            const secs = this.waveManager.getCountdownSeconds();
            const label = this.waveManager.state === 'countdown' ? `WAVE ${this.waveManager.currentWave + 1} INCOMING — ${secs}s` : `NEXT WAVE IN ${secs}s`;
            this.ctx.save(); this.ctx.fillStyle = 'rgba(0,0,0,0.55)'; this.ctx.fillRect(CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2 - 22, 280, 44); this.ctx.fillStyle = '#00f2ff'; this.ctx.font = 'bold 13px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.fillText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5); this.ctx.restore();
        }

        if (this.rankUpAlertTimer > 0) {
            this.rankUpAlertTimer--; const refPlayer = this.players[this.localPlayerIndex] || this.players[0]; const newRank = refPlayer ? refPlayer.rank : 1; const RANK_NAMES = { 1: 'GRUNT', 2: 'SENTINEL', 3: 'LIEUTENANT', 4: 'COMMANDER' };
            this.ctx.save(); this.ctx.fillStyle = 'rgba(4, 8, 20, 0.85)'; this.ctx.fillRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 40, 400, 80); this.ctx.strokeStyle = '#3cff00'; this.ctx.lineWidth = 3; this.ctx.strokeRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 40, 400, 80);
            this.ctx.fillStyle = '#3cff00'; this.ctx.font = 'bold 13px Orbitron, monospace'; this.ctx.textAlign = 'center'; this.ctx.shadowColor = '#3cff00'; this.ctx.shadowBlur = 10; this.ctx.fillText('⚡ SECURITY CLEARANCE UPGRADED ⚡', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
            this.ctx.fillStyle = '#ffffff'; this.ctx.font = 'bold 10px Orbitron, monospace'; this.ctx.fillText(`NEW CLEARANCE: ${RANK_NAMES[newRank] || 'OPERATIVE'} (LEVEL ${newRank})`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18); this.ctx.restore();
        }

        if (this.touchAiming) {
            const rx = this.touchX; const ry = this.touchY; const refP = this.players[this.localPlayerIndex] || this.players[0];
            const COLOR_VALUES = { 'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff', 'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff' }; const colorVal = (refP && refP.illusionColor) ? COLOR_VALUES[refP.illusionColor] : '#00f2ff';
            this.ctx.save(); this.ctx.strokeStyle = colorVal; this.ctx.lineWidth = 1.5; this.ctx.setLineDash([4, 4]);
            if (refP) { const prx = refP.x + refP.width / 2 - this.cameraX; const pry = refP.y + refP.height / 2 - this.cameraY; this.ctx.beginPath(); this.ctx.moveTo(prx, pry); this.ctx.lineTo(rx, ry); this.ctx.stroke(); }
            this.ctx.setLineDash([]); this.ctx.beginPath(); const pulseRadius = 14 + Math.abs(Math.sin(Date.now() / 100)) * 4; this.ctx.arc(rx, ry, pulseRadius, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(rx, ry, pulseRadius + 6, -Math.PI / 4, Math.PI / 4); this.ctx.stroke(); this.ctx.beginPath(); this.ctx.arc(rx, ry, pulseRadius + 6, Math.PI * 3 / 4, Math.PI * 5 / 4); this.ctx.stroke();
            this.ctx.fillStyle = colorVal; this.ctx.beginPath(); this.ctx.arc(rx, ry, 2, 0, Math.PI * 2); this.ctx.fill(); this.ctx.restore();
        }

        this.ctx.save(); this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; for (let y = 0; y < CANVAS_HEIGHT; y += 3) { this.ctx.fillRect(0, y, CANVAS_WIDTH, 1); }
        const vignette = this.ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)'); vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)'); this.ctx.fillStyle = vignette; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); this.ctx.restore();

        this.ctx.restore();
    }

    spawnDashParticles(player) { for (let i = 0; i < 12; i++) { this.particles.push({ x: player.x + player.width / 2, y: player.y + player.height / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, size: Math.random() * 3 + 1, color: player.color, life: 15 }); } }
    spawnExplosion(x, y, color) { for (let i = 0; i < 15; i++) { this.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, size: Math.random() * 3 + 1, color, life: 20 }); } }
    spawnCamoFlash(x, y) { for (let angle = 0; angle < Math.PI * 2; angle += 0.25) { this.particles.push({ x: x + Math.cos(angle) * 10, y: y + Math.sin(angle) * 10, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5, size: Math.random() * 2 + 2, color: '#00f2ff', life: 25 }); } }
    spawnSwapFlash(x, y, illusionColor) { const colors = { 'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff' }; const color = colors[illusionColor] || '#ffffff'; for (let angle = 0; angle < Math.PI * 2; angle += 0.2) { this.particles.push({ x: x + Math.cos(angle) * 8, y: y + Math.sin(angle) * 8, vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5, size: Math.random() * 2 + 2, color: color, life: 20 }); } }
    spawnDust(x, y, count = 6) { for (let i = 0; i < count; i++) { this.particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 1 - 0.4, size: Math.random() * 3 + 2, color: 'rgba(226, 232, 240, 0.45)', life: 15 }); } }

    updateHUD() {
        document.getElementById('hud-timer').innerText = `TIME: ${this.formatTime(this.elapsedTime)}`;
        document.getElementById('hud-credits').innerText = `CREDITS: ${this.credits}`;
        const scoreEl = document.getElementById('hud-score'); if (scoreEl) scoreEl.innerText = `SCORE: ${this.score}`;
        document.getElementById('hud-wave').innerText = `WAVE: ${this.waveManager.currentWave}`;

        const player = this.players[this.localPlayerIndex] || this.players[0]; if (!player) return;
        const hpPct = (player.hp / player.maxHp) * 100; document.getElementById('barfill-hp').style.height = `${hpPct}%`;
        const ammoPct = (player.ammo / player.maxAmmo) * 100; const ammoEl = document.getElementById('barfill-ammo'); if (ammoEl) ammoEl.style.height = `${ammoPct}%`;

        const fillR = document.getElementById('mutiny-fill-r'); const fillG = document.getElementById('mutiny-fill-g'); const fillB = document.getElementById('mutiny-fill-b'); const fillChaos = document.getElementById('hud-chaos-fill');
        if (fillR) fillR.style.width = `${this.mutinyR || 0}%`; if (fillG) fillG.style.width = `${this.mutinyG || 0}%`; if (fillB) fillB.style.width = `${this.mutinyB || 0}%`; if (fillChaos) fillChaos.style.width = `${this.chaosLevel || 0}%`;

        const camoEl = document.getElementById('hud-camo');
        if (camoEl) {
            if (player.camoActive) { const secs = Math.ceil(player.camoDuration / 60); camoEl.innerText = `CAMO: ${secs}s`; camoEl.style.color = '#00f2ff'; }
            else if (player.camoCooldown > 0) { const cd = Math.ceil(player.camoCooldown / 60); camoEl.innerText = `CAMO: ${cd}s CD`; camoEl.style.color = '#555'; }
            else { camoEl.innerText = 'CAMO: READY'; camoEl.style.color = '#3cff00'; }
        }

        const colorEl = document.getElementById('hud-color');
        if (colorEl && player.illusionColor) {
            const COLOR_VALUES = { 'R': '#ff3333', 'G': '#33ff33', 'B': '#3333ff', 'Y': '#ffff33', 'M': '#ff33ff', 'C': '#33ffff' };
            colorEl.innerText = `COLOR: ${player.illusionColor} (${player.colorCharges}/${player.maxColorCharges})`; colorEl.style.color = COLOR_VALUES[player.illusionColor] || '#ffffff';
        }

        const weaponEl = document.getElementById('hud-weapon');
        if (weaponEl) {
            const WEAPON_HUD = { blaster: { label: '🔫 BLASTER', color: '#3cff00' }, shotgun: { label: '💥 SHOTGUN', color: '#ffb700' }, railgun: { label: '⚡ RAILGUN', color: '#00f2ff' } };
            const currentWeapon = player.weapons[player.currentWeaponIndex] || 'blaster'; const info = WEAPON_HUD[currentWeapon] || WEAPON_HUD.blaster;
            weaponEl.innerText = info.label; weaponEl.style.color = info.color;
        }

        const grenadeEl = document.getElementById('hud-grenades'); if (grenadeEl) { grenadeEl.innerText = `💣 ${player.grenades}/${player.maxGrenades}`; grenadeEl.style.color = player.grenades > 0 ? '#ffb700' : '#555'; }
        if (this.chaosLevel >= 60) { document.getElementById('core-alarm').classList.remove('hidden'); } else { document.getElementById('core-alarm').classList.add('hidden'); }

        for (let i = 1; i < 4; i++) {
            const bar = document.getElementById(`coop-bar-${i}`); if (!bar) continue; const p = this.players[i];
            if (p && p.active) { bar.style.display = 'flex'; const hpFill = bar.querySelector('.coop-hp-fill'); if (hpFill) hpFill.style.width = `${(p.hp / p.maxHp) * 100}%`; } else { bar.style.display = 'none'; }
        }
    }

    incrementMutiny(colorCode, amount = 8) {
        const prevR = this.mutinyR || 0; const prevG = this.mutinyG || 0; const prevB = this.mutinyB || 0;
        if (colorCode === 'R') this.mutinyR = Math.min(100, prevR + amount); if (colorCode === 'G') this.mutinyG = Math.min(100, prevG + amount); if (colorCode === 'B') this.mutinyB = Math.min(100, prevB + amount);
        this.chaosLevel = Math.round(((this.mutinyR || 0) + (this.mutinyG || 0) + (this.mutinyB || 0)) / 3);

        const FACTION_NAMES = { R: '🔴 RED', G: '🟢 GREEN', B: '🔵 BLUE' };
        const justFilled = (colorCode === 'R' && prevR < 100 && this.mutinyR >= 100) || (colorCode === 'G' && prevG < 100 && this.mutinyG >= 100) || (colorCode === 'B' && prevB < 100 && this.mutinyB >= 100);

        if (justFilled) {
            const filledName = FACTION_NAMES[colorCode]; const incomplete = [];
            if (this.mutinyR < 100) incomplete.push('🔴 RED'); if (this.mutinyG < 100) incomplete.push('🟢 GREEN'); if (this.mutinyB < 100) incomplete.push('🔵 BLUE');
            this.addLog(`✅ ${filledName} MUTINY COMPLETE! FACTION IN FULL REVOLT!`, 'success');
            if (incomplete.length > 0) { this.addLog(`⚠️ FOCUS ON: ${incomplete.join(' & ')} — SWITCH COLOR & TRIGGER THEIR MUTINY!`, 'alert'); }
            else { this.addLog('🏆 ALL FACTIONS IN MUTINY — TRIGGER CHAOS WIN CONDITION!', 'success'); }
        }
    }

    formatTime(seconds) { const m = Math.floor(seconds / 60), s = seconds % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

    // ---- ROBUST MODAL PAUSE SYSTEM CONTROLLER ----
    togglePause() {
        if (this.state !== STATE_PLAYING) return;
        this.isPaused = !this.isPaused;

        // Support modal selectors used interchangeably across template builds
        const pauseScreen = document.getElementById('pause-screen') || document.getElementById('pause-modal');
        if (pauseScreen) {
            if (this.isPaused) { pauseScreen.classList.remove('hidden'); pauseScreen.classList.add('active'); }
            else { pauseScreen.classList.remove('active'); pauseScreen.classList.add('hidden'); }
        }
    }

    addLog(msg, type = 'normal') { const row = document.createElement('div'); row.className = `terminal-log-row ${type}`; row.innerText = `> ${msg}`; this.terminalContent.innerHTML = ''; this.terminalContent.appendChild(row); }

    handleNetworkMessage(data) {
        switch (data.type) {
            case 'assign-id': this.localPlayerIndex = data.playerId - 1; this.addLog(`ASSIGNED OPERATIVE SLOT: P${data.playerId}`, 'success'); break;
            case 'lobby-update': this.updateWaitingScreen(data); break;
            case 'start-game': this.startGame(); break;
            case 'state-update': {
                if (data.players) {
                    data.players.forEach(ps => {
                        if (!ps) return; const idx = ps.index; if (idx === undefined || idx === null || idx < 0 || idx >= 4) return; if (idx === this.localPlayerIndex) return;
                        if (!this.players[idx]) { this.players[idx] = new Player(ps.x, ps.y, PLAYER_COLORS[idx] || '#fff'); }
                        const p = this.players[idx]; if (p) { p.x = ps.x; p.y = ps.y; p.vx = ps.vx; p.vy = ps.vy; p.hp = ps.hp; p.rank = ps.rank; p.aimAngle = ps.aimAngle; p.camoActive = ps.camoActive; p.active = ps.active; p.illusionColor = ps.illusionColor || 'G'; }
                    });
                }
                if (data.guards) {
                    data.guards.forEach(gs => {
                        let guard = this.guards.find(g => g.id === gs.id);
                        if (!guard) { const r = gs.rank || 1; const c = gs.colorCode || 'R'; guard = new Guard(gs.id, gs.x, gs.y, 0, 0, 0, 1600, 0, 1200, r, c); guard.maxHp = gs.maxHp; this.guards.push(guard); }
                        guard.x = gs.x; guard.y = gs.y; guard.hp = gs.hp; guard.aimAngle = gs.aimAngle; if (gs.rank) guard.rank = gs.rank; if (gs.colorCode) guard.colorCode = gs.colorCode;
                    });
                    this.guards = this.guards.filter(g => data.guards.some(gs => gs.id === g.id));
                }
                if (data.lasers) this.lasers = data.lasers; if (data.rankChips) this.rankChips = data.rankChips; if (data.currencyChips) this.currencyChips = data.currencyChips; if (data.ammoDrops) this.ammoDrops = data.ammoDrops; if (data.chaosLevel !== undefined) this.chaosLevel = data.chaosLevel; if (data.credits !== undefined) this.credits = data.credits;
                if (data.waveState) { this.waveManager.currentWave = data.waveState.currentWave; this.waveManager.state = data.waveState.state; this.waveManager.countdown = data.waveState.countdown; this.waveManager.countdownMax = data.waveState.countdownMax; }
                break;
            }
            case 'game-over': this.endGame(data.won, data.reason); break;
            case 'restart-game': this.restartGame(); break;
            case 'next-stage': this.stageNumber = data.stageNumber; this.initLevel(); this.waveManager.reset(); this.waveManager.currentWave = this.waveManager.currentWave + 1; this.waveManager.countdown = 0; this.players.forEach((p, idx) => { if (p) { p.active = true; p.hp = p.maxHp; p.x = 150 + idx * 35; p.y = 150; } }); break;
        }
    }

    updateWaitingScreen(data) {
        const codeEl = document.getElementById('waiting-room-code'); if (codeEl && data.roomCode) codeEl.innerText = data.roomCode;
        const list = document.getElementById('waiting-player-list'); if (list && data.players) { list.innerHTML = data.players.map(p => `<div class="lobby-player-row"><span class="lpr-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></span><span class="lpr-name">${p.nickname || 'OPERATIVE'}</span><span class="lpr-badge">${p.isHost ? '&#x2605; HOST' : 'P' + p.id}</span></div>`).join(''); }
        const countEl = document.getElementById('waiting-count'); if (countEl && data.players) { const slots = 4 - data.players.length; countEl.innerText = `${data.players.length}/4 OPERATIVES — ${slots} SLOT${slots !== 1 ? 'S' : ''} OPEN`; }
    }

    endGame(won, reason) {
        this.state = STATE_GAMEOVER; if (won) { AudioController.playWinTheme(); } else { AudioController.playFailTheme(); } AudioController.stopAll();
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); this.ctx.fillStyle = '#040814'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.hudOverlay.classList.add('hidden'); this.gameOverScreen.classList.remove('hidden'); this.gameOverScreen.classList.add('active');

        const RANK_NAMES = { 1: 'GRUNT (LVL 1)', 2: 'SENTINEL (LVL 2)', 3: 'LIEUTENANT (LVL 3)', 4: 'COMMANDER (LVL 4)' };
        document.getElementById('game-over-title').innerText = won ? 'MUTINY SUCCESSFUL' : 'MISSION FAILURE'; document.getElementById('game-over-reason').innerText = reason;
        const p = this.players[this.localPlayerIndex] || this.players[0]; document.getElementById('stat-rank').innerText = p ? RANK_NAMES[p.rank] : '-'; document.getElementById('stat-chaos').innerText = `${this.chaosLevel}%`; document.getElementById('stat-mutinies').innerText = this.mutiniesTriggered; document.getElementById('stat-wave').innerText = `${this.waveManager.currentWave}`;
        if (this.networkManager && this.mode === 'host') { this.networkManager.sendGameOver(won, reason); }
    }

    restartGame() { this.gameOverScreen.classList.remove('active'); this.gameOverScreen.classList.add('hidden'); if (this.networkManager && this.mode === 'host') { this.networkManager.sendRestart(); } this.startGame(); }

    quitToLobby() {
        this.state = STATE_LOBBY; this.isPaused = false;
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); this.ctx.fillStyle = '#040814'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.hudOverlay.classList.add('hidden'); document.getElementById('touch-controls-container')?.classList.add('hidden'); document.getElementById('core-alarm')?.classList.add('hidden'); this.rankUpAlertTimer = 0;
        this.terminalContent.innerHTML = '<div class="terminal-log-row">> INFILTRATE. BLEND IN. TRIGGER CHAOS.</div>';
        document.getElementById('pause-screen')?.classList.remove('active'); document.getElementById('pause-screen')?.classList.add('hidden');
        document.getElementById('pause-modal')?.classList.remove('active'); document.getElementById('pause-modal')?.classList.add('hidden');
        this.gameOverScreen.classList.remove('active'); this.gameOverScreen.classList.add('hidden');
        const briefingScreen = document.getElementById('briefing-screen'); if (briefingScreen) { briefingScreen.classList.remove('active'); briefingScreen.classList.add('hidden'); }
        if (this.shopScreen) { this.shopScreen.classList.remove('active'); this.shopScreen.classList.add('hidden'); }
        this.lobbyScreen.classList.add('active'); const connPanel = document.getElementById('connection-panel'); if (connPanel) connPanel.classList.add('hidden'); document.querySelector('.menu-sections')?.classList.remove('hidden');
    }

    showShop() { this.isPaused = true; if (this.shopScreen) { document.getElementById('shop-credits').innerText = this.credits; this.shopScreen.classList.remove('hidden'); this.shopScreen.classList.add('active'); } this.addLog('🛒 VENDOR LOBBY CONNECTED: UPGRADE YOUR OPERATIVE.', 'success'); }
    closeShop() { if (this.shopScreen) { this.shopScreen.classList.remove('active'); this.shopScreen.classList.add('hidden'); } this.isPaused = false; this.addLog('🚀 DEPARTED VENDOR. PROCEEDING TO PROGRESSION DOOR.', 'success'); }

    buyShopUpgrade(type) {
        const localP = this.players[this.localPlayerIndex] || this.players[0]; if (!localP) return;
        const BASE_PRICE = { hp: 20, color: 10 }; const purchases = this.upgradePurchases || (this.upgradePurchases = { hp: 0, color: 0 });

        if (type === 'hp') {
            const cost = BASE_PRICE.hp + purchases.hp * 10;
            if (this.credits >= cost) { this.credits -= cost; purchases.hp++; localP.maxHp += 1; localP.hp = localP.maxHp; AudioController.playLevelUp(); this.addLog(`➕ UPGRADED MAX HP: Now ${localP.maxHp}! (Next cost: ${BASE_PRICE.hp + purchases.hp * 10})`, 'success'); }
            else { this.addLog(`❌ NEED ${BASE_PRICE.hp + purchases.hp * 10} CREDITS FOR HP UPGRADE!`, 'alert'); }
        } else if (type === 'color') {
            const cost = BASE_PRICE.color + purchases.color * 10;
            if (this.credits >= cost) { this.credits -= cost; purchases.color++; localP.maxColorCharges += 1; localP.colorCharges = localP.maxColorCharges; AudioController.playLevelUp(); this.addLog(`➕ UPGRADED COLOR CHARGES: Now ${localP.maxColorCharges}! (Next cost: ${BASE_PRICE.color + purchases.color * 10})`, 'success'); }
            else { this.addLog(`❌ NEED ${BASE_PRICE.color + purchases.color * 10} CREDITS FOR COLOR UPGRADE!`, 'alert'); }
        }
        document.getElementById('shop-credits').innerText = this.credits; const purchases2 = this.upgradePurchases; const hpPriceEl = document.getElementById('shop-price-hp'); const colorPriceEl = document.getElementById('shop-price-color'); if (hpPriceEl) hpPriceEl.innerText = BASE_PRICE.hp + purchases2.hp * 10; if (colorPriceEl) colorPriceEl.innerText = BASE_PRICE.color + purchases2.color * 10;
    }
}

window.addEventListener('DOMContentLoaded', () => { window.Game = new GameEngine(); });