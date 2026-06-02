import { prepare, layoutWithLines, prepareWithSegments, layoutNextLineRange, materializeLineRange } from "@chenglou/pretext";

const app = document.getElementById("app");

let activeLoop = null;

// =====================
// STOP CURRENT DEMO
// =====================
function stop() {
    if (activeLoop) cancelAnimationFrame(activeLoop);
    activeLoop = null;
    app.innerHTML = "";
}

// =====================
// 1. FLOW TEXT
// =====================
function flow() {
    stop();

    const text = `
Pretext flow demo.
Move mouse horizontally to change layout width.
`;

    const prepared = prepare(text, "18px system-ui");

    let mouseX = 400;

    window.onmousemove = (e) => mouseX = e.clientX;

    function loop() {
        const width = Math.max(200, mouseX);

        const { lines } = layoutWithLines(prepared, width, 24);

        app.innerHTML = lines.map(l => l.text).join("<br>");

        activeLoop = requestAnimationFrame(loop);
    }

    loop();
}

// =====================
// 2. GRAVITY TEXT
// =====================
function gravity() {
    stop();

    const text = `
Text bends based on cursor position.
Pretext handles line reflow cheaply.
`;

    const prepared = prepareWithSegments(text, "18px monospace");

    let mouse = 400;

    window.onmousemove = (e) => mouse = e.clientX;

    function loop() {
        let cursor = { segmentIndex: 0, graphemeIndex: 0 };

        let out = "";

        while (true) {
            const width = Math.max(200, 600 - Math.abs(mouse - 400));

            const range = layoutNextLineRange(prepared, cursor, width);
            if (!range) break;

            const line = materializeLineRange(prepared, range);

            out += line.text + "\n";

            cursor = range.end;
        }

        app.textContent = out;

        activeLoop = requestAnimationFrame(loop);
    }

    loop();
}

// =====================
// 3. EDITOR
// =====================
function editor() {
    stop();

    app.innerHTML = `
<textarea id="t" style="width:100%;height:120px;">Type here...</textarea>
<input id="w" type="range" min="200" max="800" value="400"/>
<pre id="out"></pre>
`;

    const t = document.getElementById("t");
    const w = document.getElementById("w");
    const out = document.getElementById("out");

    function update() {
        const prepared = prepareWithSegments(t.value, "16px monospace");

        const { lines } = layoutWithLines(prepared, Number(w.value), 20);

        out.textContent = lines.map(l => l.text).join("\n");
    }

    t.oninput = update;
    w.oninput = update;

    update();
}

// =====================
// 4. WALL VISUAL
// =====================
function wall() {
    stop();

    function loop() {
        let out = "";

        for (let y = 0; y < 30; y++) {
            let line = "";

            for (let x = 0; x < 80; x++) {
                const v = Math.sin((x + Date.now() * 0.003)) > 0 ? "█" : "░";
                line += v;
            }

            out += line + "\n";
        }

        app.textContent = out;

        activeLoop = requestAnimationFrame(loop);
    }

    loop();
}

// =====================
// ROUTER
// =====================
window.switchDemo = function(name) {
    if (name === "flow") flow();
    if (name === "gravity") gravity();
    if (name === "editor") editor();
    if (name === "wall") wall();
};

// default
flow();