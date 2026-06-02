// =====================
// CONFIG
// =====================
const COLS = 120;
const ROWS = 40;

const app = document.getElementById("app");

// =====================
// MAP (2D grid)
// 1 = red wall
// 2 = blue wall
// 3 = green wall
// =====================
const map = [
    "111111111111111111",
    "100000000000000001",
    "102000000000003001",
    "100000011000000001",
    "100000011000000001",
    "100000000000000001",
    "100000000000000001",
    "111111111111111111"
];

// =====================
// PLAYER
// =====================
const player = {
    x: 2.5,
    y: 2.5,
    angle: 0
};

// =====================
// INPUT
// =====================
const keys = {};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =====================
// COLLISION
// =====================
function getCell(x, y) {
    return map[Math.floor(y)][Math.floor(x)];
}

function isWall(x, y) {
    return getCell(x, y) !== "0";
}

// =====================
// MOVEMENT
// =====================
function update() {
    const moveSpeed = 0.05;
    const rotSpeed = 0.04;

    if (keys["arrowleft"]) player.angle -= rotSpeed;
    if (keys["arrowright"]) player.angle += rotSpeed;

    let nx = player.x;
    let ny = player.y;

    if (keys["w"]) {
        nx += Math.cos(player.angle) * moveSpeed;
        ny += Math.sin(player.angle) * moveSpeed;
    }

    if (keys["s"]) {
        nx -= Math.cos(player.angle) * moveSpeed;
        ny -= Math.sin(player.angle) * moveSpeed;
    }

    if (!isWall(nx, player.y)) player.x = nx;
    if (!isWall(player.x, ny)) player.y = ny;
}

// =====================
// RAYCAST
// =====================
function castRay(angle) {
    for (let d = 0; d < 20; d += 0.05) {
        const x = player.x + Math.cos(angle) * d;
        const y = player.y + Math.sin(angle) * d;

        const cell = getCell(x, y);
        if (cell !== "0") {
            return { dist: d, type: cell };
        }
    }
    return { dist: 20, type: "1" };
}

// =====================
// FRAME
// =====================
function render() {
    const frame = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({
            char: " ",
            color: "#000"
        }))
    );

    for (let x = 0; x < COLS; x++) {
        const rayAngle = player.angle + (x / COLS - 0.5) * 1.2;

        const hit = castRay(rayAngle);
        const dist = hit.dist;

        const wallHeight = Math.floor(ROWS / (dist + 0.001));

        // shading
        const shade =
            dist < 3 ? "█" :
                dist < 6 ? "▓" :
                    dist < 10 ? "▒" : "░";

        // wall color by type
        let color =
            hit.type === "1" ? "#ff4444" :
                hit.type === "2" ? "#4444ff" :
                    hit.type === "3" ? "#44ff44" :
                        "#aaaaaa";

        const start = Math.floor((ROWS - wallHeight) / 2);

        for (let y = 0; y < wallHeight; y++) {
            const py = start + y;

            if (py >= 0 && py < ROWS) {
                frame[py][x] = {
                    char: shade,
                    color
                };
            }
        }
    }

    return frame;
}

// =====================
// DRAW
// =====================
function draw(frame) {
    let out = "";

    for (let y = 0; y < ROWS; y++) {
        let line = "";

        for (let x = 0; x < COLS; x++) {
            const c = frame[y][x];
            line += `<span style="color:${c.color}">${c.char}</span>`;
        }

        out += line + "\n";
    }

    app.innerHTML = out;
}

// =====================
// LOOP
// =====================
function loop() {
    update();
    draw(render());
    requestAnimationFrame(loop);
}

loop();