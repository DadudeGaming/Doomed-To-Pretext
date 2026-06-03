const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.85;
canvas.height = window.innerHeight * 0.85;

// -------------------- MAP --------------------
const map = [
    "111111111111111111111111",
    "100000000000000000000001",
    "100020000003000000020001",
    "100000111110000001110001",
    "100000100010000001000001",
    "100000100010000001000001",
    "100000111110000000000001",
    "100000000000000000000001",
    "100030000000000000030001",
    "100000000111000000000001",
    "100000000100000200000001",
    "100020000100000000000001",
    "100000000111000000000001",
    "100000000000000000000001",
    "100000000000000000000001",
    "111111111111111111111111"
];

// -------------------- WALL SENTENCES --------------------
const wallSentences = {
    "1": [
        "FACILITY SECTOR SECURE CONTAINMENT ACTIVE ",
        "PERIMETER LOCK ENGAGED ALL UNITS STANDBY ",
        "ZONE ALPHA CLEAR PROCEED WITH CAUTION NOW ",
        "GRID OFFLINE REROUTING POWER SYSTEMS LINE ",
        "SCAN COMPLETE NO ANOMALIES DETECTED HERE ",
        "ACCESS DENIED UNAUTHORIZED ENTRY LOCKED ",
        "SURVEILLANCE ACTIVE MONITORING SECTORS ",
        "LOCKDOWN PROTOCOL SEVEN HOLD POSITION NOW "
    ],
    "2": [
        "TOXIC LEAK DETECTED HAZARD ZONE EVACUATE ",
        "BIOHAZARD LEVEL FOUR SEAL ALL VENTS NOW ",
        "CONTAMINATION SPREADING QUARANTINE PROTOCOL ",
        "PURGE INITIATED STAND CLEAR OF EXHAUSTS ",
        "CHEMICAL AGENT UNKNOWN DO NOT BREATHE AIR ",
        "DECONTAMINATION REQUIRED BEFORE ENTRY ",
        "EXPOSURE LIMIT EXCEEDED SEEK MEDICAL AID ",
        "AIRBORNE PATHOGEN DETECTED MASKS REQUIRED "
    ],
    "3": [
        "REACTOR CORE INSTABILITY CRITICAL FAILURE ",
        "MELTDOWN IMMINENT EVACUATE ALL PERSONNEL ",
        "THERMAL OVERLOAD DETECTED SHUTDOWN RUNNING ",
        "COOLANT LOSS IN SECTOR THREE ALERT ALERT ",
        "RADIATION LEVELS RISING BREACH IMMINENT ",
        "EMERGENCY SHUTDOWN INITIATED STAND CLEAR ",
        "CORE TEMPERATURE EXCEEDING SAFE LIMITS ",
        "FUSION CHAIN REACTION UNSTABLE EVACUATE "
    ]
};

const wallColor = {
    "1": [170, 20, 20],
    "2": [40, 180, 70],
    "3": [210, 110, 30]
};

// -------------------- PLAYER --------------------
const player = {
    x: 2.5,
    y: 2.5,
    a: 0,
    ammo: 25,
    kills: 0,
    health: 100,
    reload: false,
    reloadTimer: 0,
    flashTimer: 0,
    damageIndicator: 0
};

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup",   e => keys[e.key.toLowerCase()] = false);

// -------------------- MOUSE LOOK --------------------
let locked = false;
canvas.onclick = () => canvas.requestPointerLock();
document.addEventListener("pointerlockchange", () => {
    locked = document.pointerLockElement === canvas;
});
document.addEventListener("mousemove", e => {
    if (!locked) return;
    player.a += e.movementX * 0.0022;
});

// -------------------- ENEMIES --------------------
const enemies = [];
const spawnPoints = [
    { x: 10, y: 3,  cooldown: 0 },
    { x: 18, y: 5,  cooldown: 0 },
    { x: 8,  y: 8,  cooldown: 0 },
    { x: 20, y: 10, cooldown: 0 },
    { x: 5,  y: 12, cooldown: 0 },
    { x: 14, y: 13, cooldown: 0 },
    { x: 3,  y: 7,  cooldown: 0 },
    { x: 21, y: 7,  cooldown: 0 },
    { x: 11, y: 10, cooldown: 0 },
    { x: 16, y: 4,  cooldown: 0 },
];

const SPAWN_COOLDOWN = 480;
let spawnTimer   = 0;
let respawnTimer = 0;
const MAX_ENEMIES = 8;
const ENEMY_SPEED = 0.003;

function spawnEnemy() {
    if (enemies.filter(e => e.alive).length >= MAX_ENEMIES) return;

    for (const p of spawnPoints) {
        if (p.cooldown > 0) p.cooldown--;
    }

    const candidates = spawnPoints
        .filter(p => p.cooldown === 0)
        .sort(() => Math.random() - 0.5);

    for (const p of candidates) {
        let blocked = false;
        for (const e of enemies) {
            if (!e.alive) continue;
            const dx = e.x - p.x, dy = e.y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < 1.3) { blocked = true; break; }
        }
        const pdx = player.x - p.x, pdy = player.y - p.y;
        if (Math.sqrt(pdx*pdx + pdy*pdy) < 2.5) blocked = true;
        if (map[Math.floor(p.y)]?.[Math.floor(p.x)] !== "0") blocked = true;
        if (!blocked) {
            enemies.push({ x: p.x, y: p.y, alive: true, spawnPoint: p });
            return;
        }
    }
}

for (let i = 0; i < 4; i++) spawnEnemy();

// -------------------- SHOOT --------------------
canvas.addEventListener("mousedown", shoot);
function shoot() {
    if (player.reload || player.ammo <= 0) return;
    player.ammo--;

    player.flashTimer = 6;

    if (player.ammo === 0) { player.reload = true; player.reloadTimer = 90; }
    for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - player.x, dy = e.y - player.y;
        const dist  = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        let diff = Math.abs(angle - player.a);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (dist < 8 && diff < 0.18) {
            e.alive = false;
            player.kills++;
            if (e.spawnPoint) e.spawnPoint.cooldown = SPAWN_COOLDOWN;
            break;
        }
    }
}

// -------------------- RAYCAST --------------------
function cast(angle) {
    for (let d = 0; d < 30; d += 0.03) {
        const x    = player.x + Math.cos(angle) * d;
        const y    = player.y + Math.sin(angle) * d;
        const mx   = Math.floor(x);
        const my   = Math.floor(y);
        const cell = map?.[my]?.[mx];

        if (cell && cell !== "0") {
            const blockX = x - mx;
            const blockY = y - my;

            let hitSide = 0;
            let texX = blockX;
            if (Math.abs(blockX - 0.0) < 0.04 || Math.abs(blockX - 1.0) < 0.04) {
                texX = blockY;
                hitSide = 1;
            }
            return { dist: d, cell, texX, mx, my, hitSide, hitX: x, hitY: y };
        }
    }
    return { dist: 30, cell: "0", texX: 0, mx: 0, my: 0, hitSide: 0, hitX: 0, hitY: 0 };
}

// -------------------- DETERMINISTIC HASH --------------------
function hash2(a, b) {
    let n = Math.imul(a ^ (b << 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 15), 0x9b4e6f3d);
    return (n ^ (n >>> 13)) >>> 0;
}

// -------------------- TRACKING RENDER STATE --------------------
let lastCellId = "";
let segmentStartRayIndex = 0;
let segmentStartWorldU = 0;

function drawWallColumn(rayIndex, hit, w, h, rays) {
    if (hit.cell === "0") return;

    // Build a unique tracking string identifier for this exact grid cell
    const currentCellId = `${hit.mx},${hit.my},${hit.cell}`;

    // Track contiguous wall panels across screenspace columns to prevent split seams
    if (rayIndex === 0 || currentCellId !== lastCellId) {
        segmentStartRayIndex = rayIndex;
        segmentStartWorldU = hit.hitSide === 0 ? hit.hitX : hit.hitY;
        lastCellId = currentCellId;
    }

    const dist = Math.max(hit.dist, 0.1);
    const wallHeight = h / (dist + 0.2);
    const screenX = (rayIndex / rays) * w;
    const top = h / 2 - wallHeight / 2;
    const bottom = h / 2 + wallHeight / 2;

    const color = wallColor[hit.cell] || [180, 180, 180];
    const shade = 1 / (1 + dist * dist * 0.08);
    const bright = Math.min(1, shade * 2.2);

    const r = (color[0] * bright) | 0;
    const g = (color[1] * bright) | 0;
    const b = (color[2] * bright) | 0;

    const fontSize = Math.max(7, Math.min(24, wallHeight / 8));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const sentences = wallSentences[hit.cell] || wallSentences["1"];
    const rowStepHeight = Math.max(8, fontSize + 1);

    // FIX: Hybrid Projection Mapping
    // 1. Calculate how many pixels wide each mono letter should span on screenspace display
    const charWidthPixels = fontSize * 0.60;

    // 2. Map how far this current ray column sits relative to the panel's first tracked ray corner
    const raysFromSegmentStart = rayIndex - segmentStartRayIndex;
    const pixelsFromSegmentStart = raysFromSegmentStart * (w / rays);

    // 3. Convert the wall corner entry coordinate into a starting letter slot offset
    const lettersPerWorldUnit = 12.0;
    const initialCharacterOffset = Math.floor(Math.abs(segmentStartWorldU) * lettersPerWorldUnit);

    // 4. Combine screen pixel steps with world offset to get uniform, stretch-proof rendering
    const screenCharacterIndex = Math.floor(pixelsFromSegmentStart / charWidthPixels);
    const combinedCharIndex = initialCharacterOffset + screenCharacterIndex;

    const startRowIdx = Math.floor((-wallHeight / 2) / rowStepHeight);
    const endRowIdx   = Math.ceil((wallHeight / 2) / rowStepHeight);

    for (let rowNum = startRowIdx; rowNum <= endRowIdx; rowNum++) {
        const y = h / 2 + rowNum * rowStepHeight;

        if (y < top || y > bottom) continue;

        const tileSeed = hash2(hit.mx, hit.my);
        const sentenceIndex = Math.abs(tileSeed + rowNum) % sentences.length;
        const currentSentence = sentences[sentenceIndex];

        // Safely extract out character using the stretch-free index computation loop
        const finalCharIdx = ((combinedCharIndex % currentSentence.length) + currentSentence.length) % currentSentence.length;
        const character = currentSentence[finalCharIdx];

        ctx.fillText(character, screenX, y);
    }
}

// -------------------- MAIN LOOP --------------------
function loop() {
    const w = canvas.width;
    const h = canvas.height;

    spawnTimer++;
    if (spawnTimer > 200) { spawnEnemy(); spawnTimer = 0; }

    respawnTimer++;
    if (respawnTimer > 180) {
        if (enemies.filter(e => e.alive).length < 3) spawnEnemy();
        respawnTimer = 0;
    }

    if (player.reload) {
        player.reloadTimer--;
        if (player.reloadTimer <= 0) { player.ammo = 25; player.reload = false; }
    }

    if (player.flashTimer > 0) player.flashTimer--;
    if (player.damageIndicator > 0) player.damageIndicator--;

    // Movement Physics
    const move = 0.022;
    if (keys["w"]) {
        const nx = player.x + Math.cos(player.a) * move;
        const ny = player.y + Math.sin(player.a) * move;
        if (map[Math.floor(player.y)]?.[Math.floor(nx)] === "0") player.x = nx;
        if (map[Math.floor(ny)]?.[Math.floor(player.x)] === "0") player.y = ny;
    }
    if (keys["s"]) {
        const nx = player.x - Math.cos(player.a) * move;
        const ny = player.y - Math.sin(player.a) * move;
        if (map[Math.floor(player.y)]?.[Math.floor(nx)] === "0") player.x = nx;
        if (map[Math.floor(ny)]?.[Math.floor(player.x)] === "0") player.y = ny;
    }
    if (keys["a"]) {
        const nx = player.x + Math.cos(player.a - Math.PI / 2) * move;
        const ny = player.y + Math.sin(player.a - Math.PI / 2) * move;
        if (map[Math.floor(player.y)]?.[Math.floor(nx)] === "0") player.x = nx;
        if (map[Math.floor(ny)]?.[Math.floor(player.x)] === "0") player.y = ny;
    }
    if (keys["d"]) {
        const nx = player.x + Math.cos(player.a + Math.PI / 2) * move;
        const ny = player.y + Math.sin(player.a + Math.PI / 2) * move;
        if (map[Math.floor(player.y)]?.[Math.floor(nx)] === "0") player.x = nx;
        if (map[Math.floor(ny)]?.[Math.floor(player.x)] === "0") player.y = ny;
    }

    // ---- ENEMY AI & HEALTH CONTROLLER PASS ----
    const alive = enemies.filter(e => e.alive);
    for (const e of alive) {
        const edx = player.x - e.x;
        const edy = player.y - e.y;
        const edist = Math.sqrt(edx * edx + edy * edy);

        if (edist > 0.4) {
            const moveX = (edx / edist) * ENEMY_SPEED;
            const moveY = (edy / edist) * ENEMY_SPEED;

            if (map[Math.floor(e.y)]?.[Math.floor(e.x + moveX)] === "0") e.x += moveX;
            if (map[Math.floor(e.y + moveY)]?.[Math.floor(e.x)] === "0") e.y += moveY;
        } else {
            // Melee contact collision -> Slashed down to ~0.01 per frame (~0.6 health lost per second)
            if (player.health > 0) {
                player.health -= 0.01;
                if (Math.random() < 0.03) player.damageIndicator = 3;
            }
        }
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // ---- RAYCASTING RENDER PASS ----
    const rays = 140;
    const zBuffer = new Float32Array(rays);
    const fov = 1.2;

    // Reset loop rendering states before handling frame ray arrays
    lastCellId = "";

    for (let i = 0; i < rays; i++) {
        const angle = player.a + (i / rays - 0.5) * fov;
        const hit = cast(angle);
        zBuffer[i] = hit.dist;
        drawWallColumn(i, hit, w, h, rays);
    }

    // Depth sorting
    alive.sort((a, b) => {
        const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
        const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        return db - da;
    });

    // ---- ENEMY RENDERING PASS ----
    for (const e of alive) {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let relAngle = Math.atan2(dy, dx) - player.a;
        while (relAngle >  Math.PI) relAngle -= Math.PI * 2;
        while (relAngle < -Math.PI) relAngle += Math.PI * 2;

        if (Math.abs(relAngle) > fov / 2 + 0.2) continue;

        const size = Math.min(h, 300 / dist);
        const sx = w / 2 + (relAngle / (fov)) * w;

        const x0 = Math.max(0,      Math.floor(sx - size / 2));
        const x1 = Math.min(w - 1,  Math.floor(sx + size / 2));
        let visible = false;
        for (let px = x0; px <= x1; px++) {
            const ri = Math.min(rays - 1, Math.floor((px / w) * rays));
            if (zBuffer[ri] > dist) { visible = true; break; }
        }
        if (!visible) continue;

        const maxDistDistance = 12;
        const proximityFactor = Math.max(0, Math.min(1, dist / maxDistDistance));
        const finalRed = Math.floor(55 + (proximityFactor * 190));

        ctx.fillStyle = `rgb(${finalRed}, 10, 10)`;
        ctx.font = `${size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▲", sx, h / 2);
    }

    // Crosshair
    ctx.fillStyle = "rgba(200, 20, 20, 0.8)";
    ctx.fillRect(w / 2 - 2, h / 2 - 2, 4, 4);

    // ---- GUN & MUZZLE FLASH ----
    const gunY = h - 80;
    if (player.flashTimer > 0) {
        const particles = ["*FLASH*", "##BANG##", "!!!!", "⚡⚡⚡", "X##X", "💥"];
        ctx.fillStyle = "rgb(255, 240, 20)";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        for (let k = 0; k < 5; k++) {
            const str = particles[Math.floor(Math.random() * particles.length)];
            const size = Math.floor(Math.random() * 16) + 16;
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 50;

            ctx.font = `bold ${size}px monospace`;
            ctx.fillText(str, w / 2 + offsetX, (gunY - 35) + offsetY);
        }
    }

    // Gun bracket
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 15, h - 60);
    ctx.lineTo(w / 2 - 15, gunY);
    ctx.lineTo(w / 2 + 15, gunY);
    ctx.lineTo(w / 2 + 15, h - 60);
    ctx.stroke();

    if (player.damageIndicator > 0) {
        ctx.fillStyle = "rgba(240, 10, 10, 0.15)";
        ctx.fillRect(0, 0, w, h);
    }

    // ---- MINIMAP ----
    const s = 4;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] !== "0") {
                ctx.fillStyle = "#222";
                ctx.fillRect(x * s, y * s, s, s);
            }
        }
    }

    ctx.fillStyle = "rgb(200, 40, 40)";
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const e of alive) {
        ctx.fillText("▲", e.x * s, e.y * s);
    }

    ctx.fillStyle = "white";
    ctx.fillRect(player.x * s - 1, player.y * s - 1, 2, 2);

    // HUD Display UI overlay
    ctx.fillStyle = "#801010";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`♥ HEALTH ${Math.max(0, Math.floor(player.health))}`, 30, h - 25);

    ctx.textAlign = "center";
    ctx.fillText(`☠ KILLS ${player.kills}`, w / 2, h - 25);

    ctx.textAlign = "right";
    ctx.fillText(`⚡ AMMO ${player.ammo}${player.reload ? " (RELOADING)" : ""}`, w - 30, h - 25);

    requestAnimationFrame(loop);
}

loop();