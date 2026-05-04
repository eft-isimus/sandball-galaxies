const crabImg = new Image();
crabImg.src = "crab.png"; // crab for walker :)
crabImg.onload = draw;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const padding = 20; // pixels of empty space on left/right

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// parameters
const stepLength = 10;   // fixed step length (grid spacing)
const maxScroll = document.body.scrollHeight - window.innerHeight;
const targetFraction = 2.5; // want ~250% height max
const stepSizePx = (maxScroll * stepLength) / (targetFraction * cssHeight);

// to keep the walk restrained within the box
const usableWidth = cssWidth - 2 * padding;
const maxStepsX = Math.floor((usableWidth / 2) / stepLength);
const centerX = Math.floor(cssWidth / 2 / stepLength) * stepLength;
const minX = centerX - maxStepsX * stepLength;
const maxX = centerX + maxStepsX * stepLength;

canvas.style.width = cssWidth + "px";
canvas.style.height = cssHeight + "px";

canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;

ctx.scale(dpr, dpr);

// --- Random walk storage ---
let points = [];

// initialize
function resetPoints() {
    points = [{
        x: centerX,
        y: 0
    }];
}
resetPoints();

// --- Step function ---
function addStep() {
    const last = points[points.length - 1];

    let dx = 0;
    let dy = 0;

    const atLeft = last.x <= minX;
    const atRight = last.x >= maxX;
    const atTop = last.y <= 0;

    const r = Math.random();

    if (atTop) {
        dy = stepLength;
    } else if (atLeft) {
        if (r < 0.5) dy = stepLength;
        else dx = stepLength;
    } else if (atRight) {
        if (r < 0.5) dy = stepLength;
        else dx = -stepLength;
    } else {
        if (r < 0.33) dy = stepLength;
        else if (r < 0.66) dx = stepLength;
        else dx = -stepLength;
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
    const last = points[points.length - 1];

const size = 20;

// move origin to crab position
ctx.save();
ctx.translate(last.x, last.y);

// rotate (-90° = -π/2)
ctx.rotate(-Math.PI / 2);

// draw centered
ctx.drawImage(
    crabImg,
    -size / 2,
    -size / 2,
    size,
    size
    );
    ctx.restore();
}

// --- Scroll handler ---
window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const stepsNeeded = Math.floor(scrollTop / stepSizePx);

    while (points.length - 1 < stepsNeeded) {
        addStep();
    }

    while (points.length - 1 > stepsNeeded) {
        points.pop();
    }

    draw();
});

// to control the tabs
function showTab(id) {
    document.querySelectorAll('.tab-content')
        .forEach(el => el.style.display = 'none');

    document.getElementById(id).style.display = 'block';
}

// --- TIME ENSEMBLE ---

const walkCanvas = document.getElementById("walkCanvas");
const walkCtx = walkCanvas.getContext("2d");

const plotCanvas = document.getElementById("plotCanvas");
const plotCtx = plotCanvas.getContext("2d");

const W = 300, H = 300, maxSteps = 100;

walkCanvas.width = plotCanvas.width = W;
walkCanvas.height = plotCanvas.height = H;

let pts, step, running;

// reset
function resetTimeEnsemble() {
    pts = [{ x: W / 2, y: H / 2 }];
    step = 0;
    running = true;
    loop();
}

// random step
function stepWalk() {
    const { x, y } = pts[pts.length - 1];
    const r = Math.random();
    pts.push(
        r < 0.25 ? { x, y: y - stepLength } :
        r < 0.5  ? { x, y: y + stepLength } :
        r < 0.75 ? { x: x + stepLength, y } :
                   { x: x - stepLength, y }
    );
}

// draw walk
function drawWalk() {
    walkCtx.clearRect(0, 0, W, H);
    walkCtx.beginPath();
    walkCtx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => walkCtx.lineTo(p.x, p.y));
    walkCtx.stroke();
}

// compute R²
function computeR2() {
    const n = pts.length, R2 = [];
    for (let k = 1; k < n; k++) {
        let s = 0;
        for (let t = 0; t < n - k; t++) {
            const dx = pts[t + k].x - pts[t].x;
            const dy = pts[t + k].y - pts[t].y;
            s += dx * dx + dy * dy;
        }
        R2[k] = s / (n - k);
    }
    return R2;
}

// draw plot
function drawPlot(R2) {
    plotCtx.clearRect(0, 0, W, H);

    const max = Math.max(...R2.filter(Boolean), 1);
    const xs = W / maxSteps, ys = H / max;

    plotCtx.beginPath();
    R2.forEach((v, k) => {
        if (!v) return;
        const x = k * xs, y = H - v * ys;
        k === 1 ? plotCtx.moveTo(x, y) : plotCtx.lineTo(x, y);
    });
    plotCtx.stroke();
}

// animation
function loop() {
    if (!running || step >= maxSteps) return;

    stepWalk();
    step++;

    drawWalk();
    drawPlot(computeR2());

    setTimeout(loop, 40);
}

// hook into tabs
const oldShowTab = showTab;
showTab = function(id) {
    oldShowTab(id);
    if (id === "tab2") resetTimeEnsemble();
};
