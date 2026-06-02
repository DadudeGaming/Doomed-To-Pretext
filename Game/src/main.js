const app = document.getElementById("app");

function draw() {
    let out = "";

    for (let y = 0; y < 40; y++) {
        let line = "";
        for (let x = 0; x < 120; x++) {
            line += Math.random() > 0.5 ? "█" : " ";
        }
        out += line + "\n";
    }

    app.textContent = out;
}

setInterval(draw, 100);