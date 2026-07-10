// WebRTC Multiplayer Module — Up to 4 Players via PeerJS (LAN)
// Architecture: Host-authoritative. Host runs full simulation and broadcasts state.
// Joiners send key inputs to host; host simulates all players.

const NET_PLAYER_COLORS = ['#3cff00', '#00f2ff', '#ffb700', '#ff69b4'];

export class NetworkManager {
  constructor(gameEngine) {
    this.game         = gameEngine;
    this.peer         = null;
    this.peerId       = null;
    this.syncCounter  = 0;

    // Host: one connection per joiner (max 3)
    this.connections  = [];
    // Joiner: single connection back to host
    this.hostConn     = null;

    this.isHost         = false;
    this.localPlayerId  = 1;   // 1=host, 2-4=joiners
    this.nextAssignId   = 2;   // Host assigns IDs starting at 2

    // Nicknames and input per player
    this.playerNicknames = { 1: '' };
    this.remoteInputs    = {};
  }

  // ---------------------------------------------------------------
  //  HOST
  // ---------------------------------------------------------------
  initHost() {
    this.isHost = true;
    this.localPlayerId = 1;
    this.game.mode = 'host';
    this.game.localPlayerIndex = 0;
    this.playerNicknames[1] = this.game.nickname || 'OPERATIVE';

    const code = 'SI-' + Math.floor(1000 + Math.random() * 9000);
    this.peer = new Peer(code);

    this.peer.on('open', (id) => {
      this.peerId = id;
      const displayCode = id.replace('SI-', '');
      const el = document.getElementById('lobby-code');
      if (el) el.innerText = displayCode;
      document.getElementById('connection-panel').classList.remove('hidden');
      document.getElementById('host-controls').classList.remove('hidden');
      document.querySelector('.menu-sections').classList.add('hidden');
      // Show host's own entry in the player list
      this.updateHostLobbyUI();
      this.game.addLog(`HOSTING — CODE: ${displayCode}`, 'success');
    });

    this.peer.on('connection', (conn) => {
      if (this.connections.length >= 3) {
        conn.close();
        return;
      }
      const assignedId = this.nextAssignId++;
      this.connections.push(conn);
      conn._playerId = assignedId;
      this.playerNicknames[assignedId] = '';
      this.remoteInputs[assignedId] = { keys: {}, mouseX: 400, mouseY: 250 };
      this._setupHostConnCallbacks(conn, assignedId);
    });

    this.peer.on('error', (err) => {
      const el = document.getElementById('lobby-code');
      if (el) el.innerText = 'ERR:' + err.type;
    });
  }

  _setupHostConnCallbacks(conn, assignedId) {
    conn.on('open', () => {
      conn.send({ type: 'assign-id', playerId: assignedId });
      this.game.addLog(`OPERATIVE P${assignedId} LINKING...`, 'success');
    });

    conn.on('data', (data) => {
      if (data.type === 'player-input') {
        this.remoteInputs[assignedId] = {
          keys:     data.keys,
          aimAngle: data.aimAngle
        };
      } else if (data.type === 'client-join') {
        // Joiner sends their nickname when they connect
        this.playerNicknames[assignedId] = (data.nickname || 'OPERATIVE').toUpperCase();
        const slots = 4 - this.connections.length;
        this.game.addLog(`P${assignedId} [${this.playerNicknames[assignedId]}] LINKED — ${slots} SLOT(S) FREE`, 'success');
        // Broadcast updated lobby to all clients + update host UI
        this.broadcastLobbyState();
        this.updateHostLobbyUI();
      } else if (data.type === 'client-ready') {
        if (this.game.state === 'playing') {
          conn.send({ type: 'start-game' });
        }
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn);
      delete this.remoteInputs[assignedId];
      delete this.playerNicknames[assignedId];
      this.game.addLog(`P${assignedId} DISCONNECTED.`, 'alert');
      this.broadcastLobbyState();
      this.updateHostLobbyUI();
    });
  }

  // ---------------------------------------------------------------
  //  JOINER
  // ---------------------------------------------------------------
  connectToHost(codeString, nickname) {
    this.isHost = false;
    this.game.mode = 'join';

    let targetCode = codeString.toUpperCase().trim();
    if (!targetCode.startsWith('SI-')) targetCode = 'SI-' + targetCode;

    this.peer = new Peer();

    this.peer.on('open', () => {
      this.hostConn = this.peer.connect(targetCode);
      this._setupJoinerCallbacks(nickname || 'OPERATIVE');
    });

    this.peer.on('error', (err) => {
      const s = document.getElementById('waiting-status-text');
      if (s) s.innerText = 'CONNECTION FAILED: ' + err.type.toUpperCase();
    });
  }

  _setupJoinerCallbacks(nickname) {
    this.hostConn.on('open', () => {
      // Introduce ourselves with our nickname
      this.hostConn.send({ type: 'client-join', nickname });
      const s = document.getElementById('waiting-status-text');
      if (s) s.innerText = 'LINKED — WAITING FOR HOST TO LAUNCH...';
    });

    this.hostConn.on('data', (data) => {
      this.game.handleNetworkMessage(data);
    });

    this.hostConn.on('close', () => {
      this.game.endGame(false, 'LINK SEVERED: HOST DISCONNECTED.');
    });
  }

  // ---------------------------------------------------------------
  //  LOBBY STATE SYNC
  // ---------------------------------------------------------------

  buildLobbyPlayers() {
    const players = [];
    // Host always at index 0
    players.push({
      id:       1,
      nickname: this.playerNicknames[1] || 'OPERATIVE',
      color:    NET_PLAYER_COLORS[0],
      isHost:   true
    });
    // Joiners in order of connection
    this.connections.forEach(conn => {
      const id = conn._playerId;
      if (!id) return;
      players.push({
        id,
        nickname: this.playerNicknames[id] || `OPERATIVE ${id}`,
        color:    NET_PLAYER_COLORS[id - 1] || '#fff',
        isHost:   false
      });
    });
    return players;
  }

  broadcastLobbyState() {
    if (!this.isHost) return;
    const payload = {
      type:     'lobby-update',
      players:  this.buildLobbyPlayers(),
      roomCode: this.peerId?.replace('SI-', '') || '----'
    };
    this.connections.forEach(conn => {
      if (conn.open) conn.send(payload);
    });
  }

  updateHostLobbyUI() {
    const list = document.getElementById('host-player-list');
    if (!list) return;
    const players = this.buildLobbyPlayers();
    list.innerHTML = players.map(p => `
      <div class="lobby-player-row">
        <span class="lpr-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></span>
        <span class="lpr-name">${p.nickname}</span>
        <span class="lpr-badge">${p.isHost ? '★ HOST' : 'P' + p.id}</span>
      </div>
    `).join('');
  }

  // ---------------------------------------------------------------
  //  SYNC HELPERS
  // ---------------------------------------------------------------

  // Host → all joiners: full world snapshot at ~20 Hz
  broadcastState() {
    if (!this.isHost || this.connections.length === 0) return;
    this.syncCounter++;
    if (this.syncCounter % 3 !== 0) return;

    const playerStates = this.game.players.map((p, i) =>
      p ? {
        index:    i,
        x: p.x,   y: p.y,
        vx: p.vx, vy: p.vy,
        hp: p.hp,  rank: p.rank,
        aimAngle:  p.aimAngle,
        camoActive: p.camoActive,
        active:    p.active,
        nickname:  p.nickname || '',
        illusionColor: p.illusionColor || 'G'
      } : null
    );

    const payload = {
      type: 'state-update',
      players: playerStates,
      guards: this.game.guards.map(g => ({
        id: g.id,
        x: g.x,   y: g.y,
        hp: g.hp,  maxHp: g.maxHp,
        aimAngle:  g.aimAngle,
        target:    !!g.target,
        rank:      g.rank,
        colorCode: g.colorCode
      })),
      lasers: this.game.lasers.map(l => ({
        x: l.x,   y: l.y,
        vx: l.vx, vy: l.vy,
        type:    l.type,
        subType: l.subType,
        width:   l.width,
        height:  l.height
      })),
      chaosLevel:    this.game.chaosLevel,
      credits:       this.game.credits,
      rankChips:     this.game.rankChips,
      currencyChips: this.game.currencyChips,
      ammoDrops:     this.game.ammoDrops,
      waveState: {
        currentWave:  this.game.waveManager.currentWave,
        state:        this.game.waveManager.state,
        countdown:    this.game.waveManager.countdown,
        countdownMax: this.game.waveManager.countdownMax
      }
    };

    this.connections.forEach(conn => {
      if (conn.open) conn.send(payload);
    });
  }

  // Joiner → host: local key state at ~30 Hz
  sendInput(keys, aimAngle) {
    this.syncCounter++;
    if (this.syncCounter % 2 !== 0) return;
    if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'player-input', keys: { ...keys }, aimAngle });
    }
  }

  sendGameOver(won, reason) {
    this.connections.forEach(conn => {
      if (conn.open) conn.send({ type: 'game-over', won, reason });
    });
  }

  sendStartGame() {
    this.connections.forEach(conn => {
      if (conn.open) conn.send({ type: 'start-game' });
    });
  }

  sendRestart() {
    this.connections.forEach(conn => {
      if (conn.open) conn.send({ type: 'restart-game' });
    });
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections = [];
    this.hostConn    = null;
  }
}
