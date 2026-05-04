const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

canvas.style.width = cssWidth + "px";
canvas.style.height = cssHeight + "px";

canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;

ctx.scale(dpr, dpr);

// --- Random walk storage ---
let points = [];

// parameters
const stepSizePx = 30;   // scroll pixels per step
const stepLength = 10;   // fixed step length (grid spacing)

// initialize
function resetPoints() {
    points = [{
        x: Math.floor(cssWidth / 2 / stepLength) * stepLength,
        y: 0
    }];
}
resetPoints();

// --- Biased discrete lattice step ---
function addStep() {
    const last = points[points.length - 1];

    // probabilities (heavily biased downward)
    const r = Math.random();

    let dx = 0;
    let dy = 0;

    if (r < 0.6) {
        dy = stepLength;          // down (60%)
    } else if (r < 0.75) {
        dx = stepLength;          // right (15%)
    } else if (r < 0.9) {
        dx = -stepLength;         // left (15%)
    } else {
        dy = -stepLength;         // up (10%)
    }

    points.push({
        x: last.x + dx,
        y: last.y + dy
    });
}

// --- Draw ---
function draw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
}

// --- Scroll handler ---
window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const stepsNeeded = Math.floor(scrollTop / stepSizePx);

    // grow
    while (points.length - 1 < stepsNeeded) {
        addStep();
    }

    // shrink
    while (points.length - 1 > stepsNeeded) {
        points.pop();
    }

    draw();
});
